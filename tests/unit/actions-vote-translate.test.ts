/**
 * Server Action 단위 테스트 — Batch 36.
 *
 * 3 모듈:
 *  - actions/vote.ts: createVote, castVote
 *  - actions/translate.ts: translateMenuPhotoAction
 *  - actions/evidence.ts: gatherKoreanEvidenceAction
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

vi.mock("@/lib/auth/actor-resolution", () => ({
  resolveActorIdForTrip: (tripId: string, actorId: string | null) => {
    if (tripId === "demo-trip-pqc") return null;
    return actorId;
  },
}));

const mockCreateVoteRow = vi.fn();
const mockCastVoteToggle = vi.fn();
vi.mock("@/lib/repositories/vote.repository", () => ({
  createVoteRow: (...args: unknown[]) => mockCreateVoteRow(...args),
  castVoteToggle: (...args: unknown[]) => mockCastVoteToggle(...args),
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

const mockTranslateMenuPhoto = vi.fn();
vi.mock("@/lib/services/menu-translation", () => ({
  translateMenuPhoto: (...args: unknown[]) => mockTranslateMenuPhoto(...args),
}));

const mockGatherKoreanEvidence = vi.fn();
vi.mock("@/lib/services/korean-evidence", () => ({
  gatherKoreanEvidence: (...args: unknown[]) => mockGatherKoreanEvidence(...args),
}));

/* ════════════════════════════════════════════
 * actions/vote — createVote
 * ════════════════════════════════════════════ */

describe("actions/vote — createVote", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockCanWriteTrip.mockResolvedValue(true);
    mockGetActorId.mockResolvedValue("user-1");
  });

  it("DEMO trip → { ok: true, demo: true }", async () => {
    const { createVote } = await import("@/actions/vote");
    const result = await createVote({
      tripId: "demo-trip-pqc",
      question: "어디 갈까?",
      optionLabels: ["A", "B"],
    });
    expect(result).toEqual({ ok: true, demo: true });
  });

  it("forbidden → { ok: false, code: 'forbidden' }", async () => {
    mockCanWriteTrip.mockResolvedValue(false);
    const { createVote } = await import("@/actions/vote");
    const result = await createVote({
      tripId: "trip-1",
      question: "질문",
      optionLabels: ["A", "B"],
    });
    expect(result).toEqual({ ok: false, code: "forbidden" });
  });

  it("빈 question → { ok: false, code: 'invalid' }", async () => {
    const { createVote } = await import("@/actions/vote");
    const result = await createVote({
      tripId: "trip-1",
      question: "   ",
      optionLabels: ["A", "B"],
    });
    expect(result).toEqual({ ok: false, code: "invalid" });
  });

  it("옵션 1개 → { ok: false, code: 'invalid' }", async () => {
    const { createVote } = await import("@/actions/vote");
    const result = await createVote({
      tripId: "trip-1",
      question: "질문",
      optionLabels: ["A"],
    });
    expect(result).toEqual({ ok: false, code: "invalid" });
  });

  it("빈 옵션 문자열 필터링 → 유효 옵션 < 2면 invalid", async () => {
    const { createVote } = await import("@/actions/vote");
    const result = await createVote({
      tripId: "trip-1",
      question: "질문",
      optionLabels: ["A", "  ", ""],
    });
    expect(result).toEqual({ ok: false, code: "invalid" });
  });

  it("정상 생성 → { ok: true, demo: false, data }", async () => {
    const mockVote = { id: "v1", question: "Q?", options: [] };
    mockCreateVoteRow.mockResolvedValue(mockVote);
    const { createVote } = await import("@/actions/vote");
    const result = await createVote({
      tripId: "trip-1",
      question: "어디갈까?",
      optionLabels: ["바나힐", "미케비치"],
    });
    expect(result).toEqual({ ok: true, demo: false, data: mockVote });
    expect(mockCreateVoteRow).toHaveBeenCalledWith(
      expect.objectContaining({
        tripId: "trip-1",
        question: "어디갈까?",
        optionLabels: ["바나힐", "미케비치"],
        createdBy: "user-1",
        actorId: "user-1",
      }),
    );
  });

  it("repo 실패 → { ok: false, code: 'internal' }", async () => {
    mockCreateVoteRow.mockResolvedValue(null);
    const { createVote } = await import("@/actions/vote");
    const result = await createVote({
      tripId: "trip-1",
      question: "Q",
      optionLabels: ["A", "B"],
    });
    expect(result).toEqual({ ok: false, code: "internal" });
  });
});

