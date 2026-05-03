/**
 * 사이클 TT (ADR-045) — ChecklistItem.actorId NULLABLE 시범 도입 회귀.
 *
 * R1 사인오프 조건 (STEP 4):
 *  1. createChecklistItem이 actorId 받아 Prisma create.data에 전달
 *  2. actorId 미제공 시 null 저장 (NULL 호환성)
 *  3. bulkCreateChecklistItems가 두 번째 인자 actorId를 모든 row에 전파
 *  4. inputs[i].actorId가 있으면 우선 (per-row override)
 *  5. rowToItem이 row.actorId를 ChecklistItem.actorId로 노출
 *
 * 답습: tests/unit/checklist-bulk-toggle.test.ts (vi.hoisted + vi.mock prisma).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockCreate, mockTransaction } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockTransaction: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    checklistItem: { create: mockCreate },
    $transaction: mockTransaction,
  },
  isDbConnected: true,
}));

vi.mock("server-only", () => ({}));

import {
  createChecklistItem,
  bulkCreateChecklistItems,
} from "@/lib/repositories/checklist.repository";

interface TxStub {
  checklistItem: { create: typeof mockCreate };
}

function buildRow(overrides: {
  id?: string;
  tripId?: string;
  actorId?: string | null;
  category?: string;
  text?: string;
  dDayBucket?: string;
  sortOrder?: number;
}) {
  return {
    id: overrides.id ?? "ci-1",
    tripId: overrides.tripId ?? "trip-A",
    category: overrides.category ?? "documents",
    text: overrides.text ?? "여권",
    dDayBucket: overrides.dDayBucket ?? "D-30",
    done: false,
    cityNote: null,
    sortOrder: overrides.sortOrder ?? 0,
    actorId: overrides.actorId ?? null,
    createdAt: new Date("2026-05-03T00:00:00Z"),
    updatedAt: new Date("2026-05-03T00:00:00Z"),
  };
}

beforeEach(() => {
  mockCreate.mockReset();
  mockTransaction.mockReset();
  mockTransaction.mockImplementation(
    async (cb: (tx: TxStub) => Promise<unknown>) => {
      return cb({ checklistItem: { create: mockCreate } });
    },
  );
});

describe("사이클 TT — createChecklistItem actorId stamp", () => {
  it("actorId 제공 시 Prisma create.data.actorId에 그대로 전달", async () => {
    mockCreate.mockResolvedValueOnce(
      buildRow({ id: "ci-1", actorId: "user-kakao-1" }),
    );

    const result = await createChecklistItem({
      tripId: "trip-A",
      category: "documents",
      text: "여권",
      dDayBucket: "D-30",
      actorId: "user-kakao-1",
    });

    expect(result).not.toBeNull();
    expect(result?.actorId).toBe("user-kakao-1");
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockCreate.mock.calls[0][0].data.actorId).toBe("user-kakao-1");
  });

  it("actorId 미제공 시 null 저장 (NULL 호환성, legacy/DEMO/미인증)", async () => {
    mockCreate.mockResolvedValueOnce(buildRow({ actorId: null }));

    const result = await createChecklistItem({
      tripId: "trip-A",
      category: "documents",
      text: "여권",
      dDayBucket: "D-30",
    });

    expect(result?.actorId).toBe(null);
    expect(mockCreate.mock.calls[0][0].data.actorId).toBe(null);
  });

  it("actorId === null 명시도 null 저장 (DEMO_TRIP_ID 강제 패턴)", async () => {
    mockCreate.mockResolvedValueOnce(buildRow({ actorId: null }));

    await createChecklistItem({
      tripId: "trip-DEMO",
      category: "documents",
      text: "여권",
      dDayBucket: "D-30",
      actorId: null,
    });

    expect(mockCreate.mock.calls[0][0].data.actorId).toBe(null);
  });

  it("rowToItem이 DB row의 actorId를 ChecklistItem.actorId로 노출", async () => {
    mockCreate.mockResolvedValueOnce(
      buildRow({ id: "ci-2", actorId: "user-X" }),
    );

    const result = await createChecklistItem({
      tripId: "trip-A",
      category: "clothing",
      text: "여름옷",
      dDayBucket: "D-7",
      actorId: "user-X",
    });

    expect(result?.id).toBe("ci-2");
    expect(result?.actorId).toBe("user-X");
  });
});

describe("사이클 TT — bulkCreateChecklistItems actorId 전파", () => {
  it("두 번째 인자 actorId를 모든 row에 전파", async () => {
    mockCreate
      .mockResolvedValueOnce(buildRow({ id: "ci-1", actorId: "user-A" }))
      .mockResolvedValueOnce(buildRow({ id: "ci-2", actorId: "user-A" }))
      .mockResolvedValueOnce(buildRow({ id: "ci-3", actorId: "user-A" }));

    const result = await bulkCreateChecklistItems(
      "trip-A",
      [
        { category: "documents", text: "여권", dDayBucket: "D-30" },
        { category: "documents", text: "비자", dDayBucket: "D-30" },
        { category: "clothing", text: "여름옷", dDayBucket: "D-7" },
      ],
      "user-A",
    );

    expect(result).not.toBeNull();
    expect(result?.length).toBe(3);
    expect(mockCreate).toHaveBeenCalledTimes(3);
    expect(mockCreate.mock.calls[0][0].data.actorId).toBe("user-A");
    expect(mockCreate.mock.calls[1][0].data.actorId).toBe("user-A");
    expect(mockCreate.mock.calls[2][0].data.actorId).toBe("user-A");
  });

  it("actorId 인자 미제공 시 모든 row null (미인증 fallback)", async () => {
    mockCreate
      .mockResolvedValueOnce(buildRow({ id: "ci-1", actorId: null }))
      .mockResolvedValueOnce(buildRow({ id: "ci-2", actorId: null }));

    await bulkCreateChecklistItems("trip-A", [
      { category: "documents", text: "여권", dDayBucket: "D-30" },
      { category: "documents", text: "비자", dDayBucket: "D-30" },
    ]);

    expect(mockCreate.mock.calls[0][0].data.actorId).toBe(null);
    expect(mockCreate.mock.calls[1][0].data.actorId).toBe(null);
  });

  it("inputs[i].actorId가 있으면 두 번째 인자보다 우선 (per-row override)", async () => {
    mockCreate
      .mockResolvedValueOnce(buildRow({ id: "ci-1", actorId: "user-OVERRIDE" }))
      .mockResolvedValueOnce(buildRow({ id: "ci-2", actorId: "user-DEFAULT" }));

    await bulkCreateChecklistItems(
      "trip-A",
      [
        {
          category: "documents",
          text: "여권",
          dDayBucket: "D-30",
          actorId: "user-OVERRIDE",
        },
        { category: "documents", text: "비자", dDayBucket: "D-30" },
      ],
      "user-DEFAULT",
    );

    expect(mockCreate.mock.calls[0][0].data.actorId).toBe("user-OVERRIDE");
    expect(mockCreate.mock.calls[1][0].data.actorId).toBe("user-DEFAULT");
  });

  it("두 번째 인자 actorId === null 명시도 null 전파 (DEMO 강제)", async () => {
    mockCreate.mockResolvedValueOnce(buildRow({ id: "ci-1", actorId: null }));

    await bulkCreateChecklistItems(
      "trip-DEMO",
      [{ category: "documents", text: "여권", dDayBucket: "D-30" }],
      null,
    );

    expect(mockCreate.mock.calls[0][0].data.actorId).toBe(null);
  });
});

// ═══════════════════════════════════════════════════════════════════
// D5 가드 — _resolveActorIdForTrip (T12 STEP 4 발견 → STEP 3 복귀)
//
// XX(ADR-044) 이후 DEMO_TRIP_ID는 isDbConnected=true이면 DB 영속화됨.
// 인증 사용자가 DEMO trip에 add 시 시드 row가 user.id로 stamp되는 오염 차단.
// ═══════════════════════════════════════════════════════════════════

import { resolveActorIdForTrip } from "@/lib/auth/actor-resolution";
import { DEMO_TRIP_IDS } from "@/lib/seed";

describe("사이클 TT — resolveActorIdForTrip (D5 DEMO_TRIP_ID 가드)", () => {
  it("일반 trip + 인증 사용자 → actorId 그대로 반환", () => {
    expect(resolveActorIdForTrip("trip-real-A", "user-kakao-1")).toBe(
      "user-kakao-1",
    );
  });

  it("일반 trip + 미인증 → null 그대로", () => {
    expect(resolveActorIdForTrip("trip-real-A", null)).toBe(null);
  });

  it.each(DEMO_TRIP_IDS)(
    "DEMO_TRIP_ID(%s) + 인증 사용자 → null 강제 (시드 오염 차단)",
    (demoId) => {
      expect(resolveActorIdForTrip(demoId, "user-kakao-1")).toBe(null);
    },
  );

  it("DEMO_TRIP_ID + 미인증 → null (그대로)", () => {
    expect(resolveActorIdForTrip(DEMO_TRIP_IDS[0], null)).toBe(null);
  });

  it("DEMO_TRIP_IDS는 베트남 6 trip 모두 포함 (회귀 안전망)", () => {
    expect(DEMO_TRIP_IDS.length).toBeGreaterThanOrEqual(6);
  });
});
