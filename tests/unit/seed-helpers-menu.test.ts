/**
 * Seed 헬퍼 함수 + 메뉴 시드 무결성 테스트 — Batch 11.
 *
 * 2 모듈:
 *  - lib/seed/index.ts: getDemoTrip, getDemoItem, listDemoItemsByDay, listDemoTrips, isDemoTrip
 *  - lib/seed/menu-phu-quoc.ts: phuQuocMenu 데이터 무결성 (MenuItem 스키마)
 */

import { describe, it, expect } from "vitest";
import {
  getDemoTrip,
  getDemoItem,
  listDemoItemsByDay,
  listDemoTrips,
  isDemoTrip,
  DEMO_TRIP_ID,
  DEMO_TRIP_IDS,
} from "@/lib/seed";
import { phuQuocMenu, PHU_QUOC_MENU_VENUE } from "@/lib/seed/menu-phu-quoc";

/* ────────── seed/index 헬퍼 ────────── */

describe("seed — getDemoTrip", () => {
  it("유효한 tripId → bundle 반환", () => {
    const bundle = getDemoTrip(DEMO_TRIP_ID);
    expect(bundle).not.toBeNull();
    expect(bundle!.trip.id).toBe(DEMO_TRIP_ID);
    expect(bundle!.items.length).toBeGreaterThan(0);
  });

  it("존재하지 않는 tripId → null", () => {
    expect(getDemoTrip("nonexistent-trip")).toBeNull();
  });
});

describe("seed — getDemoItem", () => {
  it("유효한 tripId + itemId → item 반환", () => {
    const bundle = getDemoTrip(DEMO_TRIP_ID)!;
    const firstItem = bundle.items[0];
    const found = getDemoItem(DEMO_TRIP_ID, firstItem.id);
    expect(found).not.toBeNull();
    expect(found!.id).toBe(firstItem.id);
  });

  it("존재하지 않는 tripId → null", () => {
    expect(getDemoItem("fake-trip", "fake-item")).toBeNull();
  });

  it("유효 tripId + 존재하지 않는 itemId → null", () => {
    expect(getDemoItem(DEMO_TRIP_ID, "fake-item-id")).toBeNull();
  });
});

describe("seed — listDemoItemsByDay", () => {
  it("유효 tripId → day별 2D 배열", () => {
    const days = listDemoItemsByDay(DEMO_TRIP_ID);
    expect(days.length).toBeGreaterThan(0);
    // 배열 길이 = nights + 1
    const bundle = getDemoTrip(DEMO_TRIP_ID)!;
    expect(days.length).toBe(bundle.trip.nights + 1);
  });

  it("각 day 내부 scheduledAt 정렬 보장", () => {
    const days = listDemoItemsByDay(DEMO_TRIP_ID);
    for (const day of days) {
      for (let i = 1; i < day.length; i++) {
        expect(day[i].scheduledAt >= day[i - 1].scheduledAt).toBe(true);
      }
    }
  });

  it("존재하지 않는 tripId → 빈 배열", () => {
    expect(listDemoItemsByDay("fake")).toEqual([]);
  });
});

describe("seed — listDemoTrips", () => {
  it("6개 trip 반환 (베트남 6 도시)", () => {
    const trips = listDemoTrips();
    expect(trips.length).toBe(6);
  });

  it("각 bundle에 trip + items 존재", () => {
    for (const bundle of listDemoTrips()) {
      expect(bundle.trip.id).toBeTruthy();
      expect(bundle.trip.destination).toBeTruthy();
      expect(bundle.items.length).toBeGreaterThan(0);
    }
  });
});

describe("seed — isDemoTrip", () => {
  it("DEMO_TRIP_ID → true", () => {
    expect(isDemoTrip(DEMO_TRIP_ID)).toBe(true);
  });

  it("모든 DEMO_TRIP_IDS → true", () => {
    for (const id of DEMO_TRIP_IDS) {
      expect(isDemoTrip(id)).toBe(true);
    }
  });

  it("임의 문자열 → false", () => {
    expect(isDemoTrip("user-created-trip-123")).toBe(false);
  });
});

/* ────────── menu-phu-quoc 무결성 ────────── */

describe("seed — phuQuocMenu 무결성", () => {
  it("10개 메뉴 항목", () => {
    expect(phuQuocMenu.length).toBe(10);
  });

  it("각 항목 필수 필드 존재", () => {
    for (const item of phuQuocMenu) {
      expect(item.id).toBeTruthy();
      expect(item.original).toBeTruthy();
      expect(item.phonetic).toBeTruthy();
      expect(item.translated).toBeTruthy();
      expect(item.price.vnd).toBeGreaterThan(0);
      expect(item.price.krw).toBeGreaterThan(0);
      expect(item.ingredients.length).toBeGreaterThan(0);
      expect(Array.isArray(item.allergens)).toBe(true);
    }
  });

  it("id 중복 없음", () => {
    const ids = phuQuocMenu.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("VND 가격 합리적 범위 (30,000~1,000,000)", () => {
    for (const item of phuQuocMenu) {
      expect(item.price.vnd).toBeGreaterThanOrEqual(30000);
      expect(item.price.vnd).toBeLessThanOrEqual(1000000);
    }
  });

  it("KRW 가격 합리적 범위 (1,500~60,000)", () => {
    for (const item of phuQuocMenu) {
      expect(item.price.krw).toBeGreaterThanOrEqual(1500);
      expect(item.price.krw).toBeLessThanOrEqual(60000);
    }
  });

  it("koreanPopularity 0~100 범위", () => {
    for (const item of phuQuocMenu) {
      if (item.koreanPopularity != null) {
        expect(item.koreanPopularity).toBeGreaterThanOrEqual(0);
        expect(item.koreanPopularity).toBeLessThanOrEqual(100);
      }
    }
  });

  it("갑각류 메뉴 최소 2개 (랍스터·게)", () => {
    const shellfish = phuQuocMenu.filter((m) =>
      m.allergens.includes("갑각류"),
    );
    expect(shellfish.length).toBeGreaterThanOrEqual(2);
  });

  it("PHU_QUOC_MENU_VENUE — name + address 존재", () => {
    expect(PHU_QUOC_MENU_VENUE.name).toContain("야시장");
    expect(PHU_QUOC_MENU_VENUE.address).toContain("Phú Quốc");
  });
});
