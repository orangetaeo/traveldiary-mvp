/**
 * MenuTranslation + KoreanEvidence 서비스 오케스트레이션 테스트 — Batch 16.
 *
 * 2 모듈:
 *  - lib/services/menu-translation.ts: translateMenuPhoto Claude Vision 단일 파이프라인
 *  - lib/services/korean-evidence.ts: gatherKoreanEvidence 집계
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

/* ────────── menu-translation mocks ────────── */

const mockGetEnvKey = vi.fn();
vi.mock("@/lib/utils/env", () => ({
  getEnvKey: (...args: unknown[]) => mockGetEnvKey(...args),
}));

vi.mock("@/lib/usage-quota", () => ({
  assertQuota: vi.fn(),
  recordExternalCall: vi.fn(),
  QuotaExceededError: class extends Error { cap = 0; },
}));

vi.mock("@/lib/autonomy/budget", () => ({
  assertBudget: vi.fn(),
  recordSpend: vi.fn(),
  AutonomyPausedError: class extends Error { reason = ""; },
  BudgetExceededError: class extends Error { tier = ""; thresholdUsd = 0; },
}));

vi.mock("@/lib/autonomy/model-pricing", () => ({
  calculateCostUsd: vi.fn().mockReturnValue(0),
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

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
    mockGetEnvKey.mockReturnValue(null);
  });

  it("API 키 미설정 → mode 'demo'", async () => {
    mockGetEnvKey.mockReturnValue(null);
    const { translateMenuPhoto } = await import("@/lib/services/menu-translation");
    const result = await translateMenuPhoto("base64data");
    expect(result.mode).toBe("demo");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("Claude Vision API 에러 → mode 'error' + stage 'vision'", async () => {
    mockGetEnvKey.mockReturnValue("sk-ant-test-key");
    mockFetch.mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({}),
    });
    const { translateMenuPhoto } = await import("@/lib/services/menu-translation");
    const result = await translateMenuPhoto("img");
    expect(result.mode).toBe("error");
    if (result.mode === "error") {
      expect(result.stage).toBe("vision");
      expect(result.code).toBe("claude_api_error");
      expect(result.message).toBe("HTTP 403");
      expect(result.totalMs).toBeGreaterThanOrEqual(0);
    }
  });

  it("no_text 응답 → mode 'no_text'", async () => {
    mockGetEnvKey.mockReturnValue("sk-ant-test-key");
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ type: "text", text: '{"no_text":true}' }],
        usage: { input_tokens: 100, output_tokens: 10 },
      }),
    });
    const { translateMenuPhoto } = await import("@/lib/services/menu-translation");
    const result = await translateMenuPhoto("img");
    expect(result.mode).toBe("no_text");
    if (result.mode === "no_text") {
      expect(result.totalMs).toBeGreaterThanOrEqual(0);
    }
  });

  it("네트워크 에러 → mode 'error' + code 'network'", async () => {
    mockGetEnvKey.mockReturnValue("sk-ant-test-key");
    mockFetch.mockRejectedValue(new Error("ECONNREFUSED"));
    const { translateMenuPhoto } = await import("@/lib/services/menu-translation");
    const result = await translateMenuPhoto("img");
    expect(result.mode).toBe("error");
    if (result.mode === "error") {
      expect(result.stage).toBe("vision");
      expect(result.code).toBe("network");
      expect(result.message).toBe("ECONNREFUSED");
    }
  });

  it("정상 응답 → mode 'ok' + items + cached=false", async () => {
    const items = [{ vn: "Phở", ko: "쌀국수", allergens: [] }];
    mockGetEnvKey.mockReturnValue("sk-ant-test-key");
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ type: "text", text: JSON.stringify({ items }) }],
        usage: { input_tokens: 500, output_tokens: 50 },
      }),
    });
    const { translateMenuPhoto } = await import("@/lib/services/menu-translation");
    const result = await translateMenuPhoto("img");
    expect(result.mode).toBe("ok");
    if (result.mode === "ok") {
      expect(result.items).toEqual(items);
      expect(result.cached).toBe(false);
      expect(result.totalMs).toBeGreaterThanOrEqual(0);
    }
  });

  it("JSON 파싱 실패 → mode 'error' + code 'parse_error'", async () => {
    mockGetEnvKey.mockReturnValue("sk-ant-test-key");
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ type: "text", text: "이것은 JSON이 아닙니다" }],
        usage: { input_tokens: 100, output_tokens: 20 },
      }),
    });
    const { translateMenuPhoto } = await import("@/lib/services/menu-translation");
    const result = await translateMenuPhoto("img");
    expect(result.mode).toBe("error");
    if (result.mode === "error") {
      expect(result.stage).toBe("vision");
      expect(result.code).toBe("parse_error");
    }
  });

  it("Claude에 이미지 base64를 직접 전달", async () => {
    mockGetEnvKey.mockReturnValue("sk-ant-test-key");
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ type: "text", text: '{"items":[]}' }],
        usage: { input_tokens: 100, output_tokens: 10 },
      }),
    });
    const { translateMenuPhoto } = await import("@/lib/services/menu-translation");
    await translateMenuPhoto("/9j/base64imagedata");
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.messages[0].content[0].type).toBe("image");
    expect(body.messages[0].content[0].source.data).toBe("/9j/base64imagedata");
    expect(body.messages[0].content[0].source.media_type).toBe("image/jpeg");
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
