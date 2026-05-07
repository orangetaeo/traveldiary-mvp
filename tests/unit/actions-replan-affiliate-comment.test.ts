/**
 * Server Action 단위 테스트 — Batch 39.
 *
 * 3 모듈:
 *  - actions/replan.ts: commitReplan
 *  - actions/affiliate.ts: trackAffiliateClick
 *  - actions/shareComment.ts: createCommentAction, deleteCommentAction
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

/* ──────── Mocks ──────── */

vi.mock("server-only", () => ({}));

const mockWriteAuditLog = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/audit-log", () => ({
  writeAuditLog: (...args: unknown[]) => mockWriteAuditLog(...args),
}));

const mockGetActorId = vi.fn<() => Promise<string | null>>();
vi.mock("@/lib/auth/session", () => ({
  getActorId: () => mockGetActorId(),
}));

const mockCanWriteTrip = vi.fn<() => Promise<boolean>>();
vi.mock("@/lib/auth/authorize", () => ({
  canWriteTrip: () => mockCanWriteTrip(),
  canWriteTripOrViaShareLink: () => mockCanWriteTrip(),
}));

/* ── replan deps ── */
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

/* ── affiliate deps ── */
const mockBuildAffiliateUrl = vi.fn();
vi.mock("@/lib/utils/affiliate", () => ({
  buildAffiliateUrl: (...args: unknown[]) => mockBuildAffiliateUrl(...args),
}));

/* ── shareComment deps ── */
const mockFetchShareLinkBySyncKey = vi.fn();
vi.mock("@/lib/repositories/share.repository", () => ({
  fetchShareLinkBySyncKey: (...args: unknown[]) => mockFetchShareLinkBySyncKey(...args),
}));

const mockCreateCommentRow = vi.fn();
const mockDeleteCommentRow = vi.fn();
vi.mock("@/lib/repositories/shareComment.repository", () => ({
  createCommentRow: (...args: unknown[]) => mockCreateCommentRow(...args),
  deleteCommentRow: (...args: unknown[]) => mockDeleteCommentRow(...args),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {},
  isDbConnected: true,
}));

