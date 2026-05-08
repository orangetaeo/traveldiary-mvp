/**
 * BottomNav itineraryTripId prop 회귀 가드 (2026-05-08).
 *
 * 갭: BottomNav "일정" 슬롯이 항상 DEMO_TRIP_ID — trip-scoped 페이지에서도
 * 데모 trip 일정으로 가던 문제. 본인 trip 컨텍스트가 있으면 그 trip 일정으로 가야.
 *
 * 검증:
 *   1. BottomNav — itineraryTripId 옵션 prop + default DEMO_TRIP_ID (BC)
 *   2. buildSlots(itineraryTripId) — 동적 href 생성
 *   3. /checklist/[tripId] + /cost/[tripId] — itineraryTripId={trip.id} 전달
 *   4. 다른 BottomNav 호출처 BC (prop 미지정 시 DEMO_TRIP_ID fallback)
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const NAV = readFileSync(
  resolve(process.cwd(), "components/ui/BottomNav.tsx"),
  "utf-8",
);
const CHECKLIST = readFileSync(
  resolve(process.cwd(), "app/checklist/[tripId]/page.tsx"),
  "utf-8",
);
const COST = readFileSync(
  resolve(process.cwd(), "app/cost/[tripId]/page.tsx"),
  "utf-8",
);

describe("BottomNav — itineraryTripId prop", () => {
  it("BottomNavProps에 itineraryTripId?: string 추가", () => {
    expect(NAV).toMatch(/itineraryTripId\??:\s*string/);
  });

  it("default DEMO_TRIP_ID — BC 보존", () => {
    expect(NAV).toMatch(/itineraryTripId\s*=\s*DEMO_TRIP_ID/);
  });

  it("buildSlots(itineraryTripId) — 동적 href 생성", () => {
    expect(NAV).toContain("buildSlots(itineraryTripId)");
    expect(NAV).toContain(
      "href: `/itinerary/${itineraryTripId}`",
    );
  });

  it("기존 시각·ARIA 보존 — 4 슬롯 + active 톤 + filled 아이콘", () => {
    expect(NAV).toContain('aria-label="주요 메뉴"');
    expect(NAV).toContain('aria-current={isActive ? "page" : undefined}');
    expect(NAV).toContain('text-purple');
    expect(NAV).toContain('material-symbols-outlined');
  });
});

describe("Consumer — trip-scoped 페이지에서 itineraryTripId 전달", () => {
  it("/checklist/[tripId] — itineraryTripId={trip.id} 전달", () => {
    expect(CHECKLIST).toContain(
      '<BottomNav active="itinerary" itineraryTripId={trip.id} />',
    );
  });

  it("/cost/[tripId] — itineraryTripId={trip.id} 전달", () => {
    expect(COST).toContain(
      '<BottomNav active="itinerary" itineraryTripId={trip.id} />',
    );
  });

  it("/itinerary/[id] — itineraryTripId={trip.id} 전달 (active 슬롯도 본인 trip 보존)", () => {
    const ITINERARY = readFileSync(
      resolve(process.cwd(), "app/itinerary/[id]/page.tsx"),
      "utf-8",
    );
    // active 슬롯이지만 href는 여전히 클릭 시 이동 — 본인 trip 보존 필요
    expect(ITINERARY).toContain(
      '<BottomNav active="itinerary" itineraryTripId={trip.id} />',
    );
  });

  it("/vote/[tripId] — itineraryTripId={trip.id} 전달 (cap 3)", () => {
    const VOTE = readFileSync(
      resolve(process.cwd(), "app/vote/[tripId]/page.tsx"),
      "utf-8",
    );
    expect(VOTE).toContain(
      '<BottomNav active="itinerary" itineraryTripId={trip.id} />',
    );
  });
});
