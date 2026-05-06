/**
 * Post-Trip Recap 시드 무결성 테스트.
 */

import { describe, it, expect } from "vitest";
import {
  DEMO_RECAP_STATS,
  DEMO_RECAP_HIGHLIGHTS,
  DEMO_RECAP_MOMENTS,
} from "@/lib/seed/recap-data";

describe("DEMO_RECAP_STATS 시드", () => {
  it("필수 통계 필드 존재", () => {
    expect(DEMO_RECAP_STATS.placesVisited).toBeGreaterThan(0);
    expect(DEMO_RECAP_STATS.longestStay).toBeTruthy();
    expect(DEMO_RECAP_STATS.totalDistanceKm).toBeGreaterThan(0);
    expect(DEMO_RECAP_STATS.totalSteps).toBeGreaterThan(0);
    expect(DEMO_RECAP_STATS.totalSpentKRW).toBeGreaterThan(0);
    expect(DEMO_RECAP_STATS.biggestCategory).toBeTruthy();
  });

  it("금액 합리적 범위 (10만~1000만 KRW)", () => {
    expect(DEMO_RECAP_STATS.totalSpentKRW).toBeGreaterThanOrEqual(100000);
    expect(DEMO_RECAP_STATS.totalSpentKRW).toBeLessThanOrEqual(10000000);
  });
});

describe("DEMO_RECAP_HIGHLIGHTS 시드", () => {
  it("3건 존재", () => {
    expect(DEMO_RECAP_HIGHLIGHTS).toHaveLength(3);
  });

  it("모든 항목에 필수 필드 존재", () => {
    for (const h of DEMO_RECAP_HIGHLIGHTS) {
      expect(h.id).toBeTruthy();
      expect(h.label).toBeTruthy();
      expect(h.emoji).toBeTruthy();
      expect(h.name).toBeTruthy();
      expect(h.icon).toBeTruthy();
      expect(h.color).toBeTruthy();
    }
  });

  it("ID 유일", () => {
    const ids = DEMO_RECAP_HIGHLIGHTS.map((h) => h.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("color는 purple/coral/amber 중 하나", () => {
    const validColors = ["purple", "coral", "amber"];
    for (const h of DEMO_RECAP_HIGHLIGHTS) {
      expect(validColors).toContain(h.color);
    }
  });
});

describe("DEMO_RECAP_MOMENTS 시드", () => {
  it("4건 존재", () => {
    expect(DEMO_RECAP_MOMENTS).toHaveLength(4);
  });

  it("모든 항목에 필수 필드 존재", () => {
    for (const m of DEMO_RECAP_MOMENTS) {
      expect(m.id).toBeTruthy();
      expect(m.dayLabel).toBeTruthy();
      expect(m.alt).toBeTruthy();
    }
  });

  it("ID 유일", () => {
    const ids = DEMO_RECAP_MOMENTS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("dayLabel에 Day 번호 포함", () => {
    for (const m of DEMO_RECAP_MOMENTS) {
      expect(m.dayLabel).toMatch(/Day \d+/);
    }
  });
});