vi.mock("@/lib/seed", () => ({
  DEMO_TRIP_ID: "demo-trip-pqc",
  DEMO_TRIP_IDS: ["demo-trip-pqc"],
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

/* ════════════════════════════════════════════
 * actions/replan — commitReplan
 * ════════════════════════════════════════════ */

describe("actions/replan — commitReplan", () => {
  const trigger = { type: "delay" as const, itemId: "item-1", minutes: 30 };

  beforeEach(() => {
    vi.resetAllMocks();
    mockCanWriteTrip.mockResolvedValue(true);
    mockGetActorId.mockResolvedValue("user-1");
  });

  it("DEMO trip → { ok: true, demo: true }", async () => {
    const { commitReplan } = await import("@/actions/replan");
    const result = await commitReplan({
      tripId: "demo-trip-pqc",
      optionId: "option-recommend",
      trigger,
    });
    expect(result).toEqual({ ok: true, demo: true });
  });

  it("forbidden", async () => {
    mockCanWriteTrip.mockResolvedValue(false);
    const { commitReplan } = await import("@/actions/replan");
    const result = await commitReplan({
      tripId: "trip-1",
      optionId: "option-recommend",
      trigger,
    });
    expect(result).toEqual({ ok: false, code: "forbidden" });
  });

  it("trip not_found", async () => {
    mockFetchTripFromDb.mockResolvedValue(null);
    const { commitReplan } = await import("@/actions/replan");
    const result = await commitReplan({
      tripId: "trip-1",
      optionId: "option-recommend",
      trigger,
    });
    expect(result).toEqual({ ok: false, code: "not_found" });
  });

  it("invalid_option", async () => {
    mockFetchTripFromDb.mockResolvedValue({
      trip: { id: "trip-1", updatedAt: "T" },
      items: [{ id: "a", scheduledAt: "2026-06-01T09:00:00Z" }],
    });
    mockGenerateReplanOptions.mockReturnValue([
      { option: { id: "option-safe", label: "안전" }, itemsAfter: [] },
    ]);
    const { commitReplan } = await import("@/actions/replan");
    const result = await commitReplan({
      tripId: "trip-1",
      optionId: "option-recommend",
      trigger,
    });
    expect(result).toEqual({ ok: false, code: "invalid_option" });
  });

  it("conflict", async () => {
    mockFetchTripFromDb.mockResolvedValue({
      trip: { id: "trip-1", updatedAt: "T" },
      items: [{ id: "a", scheduledAt: "2026-06-01T09:00:00Z" }],
    });
    mockGenerateReplanOptions.mockReturnValue([
      {
        option: { id: "option-recommend", label: "추천" },
        itemsAfter: [{ id: "a", scheduledAt: "2026-06-01T10:00:00Z" }],
      },
    ]);
    mockCommitReplanInTransaction.mockResolvedValue("conflict");
    const { commitReplan } = await import("@/actions/replan");
    const result = await commitReplan({
      tripId: "trip-1",
      optionId: "option-recommend",
      trigger,
      expectedTripUpdatedAt: "old-timestamp",
    });
    expect(result).toEqual({ ok: false, code: "conflict" });
  });

  it("성공 → ok + changedCount + audit", async () => {
    mockFetchTripFromDb.mockResolvedValue({
      trip: { id: "trip-1", updatedAt: "T" },
      items: [
        { id: "a", scheduledAt: "2026-06-01T09:00:00Z" },
        { id: "b", scheduledAt: "2026-06-01T11:00:00Z" },
      ],
    });
    mockGenerateReplanOptions.mockReturnValue([
      {
        option: { id: "option-recommend", label: "추천" },
        itemsAfter: [
          { id: "a", scheduledAt: "2026-06-01T09:30:00Z" }, // changed
          { id: "b", scheduledAt: "2026-06-01T11:00:00Z" }, // same
        ],
      },
    ]);
    mockCommitReplanInTransaction.mockResolvedValue({ tripUpdatedAt: "2026-06-01T12:00:00Z" });

    const { commitReplan } = await import("@/actions/replan");
    const result = await commitReplan({
      tripId: "trip-1",
      optionId: "option-recommend",
      trigger,
    });
    expect(result).toEqual({
      ok: true,
      demo: false,
      tripUpdatedAt: "2026-06-01T12:00:00Z",
      changedCount: 1,
    });
    expect(mockWriteAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "replan.commit",
        metadata: expect.objectContaining({
          optionId: "option-recommend",
          changedCount: 1,
        }),
      }),
    );
  });

  it("변경 없음 → changedCount 0 (tx 미호출)", async () => {
    mockFetchTripFromDb.mockResolvedValue({
      trip: { id: "trip-1", updatedAt: "T" },
      items: [{ id: "a", scheduledAt: "2026-06-01T09:00:00Z" }],
    });
    mockGenerateReplanOptions.mockReturnValue([
      {
        option: { id: "option-recommend", label: "추천" },
        itemsAfter: [{ id: "a", scheduledAt: "2026-06-01T09:00:00Z" }], // same
      },
    ]);
    const { commitReplan } = await import("@/actions/replan");
    const result = await commitReplan({
      tripId: "trip-1",
      optionId: "option-recommend",
      trigger,
    });
    expect(result).toEqual({ ok: true, demo: false, tripUpdatedAt: "T", changedCount: 0 });
    expect(mockCommitReplanInTransaction).not.toHaveBeenCalled();
  });
});

/* ════════════════════════════════════════════
 * actions/affiliate — trackAffiliateClick
 * ════════════════════════════════════════════ */

describe("actions/affiliate — trackAffiliateClick", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockGetActorId.mockResolvedValue("user-1");
  });

  it("정상 → redirectUrl + tracked + audit", async () => {
    mockBuildAffiliateUrl.mockReturnValue({
      url: "https://klook.com/offer?aff=td",
      tracked: true,
    });
    const { trackAffiliateClick } = await import("@/actions/affiliate");
    const result = await trackAffiliateClick({
      offerId: "o1",
      itemId: "it1",
      ota: "klook",
      priceKrw: 50000,
      baseUrl: "https://klook.com/offer",
    });
    expect(result).toEqual({
      ok: true,
      redirectUrl: "https://klook.com/offer?aff=td",
      tracked: true,
    });
    expect(mockWriteAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "affiliate.click",
        resource: "OtaOffer",
        resourceId: "o1",
        metadata: expect.objectContaining({ ota: "klook", priceKrw: 50000 }),
      }),
    );
  });

  it("tracked: false 경우 (ota 미지원)", async () => {
    mockBuildAffiliateUrl.mockReturnValue({
      url: "https://agoda.com/hotel",
      tracked: false,
    });
    const { trackAffiliateClick } = await import("@/actions/affiliate");
    const result = await trackAffiliateClick({
      offerId: "o2",
      itemId: "it2",
      ota: "agoda",
      priceKrw: 80000,
      baseUrl: "https://agoda.com/hotel",
    });
    expect(result.tracked).toBe(false);
    expect(result.redirectUrl).toBe("https://agoda.com/hotel");
  });
});

