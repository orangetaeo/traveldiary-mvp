/**
 * Price Verification 단위 테스트 — 사이클 N (ADR-029, R1 조건).
 *
 * 순수 함수 comparePriceVerification만 대상.
 * verifyItemPrice (OTA 호출 wrapper)는 외부 API라 단위 테스트 ❌.
 */

import { describe, it, expect } from "vitest";
import {
  comparePriceVerification,
  PRICE_TOLERANCE,
  toKrw,
  FX_RATES_TO_KRW,
} from "@/lib/services/price-verification";
import { phuQuocPlaces } from "@/lib/seed/phu-quoc";
import { findOffersForItem } from "@/lib/seed/ota-offers";
import type { OtaOffer } from "@/lib/types";

function makeOffer(
  ota: OtaOffer["ota"],
  priceKrw: number,
  matchTag = "test",
): OtaOffer {
  return {
    id: `${ota}-${priceKrw}`,
    matchTag,
    ota,
    title: `${ota} 상품`,
    priceKrw,
    url: `https://${ota}.com/test`,
  };
}

describe("comparePriceVerification — 임계값 분기", () => {
  it("estimate 없음 → status: no_estimate, verified: false", () => {
    const out = comparePriceVerification({
      estimatedPriceKrw: undefined,
      offers: [makeOffer("klook", 50_000), makeOffer("kkday", 52_000)],
    });
    expect(out.status).toBe("no_estimate");
    expect(out.verified).toBe(false);
    expect(out.deltaPct).toBeNull();
  });

  it("estimate=0 → status: no_estimate (방어 코드)", () => {
    const out = comparePriceVerification({
      estimatedPriceKrw: 0,
      offers: [makeOffer("klook", 50_000), makeOffer("kkday", 52_000)],
    });
    expect(out.status).toBe("no_estimate");
  });

  it("OTA 0건 → status: no_offers", () => {
    const out = comparePriceVerification({
      estimatedPriceKrw: 50_000,
      offers: [],
    });
    expect(out.status).toBe("no_offers");
    expect(out.verified).toBe(false);
    expect(out.otaSourceCount).toBe(0);
  });

  it("OTA single source (klook 1건) → status: single_source", () => {
    const out = comparePriceVerification({
      estimatedPriceKrw: 50_000,
      offers: [makeOffer("klook", 48_000)],
    });
    expect(out.status).toBe("single_source");
    expect(out.verified).toBe(false);
    expect(out.otaSourceCount).toBe(1);
    expect(out.medianOtaPriceKrw).toBe(48_000);
  });

  it("OTA 같은 ota에서 2건 (klook×2) → still single_source", () => {
    const out = comparePriceVerification({
      estimatedPriceKrw: 50_000,
      offers: [makeOffer("klook", 48_000), makeOffer("klook", 49_000)],
    });
    expect(out.status).toBe("single_source");
  });
});

describe("comparePriceVerification — 가격 비교 정확성", () => {
  it("medianOTA가 estimate와 정확히 같음 → verified", () => {
    const out = comparePriceVerification({
      estimatedPriceKrw: 50_000,
      offers: [makeOffer("klook", 50_000), makeOffer("kkday", 50_000)],
    });
    expect(out.status).toBe("verified");
    expect(out.verified).toBe(true);
    expect(out.deltaPct).toBe(0);
    expect(out.medianOtaPriceKrw).toBe(50_000);
  });

  it("medianOTA가 estimate보다 +20% (경계) → verified", () => {
    const out = comparePriceVerification({
      estimatedPriceKrw: 50_000,
      offers: [makeOffer("klook", 60_000), makeOffer("kkday", 60_000)],
    });
    expect(out.status).toBe("verified");
    expect(out.verified).toBe(true);
    expect(out.deltaPct).toBe(20);
  });

  it("medianOTA가 estimate보다 +21% → warn", () => {
    const out = comparePriceVerification({
      estimatedPriceKrw: 50_000,
      offers: [makeOffer("klook", 60_500), makeOffer("kkday", 60_500)],
    });
    expect(out.status).toBe("warn");
    expect(out.verified).toBe(false);
    expect(out.deltaPct).toBeCloseTo(21, 0);
  });

  it("medianOTA가 estimate보다 -50% (경계) → warn", () => {
    const out = comparePriceVerification({
      estimatedPriceKrw: 100_000,
      offers: [makeOffer("klook", 50_000), makeOffer("kkday", 50_000)],
    });
    expect(out.status).toBe("warn");
    expect(out.deltaPct).toBe(-50);
  });

  it("medianOTA가 estimate보다 +51% → mismatch", () => {
    const out = comparePriceVerification({
      estimatedPriceKrw: 50_000,
      offers: [makeOffer("klook", 75_500), makeOffer("kkday", 75_500)],
    });
    expect(out.status).toBe("mismatch");
    expect(out.verified).toBe(false);
  });

  it("medianOTA가 estimate보다 +200% (큰 차이) → mismatch", () => {
    const out = comparePriceVerification({
      estimatedPriceKrw: 30_000,
      offers: [
        makeOffer("klook", 90_000),
        makeOffer("kkday", 90_000),
        makeOffer("agoda", 90_000),
      ],
    });
    expect(out.status).toBe("mismatch");
    expect(out.deltaPct).toBe(200);
  });
});

