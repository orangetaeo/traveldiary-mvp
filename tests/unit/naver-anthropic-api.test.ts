/**
 * Naver Search + Anthropic Claude API 오케스트레이션 테스트 — Batch 25.
 *
 * 2 모듈:
 *  - lib/services/naver-search.ts: searchNaverLocal, searchNaverBlog, naverAvailable
 *  - lib/services/anthropic-claude.ts: translateMenuOcr, claudeAvailable
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("server-only", () => ({}));

/* ────────── shared mocks ────────── */

const mockGetEvidenceCache = vi.fn();
const mockSetEvidenceCache = vi.fn();
vi.mock("@/lib/repositories/evidence-cache.repository", () => ({
  getEvidenceCache: (...args: unknown[]) => mockGetEvidenceCache(...args),
  setEvidenceCache: (...args: unknown[]) => mockSetEvidenceCache(...args),
}));

const mockAssertQuota = vi.fn();
const mockRecordExternalCall = vi.fn();
const mockCheckQuotaOrBlock = vi.fn().mockReturnValue(null);
class TestQuotaExceededError extends Error { name = "QuotaExceededError"; cap = 10; resetAt = Date.now() + 3600000; }
vi.mock("@/lib/usage-quota", () => ({
  assertQuota: (...args: unknown[]) => mockAssertQuota(...args),
  recordExternalCall: (...args: unknown[]) => mockRecordExternalCall(...args),
  checkQuotaOrBlock: (...args: unknown[]) => mockCheckQuotaOrBlock(...args),
  QuotaExceededError: TestQuotaExceededError,
}));

const mockAssertBudget = vi.fn();
const mockRecordSpend = vi.fn();
class TestBudgetExceededError extends Error { name = "BudgetExceededError"; tier = "daily"; currentUsd = 0.5; thresholdUsd = 0.5; }
class TestAutonomyPausedError extends Error { name = "AutonomyPausedError"; pausedAt = "2026-05-05"; reason = "test"; }
vi.mock("@/lib/autonomy/budget", () => ({
  assertBudget: (...args: unknown[]) => mockAssertBudget(...args),
  recordSpend: (...args: unknown[]) => mockRecordSpend(...args),
  BudgetExceededError: TestBudgetExceededError,
  AutonomyPausedError: TestAutonomyPausedError,
}));

vi.mock("@/lib/autonomy/model-pricing", () => ({
  calculateCostUsd: () => 0.001,
}));

/* ════════════════════════════════════════════
 * Naver Search — searchNaverLocal
 * ════════════════════════════════════════════ */

describe("services — searchNaverLocal", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env = { ...ORIGINAL_ENV };
    // @ts-expect-error mock fetch
    globalThis.fetch = vi.fn();
    mockGetEvidenceCache.mockResolvedValue(null);
    mockSetEvidenceCache.mockResolvedValue(undefined);
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("naverAvailable — 키 없으면 false", async () => {
    delete process.env.NAVER_CLIENT_ID;
    const { naverAvailable } = await import("@/lib/services/naver-search");
    expect(naverAvailable()).toBe(false);
  });

  it("naverAvailable — 키 있으면 true", async () => {
    process.env.NAVER_CLIENT_ID = "id";
    process.env.NAVER_CLIENT_SECRET = "secret";
    const { naverAvailable } = await import("@/lib/services/naver-search");
    expect(naverAvailable()).toBe(true);
  });

  it("키 없으면 → demo", async () => {
    delete process.env.NAVER_CLIENT_ID;
    const { searchNaverLocal } = await import("@/lib/services/naver-search");
    const result = await searchNaverLocal("다낭 맛집");
    expect(result.mode).toBe("demo");
  });

  it("캐시 히트 → cached: true", async () => {
    process.env.NAVER_CLIENT_ID = "id";
    process.env.NAVER_CLIENT_SECRET = "secret";
    mockGetEvidenceCache.mockResolvedValue({ data: { items: [{ title: "X", link: "", category: "", address: "A", roadAddress: "" }] } });
    const { searchNaverLocal } = await import("@/lib/services/naver-search");
    const result = await searchNaverLocal("다낭");
    expect(result.mode).toBe("ok");
    if (result.mode === "ok") {
      expect(result.cached).toBe(true);
      expect(result.items.length).toBe(1);
    }
  });

  it("QuotaExceeded → error + 'quota_exceeded'", async () => {
    process.env.NAVER_CLIENT_ID = "id";
    process.env.NAVER_CLIENT_SECRET = "secret";
    mockCheckQuotaOrBlock.mockReturnValue({ mode: "error", code: "quota_exceeded", message: "cap=10" });
    const { searchNaverLocal } = await import("@/lib/services/naver-search");
    const result = await searchNaverLocal("다낭");
    expect(result.mode).toBe("error");
    if (result.mode === "error") expect(result.code).toBe("quota_exceeded");
  });

  it("HTTP 에러 → error + 'naver_api_error'", async () => {
    process.env.NAVER_CLIENT_ID = "id";
    process.env.NAVER_CLIENT_SECRET = "secret";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false, status: 500 });
    const { searchNaverLocal } = await import("@/lib/services/naver-search");
    const result = await searchNaverLocal("미케비치");
    expect(result.mode).toBe("error");
    if (result.mode === "error") expect(result.code).toBe("naver_api_error");
  });

  it("정상 응답 → ok + items + HTML strip", async () => {
    process.env.NAVER_CLIENT_ID = "id";
    process.env.NAVER_CLIENT_SECRET = "secret";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          { title: "<b>맛집</b> 다낭", link: "http://x", category: "음식", address: "다낭", roadAddress: "Rd" },
          { title: "", link: "", category: "", address: "", roadAddress: "" }, // 필터됨
        ],
      }),
    });
    const { searchNaverLocal } = await import("@/lib/services/naver-search");
    const result = await searchNaverLocal("다낭 맛집");
    expect(result.mode).toBe("ok");
    if (result.mode === "ok") {
      expect(result.items.length).toBe(1);
      expect(result.items[0].title).toBe("맛집 다낭"); // HTML 제거됨
      expect(result.cached).toBe(false);
    }
  });

  it("네트워크 에러 → error + 'network'", async () => {
    process.env.NAVER_CLIENT_ID = "id";
    process.env.NAVER_CLIENT_SECRET = "secret";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("TIMEOUT"));
    const { searchNaverLocal } = await import("@/lib/services/naver-search");
    const result = await searchNaverLocal("다낭");
    expect(result.mode).toBe("error");
    if (result.mode === "error") expect(result.code).toBe("network");
  });
});

