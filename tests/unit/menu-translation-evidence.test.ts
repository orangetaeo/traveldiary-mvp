/**
 * MenuTranslation + KoreanEvidence 서비스 오케스트레이션 테스트 — Batch 16.
 *
 * 2 모듈:
 *  - lib/services/menu-translation.ts: translateMenuPhoto 파이프라인 분기
 *  - lib/services/korean-evidence.ts: gatherKoreanEvidence 집계
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

/* ────────── menu-translation mocks ────────── */

const mockOcr = vi.fn();
const mockClaude = vi.fn();

vi.mock("@/lib/services/google-vision", () => ({
  ocrFromBase64Image: (...args: unknown[]) => mockOcr(...args),
}));

vi.mock("@/lib/services/anthropic-claude", () => ({
  translateMenuOcr: (...args: unknown[]) => mockClaude(...args),
}));

/* ────────── korean-evidence mocks ────────── */

const mockLocal = vi.fn();
const mockBlog = vi.fn();

vi.mock("@/lib/services/naver-search", () => ({
  searchNaverLocal: (...args: unknown[]) => mockLocal(...args),
  searchNaverBlog: (...args: unknown[]) => mockBlog(...args),
}));

/* ────────── translateMenuPhoto ────────── */

describe("services — translateMenuPhoto", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("OCR demo → mode 'demo'", async () => {
    mockOcr.mockResolvedValue({ mode: "demo" });
    const { translateMenuPhoto } = await import("@/lib/services/menu-translation");
    const result = await translateMenuPhoto("base64data");
    expect(result.mode).toBe("demo");
    expect(mockClaude).not.toHaveBeenCalled();
  });

  it("OCR error → mode 'error' + stage 'ocr'", async () => {
    mockOcr.mockResolvedValue({ mode: "error", code: "network", message: "timeout" });
    const { translateMenuPhoto } = await import("@/lib/services/menu-translation");
    const result = await translateMenuPhoto("img");
    expect(result.mode).toBe("error");
    if (result.mode === "error") {
      expect(result.stage).toBe("ocr");
      expect(result.code).toBe("network");
      expect(result.message).toBe("timeout");
      expect(result.totalMs).toBeGreaterThanOrEqual(0);
    }
  });

  it("OCR no_text → mode 'no_text' + ocrCached 전달", async () => {
    mockOcr.mockResolvedValue({ mode: "no_text", cached: true, fetchDurationMs: 5 });
    const { translateMenuPhoto } = await import("@/lib/services/menu-translation");
    const result = await translateMenuPhoto("img");
    expect(result.mode).toBe("no_text");
    if (result.mode === "no_text") {
      expect(result.ocrCached).toBe(true);
      expect(result.totalMs).toBeGreaterThanOrEqual(0);
    }
  });

  it("OCR ok + Claude demo → mode 'demo'", async () => {
    mockOcr.mockResolvedValue({ mode: "ok", text: "메뉴 텍스트", cached: false, fetchDurationMs: 100 });
    mockClaude.mockResolvedValue({ mode: "demo" });
    const { translateMenuPhoto } = await import("@/lib/services/menu-translation");
    const result = await translateMenuPhoto("img");
    expect(result.mode).toBe("demo");
  });

  it("OCR ok + Claude error → mode 'error' + stage 'claude'", async () => {
    mockOcr.mockResolvedValue({ mode: "ok", text: "food", cached: false, fetchDurationMs: 50 });
    mockClaude.mockResolvedValue({ mode: "error", code: "api_error", message: "rate limit" });
    const { translateMenuPhoto } = await import("@/lib/services/menu-translation");
    const result = await translateMenuPhoto("img");
    expect(result.mode).toBe("error");
    if (result.mode === "error") {
      expect(result.stage).toBe("claude");
      expect(result.code).toBe("api_error");
    }
  });

  it("OCR ok + Claude ok → mode 'ok' + items + cached 플래그", async () => {
    const items = [{ original: "Phở", translated: "쌀국수" }];
    mockOcr.mockResolvedValue({ mode: "ok", text: "Phở", cached: true, fetchDurationMs: 0 });
    mockClaude.mockResolvedValue({ mode: "ok", items, cached: false, fetchDurationMs: 200 });
    const { translateMenuPhoto } = await import("@/lib/services/menu-translation");
    const result = await translateMenuPhoto("img");
    expect(result.mode).toBe("ok");
    if (result.mode === "ok") {
      expect(result.items).toEqual(items);
      expect(result.ocrCached).toBe(true);
      expect(result.claudeCached).toBe(false);
      expect(result.totalMs).toBeGreaterThanOrEqual(0);
    }
  });

  it("OCR 호출 → Claude에 text 전달", async () => {
    mockOcr.mockResolvedValue({ mode: "ok", text: "Bánh mì 30K", cached: false, fetchDurationMs: 10 });
    mockClaude.mockResolvedValue({ mode: "ok", items: [], cached: false, fetchDurationMs: 10 });
    const { translateMenuPhoto } = await import("@/lib/services/menu-translation");
    await translateMenuPhoto("img");
    expect(mockClaude).toHaveBeenCalledWith("Bánh mì 30K");
  });
});

/* ────────── gatherKoreanEvidence ────────── */

