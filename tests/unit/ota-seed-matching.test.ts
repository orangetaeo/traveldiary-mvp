/**
 * OTA Seed 매칭 함수 테스트 — Batch 30.
 *
 * lib/seed/ota-offers.ts:
 *  - findOffersForItem: matchTag 정확 일치
 *  - findOffersByKeyword: 도시 게이트 + 키워드 분기
 *  - allOtaOffers: 전체 시드 무결성
 */

import { describe, it, expect } from "vitest";
import {
  findOffersForItem,
  findOffersByKeyword,
  allOtaOffers,
} from "@/lib/seed/ota-offers";

/* ════════════════════════════════════════════
 * allOtaOffers — 데이터 무결성
 * ════════════════════════════════════════════ */

describe("seed/ota-offers — allOtaOffers", () => {
  it("시드 50건 이상 존재", () => {
    expect(allOtaOffers.length).toBeGreaterThanOrEqual(50);
  });

  it("모든 offer에 필수 필드 존재", () => {
    for (const offer of allOtaOffers) {
      expect(offer.id).toBeTruthy();
      expect(offer.matchTag).toBeTruthy();
      expect(offer.ota).toBeTruthy();
      expect(offer.title).toBeTruthy();
      expect(offer.priceKrw).toBeGreaterThan(0);
      expect(offer.url).toBeTruthy();
    }
  });

  it("ota 값은 klook/kkday/agoda 중 하나", () => {
    const validOtas = new Set(["klook", "kkday", "agoda"]);
    for (const offer of allOtaOffers) {
      expect(validOtas.has(offer.ota)).toBe(true);
    }
  });

  it("도시 prefix 표준화 (pq-/dn-/bk-/ty-/hcm-/han-/nh-/dl-/cm-)", () => {
    const validPrefixes = ["pq-", "dn-", "bk-", "ty-", "hcm-", "han-", "nh-", "dl-", "cm-"];
    for (const offer of allOtaOffers) {
      const hasPrefix = validPrefixes.some((p) => offer.matchTag.startsWith(p));
      expect(hasPrefix).toBe(true);
    }
  });
});

/* ════════════════════════════════════════════
 * findOffersForItem — matchTag 정확 일치
 * ════════════════════════════════════════════ */

describe("seed/ota-offers — findOffersForItem", () => {
  it("정확 일치 → 해당 offers 반환", () => {
    const offers = findOffersForItem("pq-spot-cablecar");
    expect(offers.length).toBeGreaterThanOrEqual(2); // klook + kkday + agoda
    for (const o of offers) {
      expect(o.matchTag).toBe("pq-spot-cablecar");
    }
  });

  it("없는 ID → 빈 배열", () => {
    expect(findOffersForItem("nonexistent-item")).toEqual([]);
    expect(findOffersForItem("")).toEqual([]);
  });

  it("다낭 바나힐 매칭", () => {
    const offers = findOffersForItem("dn-spot-banaHills");
    expect(offers.length).toBeGreaterThanOrEqual(1);
    expect(offers[0].matchTag).toBe("dn-spot-banaHills");
  });
});

/* ════════════════════════════════════════════
 * findOffersByKeyword — 키워드 + 도시 게이트
 * ════════════════════════════════════════════ */

