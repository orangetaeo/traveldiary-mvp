/**
 * lib/services/menu-translation.ts 단위 테스트.
 *
 * translateMenuPhoto — Vision OCR + Claude 2단계 파이프라인.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockOcr = vi.fn();
vi.mock("@/lib/services/google-vision", () => ({
  ocrFromBase64Image: (...args: unknown[]) => mockOcr(...args),
}));

const mockTranslate = vi.fn();
vi.mock("@/lib/services/anthropic-claude", () => ({
  translateMenuOcr: (...args: unknown[]) => mockTranslate(...args),
}));

import { translateMenuPhoto } from "@/lib/services/menu-translation";

describe("translateMenuPhoto", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("OCR demo → demo", async () => {
    mockOcr.mockResolvedValue({ mode: "demo" });
    const r = await translateMenuPhoto("base64data");
    expect(r.mode).toBe("demo");
    expect(mockTranslate).not.toHaveBeenCalled();
  });

  it("OCR error → error (stage=ocr)", async () => {
    mockOcr.mockResolvedValue({
      mode: "error",
      code: "quota_exceeded",
      message: "API quota",
    });

    const r = await translateMenuPhoto("base64data");
    expect(r.mode).toBe("error");
    if (r.mode === "error") {
      expect(r.stage).toBe("ocr");
      expect(r.code).toBe("quota_exceeded");
      expect(r.message).toBe("API quota");
      expect(r.totalMs).toBeGreaterThanOrEqual(0);
    }
  });

  it("OCR no_text → no_text", async () => {
    mockOcr.mockResolvedValue({ mode: "no_text", cached: true });

    const r = await translateMenuPhoto("base64data");
    expect(r.mode).toBe("no_text");
    if (r.mode === "no_text") {
      expect(r.ocrCached).toBe(true);
      expect(r.totalMs).toBeGreaterThanOrEqual(0);
    }
  });

  it("OCR ok + Claude demo → demo", async () => {
    mockOcr.mockResolvedValue({ mode: "ok", text: "Phở Bò", cached: false });
    mockTranslate.mockResolvedValue({ mode: "demo" });

    const r = await translateMenuPhoto("base64data");
    expect(r.mode).toBe("demo");
  });

  it("OCR ok + Claude error → error (stage=claude)", async () => {
    mockOcr.mockResolvedValue({ mode: "ok", text: "Phở Bò", cached: false });
    mockTranslate.mockResolvedValue({
      mode: "error",
      code: "rate_limit",
      message: "429",
    });

    const r = await translateMenuPhoto("base64data");
    expect(r.mode).toBe("error");
    if (r.mode === "error") {
      expect(r.stage).toBe("claude");
      expect(r.code).toBe("rate_limit");
    }
  });

  it("OCR ok + Claude ok → ok (items + cached flags)", async () => {
    mockOcr.mockResolvedValue({ mode: "ok", text: "Phở Bò\nBánh mì", cached: false });
    mockTranslate.mockResolvedValue({
      mode: "ok",
      items: [
        { original: "Phở Bò", translated: "쇠고기 쌀국수", price: "50,000₫" },
        { original: "Bánh mì", translated: "바게트 샌드위치", price: "30,000₫" },
      ],
      cached: true,
    });

    const r = await translateMenuPhoto("base64data");
    expect(r.mode).toBe("ok");
    if (r.mode === "ok") {
      expect(r.items).toHaveLength(2);
      expect(r.items[0].translated).toBe("쇠고기 쌀국수");
      expect(r.ocrCached).toBe(false);
      expect(r.claudeCached).toBe(true);
      expect(r.totalMs).toBeGreaterThanOrEqual(0);
    }
  });

  it("imageBase64 전달 확인", async () => {
    mockOcr.mockResolvedValue({ mode: "demo" });
    await translateMenuPhoto("test-image-data");
    expect(mockOcr).toHaveBeenCalledWith("test-image-data");
  });

  it("OCR text를 Claude에 전달", async () => {
    mockOcr.mockResolvedValue({ mode: "ok", text: "메뉴 텍스트", cached: false });
    mockTranslate.mockResolvedValue({ mode: "demo" });

    await translateMenuPhoto("img");
    expect(mockTranslate).toHaveBeenCalledWith("메뉴 텍스트");
  });
});
