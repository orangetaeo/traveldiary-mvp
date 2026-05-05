/**
 * 하노이 시드 단위 테스트 — 사이클 G-2 (V1).
 *
 * 호치민 패턴 답습 + 북부 키워드(하롱·닌빈·짱안·수상인형극·구시가지) 회귀.
 * - 12 일정 / 3박 4일 / dayIndex 0~3
 * - OTA 매칭 5건 — verified 100%
 * - 도달률 = 5/12 ≈ 41.7% (12분 분모) / 100% (검증 가능 분모)
 */

import { describe, it, expect } from "vitest";
import {
  hanoiTrip,
  hanoiItinerary,
  HANOI_TRIP_ID,
} from "@/lib/seed/hanoi";
import { findOffersByKeyword } from "@/lib/seed/ota-offers";
import { getDemoTrip, listDemoTrips } from "@/lib/seed";
import { describeOtaReach } from "./helpers/ota-reach";

// ═══════════════════════════════════════════════════════════════════
// 무결성
// ═══════════════════════════════════════════════════════════════════

describe("hanoi 시드 — 무결성", () => {
  it("trip 메타 — HAN 베트남, 3박, draft", () => {
    expect(hanoiTrip.destinationCode).toBe("HAN");
    expect(hanoiTrip.nights).toBe(3);
    expect(hanoiTrip.status).toBe("draft");
    expect(hanoiTrip.id).toBe(HANOI_TRIP_ID);
    expect(hanoiTrip.destination).toBe("하노이");
  });

  it("itinerary 12 일정 (Day 0~3)", () => {
    expect(hanoiItinerary.length).toBe(12);
    const days = new Set(hanoiItinerary.map((it) => it.dayIndex));
    expect(days).toEqual(new Set([0, 1, 2, 3]));
  });

  it("모든 일정의 tripId = HANOI_TRIP_ID", () => {
    for (const it of hanoiItinerary) {
      expect(it.tripId).toBe(HANOI_TRIP_ID);
    }
  });

  it("같은 day 안에서 scheduledAt 오름차순", () => {
    for (let dayIdx = 0; dayIdx <= 3; dayIdx++) {
      const dayItems = hanoiItinerary
        .filter((it) => it.dayIndex === dayIdx)
        .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
      const original = hanoiItinerary.filter((it) => it.dayIndex === dayIdx);
      expect(original.map((it) => it.id)).toEqual(dayItems.map((it) => it.id));
    }
  });

  it("좌표 모두 (0,0) 아님", () => {
    for (const it of hanoiItinerary) {
      expect(it.location.lat !== 0 || it.location.lng !== 0).toBe(true);
    }
  });

  it("DAG dependencies — 같은 day 안에서 직전 슬롯이 선행", () => {
    expect(hanoiItinerary[0].dependencies).toEqual([]);
    expect(hanoiItinerary[1].dependencies).toEqual(["han-item-0"]);
    // han-item-4 (Day 1 첫번째) 의존성 없음 (day 경계)
    expect(hanoiItinerary[4].dependencies).toEqual([]);
    // han-item-6 (Day 2 첫번째) 의존성 없음
    expect(hanoiItinerary[6].dependencies).toEqual([]);
    // han-item-8 (Day 3 첫번째) 의존성 없음
    expect(hanoiItinerary[8].dependencies).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 데모 trip 진입 — 회귀
// ═══════════════════════════════════════════════════════════════════

describe("하노이 데모 trip — getDemoTrip 진입", () => {
  it("getDemoTrip(HANOI_TRIP_ID) → 12 일정 번들", () => {
    const bundle = getDemoTrip(HANOI_TRIP_ID);
    expect(bundle).not.toBeNull();
    expect(bundle?.trip.destinationCode).toBe("HAN");
    expect(bundle?.items.length).toBe(12);
  });

  it("listDemoTrips → 베트남 도시 trip 모두 노출 (사이클 G-2 후 ≥4개)", () => {
    const trips = listDemoTrips();
    expect(trips.length).toBeGreaterThanOrEqual(4);
    const codes = trips.map((b) => b.trip.destinationCode);
    expect(codes).toContain("DAD");
    expect(codes).toContain("HAN");
    expect(codes).toContain("PQC");
    expect(codes).toContain("SGN");
  });

  it("기존 베트남 도시 trip 회귀 통과", () => {
    expect(getDemoTrip("demo-trip-phu-quoc")?.trip.destinationCode).toBe("PQC");
    expect(getDemoTrip("demo-trip-da-nang")?.trip.destinationCode).toBe("DAD");
    expect(getDemoTrip("demo-trip-ho-chi-minh")?.trip.destinationCode).toBe("SGN");
  });
});

// ═══════════════════════════════════════════════════════════════════
// 도달률 측정 — OTA 매칭 + verified (공통 헬퍼)
// ═══════════════════════════════════════════════════════════════════

describeOtaReach({
  cityName: "하노이",
  itinerary: hanoiItinerary,
  expectedItemIds: [
    "han-item-3", // streetFoodTour
    "han-item-4", // ninhBinh
    "han-item-6", // halong
    "han-item-7", // waterPuppet
    "han-item-9", // cityTour
  ],
  expectedReachRatio: 5 / 12,
});

// ═══════════════════════════════════════════════════════════════════
// fuzzy 키워드 매칭 회귀 (사이클 G-2 신규)
// ═══════════════════════════════════════════════════════════════════

describe("하노이 fuzzy 키워드 매칭", () => {
  it("'하롱베이' → han-spot-halong 매칭 (3 OTA)", () => {
    const offers = findOffersByKeyword("하롱베이 데이투어");
    const halong = offers.filter((o) => o.matchTag === "han-spot-halong");
    expect(halong.length).toBe(3);
  });

  it("'Ha Long Bay' 영문 → han-spot-halong 매칭", () => {
    const offers = findOffersByKeyword("Ha Long Bay Day Cruise");
    expect(offers.some((o) => o.matchTag === "han-spot-halong")).toBe(true);
  });

  it("'닌빈' → han-spot-ninhBinh 매칭", () => {
    const offers = findOffersByKeyword("닌빈 짱안 투어");
    expect(offers.some((o) => o.matchTag === "han-spot-ninhBinh")).toBe(true);
  });

  it("'Trang An' → han-spot-ninhBinh 매칭 (영문)", () => {
    const offers = findOffersByKeyword("Trang An Boat Tour");
    expect(offers.some((o) => o.matchTag === "han-spot-ninhBinh")).toBe(true);
  });

  it("'36거리' / '푸드 워킹' → han-food-streetFoodTour 매칭", () => {
    // "구시가지" 단독은 호텔 체크인 등에 오탐 → 좁힌 키워드 사용
    const offers = findOffersByKeyword("하노이 구시가지 36거리 푸드 워킹투어");
    expect(offers.some((o) => o.matchTag === "han-food-streetFoodTour")).toBe(true);
  });

  it("'구시가지 호텔' 단독은 매칭 안 됨 (오탐 회귀 방지)", () => {
    const offers = findOffersByKeyword("구시가지 호텔 체크인");
    expect(offers.some((o) => o.matchTag === "han-food-streetFoodTour")).toBe(false);
  });

  it("'수상인형극' → han-spot-waterPuppet 매칭", () => {
    const offers = findOffersByKeyword("탕롱 수상인형극");
    expect(offers.some((o) => o.matchTag === "han-spot-waterPuppet")).toBe(true);
  });

  it("'호치민 영묘' → han-spot-cityTour 매칭 (호치민 도시와 충돌 없음)", () => {
    const offers = findOffersByKeyword("호치민 영묘 + 문묘");
    expect(offers.some((o) => o.matchTag === "han-spot-cityTour")).toBe(true);
    // 호치민 도시(SGN) OTA에 'hcm-' prefix는 없어야 (영묘는 하노이 콘텍스트)
    expect(offers.every((o) => !o.matchTag.startsWith("hcm-"))).toBe(true);
  });
});
