/**
 * actions/replan.ts 단위 테스트.
 *
 * commitReplan — 데모/권한/낙관적 동시성/재계산/audit 분기.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const mockWriteAuditLog = vi.fn();
vi.mock("@/lib/audit-log", () => ({
  writeAuditLog: (...args: unknown[]) => mockWriteAuditLog(...args),
}));

const mockGetActorId = vi.fn();
vi.mock("@/lib/auth/session", () => ({
  getActorId: () => mockGetActorId(),
}));

const mockCanWriteTrip = vi.fn();
vi.mock("@/lib/auth/authorize", () => ({
  canWriteTrip: (...args: unknown[]) => mockCanWriteTrip(...args),
}));

const mockFetchTripFromDb = vi.fn();
const mockCommitReplanInTransaction = vi.fn();
vi.mock("@/lib/repositories/trip.repository", () => ({
  fetchTripFromDb: (...args: unknown[]) => mockFetchTripFromDb(...args),
  commitReplanInTransaction: (...args: unknown[]) => mockCommitReplanInTransaction(...args),
}));

const mockGenerateReplanOptions = vi.fn();
vi.mock("@/lib/replan", () => ({
  generateReplanOptions: (...args: unknown[]) => mockGenerateReplanOptions(...args),
}));

let mockIsDbConnected = true;
vi.mock("@/lib/prisma", () => ({
  get isDbConnected() { return mockIsDbConnected; },
}));

vi.mock("@/lib/seed", () => ({
  DEMO_TRIP_ID: "demo-trip-danang",
}));

import { commitReplan } from "@/actions/replan";

describe("commitReplan", () => {
  const BASE_INPUT = {
    tripId: "t1",
    optionId: "option-recommend" as const,
    trigger: { type: "delay" as const, itemId: "item-1", minutes: 30 },
  };

  const MOCK_ITEMS = [
    { id: "item-1", scheduledAt: "2026-07-01T10:00:00Z" },
    { id: "item-2", scheduledAt: "2026-07-01T12:00:00Z" },
  ];

  const MOCK_BUNDLE = {
    trip: { id: "t1", updatedAt: "2026-07-01T00:00:00Z" },
    items: MOCK_ITEMS,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsDbConnected = true;
    mockGetActorId.mockResolvedValue("user-1");
    mockCanWriteTrip.mockResolvedValue(true);
    mockWriteAuditLog.mockResolvedValue(undefined);
  });

  it("DB 미연결 → demo", async () => {
    mockIsDbConnected = false;
    const r = await commitReplan(BASE_INPUT);
    expect(r).toEqual({ ok: true, demo: true });
  });

  it("데모 trip ID → demo", async () => {
    const r = await commitReplan({ ...BASE_INPUT, tripId: "demo-trip-danang" });
    expect(r).toEqual({ ok: true, demo: true });
  });

  it("권한 없음 → forbidden", async () => {
    mockCanWriteTrip.mockResolvedValue(false);
    const r = await commitReplan(BASE_INPUT);
    expect(r).toEqual({ ok: false, code: "forbidden" });
  });

  it("trip 없음 → not_found", async () => {
    mockFetchTripFromDb.mockResolvedValue(null);
    const r = await commitReplan(BASE_INPUT);
    expect(r).toEqual({ ok: false, code: "not_found" });
  });

  it("유효하지 않은 옵션 → invalid_option", async () => {
    mockFetchTripFromDb.mockResolvedValue(MOCK_BUNDLE);
    mockGenerateReplanOptions.mockReturnValue([
      { option: { id: "option-safe", label: "안전" }, itemsAfter: MOCK_ITEMS },
    ]);

    const r = await commitReplan(BASE_INPUT); // option-recommend 요청했지만 없음
    expect(r).toEqual({ ok: false, code: "invalid_option" });
  });

  it("변경 0건 → ok + changedCount=0 (DB 미호출)", async () => {
    mockFetchTripFromDb.mockResolvedValue(MOCK_BUNDLE);
    mockGenerateReplanOptions.mockReturnValue([
      {
        option: { id: "option-recommend", label: "추천" },
        itemsAfter: MOCK_ITEMS, // 동일 scheduledAt → 변경 0건
      },
    ]);

    const r = await commitReplan(BASE_INPUT);
    expect(r).toMatchObject({ ok: true, demo: false, changedCount: 0 });
    expect(mockCommitReplanInTransaction).not.toHaveBeenCalled();
  });

  it("트랜잭션 실패 → internal", async () => {
    mockFetchTripFromDb.mockResolvedValue(MOCK_BUNDLE);
    mockGenerateReplanOptions.mockReturnValue([
      {
        option: { id: "option-recommend", label: "추천" },
        itemsAfter: [
          { id: "item-1", scheduledAt: "2026-07-01T10:30:00Z" }, // 변경됨
          { id: "item-2", scheduledAt: "2026-07-01T12:00:00Z" },
        ],
      },
    ]);
    mockCommitReplanInTransaction.mockResolvedValue(null);

    const r = await commitReplan(BASE_INPUT);
    expect(r).toEqual({ ok: false, code: "internal" });
  });

  it("낙관적 동시성 충돌 → conflict", async () => {
    mockFetchTripFromDb.mockResolvedValue(MOCK_BUNDLE);
    mockGenerateReplanOptions.mockReturnValue([
      {
        option: { id: "option-recommend", label: "추천" },
        itemsAfter: [
          { id: "item-1", scheduledAt: "2026-07-01T10:30:00Z" },
          { id: "item-2", scheduledAt: "2026-07-01T12:00:00Z" },
        ],
      },
    ]);
    mockCommitReplanInTransaction.mockResolvedValue("conflict");

    const r = await commitReplan({
      ...BASE_INPUT,
      expectedTripUpdatedAt: "old-timestamp",
    });
    expect(r).toEqual({ ok: false, code: "conflict" });
  });

  it("성공 → ok + changedCount + audit log", async () => {
    mockFetchTripFromDb.mockResolvedValue(MOCK_BUNDLE);
    mockGenerateReplanOptions.mockReturnValue([
      {
        option: { id: "option-recommend", label: "추천" },
        itemsAfter: [
          { id: "item-1", scheduledAt: "2026-07-01T10:30:00Z" }, // 변경
          { id: "item-2", scheduledAt: "2026-07-01T12:30:00Z" }, // 변경
        ],
      },
    ]);
    mockCommitReplanInTransaction.mockResolvedValue({
      tripUpdatedAt: "2026-07-01T01:00:00Z",
    });

    const r = await commitReplan(BASE_INPUT);

    expect(r).toMatchObject({
      ok: true,
      demo: false,
      changedCount: 2,
      tripUpdatedAt: "2026-07-01T01:00:00Z",
    });
    expect(mockWriteAuditLog).toHaveBeenCalledOnce();
    const log = mockWriteAuditLog.mock.calls[0][0];
    expect(log.action).toBe("replan.commit");
    expect(log.resource).toBe("Trip");
    expect(log.metadata.optionId).toBe("option-recommend");
    expect(log.metadata.optionLabel).toBe("추천");
    expect(log.metadata.triggerType).toBe("delay");
    expect(log.metadata.changedCount).toBe(2);
  });

  it("서버 재계산 — generateReplanOptions에 items + trigger 전달", async () => {
    mockFetchTripFromDb.mockResolvedValue(MOCK_BUNDLE);
    mockGenerateReplanOptions.mockReturnValue([
      { option: { id: "option-recommend", label: "추천" }, itemsAfter: MOCK_ITEMS },
    ]);

    await commitReplan(BASE_INPUT);

    expect(mockGenerateReplanOptions).toHaveBeenCalledWith(MOCK_ITEMS, BASE_INPUT.trigger);
  });
});
