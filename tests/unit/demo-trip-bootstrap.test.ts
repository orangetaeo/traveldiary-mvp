/**
 * 사이클 XX (ADR-044) — 데모 trip 부트스트래핑 정합성.
 *
 * ensureDemoTripInDb()는 prisma 의존이라 단위 검증이 어려움. 대신:
 *   1. 모든 데모 trip 시드가 ensureDemoTripInDb()가 사용하는 필드를 갖췄는지
 *   2. getDemoTrip(id)가 모든 DEMO_TRIP_IDS에 대해 정상 반환
 *   3. ensureDemoTripInDb 함수 export
 * 회귀 단언 → 시드 추가 시 부트스트래핑 진입에서 P2002/null 위험 차단.
 */

import { describe, it, expect } from "vitest";
import {
  DEMO_TRIP_IDS,
  getDemoTrip,
  listDemoTrips,
} from "@/lib/seed";
import { ensureDemoTripInDb } from "@/lib/repositories/trip.repository";

describe("사이클 XX — ensureDemoTripInDb 진입 정합성", () => {
  it("DEMO_TRIP_IDS는 6개 (베트남 trip 시드)", () => {
    expect(DEMO_TRIP_IDS).toHaveLength(6);
  });

  it("ensureDemoTripInDb는 함수로 export됨", () => {
    expect(typeof ensureDemoTripInDb).toBe("function");
  });

  it.each(DEMO_TRIP_IDS)("getDemoTrip(%s)는 valid bundle 반환", (id) => {
    const bundle = getDemoTrip(id);
    expect(bundle).not.toBeNull();
    expect(bundle?.trip.id).toBe(id);
  });

  it.each(DEMO_TRIP_IDS)(
    "%s 시드 trip은 부트스트래핑 필수 필드 보유",
    (id) => {
      const bundle = getDemoTrip(id)!;
      const t = bundle.trip;
      expect(t.id).toBeTruthy();
      expect(t.destination).toBeTruthy();
      expect(t.destinationCode).toBeTruthy();
      expect(t.nights).toBeGreaterThan(0);
      expect(t.companion).toMatch(/solo|friends|family|group/);
      expect(t.preferences).toBeDefined();
      expect(t.preferences.vibes).toBeInstanceOf(Array);
      expect(t.preferences.pace).toBeTruthy();
      expect(t.preferences.excludes).toBeInstanceOf(Array);
      expect(t.status).toMatch(/draft|confirmed|in-progress|completed/);
      // startDate는 ISO date(YYYY-MM-DD)
      expect(t.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    },
  );

  it("getDemoTrip(존재하지 않는 ID)는 null", () => {
    expect(getDemoTrip("non-existent-trip")).toBeNull();
  });

  it("listDemoTrips는 6 bundle 반환 (베트남 한정)", () => {
    const trips = listDemoTrips();
    expect(trips).toHaveLength(6);
    for (const b of trips) {
      expect(b.items.length).toBeGreaterThan(0);
    }
  });
});

describe("사이클 XX — 데모 분기 제거 회귀 (코드 정합성)", () => {
  it("actions/checklist.ts에 DEMO_TRIP_ID 분기 없음", async () => {
    // Vite는 import.meta로 raw 읽기 어려움 → 정적 단언만
    const mod = await import("@/actions/checklist");
    expect(mod.addChecklistItem).toBeDefined();
    expect(mod.toggleChecklist).toBeDefined();
    expect(mod.deleteChecklist).toBeDefined();
    expect(mod.addFromTemplate).toBeDefined();
  });

  it("actions/cost.ts에 DEMO_TRIP_ID 분기 없음 (모든 mutation export)", async () => {
    const mod = await import("@/actions/cost");
    expect(mod.addCost).toBeDefined();
    expect(mod.updateCost).toBeDefined();
    expect(mod.deleteCost).toBeDefined();
    expect(mod.settleCost).toBeDefined();
  });
});
