/**
 * 치앙마이 OTA 시드 + 키워드 게이트 회귀 테스트 — 사이클 VV.
 *
 * 답습 (사이클 N 답습):
 *  - feedback_keyword_match_collisions (도시 게이트 충돌 회피)
 *  - feedback_regression_test_minimums (toBeGreaterThanOrEqual + toContain)
 *  - 가격 ±20% 정합 패턴
 *
 * 치앙마이는 태국 첫 OTA 도시 — M8 도달 9 도시 (푸꾸옥/다낭/방콕/도쿄/호치민/하노이/나트랑/달랏/치앙마이).
 */

import { describe, it, expect } from "vitest";
import {
  chiangMaiOtaOffers,
  allOtaOffers,
  findOffersForItem,
  findOffersByKeyword,
} from "@/lib/seed/ota-offers";
import { chiangMaiItinerary } from "@/lib/seed/chiang-mai";

describe("사이클 VV — 치앙마이 OTA 시드 무결성", () => {
  it("chiangMaiOtaOffers 10건 (≥10 회귀 minimum)", () => {
    expect(chiangMaiOtaOffers.length).toBeGreaterThanOrEqual(10);
  });

  it("모든 행 matchTag prefix='cm-'", () => {
    for (const offer of chiangMaiOtaOffers) {
      expect(offer.matchTag.startsWith("cm-")).toBe(true);
    }
  });

  it("4 matchTag 모두 노출 (도이수텝·코끼리·올드시티·일요야시장)", () => {
    const tags = new Set(chiangMaiOtaOffers.map((o) => o.matchTag));
    expect(tags.has("cm-spot-doiSuthep")).toBe(true);
    expect(tags.has("cm-spot-elephantSanctuary")).toBe(true);
    expect(tags.has("cm-spot-oldCityTemples")).toBe(true);
    expect(tags.has("cm-spot-sundayMarket")).toBe(true);
  });

  it("시그니처(도이수텝·코끼리)는 3 OTA, 보조(올드시티·야시장)는 2 OTA", () => {
    const byTag = new Map<string, number>();
    for (const o of chiangMaiOtaOffers) {
      byTag.set(o.matchTag, (byTag.get(o.matchTag) ?? 0) + 1);
    }
    expect(byTag.get("cm-spot-doiSuthep")).toBe(3);
    expect(byTag.get("cm-spot-elephantSanctuary")).toBe(3);
    expect(byTag.get("cm-spot-oldCityTemples")).toBe(2);
    expect(byTag.get("cm-spot-sundayMarket")).toBe(2);
  });

  it("allOtaOffers 통합 — chiangMai 포함", () => {
    const cmCount = allOtaOffers.filter((o) =>
      o.matchTag.startsWith("cm-"),
    ).length;
    expect(cmCount).toBe(chiangMaiOtaOffers.length);
  });
});

describe("사이클 VV — findOffersForItem 정확 매칭", () => {
  it("cm-spot-doiSuthep → 3건 (klook/kkday/agoda)", () => {
    const offers = findOffersForItem("cm-spot-doiSuthep");
    expect(offers.length).toBe(3);
    expect(offers.map((o) => o.ota).sort()).toEqual([
      "agoda",
      "kkday",
      "klook",
    ]);
  });

  it("cm-spot-elephantSanctuary → 3건", () => {
    expect(findOffersForItem("cm-spot-elephantSanctuary").length).toBe(3);
  });

  it("cm-spot-oldCityTemples / cm-spot-sundayMarket → 2건씩", () => {
    expect(findOffersForItem("cm-spot-oldCityTemples").length).toBe(2);
    expect(findOffersForItem("cm-spot-sundayMarket").length).toBe(2);
  });
});

describe("사이클 VV — findOffersByKeyword 도시 게이트 + 고유 키워드", () => {
  it("도이수텝 (고유 키워드) → 게이트 없이 직접 매칭", () => {
    const tags = findOffersByKeyword("도이수텝 사찰 일몰 투어").map(
      (o) => o.matchTag,
    );
    expect(tags).toContain("cm-spot-doiSuthep");
  });

  it("Doi Suthep (영문 고유) → 직접 매칭", () => {
    const tags = findOffersByKeyword("Doi Suthep Temple Tour").map(
      (o) => o.matchTag,
    );
    expect(tags).toContain("cm-spot-doiSuthep");
  });

  it("코끼리 보호소 / Elephant Nature Park → 직접 매칭", () => {
    expect(
      findOffersByKeyword("엘리펀트 자연 보호소 윤리 투어").map(
        (o) => o.matchTag,
      ),
    ).toContain("cm-spot-elephantSanctuary");
    expect(
      findOffersByKeyword("Elephant Nature Park Day Tour").map(
        (o) => o.matchTag,
      ),
    ).toContain("cm-spot-elephantSanctuary");
  });

  it("Sunday Walking Street (고유) → 도시 게이트 없이도 매칭", () => {
    const tags = findOffersByKeyword("Sunday Walking Street Food Tour").map(
      (o) => o.matchTag,
    );
    expect(tags).toContain("cm-spot-sundayMarket");
  });

  it("일요 야시장 (고유) → 직접 매칭", () => {
    const tags = findOffersByKeyword("일요 야시장 1km 보행자 거리").map(
      (o) => o.matchTag,
    );
    expect(tags).toContain("cm-spot-sundayMarket");
  });

  it("야시장 + 치앙마이 컨텍스트 → cm-spot-sundayMarket 매칭", () => {
    const tags = findOffersByKeyword("치앙마이 야시장 푸드 투어").map(
      (o) => o.matchTag,
    );
    expect(tags).toContain("cm-spot-sundayMarket");
  });

  it("올드시티 사원 + 치앙마이 컨텍스트 → cm-spot-oldCityTemples 매칭", () => {
    const tags = findOffersByKeyword(
      "치앙마이 올드시티 사원 3곳 도보 투어",
    ).map((o) => o.matchTag);
    expect(tags).toContain("cm-spot-oldCityTemples");
  });
});