/* ════════════════════════════════════════════
 * Naver Search — searchNaverBlog
 * ════════════════════════════════════════════ */

describe("services — searchNaverBlog", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env = { ...ORIGINAL_ENV };
    // @ts-expect-error mock fetch
    globalThis.fetch = vi.fn();
    mockGetEvidenceCache.mockResolvedValue(null);
    mockSetEvidenceCache.mockResolvedValue(undefined);
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("키 없으면 → demo", async () => {
    delete process.env.NAVER_CLIENT_ID;
    const { searchNaverBlog } = await import("@/lib/services/naver-search");
    const result = await searchNaverBlog("다낭 추천");
    expect(result.mode).toBe("demo");
  });

  it("정상 → ok + positiveHeuristic 계산", async () => {
    process.env.NAVER_CLIENT_ID = "id";
    process.env.NAVER_CLIENT_SECRET = "secret";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        total: 1200,
        items: [
          { title: "다낭 추천 맛집", description: "최고 강추!", bloggername: "A", postdate: "20260501", link: "http://b" },
          { title: "실망했어요", description: "별로인 곳", bloggername: "B", postdate: "20260502", link: "http://c" },
        ],
      }),
    });
    const { searchNaverBlog } = await import("@/lib/services/naver-search");
    const result = await searchNaverBlog("다낭 맛집");
    expect(result.mode).toBe("ok");
    if (result.mode === "ok") {
      expect(result.total).toBe(1200);
      expect(result.items.length).toBe(2);
      expect(result.positiveHeuristic).toBeGreaterThanOrEqual(0);
      expect(result.positiveHeuristic).toBeLessThanOrEqual(100);
      expect(result.cached).toBe(false);
    }
  });

  it("키워드 없는 블로그 → positiveHeuristic 80 (기본)", async () => {
    process.env.NAVER_CLIENT_ID = "id";
    process.env.NAVER_CLIENT_SECRET = "secret";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        total: 5,
        items: [{ title: "여행", description: "갔다왔음", bloggername: "X", postdate: "20260505", link: "" }],
      }),
    });
    const { searchNaverBlog } = await import("@/lib/services/naver-search");
    const result = await searchNaverBlog("일반");
    if (result.mode === "ok") {
      expect(result.positiveHeuristic).toBe(80);
    }
  });
});

/* ════════════════════════════════════════════
 * Anthropic Claude — translateMenuOcr
 * ════════════════════════════════════════════ */

