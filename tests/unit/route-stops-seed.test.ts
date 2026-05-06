/**
 * Day Route Map 시드 무결성 테스트.
 */

import { describe, it, expect } from "vitest";
import { DEMO_ROUTE_STOPS } from "@/lib/seed/route-stops";

describe("DEMO_ROUTE_STOPS 시드", () => {
  it("6건 존재", () => {
    expect(DEMO_ROUTE_STOPS).toHaveLength(6);
  });

  it("모든 항목에 필수 필드 존재", () => {
    for (const s of DEMO_ROUTE_STOPS) {
      expect(s.id).toBeTruthy();
      expect(s.name).toBeTruthy();
      expect(s.time).toBeTruthy();
      expect(s.category).toBeTruthy();
      expect(s.categoryIcon).toBeTruthy();
      expect(s.order).toBeGreaterThan(0);
    }
  });

  it("ID 유일", () => {
    const ids = DEMO_ROUTE_STOPS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("order 1~6 연속", () => {
    const orders = DEMO_ROUTE_STOPS.map((s) => s.order).sort((a, b) => a - b);
    expect(orders).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("time HH:MM 형식", () => {
    for (const s of DEMO_ROUTE_STOPS) {
      expect(s.time).toMatch(/^\d{2}:\d{2}$/);
    }
  });

  it("pinX/pinY 범위 0~100", () => {
    for (const s of DEMO_ROUTE_STOPS) {
      if (s.pinX !== undefined) {
        expect(s.pinX).toBeGreaterThanOrEqual(0);
        expect(s.pinX).toBeLessThanOrEqual(100);
      }
      if (s.pinY !== undefined) {
        expect(s.pinY).toBeGreaterThanOrEqual(0);
        expect(s.pinY).toBeLessThanOrEqual(100);
      }
    }
  });

  it("마지막 정류장에는 nextTransit 없음", () => {
    const last = DEMO_ROUTE_STOPS[DEMO_ROUTE_STOPS.length - 1];
    expect(last.nextTransit).toBeUndefined();
  });

  it("isActive 최대 1건", () => {
    const activeCount = DEMO_ROUTE_STOPS.filter((s) => s.isActive).length;
    expect(activeCount).toBeLessThanOrEqual(1);
  });
});
