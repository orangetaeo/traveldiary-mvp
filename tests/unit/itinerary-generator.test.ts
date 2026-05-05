/**
 * Itinerary Generator AI 오케스트레이션 테스트 — Batch 21.
 *
 * lib/services/itinerary-generator.ts: generateItinerary, aiGenerationAvailable
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("server-only", () => ({}));

/* ────────── manual mocks ────────── */

const mockAssertQuota = vi.fn();
const mockRecordExternalCall = vi.fn();

class TestQuotaExceededError extends Error {
  name = "QuotaExceededError";
}

vi.mock("@/lib/usage-quota", () => ({
  assertQuota: (...args: unknown[]) => mockAssertQuota(...args),
  recordExternalCall: (...args: unknown[]) => mockRecordExternalCall(...args),
  QuotaExceededError: TestQuotaExceededError,
}));

const mockAssertBudget = vi.fn();
const mockRecordSpend = vi.fn();

class TestBudgetExceededError extends Error {
  name = "BudgetExceededError";
}
class TestAutonomyPausedError extends Error {
  name = "AutonomyPausedError";
}

vi.mock("@/lib/autonomy/budget", () => ({
  assertBudget: (...args: unknown[]) => mockAssertBudget(...args),
  recordSpend: (...args: unknown[]) => mockRecordSpend(...args),
  BudgetExceededError: TestBudgetExceededError,
  AutonomyPausedError: TestAutonomyPausedError,
}));

vi.mock("@/lib/autonomy/model-pricing", () => ({
  calculateCostUsd: () => 0.005,
}));

const BASE_INPUT = {
  destination: "다낭",
  destinationCode: "DAD",
  startDate: "2026-05-10",
  nights: 3,
  companion: "friends",
  preferences: {
    vibes: ["food", "photo"],
    pace: "balanced",
    excludes: [],
  },
};

