/**
 * Price Verification — 사이클 N (ADR-029, 5단계 검증 5단계).
 *
 * 시드 estimatedPrice (KRW) ↔ OTA aggregator 가격 (KRW) 비교.
 * 비교 로직은 순수 함수로 분리 (테스트 용이) + OTA 호출은 thin wrapper.
 *
 * 임계값 (T4 + R1 합의):
 *   ±20% 이내    → verified
 *   20~50%       → warn
 *   50% 초과     → mismatch
 *   estimate 없음 → no_estimate
 *   OTA 0건       → no_offers
 *   OTA 1건       → single_source (자기 자신 비교 금지)
 *   통화 불일치   → currency_mismatch
 */

import "server-only";

import type { ItineraryItem, OtaOffer } from "@/lib/types";
import { formatKrw } from "@/lib/utils/format-krw";
import { aggregateOffersForItem } from "./ota-aggregator";

// ═══════════════════════════════════════════════════════════════════
// 임계값 (R1 조건 — 매직 넘버 모듈 상수)
// ═══════════════════════════════════════════════════════════════════

export const PRICE_TOLERANCE = {
  /** 이 % 이내 차이는 검증 통과 */
  verifiedPct: 20,
  /** 이 % 이내 차이는 경고만 */
  warnPct: 50,
} as const;

/** OTA single source — 자기 자신 비교 금지. T10 사전 경고 */
const MIN_OTA_SOURCES_FOR_VERIFY = 2;

/**
 * 환율 정적 테이블 (1 단위 → KRW 환산 계수). T12 BLOCKER fix.
 * 시드 estimatedPrice가 VND·THB·JPY·USD인 경우 KRW로 정규화 후 비교.
 *
 * 주의: 이 환율은 비교용 근사치 (시드 신뢰성 한계 — ADR-029 §"부정"에 명시).
 * 환율 갱신은 사이클 13+ 운영 단계 (외부 API 또는 주간 cron).
 */
export const FX_RATES_TO_KRW: Record<string, number> = {
  KRW: 1,
  VND: 1 / 18, // 1 VND ≈ 0.056 KRW (city.payment.approxKrwRate=18 역수)
  THB: 41, // 1 THB ≈ 41 KRW (방콕)
  JPY: 9.5, // 1 JPY ≈ 9.5 KRW (도쿄)
  USD: 1380, // 1 USD ≈ 1,380 KRW
  EUR: 1500,
};

/**
 * 임의 통화 → KRW 환산. 미지원 통화면 null.
 */
export function toKrw(amount: number, currency: string): number | null {
  const code = currency.toUpperCase();
  const rate = FX_RATES_TO_KRW[code];
  if (rate === undefined) return null;
  return Math.round(amount * rate);
}

// ═══════════════════════════════════════════════════════════════════
// 공개 타입
// ═══════════════════════════════════════════════════════════════════

export type PriceVerificationStatus =
  | "verified"
  | "warn"
  | "mismatch"
  | "no_estimate"
  | "no_offers"
  | "single_source"
  | "currency_mismatch";

export interface PriceVerificationOutput {
  status: PriceVerificationStatus;
  /** DB 저장용 boolean — verified만 true, 나머지 모두 false */
  verified: boolean;
  reason: string;
  /** estimate vs medianOta 차이 (%, ±) — null이면 비교 불가 */
  deltaPct: number | null;
  /** OTA 가격 중앙값 (KRW) — null이면 비교 불가 */
  medianOtaPriceKrw: number | null;
  /** OTA 출처 개수 (참여한 OTA 행 수) */
  otaSourceCount: number;
}

export interface ComparePriceInput {
  /** 시드/사용자가 입력한 예상 가격 (KRW) — undefined면 no_estimate */
  estimatedPriceKrw?: number;
  /** OTA 비교 대상 offers */
  offers: OtaOffer[];
}

// ═══════════════════════════════════════════════════════════════════
// 순수 함수 — 비교 로직 (T13 권장)
// ═══════════════════════════════════════════════════════════════════

