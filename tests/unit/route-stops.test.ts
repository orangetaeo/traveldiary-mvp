/**
 * lib/utils/route-stops.ts 단위 테스트 — A1 동선 지도.
 *
 * buildRouteStops: ItineraryItem[] → RouteStop[] 변환 + 거리 계산.
 */

import { describe, it, expect } from "vitest";
import { buildRouteStops } from "@/lib/utils/route-stops";
import type { ItineraryItem } from "@/lib/types";

function makeItem(overrides: Partial<ItineraryItem> & { id: string }): ItineraryItem {
  return {
    tripId: "trip-1",
    dayIndex: 0,
    scheduledAt: "2026-05-10T09:00:00.000Z",
    durationMinutes: 60,
    flexibility: "flexible",
    priority: 3,
    flexMinutes: 30,
    name: "테스트 장소",
    category: "spot",
    location: { lat: 10.2, lng: 103.9, address: "주소" },
    evidence: { reasons: [], sources: [], verifiedAt: "" },
    dependencies: [],
    ...overrides,
  };
}

describe("buildRouteStops", () => {
  it("빈 배열 → 빈 결과", () => {
    const result = buildRouteStops([]);
    expect(result.stops).toHaveLength(0);
    expect(result.walkingKm).toBe(0);
    expect(result.drivingKm).toBe(0);
  });

  it("단일 아이템 → 1개 stop, 중앙 핀", () => {
    const result = buildRouteStops([makeItem({ id: "a" })]);
    expect(result.stops).toHaveLength(1);
    expect(result.stops[0].order).toBe(1);
    expect(result.stops[0].pinX).toBe(50);
    expect(result.stops[0].pinY).toBe(50);
    expect(result.stops[0].lat).toBe(10.2);
    expect(result.stops[0].lng).toBe(103.9);
  });

  it("scheduledAt 기준 정렬", () => {
    const items = [
      makeItem({ id: "b", name: "점심", scheduledAt: "2026-05-10T12:00:00.000Z" }),
      makeItem({ id: "a", name: "아침", scheduledAt: "2026-05-10T08:00:00.000Z" }),
    ];
    const { stops } = buildRouteStops(items);
    expect(stops[0].name).toBe("아침");
    expect(stops[0].order).toBe(1);
    expect(stops[1].name).toBe("점심");
    expect(stops[1].order).toBe(2);
  });

  it("시간 포맷 HH:MM", () => {
    const items = [
      makeItem({ id: "a", scheduledAt: "2026-05-10T09:30:00.000Z" }),
    ];
    const { stops } = buildRouteStops(items);
    expect(stops[0].time).toBe("09:30");
  });

  it("카테고리 아이콘 매핑", () => {
    const categories: Array<[string, string, string]> = [
      ["food", "restaurant", "맛집"],
      ["spot", "place", "관광"],
      ["shopping", "shopping_bag", "쇼핑"],
      ["rest", "hotel", "숙소"],
    ];

    for (const [cat, icon, label] of categories) {
      const { stops } = buildRouteStops([
        makeItem({ id: cat, category: cat as ItineraryItem["category"] }),
      ]);
      expect(stops[0].categoryIcon).toBe(icon);
      expect(stops[0].category).toBe(label);
    }
  });

  it("도보 거리 계산 (< 1km)", () => {
    const items = [
      makeItem({
        id: "a",
        scheduledAt: "2026-05-10T09:00:00.000Z",
        location: { lat: 10.200, lng: 103.900, address: "A" },
      }),
      makeItem({
        id: "b",
        scheduledAt: "2026-05-10T10:00:00.000Z",
        location: { lat: 10.201, lng: 103.901, address: "B" }, // ~0.14km 차이
      }),
    ];
    const { stops, walkingKm, drivingKm } = buildRouteStops(items);
    expect(walkingKm).toBeGreaterThan(0);
    expect(drivingKm).toBe(0);
    expect(stops[0].nextTransit).toMatch(/^도보 \d+분$/);
  });

  it("차량 거리 계산 (>= 1km)", () => {
    const items = [
      makeItem({
        id: "a",
        scheduledAt: "2026-05-10T09:00:00.000Z",
        location: { lat: 10.200, lng: 103.900, address: "A" },
      }),
      makeItem({
        id: "b",
        scheduledAt: "2026-05-10T10:00:00.000Z",
        location: { lat: 10.300, lng: 104.000, address: "B" }, // ~14km 차이
      }),
    ];
    const { stops, walkingKm, drivingKm } = buildRouteStops(items);
    expect(drivingKm).toBeGreaterThan(0);
    expect(walkingKm).toBe(0);
    expect(stops[0].nextTransit).toMatch(/^차량 \d+분$/);
  });

  it("마지막 stop에는 nextTransit 없음", () => {
    const items = [
      makeItem({ id: "a", scheduledAt: "2026-05-10T09:00:00.000Z" }),
      makeItem({ id: "b", scheduledAt: "2026-05-10T10:00:00.000Z" }),
    ];
    const { stops } = buildRouteStops(items);
    expect(stops[stops.length - 1].nextTransit).toBeUndefined();
  });

  it("(0,0) 좌표 → lat/lng undefined", () => {
    const items = [
      makeItem({
        id: "a",
        location: { lat: 0, lng: 0, address: "미설정" },
      }),
    ];
    const { stops } = buildRouteStops(items);
    expect(stops[0].lat).toBeUndefined();
    expect(stops[0].lng).toBeUndefined();
  });

  it("activeItemId 매칭", () => {
    const items = [
      makeItem({ id: "a", scheduledAt: "2026-05-10T09:00:00.000Z" }),
      makeItem({ id: "b", scheduledAt: "2026-05-10T10:00:00.000Z" }),
    ];
    const { stops } = buildRouteStops(items, "b");
    expect(stops[0].isActive).toBe(false);
    expect(stops[1].isActive).toBe(true);
  });

  it("3+ stops → 핀 좌표 bounding box 정규화", () => {
    const items = [
      makeItem({
        id: "a",
        scheduledAt: "2026-05-10T09:00:00.000Z",
        location: { lat: 10.0, lng: 103.0, address: "남서" },
      }),
      makeItem({
        id: "b",
        scheduledAt: "2026-05-10T10:00:00.000Z",
        location: { lat: 10.5, lng: 103.5, address: "중앙" },
      }),
      makeItem({
        id: "c",
        scheduledAt: "2026-05-10T11:00:00.000Z",
        location: { lat: 11.0, lng: 104.0, address: "북동" },
      }),
    ];
    const { stops } = buildRouteStops(items);

    // 첫 stop: 남서 → pinX 낮음, pinY 높음 (lat 반전)
    expect(stops[0].pinX).toBeLessThan(stops[2].pinX);
    expect(stops[0].pinY).toBeGreaterThan(stops[2].pinY);

    // 모든 핀이 12~88% 범위 (PADDING)
    for (const s of stops) {
      expect(s.pinX).toBeGreaterThanOrEqual(12);
      expect(s.pinX).toBeLessThanOrEqual(88);
      expect(s.pinY).toBeGreaterThanOrEqual(12);
      expect(s.pinY).toBeLessThanOrEqual(88);
    }
  });
});
