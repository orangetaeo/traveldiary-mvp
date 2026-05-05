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
import { findOffersByKeyword } from "@/lib/seed/ota-offers";
import { getDemoTrip } from "@/lib/seed";
import { describeOtaReach } from "./helpers/ota-reach";
import { assertSeedIntegrity } from "./helpers/city-seed-integrity";

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

  assertSeedIntegrity({ tripId: DA_NANG_TRIP_ID, itinerary: daNangItinerary, maxDayIndex: 3 });

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
// 도달률 측정 — OTA 매칭 + verified (공통 헬퍼)
// ═══════════════════════════════════════════════════════════════════

describeOtaReach({
  cityName: "다낭",
  itinerary: daNangItinerary,
  expectedItemIds: [
    "dn-item-1",  // 한시장
    "dn-item-3",  // 바나힐
    "dn-item-5",  // 미선
    "dn-item-7",  // 호이안
    "dn-item-9",  // 마블
    "dn-item-10", // 미케
  ],
  expectedReachRatio: 6 / 12,
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
