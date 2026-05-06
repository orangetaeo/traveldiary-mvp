/**
 * 알림 + 장소 탐색 시드 무결성 테스트.
 */

import { describe, it, expect } from "vitest";
import { DEMO_NOTIFICATIONS } from "@/lib/seed/notifications";
import { DEMO_DISCOVER_PLACES } from "@/lib/seed/discover-places";

describe("DEMO_NOTIFICATIONS 시드", () => {
  it("6건 존재", () => {
    expect(DEMO_NOTIFICATIONS).toHaveLength(6);
  });

  it("모든 항목에 필수 필드 존재", () => {
    for (const n of DEMO_NOTIFICATIONS) {
      expect(n.id).toBeTruthy();
      expect(n.title).toBeTruthy();
      expect(n.body).toBeTruthy();
      expect(n.category).toBeTruthy();
      expect(n.icon).toBeTruthy();
      expect(n.createdAt).toBeTruthy();
    }
  });

  it("ID 유일", () => {
    const ids = DEMO_NOTIFICATIONS.map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("카테고리 분포 — travel/companion/system", () => {
    const cats = new Set(DEMO_NOTIFICATIONS.map((n) => n.category));
    expect(cats).toContain("travel");
    expect(cats).toContain("companion");
    expect(cats).toContain("system");
  });

  it("읽음/안읽음 분포", () => {
    const unread = DEMO_NOTIFICATIONS.filter((n) => !n.read);
    const read = DEMO_NOTIFICATIONS.filter((n) => n.read);
    expect(unread.length).toBeGreaterThanOrEqual(1);
    expect(read.length).toBeGreaterThanOrEqual(1);
  });

  it("createdAt ISO 유효", () => {
    for (const n of DEMO_NOTIFICATIONS) {
      const d = new Date(n.createdAt);
      expect(isNaN(d.getTime())).toBe(false);
    }
  });
});

describe("DEMO_DISCOVER_PLACES 시드", () => {
  it("7개 도시 36건 이상 존재", () => {
    expect(DEMO_DISCOVER_PLACES.length).toBeGreaterThanOrEqual(36);
    const destinations = new Set(DEMO_DISCOVER_PLACES.map((p) => p.destination));
    expect(destinations.size).toBeGreaterThanOrEqual(7);
  });

  it("모든 항목에 필수 필드 존재", () => {
    for (const p of DEMO_DISCOVER_PLACES) {
      expect(p.id).toBeTruthy();
      expect(p.name).toBeTruthy();
      expect(p.category).toBeTruthy();
      expect(p.rating).toBeGreaterThan(0);
      expect(p.reviewCount).toBeGreaterThan(0);
      expect(p.distance).toBeTruthy();
    }
  });

  it("ID 유일", () => {
    const ids = DEMO_DISCOVER_PLACES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("카테고리 다양성 (3종 이상)", () => {
    const cats = new Set(DEMO_DISCOVER_PLACES.map((p) => p.category));
    expect(cats.size).toBeGreaterThanOrEqual(3);
  });

  it("badge는 ai 또는 popular (정의된 경우)", () => {
    const validBadges = ["ai", "popular"];
    for (const p of DEMO_DISCOVER_PLACES) {
      if (p.badge) {
        expect(validBadges).toContain(p.badge);
      }
    }
  });

  it("rating 범위 1~5", () => {
    for (const p of DEMO_DISCOVER_PLACES) {
      expect(p.rating).toBeGreaterThanOrEqual(1);
      expect(p.rating).toBeLessThanOrEqual(5);
    }
  });
});
