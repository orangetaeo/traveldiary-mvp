/**
 * DayRouteMiniMap 단위 테스트 (디자인 갭 #1 U3, 사이클 X).
 *
 * 검증:
 *  - items=[] → null 반환 (DOM에 노출 안 함)
 *  - items≥1 → 핀 N개 + DAY {N} 동선 · {N}곳 메타 + 풀스크린 링크
 *  - items=1 → polyline(라우트 라인) 미렌더
 *  - items≥2 → polyline 렌더
 *  - 좌표 모두 동일(0/0 폴백) → 균등 분포 핀 위치 (붕괴 가드)
 *  - 풀스크린 확대 링크는 /itinerary/[id]/map?day=N
 */

import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DayRouteMiniMap } from "@/components/itinerary/DayRouteMiniMap";
import type { ItineraryItem } from "@/lib/types";

function makeItem(id: string, lat: number, lng: number): ItineraryItem {
  return {
    id,
    tripId: "trip-test",
    dayIndex: 0,
    scheduledAt: "2026-05-07T09:00:00.000Z",
    durationMinutes: 60,
    flexibility: "flexible",
    priority: 3,
    flexMinutes: 30,
    name: `테스트 ${id}`,
    category: "spot",
    location: { lat, lng, address: "addr" },
    evidence: { reasons: [], sources: [], verifiedAt: "2026-05-07T00:00:00.000Z" },
    dependencies: [],
  };
}

describe("DayRouteMiniMap", () => {
  it("items=[] → null 반환 (빈 문자열 렌더)", () => {
    const html = renderToStaticMarkup(
      <DayRouteMiniMap tripId="t1" dayIndex={0} items={[]} />,
    );
    expect(html).toBe("");
  });

  it("items=1 → 핀 1개 + polyline 미렌더 + 메타 표시", () => {
    const html = renderToStaticMarkup(
      <DayRouteMiniMap
        tripId="trip-1"
        dayIndex={0}
        items={[makeItem("a", 10.2, 103.9)]}
      />,
    );
    expect(html).toContain("DAY 1 동선 · 1곳");
    expect(html).toContain("aria-label=\"1번 테스트 a\"");
    // 1핀이면 polyline 없음
    expect(html).not.toContain("<polyline");
  });

  it("items=3 → 핀 3개 + polyline 1개", () => {
    const html = renderToStaticMarkup(
      <DayRouteMiniMap
        tripId="trip-1"
        dayIndex={1}
        items={[
          makeItem("a", 10.2, 103.9),
          makeItem("b", 10.3, 104.0),
          makeItem("c", 10.4, 104.1),
        ]}
      />,
    );
    expect(html).toContain("DAY 2 동선 · 3곳");
    expect(html).toContain("aria-label=\"1번 테스트 a\"");
    expect(html).toContain("aria-label=\"2번 테스트 b\"");
    expect(html).toContain("aria-label=\"3번 테스트 c\"");
    expect(html).toContain("<polyline");
  });

  it("좌표 모두 0/0(붕괴) → 균등 분포 폴백 (핀 N개 모두 렌더)", () => {
    const html = renderToStaticMarkup(
      <DayRouteMiniMap
        tripId="trip-1"
        dayIndex={0}
        items={[
          makeItem("a", 0, 0),
          makeItem("b", 0, 0),
          makeItem("c", 0, 0),
        ]}
      />,
    );
    // 핀 3개가 모두 노출 (붕괴 가드 동작)
    expect(html).toContain("aria-label=\"1번 테스트 a\"");
    expect(html).toContain("aria-label=\"2번 테스트 b\"");
    expect(html).toContain("aria-label=\"3번 테스트 c\"");
  });

  it("풀스크린 확대 링크는 /itinerary/[id]/map?day=N", () => {
    const html = renderToStaticMarkup(
      <DayRouteMiniMap
        tripId="trip-xyz"
        dayIndex={2}
        items={[
          makeItem("a", 10.2, 103.9),
          makeItem("b", 10.3, 104.0),
        ]}
      />,
    );
    expect(html).toContain('href="/itinerary/trip-xyz/map?day=2"');
    expect(html).toContain('aria-label="동선 지도 풀스크린 보기"');
    expect(html).toContain("확대 보기");
  });

  it("section aria-label에 dayIndex+1이 노출", () => {
    const html = renderToStaticMarkup(
      <DayRouteMiniMap
        tripId="t1"
        dayIndex={3}
        items={[makeItem("a", 10.2, 103.9)]}
      />,
    );
    expect(html).toContain('aria-label="Day 4 미니 동선 지도"');
  });
});
