/**
 * Claude 모델별 토큰 단가 (사이클 AAAA2, ADR-047 트리거 — 가격 갱신은 별도 PR).
 *
 * 단위: USD per 1,000,000 tokens (Anthropic 공시 단가 기준 추정값)
 * 갱신 시점: Anthropic 가격 변경 또는 신규 모델 출시.
 */

export interface ModelPrice {
  inputPerMTok: number;
  outputPerMTok: number;
}

export const MODEL_PRICING: Record<string, ModelPrice> = {
  // Haiku 4.5
  "claude-haiku-4-5-20251001": { inputPerMTok: 1.0, outputPerMTok: 5.0 },
  "claude-haiku-4-5": { inputPerMTok: 1.0, outputPerMTok: 5.0 },
  // Sonnet 4.6
  "claude-sonnet-4-6": { inputPerMTok: 3.0, outputPerMTok: 15.0 },
  // Opus 4.7
  "claude-opus-4-7": { inputPerMTok: 15.0, outputPerMTok: 75.0 },
  "claude-opus-4-7[1m]": { inputPerMTok: 15.0, outputPerMTok: 75.0 },
};

/**
 * 토큰 사용량 → USD 계산. 모델 미등록 시 0 (안전 기본값).
 */
export function calculateCostUsd(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const price = MODEL_PRICING[model];
  if (!price) return 0;
  const inUsd = (inputTokens / 1_000_000) * price.inputPerMTok;
  const outUsd = (outputTokens / 1_000_000) * price.outputPerMTok;
  return inUsd + outUsd;
}
