/**
 * lib/services/anthropic-claude.ts 단위 테스트.
 *
 * translateMenuOcr + claudeAvailable — env, 캐시, 쿼터, 예산, fetch, JSON 파싱.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockGetCache = vi.fn();
const mockSetCache = vi.fn();
vi.mock("@/lib/repositories/evidence-cache.repository", () => ({
  getEvidenceCache: (...args: unknown[]) => mockGetCache(...args),
  setEvidenceCache: (...args: unknown[]) => mockSetCache(...args),
}));

const mockAssertQuota = vi.fn();
const mockRecordCall = vi.fn();
vi.mock("@/lib/usage-quota", () => {
  class _QuotaExceededError extends Error {
    cap: number;
    resetAt: number;
    constructor(cap: number, resetAt: number) {
      super("quota exceeded");
      this.cap = cap;
      this.resetAt = resetAt;
    }
  }
  return {
    assertQuota: (...args: unknown[]) => mockAssertQuota(...args),
    recordExternalCall: (...args: unknown[]) => mockRecordCall(...args),
    QuotaExceededError: _QuotaExceededError,
  };
});

const mockAssertBudget = vi.fn();
const mockRecordSpend = vi.fn();
vi.mock("@/lib/autonomy/budget", () => {
  class _BudgetExceededError extends Error {
    tier: string;
    thresholdUsd: number;
    currentUsd: number;
    constructor(tier: string, thresholdUsd: number, currentUsd: number) {
      super("budget exceeded");
      this.tier = tier;
      this.thresholdUsd = thresholdUsd;
      this.currentUsd = currentUsd;
    }
  }
  class _AutonomyPausedError extends Error {
    pausedAt: string;
    reason: string;
    constructor(pausedAt: string, reason: string) {
      super("autonomy paused");
      this.pausedAt = pausedAt;
      this.reason = reason;
    }
  }
  return {
    assertBudget: (...args: unknown[]) => mockAssertBudget(...args),
    recordSpend: (...args: unknown[]) => mockRecordSpend(...args),
    BudgetExceededError: _BudgetExceededError,
    AutonomyPausedError: _AutonomyPausedError,
  };
});

vi.mock("@/lib/autonomy/model-pricing", () => ({
  calculateCostUsd: () => 0.001,
}));

const mockGetEnvKey = vi.fn();
vi.mock("@/lib/utils/env", () => ({
  getEnvKey: (...args: unknown[]) => mockGetEnvKey(...args),
}));

vi.mock("@/lib/utils/cache-key", () => ({
  hashCacheKey: (s: string) => `hash-${s.slice(0, 8)}`,
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { translateMenuOcr, claudeAvailable } from "@/lib/services/anthropic-claude";
import { QuotaExceededError } from "@/lib/usage-quota";
import { BudgetExceededError, AutonomyPausedError } from "@/lib/autonomy/budget";

describe("anthropic-claude service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAssertQuota.mockReset();
    mockAssertBudget.mockReset();
    mockGetEnvKey.mockReturnValue(null);
    mockGetCache.mockResolvedValue(null);
    mockSetCache.mockResolvedValue(undefined);
  });

  // ─── claudeAvailable ──────────────────────────────────────

  it("env 미설정 → false", () => {
    expect(claudeAvailable()).toBe(false);
  });

  it("env 설정 → true", () => {
    mockGetEnvKey.mockReturnValue("sk-test");
    expect(claudeAvailable()).toBe(true);
  });

  // ─── demo ──────────────────────────────────────────────────

  it("API key 미설정 → demo", async () => {
    const r = await translateMenuOcr("some text");
    expect(r).toEqual({ mode: "demo" });
  });

  // ─── 캐시 히트 ────────────────────────────────────────────

  it("캐시 히트 → ok + cached", async () => {
    mockGetEnvKey.mockReturnValue("sk-test");
    mockGetCache.mockResolvedValue({
      data: { items: [{ vn: "Phở", ko: "쌀국수", allergens: [] }] },
    });

    const r = await translateMenuOcr("Phở bò");
    expect(r).toMatchObject({ mode: "ok", cached: true });
    if (r.mode === "ok") {
      expect(r.items[0].ko).toBe("쌀국수");
    }
  });

  // ─── 쿼터 초과 ────────────────────────────────────────────

  it("쿼터 초과 → quota_exceeded + recordExternalCall(blockedBy)", async () => {
    mockGetEnvKey.mockReturnValue("sk-test");
    mockAssertQuota.mockImplementation(() => {
      throw new QuotaExceededError(10, Date.now() + 60000);
    });

    const r = await translateMenuOcr("text");
    expect(r).toMatchObject({ mode: "error", code: "quota_exceeded" });
    expect(mockRecordCall).toHaveBeenCalledWith("anthropic", { blockedBy: "quota" });
  });

  // ─── 예산 초과 ────────────────────────────────────────────

  it("예산 초과 → budget_exceeded + recordExternalCall(blockedBy)", async () => {
    mockGetEnvKey.mockReturnValue("sk-test");
    mockAssertBudget.mockImplementation(() => {
      throw new BudgetExceededError("daily", 1.0, 1.5);
    });

    const r = await translateMenuOcr("text");
    expect(r).toMatchObject({ mode: "error", code: "budget_exceeded" });
    expect(mockRecordCall).toHaveBeenCalledWith("anthropic", { blockedBy: "budget" });
  });

  // ─── autonomy paused ──────────────────────────────────────

  it("autonomy paused → autonomy_paused", async () => {
    mockGetEnvKey.mockReturnValue("sk-test");
    mockAssertBudget.mockImplementation(() => {
      throw new AutonomyPausedError("2026-05-06T12:00:00Z", "emergency");
    });

    const r = await translateMenuOcr("text");
    expect(r).toMatchObject({ mode: "error", code: "autonomy_paused" });
    expect(mockRecordCall).toHaveBeenCalledWith("anthropic", { blockedBy: "emergency" });
  });

  // ─── fetch 성공 → JSON 파싱 ────────────────────────────────

  it("API OK + 유효 JSON → ok + items + recordSpend", async () => {
    mockGetEnvKey.mockReturnValue("sk-test");
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{
          type: "text",
          text: '{"items":[{"vn":"Cơm tấm","ko":"꼼땀","allergens":["egg"]}]}',
        }],
        usage: { input_tokens: 100, output_tokens: 50 },
      }),
    });

    const r = await translateMenuOcr("Cơm tấm sườn");
    expect(r).toMatchObject({ mode: "ok", cached: false });
    if (r.mode === "ok") {
      expect(r.items[0].vn).toBe("Cơm tấm");
      expect(r.items[0].allergens).toEqual(["egg"]);
    }
    expect(mockRecordSpend).toHaveBeenCalledOnce();
    expect(mockSetCache).toHaveBeenCalledOnce();
  });

  // ─── JSON 앞뒤 텍스트 섞임 → 추출 ──────────────────────────

  it("JSON 앞뒤 텍스트 → 추출 성공", async () => {
    mockGetEnvKey.mockReturnValue("sk-test");
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{
          type: "text",
          text: 'Here is the translation:\n{"items":[{"vn":"Bún","ko":"분","allergens":[]}]}\nDone!',
        }],
        usage: { input_tokens: 50, output_tokens: 30 },
      }),
    });

    const r = await translateMenuOcr("Bún bò");
    expect(r).toMatchObject({ mode: "ok" });
    if (r.mode === "ok") {
      expect(r.items[0].ko).toBe("분");
    }
  });

  // ─── JSON 없음 → parse_error ───────────────────────────────

  it("content에 JSON 없음 → parse_error", async () => {
    mockGetEnvKey.mockReturnValue("sk-test");
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ type: "text", text: "I cannot process this." }],
        usage: { input_tokens: 10, output_tokens: 5 },
      }),
    });

    const r = await translateMenuOcr("invalid");
    expect(r).toMatchObject({ mode: "error", code: "parse_error" });
  });

  // ─── items가 배열 아님 → parse_error ────────────────────────

  it("items 배열 아님 → parse_error", async () => {
    mockGetEnvKey.mockReturnValue("sk-test");
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ type: "text", text: '{"items":"not-array"}' }],
        usage: { input_tokens: 10, output_tokens: 5 },
      }),
    });

    const r = await translateMenuOcr("bad");
    expect(r).toEqual({ mode: "error", code: "parse_error", message: "items not array" });
  });

  // ─── API HTTP 에러 ─────────────────────────────────────────

  it("HTTP 에러 → claude_api_error", async () => {
    mockGetEnvKey.mockReturnValue("sk-test");
    mockFetch.mockResolvedValue({ ok: false, status: 429 });

    const r = await translateMenuOcr("text");
    expect(r).toEqual({ mode: "error", code: "claude_api_error", message: "HTTP 429" });
  });

  // ─── API 응답 내 error ─────────────────────────────────────

  it("API 응답 error 필드 → claude_api_error", async () => {
    mockGetEnvKey.mockReturnValue("sk-test");
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        error: { message: "overloaded" },
      }),
    });

    const r = await translateMenuOcr("text");
    expect(r).toEqual({ mode: "error", code: "claude_api_error", message: "overloaded" });
  });

  // ─── 네트워크 에러 ─────────────────────────────────────────

  it("fetch throw → network", async () => {
    mockGetEnvKey.mockReturnValue("sk-test");
    mockFetch.mockRejectedValue(new Error("ECONNRESET"));

    const r = await translateMenuOcr("text");
    expect(r).toEqual({ mode: "error", code: "network", message: "ECONNRESET" });
  });
});
