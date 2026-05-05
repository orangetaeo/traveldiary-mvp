/**
 * 나트랑 시드 단위 테스트 — 사이클 G-4 (V1).
 *
 * feedback_city_seed_pattern 답습 + 푸꾸옥과 키워드 충돌 회귀 (vinwonder·snorkel·야시장·케이블카).
 * - 12 일정 / 3박 4일
 * - OTA 매칭 5건 — verified 100%
 * - 도시 게이트 키워드 분기 (도시 ctx 명시 시만 hit)
 */

import { describe, it, expect } from "vitest";
import {
  nhaTrangTrip,
  nhaTrangItinerary,
  NHA_TRANG_TRIP_ID,
} from "@/lib/seed/nha-trang";
import { findOffersByKeyword } from "@/lib/seed/ota-offers";
import { getDemoTrip, listDemoTrips } from "@/lib/seed";
import { describeOtaReach } from "./helpers/ota-reach";
import { assertSeedIntegrity } from "./helpers/city-seed-integrity";

// ═══════════════════════════════════════════════════════════════════
// 무결성
// ═══════════════════════════════════════════════════════════════════

describe("nhaTrang 시드 — 무결성", () => {
  it("trip 메타 — NHA 베트남, 3박, draft", () => {
    expect(nhaTrangTrip.destinationCode).toBe("NHA");
    expect(nhaTrangTrip.nights).toBe(3);
    expect(nhaTrangTrip.status).toBe("draft");
    expect(nhaTrangTrip.id).toBe(NHA_TRANG_TRIP_ID);
    expect(nhaTrangTrip.destination).toBe("나트랑");
  });

  it("itinerary 12 일정 (Day 0~3)", () => {
    expect(nhaTrangItinerary.length).toBe(12);
    const days = new Set(nhaTrangItinerary.map((it) => it.dayIndex));
    expect(days).toEqual(new Set([0, 1, 2, 3]));
  });

  assertSeedIntegrity({ tripId: NHA_TRANG_TRIP_ID, itinerary: nhaTrangItinerary, maxDayIndex: 3 });

  it("DAG dependencies — day 경계 무의존성", () => {
    expect(nhaTrangItinerary[0].dependencies).toEqual([]);
    expect(nhaTrangItinerary[1].dependencies).toEqual(["nh-item-0"]);
    expect(nhaTrangItinerary[3].dependencies).toEqual([]); // Day 1 첫번째
    expect(nhaTrangItinerary[6].dependencies).toEqual([]); // Day 2 첫번째
    expect(nhaTrangItinerary[8].dependencies).toEqual([]); // Day 3 첫번째
  });
});

// ═══════════════════════════════════════════════════════════════════
// 데모 trip 진입 — 회귀
// ═══════════════════════════════════════════════════════════════════

describe("나트랑 데모 trip — getDemoTrip 진입", () => {
  it("getDemoTrip(NHA_TRANG_TRIP_ID) → 12 일정 번들", () => {
    const bundle = getDemoTrip(NHA_TRANG_TRIP_ID);
    expect(bundle).not.toBeNull();
    expect(bundle?.trip.destinationCode).toBe("NHA");
    expect(bundle?.items.length).toBe(12);
  });

  it("listDemoTrips → 베트남 도시 trip 모두 노출 (G-4 후 5개)", () => {
    const trips = listDemoTrips();
    expect(trips.length).toBeGreaterThanOrEqual(5);
    const codes = trips.map((b) => b.trip.destinationCode);
    expect(codes).toContain("PQC");
    expect(codes).toContain("DAD");
    expect(codes).toContain("SGN");
    expect(codes).toContain("HAN");
    expect(codes).toContain("NHA");
  });
});

// ═══════════════════════════════════════════════════════════════════
// 도달률 측정 — OTA 매칭 + verified (공통 헬퍼)
// ═══════════════════════════════════════════════════════════════════

describeOtaReach({
  cityName: "나트랑",
  itinerary: nhaTrangItinerary,
  expectedItemIds: [
    "nh-item-2", // streetFood
    "nh-item-3", // cityTour
    "nh-item-5", // vinwonders
    "nh-item-6", // snorkeling
    "nh-item-9", // mudSpa
  ],
  expectedReachRatio: 5 / 12,
});

