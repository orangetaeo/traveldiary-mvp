/**
 * actions/evidence.ts 단위 테스트.
 *
 * gatherKoreanEvidenceAction — gatherKoreanEvidence 호출 + fresh-only audit log.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockWriteAuditLog = vi.fn();
vi.mock("@/lib/audit-log", () => ({
  writeAuditLog: (...args: unknown[]) => mockWriteAuditLog(...args),
}));

const mockGetActorId = vi.fn();
vi.mock("@/lib/auth/session", () => ({
  getActorId: () => mockGetActorId(),
}));

const mockGatherKoreanEvidence = vi.fn();
vi.mock("@/lib/services/korean-evidence", () => ({
  gatherKoreanEvidence: (...args: unknown[]) => mockGatherKoreanEvidence(...args),
}));

import { gatherKoreanEvidenceAction } from "@/actions/evidence";

describe("gatherKoreanEvidenceAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetActorId.mockResolvedValue("user-1");
    mockWriteAuditLog.mockResolvedValue(undefined);
  });

  const BASE_INPUT = { itemId: "item-1", query: "다낭 맛집" };

  it("ok + fresh → audit 기록", async () => {
    mockGatherKoreanEvidence.mockResolvedValue({
      mode: "ok",
      cached: false,
      evidence: {
        reasons: ["네이버 지도 등록"],
        sources: [{ platform: "naver", url: "https://map.naver.com" }],
        verifiedAt: "2026-05-07T00:00:00Z",
      },
    });

    const result = await gatherKoreanEvidenceAction(BASE_INPUT);

    expect(result.mode).toBe("ok");
    expect(mockWriteAuditLog).toHaveBeenCalledOnce();
    const log = mockWriteAuditLog.mock.calls[0][0];
    expect(log.action).toBe("evidence.gathered");
    expect(log.resource).toBe("ItineraryItem");
    expect(log.resourceId).toBe("item-1");
    expect(log.after).toEqual({ sourceCount: 1, reasonCount: 1 });
    expect(log.metadata).toEqual({ source: "naver", query: "다낭 맛집" });
  });

  it("ok + cached → audit 미기록", async () => {
    mockGatherKoreanEvidence.mockResolvedValue({
      mode: "ok",
      cached: true,
      evidence: {
        reasons: ["캐시"],
        sources: [{ platform: "naver", url: "u" }],
        verifiedAt: "2026-05-07T00:00:00Z",
      },
    });

    await gatherKoreanEvidenceAction(BASE_INPUT);

    expect(mockWriteAuditLog).not.toHaveBeenCalled();
  });

  it("demo → audit 미기록", async () => {
    mockGatherKoreanEvidence.mockResolvedValue({ mode: "demo" });

    const result = await gatherKoreanEvidenceAction(BASE_INPUT);

    expect(result.mode).toBe("demo");
    expect(mockWriteAuditLog).not.toHaveBeenCalled();
  });

  it("no_data → audit 미기록", async () => {
    mockGatherKoreanEvidence.mockResolvedValue({ mode: "no_data" });

    const result = await gatherKoreanEvidenceAction(BASE_INPUT);

    expect(result.mode).toBe("no_data");
    expect(mockWriteAuditLog).not.toHaveBeenCalled();
  });

  it("error → audit 미기록", async () => {
    mockGatherKoreanEvidence.mockResolvedValue({
      mode: "error",
      message: "Naver API fail",
    });

    const result = await gatherKoreanEvidenceAction(BASE_INPUT);

    expect(result.mode).toBe("error");
    expect(mockWriteAuditLog).not.toHaveBeenCalled();
  });

  it("gatherKoreanEvidence에 query 전달", async () => {
    mockGatherKoreanEvidence.mockResolvedValue({ mode: "demo" });

    await gatherKoreanEvidenceAction({ itemId: "i", query: "호이안 쿠킹" });

    expect(mockGatherKoreanEvidence).toHaveBeenCalledWith("호이안 쿠킹");
  });

  it("결과 그대로 반환", async () => {
    const outcome = { mode: "no_data" as const };
    mockGatherKoreanEvidence.mockResolvedValue(outcome);

    const result = await gatherKoreanEvidenceAction(BASE_INPUT);

    expect(result).toEqual(outcome);
  });

  it("actorId 전달", async () => {
    mockGetActorId.mockResolvedValue("actor-xyz");
    mockGatherKoreanEvidence.mockResolvedValue({
      mode: "ok",
      cached: false,
      evidence: {
        reasons: ["r"],
        sources: [{ platform: "naver", url: "u" }],
        verifiedAt: "t",
      },
    });

    await gatherKoreanEvidenceAction(BASE_INPUT);

    const log = mockWriteAuditLog.mock.calls[0][0];
    expect(log.actorId).toBe("actor-xyz");
  });
});