/* ════════════════════════════════════════════
 * actions/shareComment — createCommentAction
 * ════════════════════════════════════════════ */

describe("actions/shareComment — createCommentAction", () => {
  const baseInput = {
    syncKey: "key-abc",
    nickname: "여행자",
    body: "멋지네요!",
    clientUuid: "uuid-12345678",
  };

  beforeEach(() => {
    vi.resetAllMocks();
    mockGetActorId.mockResolvedValue(null); // 익명
  });

  it("link not_found", async () => {
    mockFetchShareLinkBySyncKey.mockResolvedValue(null);
    const { createCommentAction } = await import("@/actions/shareComment");
    const result = await createCommentAction(baseInput);
    expect(result).toEqual({ ok: false, code: "not_found" });
  });

  it("link revoked", async () => {
    mockFetchShareLinkBySyncKey.mockResolvedValue({
      link: { id: "sl-1", tripId: "t1", revokedAt: new Date(), expiresAt: null },
    });
    const { createCommentAction } = await import("@/actions/shareComment");
    const result = await createCommentAction(baseInput);
    expect(result).toEqual({ ok: false, code: "revoked" });
  });

  it("link expired", async () => {
    mockFetchShareLinkBySyncKey.mockResolvedValue({
      link: { id: "sl-1", tripId: "t1", revokedAt: null, expiresAt: new Date(Date.now() - 86400000) },
    });
    const { createCommentAction } = await import("@/actions/shareComment");
    const result = await createCommentAction(baseInput);
    expect(result).toEqual({ ok: false, code: "expired" });
  });

  it("repo 실패", async () => {
    mockFetchShareLinkBySyncKey.mockResolvedValue({
      link: { id: "sl-1", tripId: "t1", revokedAt: null, expiresAt: null },
    });
    mockCreateCommentRow.mockResolvedValue({ ok: false, code: "internal", message: "DB err" });
    const { createCommentAction } = await import("@/actions/shareComment");
    const result = await createCommentAction(baseInput);
    expect(result).toEqual({ ok: false, code: "internal", message: "DB err" });
  });

  it("성공 → commentId + audit", async () => {
    mockFetchShareLinkBySyncKey.mockResolvedValue({
      link: { id: "sl-1", tripId: "t1", revokedAt: null, expiresAt: null },
    });
    mockCreateCommentRow.mockResolvedValue({ ok: true, comment: { id: "c-99" } });
    const { createCommentAction } = await import("@/actions/shareComment");
    const result = await createCommentAction(baseInput);
    expect(result).toEqual({ ok: true, demo: false, commentId: "c-99" });
    expect(mockWriteAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "comment.create",
        resourceId: "c-99",
      }),
    );
  });
});

/* ════════════════════════════════════════════
 * actions/shareComment — deleteCommentAction
 * ════════════════════════════════════════════ */

describe("actions/shareComment — deleteCommentAction", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockGetActorId.mockResolvedValue("user-1");
  });

  it("repo 실패 → { ok: false, code }", async () => {
    mockDeleteCommentRow.mockResolvedValue({ ok: false, code: "not_found" });
    const { deleteCommentAction } = await import("@/actions/shareComment");
    const result = await deleteCommentAction({
      syncKey: "k",
      commentId: "c1",
      clientUuid: "uuid",
    });
    expect(result).toEqual({ ok: false, code: "not_found" });
  });

  it("성공 → ok + audit", async () => {
    mockDeleteCommentRow.mockResolvedValue({ ok: true });
    const { deleteCommentAction } = await import("@/actions/shareComment");
    const result = await deleteCommentAction({
      syncKey: "k",
      commentId: "c2",
      clientUuid: "uuid",
    });
    expect(result).toEqual({ ok: true });
    expect(mockWriteAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "comment.delete",
        resourceId: "c2",
      }),
    );
  });
});
