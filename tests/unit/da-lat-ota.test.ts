/**
 * 달랏 OTA 시드 + 키워드 게이트 회귀 테스트 — 사이클 N.
 *
 * 답습:
 *  - feedback_keyword_match_collisions (도시 게이트 충돌 회피)
 *  - feedback_regression_test_minimums (toBeGreaterThanOrEqual + toContain)
 *  - 사이클 D 가격 ±20% 정합 패턴
 */

import { describe, it, expect } from "vitest";
import {
  daLatOtaOffers,
  allOtaOffers,
  findOffersForItem,
  findOffersByKeyword,
} from "@/lib/seed/ota-offers";
import { daLatItinerary } from "@/lib/seed/da-lat";

describe("사이클 N — 달랏 OTA 시드 무결성", () => {
  it("daLatOtaOffers 10건 (≥10 회귀 minimum)", () => {
    expect(daLatOtaOffers.length).toBeGreaterThanOrEqual(10);
  });

  it("모든 행 matchTag prefix='dl-'", () => {
    for (const offer of daLatOtaOffers) {
      expect(offer.matchTag.startsWith("dl-")).toBe(true);
    }
  });

  it("4 matchTag 모두 노출 (야시장·랑비앙·다탄라·케이블카)", () => {
    const tags = new Set(daLatOtaOffers.map((o) => o.matchTag));
    expect(tags.has("dl-food-nightMarket")).toBe(true);
    expect(tags.has("dl-spot-langbiang")).toBe(true);
    expect(tags.has("dl-spot-datanla")).toBe(true);
    expect(tags.has("dl-spot-cableCar")).toBe(true);
  });

  it("시그니처(랑비앙·다탄라)는 3 OTA, 보조(야시장·케이블카)는 2 OTA", () => {
    const byTag = new Map<string, number>();
    for (const o of daLatOtaOffers) {
      byTag.set(o.matchTag, (byTag.get(o.matchTag) ?? 0) + 1);
    }
    expect(byTag.get("dl-spot-langbiang")).toBe(3);
    expect(byTag.get("dl-spot-datanla")).toBe(3);
    expect(byTag.get("dl-food-nightMarket")).toBe(2);
    expect(byTag.get("dl-spot-cableCar")).toBe(2);
  });

  it("allOtaOffers 통합 — daLat 포함", () => {
    const dlCount = allOtaOffers.filter((o) => o.matchTag.startsWith("dl-")).length;
    expect(dlCount).toBe(daLatOtaOffers.length);
  });
});

describe("사이클 N — findOffersForItem 정확 매칭", () => {
  it("dl-spot-langbiang → 3건", () => {
    const offers = findOffersForItem("dl-spot-langbiang");
    expect(offers.length).toBe(3);
    expect(offers.map((o) => o.ota).sort()).toEqual(["agoda", "kkday", "klook"]);
  });

  it("dl-spot-datanla → 3건", () => {
    expect(findOffersForItem("dl-spot-datanla").length).toBe(3);
  });

  it("dl-food-nightMarket / dl-spot-cableCar → 2건씩", () => {
    expect(findOffersForItem("dl-food-nightMarket").length).toBe(2);
    expect(findOffersForItem("dl-spot-cableCar").length).toBe(2);
  });
});

describe("사이클 N — findOffersByKeyword 도시 게이트 + 고유 키워드", () => {
  it("야시장 + 달랏 컨텍스트 → dl-food-nightMarket 매칭", () => {
    const offers = findOffersByKeyword("달랏 야시장 푸드 워킹투어");
    const tags = offers.map((o) => o.matchTag);
    expect(tags).toContain("dl-food-nightMarket");
  });

  it("케이블카 + 달랏 컨텍스트 → dl-spot-cableCar 매칭", () => {
    const offers = findOffersByKeyword("달랏 케이블카 + Truc Lam 사찰");
    const tags = offers.map((o) => o.matchTag);
    expect(tags).toContain("dl-spot-cableCar");
  });

  it("랑비앙 (고유 키워드) → 게이트 없이 직접 매칭", () => {
    const offers = findOffersByKeyword("랑비앙 일출 지프 투어 (1929m)");
    const tags = offers.map((o) => o.matchTag);
    expect(tags).toContain("dl-spot-langbiang");
  });

  it("다탄라 / 알파인 코스터 (고유 키워드) → 직접 매칭", () => {
    expect(findOffersByKeyword("다탄라 폭포 + 알파인 코스터").map((o) => o.matchTag))
      .toContain("dl-spot-datanla");
    expect(findOffersByKeyword("Alpine Coaster Datanla").map((o) => o.matchTag))
      .toContain("dl-spot-datanla");
  });
});

