/**
 * 옵션 L (디자인 갭 D, Session AA) — cross-link 회귀.
 *
 * 검증:
 *   1. /trips/[tripId] page → BentoSummary tripId prop 주입 (4 카드 클릭 가능)
 *   2. /itinerary/[id] page → trip dashboard 진입 칩 존재
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const TRIP_DASHBOARD_SRC = readFileSync(
  resolve(process.cwd(), "app/trips/[tripId]/page.tsx"),
  "utf-8",
);

const ITINERARY_PAGE_SRC = readFileSync(
  resolve(process.cwd(), "app/itinerary/[id]/page.tsx"),
  "utf-8",
);

describe("옵션 L — /trips/[tripId] BentoSummary tripId 주입", () => {
  it("BentoSummary에 tripId prop 전달 (4 카드 cross-link 활성)", () => {
    expect(TRIP_DASHBOARD_SRC).toContain("tripId={trip.id}");
    expect(TRIP_DASHBOARD_SRC).toMatch(/<BentoSummary[\s\S]*?tripId=\{trip\.id\}/);
  });
});

describe("옵션 L — /itinerary/[id] 헤더 trip dashboard 진입 칩", () => {
  it("/trips/${trip.id} Link 존재", () => {
    expect(ITINERARY_PAGE_SRC).toContain("/trips/${trip.id}");
  });

  it('aria-label "여행 대시보드로 이동"', () => {
    expect(ITINERARY_PAGE_SRC).toContain('aria-label="여행 대시보드로 이동"');
  });

  it("dashboard 아이콘 + 대시보드 카피", () => {
    expect(ITINERARY_PAGE_SRC).toMatch(/material-symbols-outlined[\s\S]*?>\s*dashboard\s*</);
    expect(ITINERARY_PAGE_SRC).toContain("대시보드 →");
  });

  it("기존 city 칩(도시 가이드)도 유지 (BC)", () => {
    expect(ITINERARY_PAGE_SRC).toContain("도시 가이드 →");
    expect(ITINERARY_PAGE_SRC).toContain("travel_explore");
  });
});
