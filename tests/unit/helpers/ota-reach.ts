/**
 * OTA 도달률 테스트 헬퍼 — DRY 추출.
 *
 * 4개 도시(다낭/호치민/하노이/나트랑) 시드 테스트에서 동일하게 반복되는
 * getOffersForItem + OTA 매칭 검증 + comparePriceVerification 블록을
 * 파라미터화된 빌더로 추출.
 */

import { describe, it, expect } from "vitest";
import { findOffersForItem, findOffersByKeyword } from "@/lib/seed/ota-offers";
import { comparePriceVerification, toKrw } from "@/lib/services/price-verification";
import type { ItineraryItem } from "@/lib/types";

/**
 * OTA 매칭 시 ID 정확 매칭 → 키워드 fallback 순으로 오퍼 조회.
 * 4개 도시 테스트에서 동일하게 사용.
 */
export function getOffersForItem(item: { id: string; name: string }) {
  const exact = findOffersForItem(item.id);
  if (exact.length > 0) return exact;
  return findOffersByKeyword(item.name);
}

export interface OtaReachParams {
  /** 도시 한국어명 (예: "다낭") */
  cityName: string;
  /** 시드 itinerary 배열 */
  itinerary: ItineraryItem[];
  /** OTA 매칭 기대 item ID 목록 */
  expectedItemIds: string[];
  /** 전체 분모 대비 매칭 비율 (예: 6/12 → 0.5) */
  expectedReachRatio: number;
}

/**
 * OTA 도달률 describe 블록 생성.
 * 호출하면 내부적으로 describe/it을 등록하므로 테스트 파일 최상위에서 호출해야 함.
 */
export function describeOtaReach(params: OtaReachParams) {
  const { cityName, itinerary, expectedItemIds, expectedReachRatio } = params;
  const matchCount = expectedItemIds.length;

  describe(`${cityName} 도달률 — OTA 매칭 + verified`, () => {
    it(`OTA 매칭 가능 일정 = ${matchCount}건`, () => {
      const matched = itinerary.filter(
        (item) => getOffersForItem(item).length > 0,
      );
      expect(matched.length).toBe(matchCount);
      expect(new Set(matched.map((item) => item.id))).toEqual(
        new Set(expectedItemIds),
      );
    });

    it(`${cityName} ${itinerary.length} 일정 분모 도달률 ≈ ${(expectedReachRatio * 100).toFixed(1)}%`, () => {
      const matched = itinerary.filter(
        (item) => getOffersForItem(item).length > 0,
      );
      expect(matched.length / itinerary.length).toBeCloseTo(
        expectedReachRatio,
        3,
      );
    });

    it.each(expectedItemIds.map((id) => ({ id })))(
      "$id — comparePriceVerification → verified",
      ({ id }) => {
        const item = itinerary.find((it) => it.id === id);
        expect(item).toBeDefined();
        if (!item) return;

        const offers = getOffersForItem(item);
        expect(offers.length).toBeGreaterThanOrEqual(2);

        const krw = item.estimatedPrice
          ? toKrw(item.estimatedPrice.amount, item.estimatedPrice.currency)
          : undefined;
        expect(krw).not.toBeNull();

        const result = comparePriceVerification({
          estimatedPriceKrw: krw ?? undefined,
          offers,
        });
        expect(result.status).toBe("verified");
        expect(result.verified).toBe(true);
        expect(Math.abs(result.deltaPct ?? 0)).toBeLessThanOrEqual(20);
      },
    );

    it(`검증 가능 일정 분모 도달률 = 100% (${matchCount} verified / ${matchCount} 검증가능)`, () => {
      const verifiedCount = expectedItemIds
        .map((id) => {
          const item = itinerary.find((it) => it.id === id);
          if (!item) return false;
          const offers = getOffersForItem(item);
          const krw = item.estimatedPrice
            ? toKrw(item.estimatedPrice.amount, item.estimatedPrice.currency)
            : undefined;
          const result = comparePriceVerification({
            estimatedPriceKrw: krw ?? undefined,
            offers,
          });
          return result.status === "verified";
        })
        .filter(Boolean).length;
      expect(verifiedCount).toBe(matchCount);
    });
  });
}
