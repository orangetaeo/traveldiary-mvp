/**
 * actions/translate.ts 단위 테스트.
 *
 * translateMenuPhotoAction — translateMenuPhoto 호출 + 조건부 audit log.
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

const mockTranslateMenuPhoto = vi.fn();
vi.mock("@/lib/services/menu-translation", () => ({
  translateMenuPhoto: (...args: unknown[]) => mockTranslateMenuPhoto(...args),
}));

import { translateMenuPhotoAction } from "@/actions/translate";

describe("translateMenuPhotoAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetActorId.mockResolvedValue("user-1");
    mockWriteAuditLog.mockResolvedValue(undefined);
  });

  it("ok + fresh → audit 기록", async () => {
    mockTranslateMenuPhoto.mockResolvedValue({
      mode: "ok",
      items: [{ original: "Phở", translated: "쌀국수", price: null }],
      cached: false,
      totalMs: 1200,
    });

    const result = await translateMenuPhotoAction({
      imageBase64: "base64",
      contextId: "item-1",
    });

    expect(result.mode).toBe("ok");
    expect(mockWriteAuditLog).toHaveBeenCalledOnce();
    const log = mockWriteAuditLog.mock.calls[0][0];
    expect(log.action).toBe("evidence.gathered");
    expect(log.resource).toBe("MenuTranslation");
    expect(log.resourceId).toBe("item-1");
    expect(log.after).toEqual({ itemCount: 1 });
    expect(log.metadata.source).toBe("claude-vision");
    expect(log.metadata.mode).toBe("ok");
  });

  it("ok + cached → audit 미기록", async () => {
    mockTranslateMenuPhoto.mockResolvedValue({
      mode: "ok",
      items: [{ original: "A", translated: "B", price: null }],
      cached: true,
      totalMs: 50,
    });

    await translateMenuPhotoAction({ imageBase64: "base64" });

    expect(mockWriteAuditLog).not.toHaveBeenCalled();
  });

  it("ok + fresh → audit 기록 (cached=false)", async () => {
    mockTranslateMenuPhoto.mockResolvedValue({
      mode: "ok",
      items: [],
      cached: false,
      totalMs: 300,
    });

    await translateMenuPhotoAction({ imageBase64: "img" });

    expect(mockWriteAuditLog).toHaveBeenCalledOnce();
  });

  it("error → audit 기록", async () => {
    mockTranslateMenuPhoto.mockResolvedValue({
      mode: "error",
      stage: "vision",
      code: "claude_api_error",
      message: "HTTP 403",
      totalMs: 200,
    });

    const result = await translateMenuPhotoAction({
      imageBase64: "img",
      contextId: "ctx-1",
    });

    expect(result.mode).toBe("error");
    expect(mockWriteAuditLog).toHaveBeenCalledOnce();
    const log = mockWriteAuditLog.mock.calls[0][0];
    expect(log.after).toBeNull();
    expect(log.metadata.mode).toBe("error");
    expect(log.metadata.errorCode).toBe("claude_api_error");
    expect(log.metadata.stage).toBe("vision");
  });

  it("no_text → audit 기록", async () => {
    mockTranslateMenuPhoto.mockResolvedValue({
      mode: "no_text",
      totalMs: 150,
    });

    const result = await translateMenuPhotoAction({ imageBase64: "img" });

    expect(result.mode).toBe("no_text");
    expect(mockWriteAuditLog).toHaveBeenCalledOnce();
    const log = mockWriteAuditLog.mock.calls[0][0];
    expect(log.metadata.mode).toBe("no_text");
  });

  it("demo → audit 미기록", async () => {
    mockTranslateMenuPhoto.mockResolvedValue({ mode: "demo" });

    const result = await translateMenuPhotoAction({ imageBase64: "img" });

    expect(result.mode).toBe("demo");
    expect(mockWriteAuditLog).not.toHaveBeenCalled();
  });

  it("contextId 미지정 → resourceId='unknown'", async () => {
    mockTranslateMenuPhoto.mockResolvedValue({
      mode: "error",
      stage: "vision",
      code: "network",
      totalMs: 100,
    });

    await translateMenuPhotoAction({ imageBase64: "img" });

    const log = mockWriteAuditLog.mock.calls[0][0];
    expect(log.resourceId).toBe("unknown");
  });

  it("translateMenuPhoto에 imageBase64 전달", async () => {
    mockTranslateMenuPhoto.mockResolvedValue({ mode: "demo" });

    await translateMenuPhotoAction({ imageBase64: "ABC123" });

    expect(mockTranslateMenuPhoto).toHaveBeenCalledWith("ABC123");
  });

  it("결과 그대로 반환", async () => {
    const outcome = {
      mode: "ok" as const,
      items: [{ original: "X", translated: "Y", price: "10k" }],
      cached: false,
      totalMs: 500,
    };
    mockTranslateMenuPhoto.mockResolvedValue(outcome);

    const result = await translateMenuPhotoAction({ imageBase64: "img", contextId: "c" });

    expect(result).toEqual(outcome);
  });
});