describe("seed/ota-offers — findOffersByKeyword", () => {
  // 도시 게이트 불필요 — 고유 키워드
  it("'바나힐' → dn-spot-banaHills", () => {
    const offers = findOffersByKeyword("바나힐");
    expect(offers.length).toBeGreaterThanOrEqual(1);
    expect(offers.some((o) => o.matchTag === "dn-spot-banaHills")).toBe(true);
  });

  it("'메콩' → hcm-spot-mekong", () => {
    const offers = findOffersByKeyword("메콩 델타 투어");
    expect(offers.some((o) => o.matchTag === "hcm-spot-mekong")).toBe(true);
  });

  it("'하롱' → han-spot-halong", () => {
    const offers = findOffersByKeyword("하롱베이 크루즈");
    expect(offers.some((o) => o.matchTag === "han-spot-halong")).toBe(true);
  });

  it("'디즈니' → ty-spot-disneyland", () => {
    const offers = findOffersByKeyword("도쿄 디즈니랜드");
    expect(offers.some((o) => o.matchTag === "ty-spot-disneyland")).toBe(true);
  });

  // 도시 게이트 필요 — 충돌 키워드
  it("'케이블카' 단독 → 매칭 없음 (모호)", () => {
    const offers = findOffersByKeyword("케이블카 투어");
    // 도시 게이트 없이는 pq/dl 어디인지 모름 → 결과 0
    expect(offers.length).toBe(0);
  });

  it("'푸꾸옥 케이블카' → pq-spot-cablecar", () => {
    const offers = findOffersByKeyword("푸꾸옥 케이블카");
    expect(offers.some((o) => o.matchTag === "pq-spot-cablecar")).toBe(true);
  });

  it("'달랏 케이블카' → dl-spot-cableCar", () => {
    const offers = findOffersByKeyword("달랏 케이블카");
    expect(offers.some((o) => o.matchTag === "dl-spot-cableCar")).toBe(true);
  });

  it("'야시장' 단독 → 매칭 없음 (모호)", () => {
    const offers = findOffersByKeyword("야시장 구경");
    expect(offers.length).toBe(0);
  });

  it("'나트랑 야시장' → nh-food-streetFood", () => {
    const offers = findOffersByKeyword("나트랑 야시장 투어");
    expect(offers.some((o) => o.matchTag === "nh-food-streetFood")).toBe(true);
  });

  it("'빈원더 푸꾸옥' → pq 매칭, 나트랑 비매칭", () => {
    const offers = findOffersByKeyword("빈원더 푸꾸옥");
    expect(offers.some((o) => o.matchTag === "pq-spot-vinwonders")).toBe(true);
    expect(offers.some((o) => o.matchTag === "nh-spot-vinwonders")).toBe(false);
  });

  it("'빈원더 나트랑' → nh 매칭, 푸꾸옥 비매칭", () => {
    const offers = findOffersByKeyword("빈원더 나트랑");
    expect(offers.some((o) => o.matchTag === "nh-spot-vinwonders")).toBe(true);
    expect(offers.some((o) => o.matchTag === "pq-spot-vinwonders")).toBe(false);
  });

  // 치앙마이 고유 키워드
  it("'도이수텝' → cm-spot-doiSuthep", () => {
    const offers = findOffersByKeyword("도이수텝 사원");
    expect(offers.some((o) => o.matchTag === "cm-spot-doiSuthep")).toBe(true);
    // 도이수텝 명시 시 올드시티 사원 비매칭
    expect(offers.some((o) => o.matchTag === "cm-spot-oldCityTemples")).toBe(false);
  });

  it("'치앙마이 사원' → cm-spot-oldCityTemples (도이수텝 아닌 경우)", () => {
    const offers = findOffersByKeyword("치앙마이 사원 투어");
    expect(offers.some((o) => o.matchTag === "cm-spot-oldCityTemples")).toBe(true);
  });

  it("'일요 야시장' → cm-spot-sundayMarket (도시 게이트 불필요)", () => {
    const offers = findOffersByKeyword("일요 야시장");
    expect(offers.some((o) => o.matchTag === "cm-spot-sundayMarket")).toBe(true);
  });

  // 디너 크루즈 도시 분기
  it("'차오프라야' → bk-food-dinnerCruise", () => {
    const offers = findOffersByKeyword("차오프라야 크루즈");
    expect(offers.some((o) => o.matchTag === "bk-food-dinnerCruise")).toBe(true);
  });

  it("'방콕 디너 크루즈' → bk-food-dinnerCruise", () => {
    const offers = findOffersByKeyword("방콕 디너 크루즈");
    expect(offers.some((o) => o.matchTag === "bk-food-dinnerCruise")).toBe(true);
  });

  it("'호치민 디너 크루즈' → hcm-food-dinnerCruise", () => {
    const offers = findOffersByKeyword("호치민 디너 크루즈");
    expect(offers.some((o) => o.matchTag === "hcm-food-dinnerCruise")).toBe(true);
  });

  // 영문 키워드
  it("'ba na' → dn-spot-banaHills", () => {
    const offers = findOffersByKeyword("Ba Na Hills");
    expect(offers.some((o) => o.matchTag === "dn-spot-banaHills")).toBe(true);
  });

  it("'elephant sanctuary' → cm-spot-elephantSanctuary", () => {
    const offers = findOffersByKeyword("Elephant Sanctuary tour");
    expect(offers.some((o) => o.matchTag === "cm-spot-elephantSanctuary")).toBe(true);
  });

  // 완전 무관 키워드
  it("관련 없는 키워드 → 빈 배열", () => {
    expect(findOffersByKeyword("무관한 키워드")).toEqual([]);
    expect(findOffersByKeyword("서울 맛집")).toEqual([]);
  });
});
