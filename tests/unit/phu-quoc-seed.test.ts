/**
 * 푸꾸옥 시드 단위 테스트 — 시드 무결성 + OTA 도달률.
 *
 * 원본 데모 trip. 12 일정 / 3박 4일 / dayIndex 0~3.
 */

import { describe, it, expect } from "vitest";
import { phuQuocTrip, phuQuocItinerary } from "@/lib/seed/phu-quoc";
import { getDemoTrip, DEMO_TRIP_ID } from "@/lib/seed";
import { getOffersForItem } from "./helpers/ota-reach";
import { assertSeedIntegrity } from "./helpers/city-seed-integrity";

// ═══════════════════════════════════════════════════════════════════
// 무결성
// ═══════════════════════════════════════════════════════════════════

describe("phuQuoc 시드 — 무결성", () => {
  it("trip 메타 — PQC 베트남, 3박, pre-travel", () => {
    expect(phuQuocTrip.destinationCode).toBe("PQC");
    expect(phuQuocTrip.nights).toBe(3);
    expect(phuQuocTrip.currentMode).toBe("pre-travel");
    expect(phuQuocTrip.id).toBe("demo-trip-phu-quoc");
  });

  it("DEMO_TRIP_ID는 푸꾸옥 trip", () => {
    expect(DEMO_TRIP_ID).toBe(phuQuocTrip.id);
  });

  it("itinerary 12 일정 (Day 0~3)", () => {
    expect(phuQuocItinerary.length).toBe(12);
    const days = new Set(phuQuocItinerary.map((it) => it.dayIndex));
    expect(days).toEqual(new Set([0, 1, 2, 3]));
  });

  assertSeedIntegrity({
    tripId: "demo-trip-phu-quoc",
    itinerary: phuQuocItinerary,
    maxDayIndex: 3,
  });

  it("DAG dependencies — 같은 day 안에서 직전 슬롯 선행", () => {
    expect(phuQuocItinerary[0].dependencies).toEqual([]);
    expect(phuQuocItinerary[1].dependencies).toEqual(["pq-item-0"]);
    // Day 1 첫 항목 — 의존성 없음 (day 경계)
    const day1First = phuQuocItinerary.find((i) => i.dayIndex === 1);
    expect(day1First?.dependencies).toEqual([]);
  });

  it("카테고리 분포 — 4종 모두 존재", () => {
    const cats = new Set(phuQuocItinerary.map((i) => i.category));
    expect(cats).toContain("food");
    expect(cats).toContain("spot");
  });
});

// ═══════════════════════════════════════════════════════════════════
// 데모 trip 진입
// ═══════════════════════════════════════════════════════════════════

describe("phuQuoc 시드 — 데모 접근", () => {
  it("getDemoTrip으로 조회 가능", () => {
    const bundle = getDemoTrip(phuQuocTrip.id);
    expect(bundle).toBeDefined();
    expect(bundle!.trip.destination).toBe("푸꾸옥");
    expect(bundle!.items.length).toBe(12);
  });
});

// ═══════════════════════════════════════════════════════════════════
// OTA 매칭 기본 확인
// ═══════════════════════════════════════════════════════════════════

describe("phuQuoc 시드 — OTA 매칭", () => {
  it("OTA 매칭 가능 일정 2건 이상", () => {
    const matched = phuQuocItinerary.filter(
      (item) => getOffersForItem(item).length > 0,
    );
    expect(matched.length).toBeGreaterThanOrEqual(2);
  });

  it("매칭된 오퍼는 최소 2개 이상 (가격 비교 가능)", () => {
    const matched = phuQuocItinerary.filter(
      (item) => getOffersForItem(item).length > 0,
    );
    for (const item of matched) {
      expect(getOffersForItem(item).length).toBeGreaterThanOrEqual(2);
    }
  });
});
