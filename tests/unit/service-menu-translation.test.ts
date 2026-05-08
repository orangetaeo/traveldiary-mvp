/**
 * lib/services/menu-translation.ts 단위 테스트.
 *
 * translateMenuPhoto — Claude Vision 멀티모달 단일 파이프라인.
 * 사이클 JJ: Google Vision + Claude 2단계 → Claude Vision 1단계 전환에 맞춰 재작성.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

vi.mock("server-only", () => ({}));

// 쿼터/예산 모듈 모킹
vi.mock("@/lib/usage-quota", () => ({
  assertQuota: vi.fn(),
  recordExternalCall: vi.fn(),
  QuotaExceededError: class extends Error { cap = 10; },
}));
vi.mock("@/lib/autonomy/model-pricing", () => ({
  calculateCostUsd: vi.fn(() => 0.001),
}));
vi.mock("@/lib/autonomy/budget", () => ({
  assertBudget: vi.fn(),
  recordSpend: vi.fn(),
  AutonomyPausedError: class extends Error { reason = "test"; },
  BudgetExceededError: class extends Error { tier = "warn"; thresholdUsd = 1; },
}));

const SAVED_KEY = process.env.ANTHROPIC_API_KEY;

describe("translateMenuPhoto", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ANTHROPIC_API_KEY = "sk-test-key";
  });

  afterEach(() => {
    if (SAVED_KEY === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = SAVED_KEY;
    vi.restoreAllMocks();
  });

  it("ANTHROPIC_API_KEY 미설정 → demo", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const { translateMenuPhoto } = await import("@/lib/services/menu-translation");
    const r = await translateMenuPhoto("base64data");
    expect(r.mode).toBe("demo");
  });

  it("Claude API ok → ok (items + cached=false)", async () => {
    const mockItems = [
      { vn: "Phở Bò", ko: "쇠고기 쌀국수", allergens: [] },
      { vn: "Bánh mì", ko: "바게트 샌드위치", allergens: ["gluten"] },
    ];
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          content: [{ type: "text", text: JSON.stringify({ items: mockItems }) }],
          usage: { input_tokens: 100, output_tokens: 50 },
        }),
        { status: 200 },
      ),
    );

    const { translateMenuPhoto } = await import("@/lib/services/menu-translation");
    const r = await translateMenuPhoto("base64data");
    expect(r.mode).toBe("ok");
    if (r.mode === "ok") {
      expect(r.items).toHaveLength(2);
      expect(r.items[0].ko).toBe("쇠고기 쌀국수");
      expect(r.cached).toBe(false);
      expect(r.totalMs).toBeGreaterThanOrEqual(0);
    }
  });

  it("Claude API HTTP 에러 → error (stage=vision)", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("Rate limited", { status: 429 }),
    );

    const { translateMenuPhoto } = await import("@/lib/services/menu-translation");
    const r = await translateMenuPhoto("base64data");
    expect(r.mode).toBe("error");
    if (r.mode === "error") {
      expect(r.stage).toBe("vision");
      expect(r.code).toBe("claude_api_error");
      expect(r.message).toContain("429");
    }
  });

  it("no_text 응답 → no_text", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          content: [{ type: "text", text: '{"no_text": true}' }],
          usage: { input_tokens: 100, output_tokens: 10 },
        }),
        { status: 200 },
      ),
    );

    const { translateMenuPhoto } = await import("@/lib/services/menu-translation");
    const r = await translateMenuPhoto("base64data");
    expect(r.mode).toBe("no_text");
    if (r.mode === "no_text") {
      expect(r.totalMs).toBeGreaterThanOrEqual(0);
    }
  });

  it("파싱 실패 → error (stage=vision, code=parse_error)", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          content: [{ type: "text", text: "이건 JSON이 아닙니다" }],
          usage: { input_tokens: 100, output_tokens: 20 },
        }),
        { status: 200 },
      ),
    );

    const { translateMenuPhoto } = await import("@/lib/services/menu-translation");
    const r = await translateMenuPhoto("base64data");
    expect(r.mode).toBe("error");
    if (r.mode === "error") {
      expect(r.stage).toBe("vision");
      expect(r.code).toBe("parse_error");
    }
  });

  it("네트워크 에러 → error (stage=vision, code=network)", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("ECONNREFUSED"));

    const { translateMenuPhoto } = await import("@/lib/services/menu-translation");
    const r = await translateMenuPhoto("base64data");
    expect(r.mode).toBe("error");
    if (r.mode === "error") {
      expect(r.stage).toBe("vision");
      expect(r.code).toBe("network");
      expect(r.message).toBe("ECONNREFUSED");
    }
  });

  it("translateAvailable — 키 있으면 true, 없으면 false", async () => {
    const { translateAvailable } = await import("@/lib/services/menu-translation");
    expect(translateAvailable()).toBe(true);

    delete process.env.ANTHROPIC_API_KEY;
    expect(translateAvailable()).toBe(false);
  });
});