describe("사이클 N — 충돌 회귀 (푸꾸옥/나트랑 키워드 + 달랏 컨텍스트 분리)", () => {
  it("푸꾸옥 야시장 → dl- 매칭 안 됨 (충돌 회귀)", () => {
    const offers = findOffersByKeyword("즈엉동 야시장 (푸꾸옥)");
    const tags = offers.map((o) => o.matchTag);
    expect(tags).toContain("pq-food-night-market");
    expect(tags).not.toContain("dl-food-nightMarket");
  });

  it("푸꾸옥 케이블카 → dl- 매칭 안 됨 (충돌 회귀)", () => {
    const offers = findOffersByKeyword("푸꾸옥 케이블카 왕복");
    const tags = offers.map((o) => o.matchTag);
    expect(tags).toContain("pq-spot-cablecar");
    expect(tags).not.toContain("dl-spot-cableCar");
  });

  it("나트랑 야시장 → dl- 매칭 안 됨", () => {
    const offers = findOffersByKeyword("나트랑 시푸드 야시장 푸드 워킹투어");
    const tags = offers.map((o) => o.matchTag);
    expect(tags).toContain("nh-food-streetFood");
    expect(tags).not.toContain("dl-food-nightMarket");
  });

  it("도시 컨텍스트 모호한 '야시장' 단독 → 매칭 0 (오탐 방지)", () => {
    const offers = findOffersByKeyword("야시장");
    const tags = offers.map((o) => o.matchTag);
    expect(tags).not.toContain("dl-food-nightMarket");
    expect(tags).not.toContain("pq-food-night-market");
    expect(tags).not.toContain("nh-food-streetFood");
  });
});

describe("사이클 N — 가격 ±20% 정합 (시드 estimatedPrice ↔ OTA 중앙값)", () => {
  // VND → KRW 환율 (시드와 동일)
  const VND_TO_KRW = 1 / 18;

  function median(arr: number[]): number {
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  /**
   * itinerary item.id는 `dl-item-{idx}` (place.id 아님). name 키워드로 시드 가격 추출.
   * 사이클 N: place.id를 export하지 않는 시드 패턴 답습.
   */
  function findSeedPriceByName(keyword: string): number {
    const item = daLatItinerary.find((it) => it.name.includes(keyword));
    return item?.estimatedPrice?.amount ?? 0;
  }

  it("4 matchTag 모두 ±20% 안 (시드 VND 환산 vs OTA median KRW)", () => {
    const cases: Array<{ keyword: string; matchTag: string }> = [
      { keyword: "야시장 푸드", matchTag: "dl-food-nightMarket" },
      { keyword: "랑비앙", matchTag: "dl-spot-langbiang" },
      { keyword: "다탄라", matchTag: "dl-spot-datanla" },
      { keyword: "케이블카", matchTag: "dl-spot-cableCar" },
    ];

    for (const c of cases) {
      const seedVnd = findSeedPriceByName(c.keyword);
      expect(seedVnd, `seed not found for ${c.keyword}`).toBeGreaterThan(0);
      const seedKrw = seedVnd * VND_TO_KRW;
      const otaPrices = daLatOtaOffers
        .filter((o) => o.matchTag === c.matchTag)
        .map((o) => o.priceKrw);
      const otaMedian = median(otaPrices);
      const deltaPct = Math.abs(seedKrw - otaMedian) / otaMedian;
      expect(
        deltaPct,
        `${c.matchTag}: seed ${seedKrw.toFixed(0)} KRW vs OTA median ${otaMedian} KRW`,
      ).toBeLessThanOrEqual(0.2);
    }
  });
});