describe("comparePriceVerification — 중앙값 계산", () => {
  it("3건 홀수 — 중앙값 = 가운데 값", () => {
    const out = comparePriceVerification({
      estimatedPriceKrw: 50_000,
      offers: [
        makeOffer("klook", 40_000),
        makeOffer("kkday", 50_000),
        makeOffer("agoda", 80_000),
      ],
    });
    expect(out.medianOtaPriceKrw).toBe(50_000);
    expect(out.status).toBe("verified");
  });

  it("4건 짝수 — 중앙값 = 가운데 두 값 평균", () => {
    const out = comparePriceVerification({
      estimatedPriceKrw: 55_000,
      offers: [
        makeOffer("klook", 40_000),
        makeOffer("kkday", 50_000),
        makeOffer("agoda", 60_000, "tag1"),
        makeOffer("klook", 80_000, "tag2"), // klook 2번이지만 distinctOtas 계산용
      ],
    });
    expect(out.medianOtaPriceKrw).toBe(55_000);
    expect(out.status).toBe("verified");
  });

  it("metadata: PRICE_TOLERANCE 상수가 룰과 일치", () => {
    expect(PRICE_TOLERANCE.verifiedPct).toBe(20);
    expect(PRICE_TOLERANCE.warnPct).toBe(50);
  });
});

// ═══════════════════════════════════════════════════════════════════
// T12 BLOCKER fix 회귀 검증
// ═══════════════════════════════════════════════════════════════════

describe("toKrw — 통화 환산", () => {
  it("KRW → 자기 자신", () => {
    expect(toKrw(50_000, "KRW")).toBe(50_000);
  });

  it("VND → KRW (시드 환율 1/18)", () => {
    // 350,000 VND ≈ 19,444 KRW
    const krw = toKrw(350_000, "VND");
    expect(krw).toBeCloseTo(19_444, -2);
  });

  it("THB → KRW (시드 환율 41)", () => {
    expect(toKrw(1_000, "THB")).toBe(41_000);
  });

  it("JPY → KRW (시드 환율 9.5)", () => {
    expect(toKrw(1_000, "JPY")).toBe(9_500);
  });

  it("USD → KRW (시드 환율 1380)", () => {
    expect(toKrw(100, "USD")).toBe(138_000);
  });

  it("미지원 통화 → null", () => {
    expect(toKrw(100, "GBP")).toBeNull();
    expect(toKrw(100, "XYZ")).toBeNull();
  });

  it("currency 대소문자 무관", () => {
    expect(toKrw(1_000, "krw")).toBe(1_000);
    expect(toKrw(1_000, "vnd")).toBe(toKrw(1_000, "VND"));
  });

  it("FX_RATES_TO_KRW에 6개 통화 등재 (정합성)", () => {
    expect(Object.keys(FX_RATES_TO_KRW).sort()).toEqual([
      "EUR",
      "JPY",
      "KRW",
      "THB",
      "USD",
      "VND",
    ]);
  });
});

describe("ota-offers ↔ phuQuocPlaces matchTag 일치 (T12 BLOCKER fix)", () => {
  it("phuQuocPlaces에 정의된 spot/food 5개에 OTA offer가 매칭되어야 함", () => {
    // 시드 estimatedPrice 있는 5개 핵심 일정 (12a 패턴 대상)
    const targetIds = [
      "pq-spot-cablecar",
      "pq-spot-saobeach",
      "pq-spot-vinwonders",
      "pq-food-night-market",
    ];
    for (const id of targetIds) {
      const place = phuQuocPlaces.find((p) => p.id === id);
      expect(place, `시드에 ${id} 존재해야 함`).toBeDefined();

      const offers = findOffersForItem(id);
      expect(
        offers.length,
        `${id} matchTag로 OTA offer ≥ 1건 매칭되어야 함`,
      ).toBeGreaterThanOrEqual(1);
    }
  });
});
