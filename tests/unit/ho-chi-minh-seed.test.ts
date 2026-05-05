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
import { findOffersByKeyword } from "@/lib/seed/ota-offers";
import { getDemoTrip, listDemoTrips } from "@/lib/seed";
import { describeOtaReach } from "./helpers/ota-reach";

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
// 도달률 측정 — OTA 매칭 + verified (공통 헬퍼)
// ═══════════════════════════════════════════════════════════════════

describeOtaReach({
  cityName: "호치민",
  itinerary: hoChiMinhItinerary,
  expectedItemIds: [
    "hcm-item-1", // 벤탄 푸드
    "hcm-item-3", // 통일궁
    "hcm-item-5", // 디너 크루즈
    "hcm-item-6", // 메콩
    "hcm-item-9", // 시클로
  ],
  expectedReachRatio: 5 / 12,
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
