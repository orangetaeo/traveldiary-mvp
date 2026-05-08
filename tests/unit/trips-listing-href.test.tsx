/**
 * /trips listing TripCard href 회귀 테스트.
 *
 * 사이클 (Session F+2): TripCard 클릭 시 /itinerary/[id] → /trips/[id] (Trip Dashboard).
 * Trip Dashboard(PR #159, /trips/[tripId])로 가는 자연스러운 진입 경로 확보.
 *
 * 검증:
 *   - TripCard href 패턴 /trips/demo-trip-... 매칭 (옛 /itinerary/ 부재)
 *   - aria-label "여행 대시보드" 카피
 *   - footer 텍스트 "대시보드 보기 →"
 *   - CityOnlyCard /city/[slug] 그대로 (영향 범위 회귀)
 */

import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import TripsPage from "@/app/trips/page";

describe("Session F+2 — /trips listing TripCard href rewire", () => {
  it("TripCard href는 /trips/[id] 패턴 (6 데모 trip 모두)", async () => {
    const html = renderToStaticMarkup(await TripsPage({ searchParams: {} }));
    // 데모 trip 6개 모두 /trips/demo-trip-... 로 라우팅
    expect(html).toMatch(/href="\/trips\/demo-trip-phu-quoc"/);
    expect(html).toMatch(/href="\/trips\/demo-trip-da-nang"/);
    expect(html).toMatch(/href="\/trips\/demo-trip-ho-chi-minh"/);
    expect(html).toMatch(/href="\/trips\/demo-trip-hanoi"/);
    expect(html).toMatch(/href="\/trips\/demo-trip-nha-trang"/);
    expect(html).toMatch(/href="\/trips\/demo-trip-da-lat"/);
    // BottomNav 단독 deep-link(/itinerary/demo-trip-phu-quoc)는 그대로
    // (TripCard 한정 옛 카피 부재 회귀는 footer/aria 케이스에서 검증)
  });

  it("TripCard aria-label '여행 대시보드' 카피", async () => {
    const html = renderToStaticMarkup(await TripsPage({ searchParams: {} }));
    expect(html).toContain("여행 대시보드");
    // 옛 "일정 보기" aria 카피 부재 (TripCard 한정)
    expect(html).not.toMatch(/aria-label="[^"]*박[^"]*일 일정 보기"/);
  });

  it("TripCard footer 카피 '대시보드 보기 →'", async () => {
    const html = renderToStaticMarkup(await TripsPage({ searchParams: {} }));
    expect(html).toContain("대시보드 보기 →");
    // 옛 "도시 가이드 →" footer 카피 부재 (TripCard 한정 — CityOnlyCard는 별 카피)
    expect(html).not.toContain(">도시 가이드 →<");
  });

  it("CityOnlyCard /city/[slug] 라우팅 보존 (영향 범위 회귀)", async () => {
    const html = renderToStaticMarkup(await TripsPage({ searchParams: {} }));
    // 호이안(HOI)은 trip 없이 city only → /city/hoi-an 그대로
    expect(html).toMatch(/href="\/city\/hoi-an"/);
  });
});
