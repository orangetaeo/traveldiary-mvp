/**
 * lib/seed/index.ts 진입점 단위 테스트.
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

describe("lib/seed/index — getDemoTrip", () => {
  it("존재하는 tripId로 조회 성공", () => {
    const bundle = getDemoTrip(DEMO_TRIP_ID);
    expect(bundle).not.toBeNull();
    expect(bundle!.trip.id).toBe(DEMO_TRIP_ID);
    expect(bundle!.items.length).toBeGreaterThan(0);
  });

  it("없는 tripId → null", () => {
    expect(getDemoTrip("non-existent")).toBeNull();
  });
});

describe("lib/seed/index — getDemoItem", () => {
  it("존재하는 trip + item 조회 성공", () => {
    const bundle = getDemoTrip(DEMO_TRIP_ID)!;
    const firstItem = bundle.items[0];
    const found = getDemoItem(DEMO_TRIP_ID, firstItem.id);
    expect(found).not.toBeNull();
    expect(found!.id).toBe(firstItem.id);
  });

  it("없는 tripId → null", () => {
    expect(getDemoItem("non-existent", "any-item")).toBeNull();
  });

  it("존재하는 trip + 없는 itemId → null", () => {
    expect(getDemoItem(DEMO_TRIP_ID, "no-such-item")).toBeNull();
  });
});

describe("lib/seed/index — listDemoItemsByDay", () => {
  it("유효한 trip → 일별 2D 배열", () => {
    const days = listDemoItemsByDay(DEMO_TRIP_ID);
    expect(days.length).toBeGreaterThan(0);
    // 모든 서브배열의 아이템 합 = trip items 수
    const total = days.reduce((sum, d) => sum + d.length, 0);
    const bundle = getDemoTrip(DEMO_TRIP_ID)!;
    expect(total).toBe(bundle.items.length);
  });

  it("없는 tripId → 빈 배열", () => {
    expect(listDemoItemsByDay("non-existent")).toEqual([]);
  });

  it("각 일별 아이템은 scheduledAt 오름차순", () => {
    const days = listDemoItemsByDay(DEMO_TRIP_ID);
    for (const dayItems of days) {
      for (let i = 1; i < dayItems.length; i++) {
        expect(dayItems[i].scheduledAt >= dayItems[i - 1].scheduledAt).toBe(
          true,
        );
      }
    }
  });
});

describe("lib/seed/index — listDemoTrips", () => {
  it("6개 데모 trip 반환 (베트남 6 도시)", () => {
    const trips = listDemoTrips();
    expect(trips).toHaveLength(6);
  });

  it("모든 trip에 items 존재", () => {
    for (const bundle of listDemoTrips()) {
      expect(bundle.items.length).toBeGreaterThan(0);
    }
  });
});

describe("lib/seed/index — isDemoTrip", () => {
  it("데모 ID → true", () => {
    expect(isDemoTrip(DEMO_TRIP_ID)).toBe(true);
  });

  it("임의 ID → false", () => {
    expect(isDemoTrip("user-created-trip")).toBe(false);
  });
});

describe("lib/seed/index — DEMO_TRIP_IDS", () => {
  it("listDemoTrips와 동일한 ID 목록", () => {
    const fromList = listDemoTrips().map((b) => b.trip.id);
    expect(DEMO_TRIP_IDS).toEqual(fromList);
  });

  it("ID 중복 없음", () => {
    expect(new Set(DEMO_TRIP_IDS).size).toBe(DEMO_TRIP_IDS.length);
  });
});