// ═══════════════════════════════════════════════════════════════════
// 도시 게이트 키워드 분기 회귀 — 푸꾸옥 vs 나트랑
// ═══════════════════════════════════════════════════════════════════

describe("나트랑 ↔ 푸꾸옥 키워드 충돌 회피", () => {
  it("'빈원더 나트랑' → 나트랑만 (푸꾸옥 X)", () => {
    const offers = findOffersByKeyword("빈원더 나트랑 케이블카");
    expect(offers.some((o) => o.matchTag === "nh-spot-vinwonders")).toBe(true);
    expect(offers.some((o) => o.matchTag === "pq-spot-vinwonders")).toBe(false);
  });

  it("'빈원더 푸꾸옥' → 푸꾸옥만 (나트랑 X)", () => {
    const offers = findOffersByKeyword("푸꾸옥 빈원더스 입장권");
    expect(offers.some((o) => o.matchTag === "pq-spot-vinwonders")).toBe(true);
    expect(offers.some((o) => o.matchTag === "nh-spot-vinwonders")).toBe(false);
  });

  it("'빈원더' 단독(도시 ctx 없음) → 매칭 X (모호한 입력 회피)", () => {
    const offers = findOffersByKeyword("빈원더 입장권");
    expect(offers.some((o) => o.matchTag === "pq-spot-vinwonders")).toBe(false);
    expect(offers.some((o) => o.matchTag === "nh-spot-vinwonders")).toBe(false);
  });

  it("'스노클링 나트랑' → 나트랑만", () => {
    const offers = findOffersByKeyword("나트랑 스노클링 데이투어");
    expect(offers.some((o) => o.matchTag === "nh-spot-snorkeling")).toBe(true);
    expect(offers.some((o) => o.matchTag === "pq-spot-snorkeling")).toBe(false);
  });

  it("'스노클링 푸꾸옥' → 푸꾸옥만", () => {
    const offers = findOffersByKeyword("푸꾸옥 스노클링");
    expect(offers.some((o) => o.matchTag === "pq-spot-snorkeling")).toBe(true);
    expect(offers.some((o) => o.matchTag === "nh-spot-snorkeling")).toBe(false);
  });

  it("'야시장 나트랑' → 나트랑만 (시푸드 야시장 푸드투어 매칭)", () => {
    const offers = findOffersByKeyword("나트랑 야시장 시푸드");
    expect(offers.some((o) => o.matchTag === "nh-food-streetFood")).toBe(true);
    expect(offers.some((o) => o.matchTag === "pq-food-night-market")).toBe(false);
  });

  it("'케이블카 나트랑' → 나트랑 빈원더스 케이블카는 별도 OTA 시드 없음(빈원더 통합) → pq 매칭 X", () => {
    const offers = findOffersByKeyword("나트랑 케이블카");
    expect(offers.some((o) => o.matchTag === "pq-spot-cablecar")).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 나트랑 고유 키워드 (충돌 없음)
// ═══════════════════════════════════════════════════════════════════

describe("나트랑 고유 키워드 매칭", () => {
  it("'머드스파' / 'Thap Ba' → nh-spot-mudSpa", () => {
    expect(
      findOffersByKeyword("Thap Ba 머드 스파").some(
        (o) => o.matchTag === "nh-spot-mudSpa",
      ),
    ).toBe(true);
  });

  it("'폰가나가르' / '스톤성당' → nh-spot-cityTour", () => {
    expect(
      findOffersByKeyword("폰가나가르 참 타워").some(
        (o) => o.matchTag === "nh-spot-cityTour",
      ),
    ).toBe(true);
    expect(
      findOffersByKeyword("스톤 성당 시티투어").some(
        (o) => o.matchTag === "nh-spot-cityTour",
      ),
    ).toBe(true);
  });

  it("'4섬' / '혼문' → nh-spot-snorkeling (도시 ctx 없어도 OK)", () => {
    expect(
      findOffersByKeyword("혼문 4섬 보트 투어").some(
        (o) => o.matchTag === "nh-spot-snorkeling",
      ),
    ).toBe(true);
  });
});