/* ════════════════════════════════════════════
 * actions/vote — castVote
 * ════════════════════════════════════════════ */

describe("actions/vote — castVote", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockCanWriteTrip.mockResolvedValue(true);
    mockGetActorId.mockResolvedValue("user-1");
  });

  it("DEMO trip → { ok: true, demo: true }", async () => {
    const { castVote } = await import("@/actions/vote");
    const result = await castVote({
      voteId: "v1",
      tripId: "demo-trip-pqc",
      optionIndex: 0,
    });
    expect(result).toEqual({ ok: true, demo: true });
  });

  it("forbidden → { ok: false, code: 'forbidden' }", async () => {
    mockCanWriteTrip.mockResolvedValue(false);
    const { castVote } = await import("@/actions/vote");
    const result = await castVote({
      voteId: "v1",
      tripId: "trip-1",
      optionIndex: 0,
    });
    expect(result).toEqual({ ok: false, code: "forbidden" });
  });

  it("미인증 → { ok: false, code: 'no_actor' }", async () => {
    mockGetActorId.mockResolvedValue(null);
    const { castVote } = await import("@/actions/vote");
    const result = await castVote({
      voteId: "v1",
      tripId: "trip-1",
      optionIndex: 0,
    });
    expect(result).toEqual({ ok: false, code: "no_actor" });
  });

  it("vote not found → { ok: false, code: 'not_found' }", async () => {
    mockCastVoteToggle.mockResolvedValue("not_found");
    const { castVote } = await import("@/actions/vote");
    const result = await castVote({
      voteId: "v1",
      tripId: "trip-1",
      optionIndex: 0,
    });
    expect(result).toEqual({ ok: false, code: "not_found" });
  });

  it("repo 실패 (null) → { ok: false, code: 'internal' }", async () => {
    mockCastVoteToggle.mockResolvedValue(null);
    const { castVote } = await import("@/actions/vote");
    const result = await castVote({
      voteId: "v1",
      tripId: "trip-1",
      optionIndex: 0,
    });
    expect(result).toEqual({ ok: false, code: "internal" });
  });

  it("성공 → { ok: true, demo: false, data } + audit log", async () => {
    const mockVoteResult = { id: "v1", question: "Q" };
    mockCastVoteToggle.mockResolvedValue(mockVoteResult);
    const { castVote } = await import("@/actions/vote");
    const result = await castVote({
      voteId: "v1",
      tripId: "trip-1",
      optionIndex: 2,
    });
    expect(result).toEqual({ ok: true, demo: false, data: mockVoteResult });
    expect(mockWriteAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: "user-1",
        resource: "Vote",
        resourceId: "v1",
      }),
    );
  });
});

/* ════════════════════════════════════════════
 * actions/translate — translateMenuPhotoAction
 * ════════════════════════════════════════════ */