describe("services — itinerary-generator", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env = { ...ORIGINAL_ENV };
    // @ts-expect-error mock fetch
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("aiGenerationAvailable — key 없으면 false", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const { aiGenerationAvailable } = await import("@/lib/services/itinerary-generator");
    expect(aiGenerationAvailable()).toBe(false);
  });

  it("aiGenerationAvailable — key 있으면 true", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-test";
    const { aiGenerationAvailable } = await import("@/lib/services/itinerary-generator");
    expect(aiGenerationAvailable()).toBe(true);
  });

  it("API key 없으면 → demo + reason 'no_api_key'", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const { generateItinerary } = await import("@/lib/services/itinerary-generator");
    const result = await generateItinerary(BASE_INPUT);
    expect(result.mode).toBe("demo");
    if (result.mode === "demo") expect(result.reason).toBe("no_api_key");
  });

  it("QuotaExceededError → demo + 'quota_exceeded'", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    mockAssertQuota.mockImplementation(() => { throw new TestQuotaExceededError(); });
    const { generateItinerary } = await import("@/lib/services/itinerary-generator");
    const result = await generateItinerary(BASE_INPUT);
    expect(result.mode).toBe("demo");
    if (result.mode === "demo") expect(result.reason).toBe("quota_exceeded");
  });

  it("BudgetExceededError → demo + 'budget_exceeded'", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    mockAssertBudget.mockImplementation(() => { throw new TestBudgetExceededError(); });
    const { generateItinerary } = await import("@/lib/services/itinerary-generator");
    const result = await generateItinerary(BASE_INPUT);
    expect(result.mode).toBe("demo");
    if (result.mode === "demo") expect(result.reason).toBe("budget_exceeded");
  });

  it("AutonomyPausedError → demo + 'autonomy_paused'", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    mockAssertBudget.mockImplementation(() => { throw new TestAutonomyPausedError(); });
    const { generateItinerary } = await import("@/lib/services/itinerary-generator");
    const result = await generateItinerary(BASE_INPUT);
    expect(result.mode).toBe("demo");
    if (result.mode === "demo") expect(result.reason).toBe("autonomy_paused");
  });

  it("HTTP 에러 → error + 'claude_api_error'", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 429,
    });
    const { generateItinerary } = await import("@/lib/services/itinerary-generator");
    const result = await generateItinerary(BASE_INPUT);
    expect(result.mode).toBe("error");
    if (result.mode === "error") {
      expect(result.code).toBe("claude_api_error");
      expect(result.message).toContain("429");
    }
  });

  it("JSON 파싱 실패 → error + 'parse_error'", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ type: "text", text: "이건 JSON이 아닙니다" }],
        usage: { input_tokens: 100, output_tokens: 50 },
      }),
    });
    const { generateItinerary } = await import("@/lib/services/itinerary-generator");
    const result = await generateItinerary(BASE_INPUT);
    expect(result.mode).toBe("error");
    if (result.mode === "error") expect(result.code).toBe("parse_error");
  });

  it("빈 items 배열 → error + 'parse_error'", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ type: "text", text: '{"items":[]}' }],
        usage: { input_tokens: 100, output_tokens: 50 },
      }),
    });
    const { generateItinerary } = await import("@/lib/services/itinerary-generator");
    const result = await generateItinerary(BASE_INPUT);
    expect(result.mode).toBe("error");
    if (result.mode === "error") expect(result.message).toContain("empty");
  });

  it("정상 응답 → mode 'ok' + ItineraryItem[] 변환", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    const llmResponse = {
      items: [
        {
          dayIndex: 0,
          time: "09:00",
          name: "미케비치 (My Khe Beach)",
          category: "spot",
          lat: 16.05,
          lng: 108.24,
          address: "다낭 미케비치",
          durationMinutes: 90,
          reason: "한국인에게 인기 있는 해변",
        },
        {
          dayIndex: 0,
          time: "12:00",
          name: "반쎄오 맛집 (Banh Xeo Ba Duong)",
          category: "food",
          lat: 16.07,
          lng: 108.22,
          address: "23 Hoàng Diệu",
          durationMinutes: 60,
          reason: "현지 유명 반쎄오",
        },
      ],
    };

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ type: "text", text: JSON.stringify(llmResponse) }],
        usage: { input_tokens: 800, output_tokens: 400 },
      }),
    });
    const { generateItinerary } = await import("@/lib/services/itinerary-generator");
    const result = await generateItinerary(BASE_INPUT);
    expect(result.mode).toBe("ok");
    if (result.mode === "ok") {
      expect(result.items.length).toBe(2);
      expect(result.items[0].name).toBe("미케비치 (My Khe Beach)");
      expect(result.items[0].category).toBe("spot");
      expect(result.items[0].location.lat).toBe(16.05);
      expect(result.items[0].durationMinutes).toBe(90);
      expect(result.items[0].evidence.reasons[0]).toContain("한국인");
      expect(result.items[1].category).toBe("food");
      expect(result.model).toBe("claude-haiku-4-5-20251001");
    }
  });

  it("네트워크 에러 → error + 'network'", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("ECONNREFUSED"));
    const { generateItinerary } = await import("@/lib/services/itinerary-generator");
    const result = await generateItinerary(BASE_INPUT);
    expect(result.mode).toBe("error");
    if (result.mode === "error") {
      expect(result.code).toBe("network");
      expect(result.message).toContain("ECONNREFUSED");
    }
  });

  it("recordSpend 호출됨 (토큰 사용량 기록)", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ type: "text", text: '{"items":[{"dayIndex":0,"time":"09:00","name":"X","category":"spot","lat":10,"lng":103,"address":"","durationMinutes":60,"reason":"test"}]}' }],
        usage: { input_tokens: 500, output_tokens: 300 },
      }),
    });
    const { generateItinerary } = await import("@/lib/services/itinerary-generator");
    await generateItinerary(BASE_INPUT);
    expect(mockRecordSpend).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "anthropic",
        inputTokens: 500,
        outputTokens: 300,
      }),
    );
  });

  it("recordExternalCall 호출됨 (API 호출 카운트)", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ type: "text", text: '{"items":[{"dayIndex":0,"time":"09:00","name":"Y","category":"food","lat":10,"lng":103,"address":"","durationMinutes":60,"reason":"r"}]}' }],
        usage: { input_tokens: 100, output_tokens: 50 },
      }),
    });
    const { generateItinerary } = await import("@/lib/services/itinerary-generator");
    await generateItinerary(BASE_INPUT);
    expect(mockRecordExternalCall).toHaveBeenCalledWith("anthropic");
  });

  it("API 응답에 error 필드 → error 반환", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ error: { message: "invalid_api_key" } }),
    });
    const { generateItinerary } = await import("@/lib/services/itinerary-generator");
    const result = await generateItinerary(BASE_INPUT);
    expect(result.mode).toBe("error");
    if (result.mode === "error") expect(result.message).toBe("invalid_api_key");
  });
});