describe("services — translateMenuOcr", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env = { ...ORIGINAL_ENV };
    // @ts-expect-error mock fetch
    globalThis.fetch = vi.fn();
    mockGetEvidenceCache.mockResolvedValue(null);
    mockSetEvidenceCache.mockResolvedValue(undefined);
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("claudeAvailable — 키 없으면 false", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const { claudeAvailable } = await import("@/lib/services/anthropic-claude");
    expect(claudeAvailable()).toBe(false);
  });

  it("키 없으면 → demo", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const { translateMenuOcr } = await import("@/lib/services/anthropic-claude");
    const result = await translateMenuOcr("Phở bò");
    expect(result.mode).toBe("demo");
  });

  it("캐시 히트 → ok + cached: true", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    mockGetEvidenceCache.mockResolvedValue({ data: { items: [{ vn: "Phở", ko: "쌀국수", allergens: [] }] } });
    const { translateMenuOcr } = await import("@/lib/services/anthropic-claude");
    const result = await translateMenuOcr("Phở bò");
    expect(result.mode).toBe("ok");
    if (result.mode === "ok") {
      expect(result.cached).toBe(true);
      expect(result.items[0].ko).toBe("쌀국수");
    }
  });

  it("QuotaExceeded → error + 'quota_exceeded'", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    mockAssertQuota.mockImplementation(() => { throw new TestQuotaExceededError(); });
    const { translateMenuOcr } = await import("@/lib/services/anthropic-claude");
    const result = await translateMenuOcr("text");
    expect(result.mode).toBe("error");
    if (result.mode === "error") expect(result.code).toBe("quota_exceeded");
  });

  it("BudgetExceeded → error + 'budget_exceeded'", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    mockAssertBudget.mockImplementation(() => { throw new TestBudgetExceededError(); });
    const { translateMenuOcr } = await import("@/lib/services/anthropic-claude");
    const result = await translateMenuOcr("text");
    expect(result.mode).toBe("error");
    if (result.mode === "error") expect(result.code).toBe("budget_exceeded");
  });

  it("AutonomyPaused → error + 'autonomy_paused'", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    mockAssertBudget.mockImplementation(() => { throw new TestAutonomyPausedError(); });
    const { translateMenuOcr } = await import("@/lib/services/anthropic-claude");
    const result = await translateMenuOcr("text");
    expect(result.mode).toBe("error");
    if (result.mode === "error") expect(result.code).toBe("autonomy_paused");
  });

  it("HTTP 에러 → error + 'claude_api_error'", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false, status: 429 });
    const { translateMenuOcr } = await import("@/lib/services/anthropic-claude");
    const result = await translateMenuOcr("Phở");
    expect(result.mode).toBe("error");
    if (result.mode === "error") expect(result.code).toBe("claude_api_error");
  });

  it("정상 응답 → ok + items 파싱", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    const menuItems = [
      { vn: "Phở bò", ko: "소고기 쌀국수", allergens: ["gluten"] },
      { vn: "Tôm hấp", ko: "새우찜", allergens: ["shrimp", "crustacean"] },
    ];
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ type: "text", text: JSON.stringify({ items: menuItems }) }],
        usage: { input_tokens: 200, output_tokens: 100 },
      }),
    });
    const { translateMenuOcr } = await import("@/lib/services/anthropic-claude");
    const result = await translateMenuOcr("Phở bò\nTôm hấp");
    expect(result.mode).toBe("ok");
    if (result.mode === "ok") {
      expect(result.items.length).toBe(2);
      expect(result.items[0].ko).toBe("소고기 쌀국수");
      expect(result.items[1].allergens).toContain("shrimp");
      expect(result.cached).toBe(false);
    }
  });

  it("JSON 파싱 실패 → error + 'parse_error'", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ type: "text", text: "이건 JSON이 아닙니다" }],
        usage: { input_tokens: 50, output_tokens: 30 },
      }),
    });
    const { translateMenuOcr } = await import("@/lib/services/anthropic-claude");
    const result = await translateMenuOcr("text");
    expect(result.mode).toBe("error");
    if (result.mode === "error") expect(result.code).toBe("parse_error");
  });

  it("네트워크 에러 → error + 'network'", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("ECONNRESET"));
    const { translateMenuOcr } = await import("@/lib/services/anthropic-claude");
    const result = await translateMenuOcr("text");
    expect(result.mode).toBe("error");
    if (result.mode === "error") {
      expect(result.code).toBe("network");
      expect(result.message).toContain("ECONNRESET");
    }
  });

  it("recordSpend 호출 (토큰 기록)", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ type: "text", text: '{"items":[{"vn":"X","ko":"Y","allergens":[]}]}' }],
        usage: { input_tokens: 100, output_tokens: 50 },
      }),
    });
    const { translateMenuOcr } = await import("@/lib/services/anthropic-claude");
    await translateMenuOcr("X");
    expect(mockRecordSpend).toHaveBeenCalledWith(
      expect.objectContaining({ provider: "anthropic", inputTokens: 100, outputTokens: 50 }),
    );
  });
});