describe("actions/translate — translateMenuPhotoAction", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockGetActorId.mockResolvedValue("user-1");
  });

  it("demo → audit 미기록", async () => {
    mockTranslateMenuPhoto.mockResolvedValue({ mode: "demo" });
    const { translateMenuPhotoAction } = await import("@/actions/translate");
    const result = await translateMenuPhotoAction({
      imageBase64: "base64data",
      contextId: "item-1",
    });
    expect(result.mode).toBe("demo");
    expect(mockWriteAuditLog).not.toHaveBeenCalled();
  });

  it("ok (fresh) → audit 기록", async () => {
    mockTranslateMenuPhoto.mockResolvedValue({
      mode: "ok",
      items: [{ name: "쌀국수" }],
      ocrCached: false,
      claudeCached: false,
      totalMs: 1200,
    });
    const { translateMenuPhotoAction } = await import("@/actions/translate");
    const result = await translateMenuPhotoAction({
      imageBase64: "data",
      contextId: "item-2",
    });
    expect(result.mode).toBe("ok");
    expect(mockWriteAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "evidence.gathered",
        resource: "MenuTranslation",
        resourceId: "item-2",
      }),
    );
  });

  it("ok (all cached) → audit 미기록", async () => {
    mockTranslateMenuPhoto.mockResolvedValue({
      mode: "ok",
      items: [{ name: "반미" }],
      ocrCached: true,
      claudeCached: true,
      totalMs: 50,
    });
    const { translateMenuPhotoAction } = await import("@/actions/translate");
    await translateMenuPhotoAction({ imageBase64: "d" });
    expect(mockWriteAuditLog).not.toHaveBeenCalled();
  });

  it("error → audit 기록", async () => {
    mockTranslateMenuPhoto.mockResolvedValue({
      mode: "error",
      stage: "ocr",
      code: "api_error",
      totalMs: 300,
    });
    const { translateMenuPhotoAction } = await import("@/actions/translate");
    const result = await translateMenuPhotoAction({ imageBase64: "d" });
    expect(result.mode).toBe("error");
    expect(mockWriteAuditLog).toHaveBeenCalled();
  });

  it("no_text → audit 기록", async () => {
    mockTranslateMenuPhoto.mockResolvedValue({
      mode: "no_text",
      ocrCached: false,
      totalMs: 500,
    });
    const { translateMenuPhotoAction } = await import("@/actions/translate");
    const result = await translateMenuPhotoAction({ imageBase64: "d" });
    expect(result.mode).toBe("no_text");
    expect(mockWriteAuditLog).toHaveBeenCalled();
  });

  it("contextId 미전송 → resourceId 'unknown'", async () => {
    mockTranslateMenuPhoto.mockResolvedValue({
      mode: "error",
      stage: "claude",
      code: "timeout",
      totalMs: 1000,
    });
    const { translateMenuPhotoAction } = await import("@/actions/translate");
    await translateMenuPhotoAction({ imageBase64: "d" });
    expect(mockWriteAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ resourceId: "unknown" }),
    );
  });
});

/* ════════════════════════════════════════════
 * actions/evidence — gatherKoreanEvidenceAction
 * ════════════════════════════════════════════ */

describe("actions/evidence — gatherKoreanEvidenceAction", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockGetActorId.mockResolvedValue("user-1");
  });

  it("ok + fresh → audit 기록", async () => {
    mockGatherKoreanEvidence.mockResolvedValue({
      mode: "ok",
      cached: false,
      evidence: {
        sources: [{ url: "https://naver.com", title: "후기" }],
        reasons: ["한국인 리뷰 4.5점"],
      },
    });
    const { gatherKoreanEvidenceAction } = await import("@/actions/evidence");
    const result = await gatherKoreanEvidenceAction({
      itemId: "item-99",
      query: "푸꾸옥 쌀국수",
    });
    expect(result.mode).toBe("ok");
    expect(mockWriteAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "evidence.gathered",
        resource: "ItineraryItem",
        resourceId: "item-99",
      }),
    );
  });

  it("ok + cached → audit 미기록", async () => {
    mockGatherKoreanEvidence.mockResolvedValue({
      mode: "ok",
      cached: true,
      evidence: { sources: [], reasons: [] },
    });
    const { gatherKoreanEvidenceAction } = await import("@/actions/evidence");
    await gatherKoreanEvidenceAction({ itemId: "item-1", query: "q" });
    expect(mockWriteAuditLog).not.toHaveBeenCalled();
  });

  it("demo → audit 미기록", async () => {
    mockGatherKoreanEvidence.mockResolvedValue({ mode: "demo" });
    const { gatherKoreanEvidenceAction } = await import("@/actions/evidence");
    const result = await gatherKoreanEvidenceAction({ itemId: "i", query: "q" });
    expect(result.mode).toBe("demo");
    expect(mockWriteAuditLog).not.toHaveBeenCalled();
  });

  it("error → audit 미기록", async () => {
    mockGatherKoreanEvidence.mockResolvedValue({
      mode: "error",
      code: "network",
    });
    const { gatherKoreanEvidenceAction } = await import("@/actions/evidence");
    const result = await gatherKoreanEvidenceAction({ itemId: "i", query: "q" });
    expect(result.mode).toBe("error");
    expect(mockWriteAuditLog).not.toHaveBeenCalled();
  });
});
