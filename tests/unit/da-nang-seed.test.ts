/**
 * 다낭 시드 단위 테스트 — 사이클 D.
 *
 * 무결성 + 도달률 측정.
 * - 12 일정 / 3박 4일 / dayIndex 0~3
 * - OTA 매칭 6건 — comparePriceVerification으로 verified 보장
 * - 도달률 = 50% (12분 분모) / 100% (검증 가능 일정 분모)
 */

import { describe, it, expect } from "vitest";
import { daNangTrip, daNangItinerary, DA_NANG_TRIP_ID } from "@/lib/seed/da-nang";
import { findOffersForItem, findOffersByKeyword } from "@/lib/seed/ota-offers";
import { comparePriceVerification, toKrw } from "@/lib/services/price-verification";
import { getDemoTrip } from "@/lib/seed";

// ═══════════════════════════════════════════════════════════════════
// 무결성
// ═══════════════════════════════════════════════════════════════════

describe("daNang 시드 — 무결성", () => {
  it("trip 메타 — DAD 베트남, 3박, draft", () => {
    expect(daNangTrip.destinationCode).toBe("DAD");
    expect(daNangTrip.nights).toBe(3);
    expect(daNangTrip.status).toBe("draft");
    expect(daNangTrip.id).toBe(DA_NANG_TRIP_ID);
  });

  it("itinerary 12 일정 (Day 0~3)", () => {
    expect(daNangItinerary.length).toBe(12);
    const days = new Set(daNangItinerary.map((it) => it.dayIndex));
    expect(days).toEqual(new Set([0, 1, 2, 3]));
  });

  it("모든 일정의 tripId = TRIP_ID", () => {
    for (const it of daNangItinerary) {
      expect(it.tripId).toBe(DA_NANG_TRIP_ID);
    }
  });

  it("같은 day 안에서 scheduledAt 오름차순", () => {
    for (let dayIdx = 0; dayIdx <= 3; dayIdx++) {
      const dayItems = daNangItinerary
        .filter((it) => it.dayIndex === dayIdx)
        .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
      const original = daNangItinerary.filter((it) => it.dayIndex === dayIdx);
      expect(original.map((it) => it.id)).toEqual(dayItems.map((it) => it.id));
    }
  });

  it("좌표 모두 (0,0) 아님", () => {
    for (const it of daNangItinerary) {
      expect(it.location.lat !== 0 || it.location.lng !== 0).toBe(true);
    }
  });

  it("DAG dependencies — 같은 day 안에서 직전 슬롯이 선행", () => {
    // dn-item-0 (Day 0 첫번째) 의존성 없음
    expect(daNangItinerary[0].dependencies).toEqual([]);
    // dn-item-1 의존성: dn-item-0 (같은 Day 0)
    expect(daNangItinerary[1].dependencies).toEqual(["dn-item-0"]);
    // dn-item-3 (Day 1 첫번째) 의존성 없음 (day 경계)
    expect(daNangItinerary[3].dependencies).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 데모 trip 진입
// ═══════════════════════════════════════════════════════════════════

describe("다낭 데모 trip — getDemoTrip 진입", () => {
  it("getDemoTrip(DA_NANG_TRIP_ID) → 12 일정 번들", () => {
    const bundle = getDemoTrip(DA_NANG_TRIP_ID);
    expect(bundle).not.toBeNull();
    expect(bundle?.trip.destinationCode).toBe("DAD");
    expect(bundle?.items.length).toBe(12);
  });

  it("푸꾸옥 trip ID도 회귀 통과", () => {
    const bundle = getDemoTrip("demo-trip-phu-quoc");
    expect(bundle).not.toBeNull();
    expect(bundle?.trip.destinationCode).toBe("PQC");
  });
});

// ═══════════════════════════════════════════════════════════════════
// 도달률 측정 — OTA 매칭 + verified 카운트
//   ota-aggregator의 매칭 흐름 답습:
//     findOffersForItem(item.id)  → 0건이면 keyword fallback
//   item.id는 dn-item-N 형식이므로 실제 매칭은 name 기반 keyword
// ═══════════════════════════════════════════════════════════════════

function getOffersForItem(item: { id: string; name: string }) {
  const exact = findOffersForItem(item.id);
  if (exact.length > 0) return exact;
  return findOffersByKeyword(item.name);
}

describe("다낭 도달률 — OTA 매칭 + verified", () => {
  // OTA 매칭 가능 일정 6건 (item.id 기준 — plan 순서)
  // dn-item-1: 한시장 / 3: 바나힐 / 5: 미선 / 7: 호이안 / 9: 마블 / 10: 미케
  const expectedItemIds = [
    "dn-item-1",
    "dn-item-3",
    "dn-item-5",
    "dn-item-7",
    "dn-item-9",
    "dn-item-10",
  ];

  it("OTA 매칭 가능 일정 = 6건", () => {
    const matched = daNangItinerary.filter(
      (it) => getOffersForItem(it).length > 0,
    );
    expect(matched.length).toBe(6);
    expect(new Set(matched.map((it) => it.id))).toEqual(new Set(expectedItemIds));
  });

  it("다낭 12 일정 분모 도달률 = 50% (6/12)", () => {
    const matched = daNangItinerary.filter(
      (it) => getOffersForItem(it).length > 0,
    );
    expect(matched.length / daNangItinerary.length).toBe(0.5);
  });

  it.each(
    expectedItemIds.map((id) => ({ id })),
  )("$id — comparePriceVerification → verified", ({ id }) => {
    const item = daNangItinerary.find((it) => it.id === id);
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

  it("검증 가능 일정 분모 도달률 = 100% (6 verified / 6 검증가능)", () => {
    const verifiedCount = expectedItemIds
      .map((id) => {
        const item = daNangItinerary.find((it) => it.id === id);
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
    expect(verifiedCount).toBe(6);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 다국가 키워드 매칭 회귀
// ═══════════════════════════════════════════════════════════════════

describe("다낭 fuzzy 키워드 매칭 (사이클 D 신규)", () => {
  it("'한시장' → dn-food-hanmarket 매칭", () => {
    const offers = findOffersByKeyword("한시장 푸드");
    expect(offers.some((o) => o.matchTag === "dn-food-hanmarket")).toBe(true);
  });

  it("'미선' → dn-spot-mySon 매칭", () => {
    const offers = findOffersByKeyword("미선 유적 투어");
    expect(offers.some((o) => o.matchTag === "dn-spot-mySon")).toBe(true);
  });

  it("'대리석산' → dn-spot-marble 매칭 (한국어)", () => {
    const offers = findOffersByKeyword("응우한선 대리석산");
    expect(offers.some((o) => o.matchTag === "dn-spot-marble")).toBe(true);
  });

  it("'Marble Mountain' → dn-spot-marble 매칭 (영문)", () => {
    const offers = findOffersByKeyword("Marble Mountains");
    expect(offers.some((o) => o.matchTag === "dn-spot-marble")).toBe(true);
  });
});