export function comparePriceVerification(
  input: ComparePriceInput,
): PriceVerificationOutput {
  const { estimatedPriceKrw, offers } = input;

  // ── estimate 없음
  if (estimatedPriceKrw === undefined || estimatedPriceKrw <= 0) {
    return {
      status: "no_estimate",
      verified: false,
      reason: "예상 가격 정보 없음",
      deltaPct: null,
      medianOtaPriceKrw: null,
      otaSourceCount: 0,
    };
  }

  // ── OTA 0건
  if (offers.length === 0) {
    return {
      status: "no_offers",
      verified: false,
      reason: "OTA 가격 정보 없음",
      deltaPct: null,
      medianOtaPriceKrw: null,
      otaSourceCount: 0,
    };
  }

  // ── 통화 검증 (모든 시드 KRW이지만 방어 — T13 사전 경고)
  // OtaOffer는 priceKrw로 정규화되어 있어 추가 검증은 미래 통화 추가 시.
  // 현재 OtaOffer 스키마상 KRW 외 통화는 표현 불가하므로 통과.

  // ── single source (자기 자신 비교 금지 — T10 사전 경고)
  const distinctOtas = new Set(offers.map((o) => o.ota));
  if (distinctOtas.size < MIN_OTA_SOURCES_FOR_VERIFY) {
    return {
      status: "single_source",
      verified: false,
      reason: `OTA ${distinctOtas.size}개 출처만 — 교차검증 불가`,
      deltaPct: null,
      medianOtaPriceKrw: median(offers.map((o) => o.priceKrw)),
      otaSourceCount: distinctOtas.size,
    };
  }

  // ── 비교
  const medianOta = median(offers.map((o) => o.priceKrw));
  const deltaPct = ((medianOta - estimatedPriceKrw) / estimatedPriceKrw) * 100;
  const absDelta = Math.abs(deltaPct);

  if (absDelta <= PRICE_TOLERANCE.verifiedPct) {
    return {
      status: "verified",
      verified: true,
      reason: `OTA 중앙값 ${formatKrw(medianOta)} (${formatDelta(deltaPct)}, 허용 ±${PRICE_TOLERANCE.verifiedPct}%)`,
      deltaPct,
      medianOtaPriceKrw: medianOta,
      otaSourceCount: distinctOtas.size,
    };
  }

  if (absDelta <= PRICE_TOLERANCE.warnPct) {
    return {
      status: "warn",
      verified: false,
      reason: `OTA 중앙값 ${formatKrw(medianOta)} — 시드와 ${formatDelta(deltaPct)} 차이 (변동 가능)`,
      deltaPct,
      medianOtaPriceKrw: medianOta,
      otaSourceCount: distinctOtas.size,
    };
  }

  return {
    status: "mismatch",
    verified: false,
    reason: `OTA 중앙값 ${formatKrw(medianOta)} — 시드와 ${formatDelta(deltaPct)} 차이 (불일치)`,
    deltaPct,
    medianOtaPriceKrw: medianOta,
    otaSourceCount: distinctOtas.size,
  };
}

// ═══════════════════════════════════════════════════════════════════
// 외부 API 호출 wrapper (T13 권장 — 호출은 주입, 비교는 순수)
// ═══════════════════════════════════════════════════════════════════

export async function verifyItemPrice(
  item: ItineraryItem,
): Promise<PriceVerificationOutput> {
  const offers = await aggregateOffersForItem(item);

  // T12 BLOCKER fix: estimatedPrice 통화를 KRW로 정규화
  let estimatedPriceKrw: number | undefined;
  if (item.estimatedPrice && item.estimatedPrice.amount > 0) {
    const krw = toKrw(item.estimatedPrice.amount, item.estimatedPrice.currency);
    if (krw === null) {
      // 미지원 통화 — 비교 불가
      return {
        status: "currency_mismatch",
        verified: false,
        reason: `미지원 통화 ${item.estimatedPrice.currency} — 비교 불가`,
        deltaPct: null,
        medianOtaPriceKrw: offers.length > 0 ? medianPriceKrw(offers) : null,
        otaSourceCount: new Set(offers.map((o) => o.ota)).size,
      };
    }
    estimatedPriceKrw = krw;
  }

  return comparePriceVerification({
    estimatedPriceKrw,
    offers,
  });
}

/** OTA offers의 priceKrw 중앙값 (currency_mismatch 분기 표시용) */
function medianPriceKrw(offers: OtaOffer[]): number {
  if (offers.length === 0) return 0;
  const sorted = offers.map((o) => o.priceKrw).sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
}

// ═══════════════════════════════════════════════════════════════════
// 헬퍼
// ═══════════════════════════════════════════════════════════════════

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
}


function formatDelta(pct: number): string {
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}