describe("services — gatherKoreanEvidence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("둘 다 demo → mode 'demo'", async () => {
    mockLocal.mockResolvedValue({ mode: "demo" });
    mockBlog.mockResolvedValue({ mode: "demo" });
    const { gatherKoreanEvidence } = await import("@/lib/services/korean-evidence");
    const result = await gatherKoreanEvidence("다낭 미케비치");
    expect(result.mode).toBe("demo");
  });

  it("Local ok + Blog demo → mode 'ok' + 네이버 지도 source", async () => {
    mockLocal.mockResolvedValue({
      mode: "ok",
      items: [{ title: "미케비치", link: "https://map.naver.com/place/123" }],
      cached: false,
    });
    mockBlog.mockResolvedValue({ mode: "demo" });
    const { gatherKoreanEvidence } = await import("@/lib/services/korean-evidence");
    const result = await gatherKoreanEvidence("미케비치");
    expect(result.mode).toBe("ok");
    if (result.mode === "ok") {
      expect(result.evidence.reasons[0]).toContain("네이버 지도");
      expect(result.evidence.sources[0].platform).toBe("naver");
      expect(result.evidence.sources[0].url).toContain("map.naver.com");
    }
  });

  it("Local demo + Blog ok → mode 'ok' + 블로그 source", async () => {
    mockLocal.mockResolvedValue({ mode: "demo" });
    mockBlog.mockResolvedValue({
      mode: "ok",
      items: [{ title: "여행 후기" }],
      total: 1500,
      positiveHeuristic: 82,
      cached: true,
    });
    const { gatherKoreanEvidence } = await import("@/lib/services/korean-evidence");
    const result = await gatherKoreanEvidence("다낭 맛집");
    expect(result.mode).toBe("ok");
    if (result.mode === "ok") {
      expect(result.evidence.reasons[0]).toContain("블로그");
      expect(result.evidence.reasons[0]).toContain("1,500");
      expect(result.evidence.reasons[0]).toContain("82%");
      expect(result.evidence.sources[0].reviewCount).toBe(1500);
      expect(result.evidence.sources[0].positiveRate).toBe(82);
      expect(result.cached).toBe(true);
    }
  });

  it("둘 다 ok → 2 sources + 2 reasons", async () => {
    mockLocal.mockResolvedValue({
      mode: "ok",
      items: [{ title: "랍스터킹", link: "https://map.naver.com/v5/x" }],
      cached: true,
    });
    mockBlog.mockResolvedValue({
      mode: "ok",
      items: [{ title: "푸꾸옥 맛집" }],
      total: 300,
      positiveHeuristic: 91,
      cached: true,
    });
    const { gatherKoreanEvidence } = await import("@/lib/services/korean-evidence");
    const result = await gatherKoreanEvidence("푸꾸옥 랍스터킹");
    expect(result.mode).toBe("ok");
    if (result.mode === "ok") {
      expect(result.evidence.reasons.length).toBe(2);
      expect(result.evidence.sources.length).toBe(2);
      expect(result.cached).toBe(true);
    }
  });

  it("Local ok (빈 items) + Blog ok (빈 items) → mode 'no_data'", async () => {
    mockLocal.mockResolvedValue({ mode: "ok", items: [], cached: false });
    mockBlog.mockResolvedValue({ mode: "ok", items: [], total: 0, positiveHeuristic: 0, cached: false });
    const { gatherKoreanEvidence } = await import("@/lib/services/korean-evidence");
    const result = await gatherKoreanEvidence("없는 장소");
    expect(result.mode).toBe("no_data");
  });

  it("cached 계산 — 하나라도 fresh → cached=false", async () => {
    mockLocal.mockResolvedValue({
      mode: "ok",
      items: [{ title: "x", link: "" }],
      cached: false,
    });
    mockBlog.mockResolvedValue({
      mode: "ok",
      items: [{ title: "y" }],
      total: 10,
      positiveHeuristic: 50,
      cached: true,
    });
    const { gatherKoreanEvidence } = await import("@/lib/services/korean-evidence");
    const result = await gatherKoreanEvidence("테스트");
    expect(result.mode).toBe("ok");
    if (result.mode === "ok") {
      expect(result.cached).toBe(false);
    }
  });

  it("Local link 없으면 → map.naver.com 검색 URL 생성", async () => {
    mockLocal.mockResolvedValue({
      mode: "ok",
      items: [{ title: "호이안 올드타운", link: "" }],
      cached: true,
    });
    mockBlog.mockResolvedValue({ mode: "demo" });
    const { gatherKoreanEvidence } = await import("@/lib/services/korean-evidence");
    const result = await gatherKoreanEvidence("호이안 올드타운");
    expect(result.mode).toBe("ok");
    if (result.mode === "ok") {
      expect(result.evidence.sources[0].url).toContain("map.naver.com/v5/search/");
      expect(result.evidence.sources[0].url).toContain(encodeURIComponent("호이안 올드타운"));
    }
  });

  it("verifiedAt ISO 형식", async () => {
    mockLocal.mockResolvedValue({
      mode: "ok",
      items: [{ title: "T", link: "http://x" }],
      cached: true,
    });
    mockBlog.mockResolvedValue({ mode: "demo" });
    const { gatherKoreanEvidence } = await import("@/lib/services/korean-evidence");
    const result = await gatherKoreanEvidence("T");
    if (result.mode === "ok") {
      expect(result.evidence.verifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    }
  });
});