describe("사이클 VV — 충돌 회귀 (베트남 도시 + 치앙마이 컨텍스트 분리)", () => {
  it("푸꾸옥 야시장 → cm- 매칭 안 됨", () => {
    const tags = findOffersByKeyword("즈엉동 야시장 (푸꾸옥)").map(
      (o) => o.matchTag,
    );
    expect(tags).toContain("pq-food-night-market");
    expect(tags).not.toContain("cm-spot-sundayMarket");
  });

  it("나트랑 시푸드 야시장 → cm- 매칭 안 됨", () => {
    const tags = findOffersByKeyword("나트랑 시푸드 야시장").map(
      (o) => o.matchTag,
    );
    expect(tags).toContain("nh-food-streetFood");
    expect(tags).not.toContain("cm-spot-sundayMarket");
  });

  it("달랏 야시장 → cm- 매칭 안 됨", () => {
    const tags = findOffersByKeyword("달랏 야시장 푸드 워킹투어").map(
      (o) => o.matchTag,
    );
    expect(tags).toContain("dl-food-nightMarket");
    expect(tags).not.toContain("cm-spot-sundayMarket");
  });

  it("도이수텝 명시 시 — oldCityTemples 충돌 회피 (도이수텝만 매칭)", () => {
    const tags = findOffersByKeyword(
      "치앙마이 도이수텝 사찰 일몰 투어",
    ).map((o) => o.matchTag);
    expect(tags).toContain("cm-spot-doiSuthep");
    expect(tags).not.toContain("cm-spot-oldCityTemples");
  });

  it("호이안 'old quarter' (베트남) → cm- 매칭 안 됨 (게이트 필요)", () => {
    const tags = findOffersByKeyword(
      "호이안 old quarter 야시장 워킹",
    ).map((o) => o.matchTag);
    expect(tags).not.toContain("cm-spot-oldCityTemples");
    expect(tags).not.toContain("cm-spot-sundayMarket");
  });

  it("'사원' 단독 (도시 컨텍스트 없음) → cm- 매칭 0 (오탐 방지)", () => {
    const tags = findOffersByKeyword("사원 방문 일정").map((o) => o.matchTag);
    expect(tags).not.toContain("cm-spot-oldCityTemples");
  });
});

describe("사이클 VV — 가격 ±20% 정합 (시드 estimatedPrice ↔ OTA 중앙값)", () => {
  // THB → KRW 환율 (시드와 동일 — 1 THB ≈ 1/36 KRW)
  const THB_TO_KRW = 1 / 0.0277; // 1 THB = ~36 KRW

  function median(arr: number[]): number {
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  function findSeedPriceByName(keyword: string): number {
    const item = chiangMaiItinerary.find((it) => it.name.includes(keyword));
    return item?.estimatedPrice?.amount ?? 0;
  }

  it("4 matchTag 모두 ±25% 안 (시드 THB 환산 vs OTA median KRW)", () => {
    const cases: Array<{ keyword: string; matchTag: string }> = [
      { keyword: "도이수텝", matchTag: "cm-spot-doiSuthep" },
      { keyword: "엘리펀트", matchTag: "cm-spot-elephantSanctuary" },
      { keyword: "올드시티 사원", matchTag: "cm-spot-oldCityTemples" },
      { keyword: "일요 야시장", matchTag: "cm-spot-sundayMarket" },
    ];

    for (const c of cases) {
      const seedThb = findSeedPriceByName(c.keyword);
      expect(seedThb, `seed not found for ${c.keyword}`).toBeGreaterThan(0);
      const seedKrw = seedThb * THB_TO_KRW;
      const otaPrices = chiangMaiOtaOffers
        .filter((o) => o.matchTag === c.matchTag)
        .map((o) => o.priceKrw);
      const otaMedian = median(otaPrices);
      const deltaPct = Math.abs(seedKrw - otaMedian) / otaMedian;
      expect(
        deltaPct,
        `${c.matchTag}: seed ${seedKrw.toFixed(0)} KRW vs OTA median ${otaMedian} KRW (delta ${(deltaPct * 100).toFixed(1)}%)`,
      ).toBeLessThanOrEqual(0.25);
    }
  });
});
