/**
 * 호치민 시드 단위 테스트 — 사이클 G-1 (V1).
 *
 * 무결성 + 도달률 측정 (다낭 패턴 답습).
 * - 12 일정 / 3박 4일 / dayIndex 0~3
 * - OTA 매칭 5건 — comparePriceVerification으로 verified 보장
 * - 도달률 = 5/12 ≈ 41.7% (12분 분모) / 100% (검증 가능 일정 분모)
 */

import { describe, it, expect } from "vitest";
import {
  hoChiMinhTrip,
  hoChiMinhItinerary,
  HO_CHI_MINH_TRIP_ID,
} from "@/lib/seed/ho-chi-minh";
import { findOffersForItem, findOffersByKeyword } from "@/lib/seed/ota-offers";
import { comparePriceVerification, toKrw } from "@/lib/services/price-verification";
import { getDemoTrip, listDemoTrips } from "@/lib/seed";

// ═══════════════════════════════════════════════════════════════════
// 무결성
// ═══════════════════════════════════════════════════════════════════

describe("hoChiMinh 시드 — 무결성", () => {
  it("trip 메타 — SGN 베트남, 3박, draft", () => {
    expect(hoChiMinhTrip.destinationCode).toBe("SGN");
    expect(hoChiMinhTrip.nights).toBe(3);
    expect(hoChiMinhTrip.status).toBe("draft");
    expect(hoChiMinhTrip.id).toBe(HO_CHI_MINH_TRIP_ID);
    expect(hoChiMinhTrip.destination).toBe("호치민");
  });

  it("itinerary 12 일정 (Day 0~3)", () => {
    expect(hoChiMinhItinerary.length).toBe(12);
    const days = new Set(hoChiMinhItinerary.map((it) => it.dayIndex));
    expect(days).toEqual(new Set([0, 1, 2, 3]));
  });

  it("모든 일정의 tripId = HO_CHI_MINH_TRIP_ID", () => {
    for (const it of hoChiMinhItinerary) {
      expect(it.tripId).toBe(HO_CHI_MINH_TRIP_ID);
    }
  });

  it("같은 day 안에서 scheduledAt 오름차순", () => {
    for (let dayIdx = 0; dayIdx <= 3; dayIdx++) {
      const dayItems = hoChiMinhItinerary
        .filter((it) => it.dayIndex === dayIdx)
        .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
      const original = hoChiMinhItinerary.filter((it) => it.dayIndex === dayIdx);
      expect(original.map((it) => it.id)).toEqual(dayItems.map((it) => it.id));
    }
  });

  it("좌표 모두 (0,0) 아님", () => {
    for (const it of hoChiMinhItinerary) {
      expect(it.location.lat !== 0 || it.location.lng !== 0).toBe(true);
    }
  });

  it("DAG dependencies — 같은 day 안에서 직전 슬롯이 선행", () => {
    expect(hoChiMinhItinerary[0].dependencies).toEqual([]);
    expect(hoChiMinhItinerary[1].dependencies).toEqual(["hcm-item-0"]);
    // hcm-item-3 (Day 1 첫번째) 의존성 없음 (day 경계)
    expect(hoChiMinhItinerary[3].dependencies).toEqual([]);
    // hcm-item-6 (Day 2 첫번째) 의존성 없음
    expect(hoChiMinhItinerary[6].dependencies).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 데모 trip 진입 — 회귀
// ═══════════════════════════════════════════════════════════════════

describe("호치민 데모 trip — getDemoTrip 진입", () => {
  it("getDemoTrip(HO_CHI_MINH_TRIP_ID) → 12 일정 번들", () => {
    const bundle = getDemoTrip(HO_CHI_MINH_TRIP_ID);
    expect(bundle).not.toBeNull();
    expect(bundle?.trip.destinationCode).toBe("SGN");
    expect(bundle?.items.length).toBe(12);
  });

  it("listDemoTrips → 베트남 도시 trip 모두 노출 (사이클 G-2 후 4개)", () => {
    const trips = listDemoTrips();
    expect(trips.length).toBeGreaterThanOrEqual(3);
    const codes = trips.map((b) => b.trip.destinationCode);
    expect(codes).toContain("DAD");
    expect(codes).toContain("PQC");
    expect(codes).toContain("SGN");
  });

  it("푸꾸옥/다낭 trip 회귀 통과", () => {
    expect(getDemoTrip("demo-trip-phu-quoc")?.trip.destinationCode).toBe("PQC");
    expect(getDemoTrip("demo-trip-da-nang")?.trip.destinationCode).toBe("DAD");
  });
});

// ═══════════════════════════════════════════════════════════════════
// 도달률 측정 — OTA 매칭 + verified 카운트
// ═══════════════════════════════════════════════════════════════════

function getOffersForItem(item: { id: string; name: string }) {
  const exact = findOffersForItem(item.id);
  if (exact.length > 0) return exact;
  return findOffersByKeyword(item.name);
}

describe("호치민 도달률 — OTA 매칭 + verified", () => {
  // OTA 매칭 가능 일정 5건 (plan 순서)
  // hcm-item-1: 벤탄 푸드 / 3: 통일궁 / 5: 디너 크루즈 / 6: 메콩 / 9: 시클로
  const expectedItemIds = [
    "hcm-item-1",
    "hcm-item-3",
    "hcm-item-5",
    "hcm-item-6",
    "hcm-item-9",
  ];

  it("OTA 매칭 가능 일정 = 5건", () => {
    const matched = hoChiMinhItinerary.filter(
      (it) => getOffersForItem(it).length > 0,
    );
    expect(matched.length).toBe(5);
    expect(new Set(matched.map((it) => it.id))).toEqual(new Set(expectedItemIds));
  });

  it("호치민 12 일정 분모 도달률 ≈ 41.7% (5/12)", () => {
    const matched = hoChiMinhItinerary.filter(
      (it) => getOffersForItem(it).length > 0,
    );
    expect(matched.length / hoChiMinhItinerary.length).toBeCloseTo(5 / 12, 3);
  });

  it.each(
    expectedItemIds.map((id) => ({ id })),
  )("$id — comparePriceVerification → verified", ({ id }) => {
    const item = hoChiMinhItinerary.find((it) => it.id === id);
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
  });

  it("검증 가능 일정 분모 도달률 = 100% (5 verified / 5 검증가능)", () => {
    const verifiedCount = expectedItemIds
      .map((id) => {
        const item = hoChiMinhItinerary.find((it) => it.id === id);
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
    expect(verifiedCount).toBe(5);
  });
});

// ═══════════════════════════════════════════════════════════════════
// fuzzy 키워드 매칭 회귀 (사이클 G-1 신규)
// ═══════════════════════════════════════════════════════════════════

describe("호치민 fuzzy 키워드 매칭", () => {
  it("'메콩' → hcm-spot-mekong 매칭", () => {
    const offers = findOffersByKeyword("메콩델타 미토 데이투어");
    expect(offers.some((o) => o.matchTag === "hcm-spot-mekong")).toBe(true);
  });

  it("'시클로' → hcm-spot-cyclo 매칭", () => {
    const offers = findOffersByKeyword("시클로 시내투어");
    expect(offers.some((o) => o.matchTag === "hcm-spot-cyclo")).toBe(true);
  });

  it("'벤탄' → hcm-food-streetFood 매칭", () => {
    const offers = findOffersByKeyword("벤탄시장 푸드 워킹투어");
    expect(offers.some((o) => o.matchTag === "hcm-food-streetFood")).toBe(true);
  });

  it("'통일궁' → hcm-spot-warMuseum 매칭", () => {
    const offers = findOffersByKeyword("통일궁 + 전쟁 박물관");
    expect(offers.some((o) => o.matchTag === "hcm-spot-warMuseum")).toBe(true);
  });

  it("'사이공 강 디너 크루즈' → hcm-food-dinnerCruise 매칭 (방콕과 충돌 없음)", () => {
    const offers = findOffersByKeyword("사이공 강 디너 크루즈 (Indochina Queen)");
    expect(offers.some((o) => o.matchTag === "hcm-food-dinnerCruise")).toBe(true);
    // 방콕 차오프라야 매칭은 들어가지 않아야 함
    expect(offers.some((o) => o.matchTag === "bk-food-dinnerCruise")).toBe(false);
  });

  it("'차오프라야 디너 크루즈' → 방콕만 매칭 (호치민 미스)", () => {
    const offers = findOffersByKeyword("차오프라야 디너 크루즈");
    expect(offers.some((o) => o.matchTag === "bk-food-dinnerCruise")).toBe(true);
    expect(offers.some((o) => o.matchTag === "hcm-food-dinnerCruise")).toBe(false);
  });
});
