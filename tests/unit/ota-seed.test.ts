/**
 * OTA Seed 단위 테스트 — 사이클 C (다낭/방콕/도쿄 인프라 시드).
 *
 * 시드 무결성 + 도시별 매칭 + 다국가 키워드 분기.
 * itinerary 시드는 별도 사이클(D+) → 여기서는 OTA 풀 자체만 검증.
 */

import { describe, it, expect } from "vitest";
import {
  phuQuocOtaOffers,
  daNangOtaOffers,
  bangkokOtaOffers,
  tokyoOtaOffers,
  allOtaOffers,
  findOffersForItem,
  findOffersByKeyword,
} from "@/lib/seed/ota-offers";

// ═══════════════════════════════════════════════════════════════════
// 무결성 — matchTag prefix · 가격 양수 · URL 존재
// ═══════════════════════════════════════════════════════════════════

describe("OTA seed — 도시별 무결성", () => {
  it("푸꾸옥 모든 행 matchTag prefix='pq-' (회귀)", () => {
    expect(phuQuocOtaOffers.length).toBeGreaterThan(0);
    for (const offer of phuQuocOtaOffers) {
      expect(offer.matchTag.startsWith("pq-")).toBe(true);
    }
  });

  it("다낭 모든 행 matchTag prefix='dn-'", () => {
    expect(daNangOtaOffers.length).toBe(6);
    for (const offer of daNangOtaOffers) {
      expect(offer.matchTag.startsWith("dn-")).toBe(true);
    }
  });

  it("방콕 모든 행 matchTag prefix='bk-'", () => {
    expect(bangkokOtaOffers.length).toBe(6);
    for (const offer of bangkokOtaOffers) {
      expect(offer.matchTag.startsWith("bk-")).toBe(true);
    }
  });

  it("도쿄 모든 행 matchTag prefix='ty-'", () => {
    expect(tokyoOtaOffers.length).toBe(6);
    for (const offer of tokyoOtaOffers) {
      expect(offer.matchTag.startsWith("ty-")).toBe(true);
    }
  });

  it("모든 OTA 행은 priceKrw > 0", () => {
    for (const offer of allOtaOffers) {
      expect(offer.priceKrw).toBeGreaterThan(0);
    }
  });

  it("모든 OTA 행은 url 비어있지 않음", () => {
    for (const offer of allOtaOffers) {
      expect(offer.url.length).toBeGreaterThan(0);
    }
  });

  it("id는 전역 unique", () => {
    const ids = new Set<string>();
    for (const offer of allOtaOffers) {
      expect(ids.has(offer.id)).toBe(false);
      ids.add(offer.id);
    }
  });

  it("도시별 OTA 다양성 — 같은 matchTag 안에서 ota 중복 없음", () => {
    const groups = new Map<string, Set<string>>();
    for (const offer of allOtaOffers) {
      const set = groups.get(offer.matchTag) ?? new Set<string>();
      // 같은 matchTag 안에서 같은 ota 행이 2개면 중복
      expect(set.has(offer.ota)).toBe(false);
      set.add(offer.ota);
      groups.set(offer.matchTag, set);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// findOffersForItem — exact match
// ═══════════════════════════════════════════════════════════════════

describe("findOffersForItem — exact matchTag", () => {
  it("'pq-spot-cablecar' → 3 OTA (klook/kkday/agoda)", () => {
    const offers = findOffersForItem("pq-spot-cablecar");
    expect(offers.length).toBe(3);
    expect(new Set(offers.map((o) => o.ota))).toEqual(
      new Set(["klook", "kkday", "agoda"]),
    );
  });

  it("'dn-spot-banaHills' → 3 OTA (다낭 신규)", () => {
    const offers = findOffersForItem("dn-spot-banaHills");
    expect(offers.length).toBe(3);
  });

  it("'bk-spot-ayutthaya' → 2 OTA (klook/agoda)", () => {
    const offers = findOffersForItem("bk-spot-ayutthaya");
    expect(offers.length).toBe(2);
  });

  it("'ty-spot-disneyland' → 2 OTA", () => {
    const offers = findOffersForItem("ty-spot-disneyland");
    expect(offers.length).toBe(2);
  });

  it("미존재 matchTag → 빈 배열", () => {
    expect(findOffersForItem("nonexistent")).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════
// findOffersByKeyword — 다국가 키워드 분기 (사이클 C 보강)
// ═══════════════════════════════════════════════════════════════════

describe("findOffersByKeyword — 다국가 fuzzy 매칭", () => {
  it("푸꾸옥 '케이블카' (회귀)", () => {
    const offers = findOffersByKeyword("푸꾸옥 케이블카");
    expect(offers.length).toBeGreaterThanOrEqual(2);
    expect(offers.every((o) => o.matchTag === "pq-spot-cablecar")).toBe(true);
  });

  it("다낭 '바나힐' → 다낭 OTA만", () => {
    const offers = findOffersByKeyword("바나힐 케이블카");
    // '케이블카'는 푸꾸옥 매칭이지만 '바나힐'도 매칭 → 둘 다 반환
    const banaTags = offers.filter((o) => o.matchTag === "dn-spot-banaHills");
    expect(banaTags.length).toBe(3);
  });

  it("다낭 'hoi an' 영문 → 호이안 데이투어 매칭", () => {
    const offers = findOffersByKeyword("Hoi An Old Town");
    const hoian = offers.filter((o) => o.matchTag === "dn-spot-hoianTour");
    expect(hoian.length).toBe(2);
  });

  it("방콕 '디너 크루즈' 한글 매칭", () => {
    const offers = findOffersByKeyword("차오프라야 디너 크루즈");
    const cruise = offers.filter(
      (o) => o.matchTag === "bk-food-dinnerCruise",
    );
    expect(cruise.length).toBe(2);
  });

  it("방콕 '왓 아룬' (공백 포함)", () => {
    const offers = findOffersByKeyword("왓 아룬 입장권");
    expect(offers.some((o) => o.matchTag === "bk-spot-watarun")).toBe(true);
  });

  it("도쿄 'Disney' 영문 → 디즈니랜드", () => {
    const offers = findOffersByKeyword("Tokyo Disneyland 1Day");
    expect(
      offers.some((o) => o.matchTag === "ty-spot-disneyland"),
    ).toBe(true);
  });

  it("도쿄 '하코네'도 후지 투어로 매칭 (T9 세컨더리 키워드)", () => {
    const offers = findOffersByKeyword("하코네 온천");
    expect(offers.some((o) => o.matchTag === "ty-spot-fujiTour")).toBe(true);
  });

  it("매칭 없음 → 빈 배열", () => {
    const offers = findOffersByKeyword("일반 산책로");
    expect(offers).toEqual([]);
  });

  it("푸꾸옥 + 다낭 키워드 동시 → 양쪽 다 매칭 (회귀 안전)", () => {
    const offers = findOffersByKeyword("케이블카 바나힐");
    const cities = new Set(
      offers.map((o) => o.matchTag.split("-")[0]),
    );
    expect(cities.has("pq")).toBe(true);
    expect(cities.has("dn")).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 통합 풀 카운트
// ═══════════════════════════════════════════════════════════════════

describe("allOtaOffers 통합 풀", () => {
  it("푸꾸옥 + 다낭 + 방콕 + 도쿄 = 누적 합", () => {
    expect(allOtaOffers.length).toBe(
      phuQuocOtaOffers.length +
        daNangOtaOffers.length +
        bangkokOtaOffers.length +
        tokyoOtaOffers.length,
    );
  });

  it("사이클 C 후 신규 시드 = 18건 (도시당 6)", () => {
    expect(daNangOtaOffers.length + bangkokOtaOffers.length + tokyoOtaOffers.length).toBe(18);
  });
});
