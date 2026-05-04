import { describe, it, expect } from "vitest";
import { calculateCostUsd, MODEL_PRICING } from "@/lib/autonomy/model-pricing";

describe("model-pricing — Claude 모델 단가 (사이클 AAAA2)", () => {
  it("Haiku 4.5: $1/$5 per MTok", () => {
    // 1M input + 1M output = $1 + $5 = $6
    expect(
      calculateCostUsd("claude-haiku-4-5-20251001", 1_000_000, 1_000_000),
    ).toBeCloseTo(6.0, 6);
  });

  it("Sonnet 4.6: $3/$15 per MTok", () => {
    expect(
      calculateCostUsd("claude-sonnet-4-6", 1_000_000, 1_000_000),
    ).toBeCloseTo(18.0, 6);
  });

  it("Opus 4.7: $15/$75 per MTok", () => {
    expect(
      calculateCostUsd("claude-opus-4-7", 1_000_000, 1_000_000),
    ).toBeCloseTo(90.0, 6);
  });

  it("미등록 모델은 0 (안전 기본값)", () => {
    expect(calculateCostUsd("unknown-model", 1_000_000, 1_000_000)).toBe(0);
  });

  it("작은 토큰 양도 정확히 계산", () => {
    // 100 input + 50 output @ Haiku = 100/1M*$1 + 50/1M*$5 = $0.0001 + $0.00025 = $0.00035
    expect(
      calculateCostUsd("claude-haiku-4-5-20251001", 100, 50),
    ).toBeCloseTo(0.00035, 8);
  });

  it("Opus 4.7[1m]도 같은 단가", () => {
    expect(MODEL_PRICING["claude-opus-4-7[1m]"]).toEqual(
      MODEL_PRICING["claude-opus-4-7"],
    );
  });

  it("Haiku 4.5와 Haiku 4.5 (timestamped)는 같은 단가", () => {
    expect(MODEL_PRICING["claude-haiku-4-5"]).toEqual(
      MODEL_PRICING["claude-haiku-4-5-20251001"],
    );
  });
});
