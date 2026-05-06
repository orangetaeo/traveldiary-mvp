/**
 * 신규 View 컴포넌트 렌더 테스트 (PR #155, #157, #160, #162).
 *
 * renderToStaticMarkup 정적 마크업 검증 (testing-library 미도입 정책).
 * "use client" 컴포넌트의 초기 렌더 출력 확인.
 */

import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { NotificationListView } from "@/components/notifications/NotificationListView";
import { PlaceDiscoveryView } from "@/components/itinerary/PlaceDiscoveryView";
import { DayRouteMapView } from "@/components/itinerary/DayRouteMapView";
import { PostTripRecapView } from "@/components/recap/PostTripRecapView";
import { DEMO_NOTIFICATIONS } from "@/lib/seed/notifications";
import { DEMO_DISCOVER_PLACES } from "@/lib/seed/discover-places";
import { DEMO_ROUTE_STOPS } from "@/lib/seed/route-stops";
import {
  DEMO_RECAP_STATS,
  DEMO_RECAP_HIGHLIGHTS,
  DEMO_RECAP_MOMENTS,
} from "@/lib/seed/recap-data";

// next/link → a 태그로 치환
vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) =>
    <a href={href}>{children}</a>,
}));

// useToast mock (PlaceDiscoveryView에서 사용)
vi.mock("@/lib/hooks/useToast", () => ({
  useToast: () => ({ visible: false, message: "", show: vi.fn() }),
}));

describe("NotificationListView", () => {
  it("렌더 성공 + 알림 제목 포함", () => {
    const html = renderToStaticMarkup(
      <NotificationListView notifications={DEMO_NOTIFICATIONS} />,
    );
    expect(html).toContain("알림");
    // 첫 알림 제목 포함
    expect(html).toContain(DEMO_NOTIFICATIONS[0].title);
  });

  it("빈 알림 → 빈 상태 메시지", () => {
    const html = renderToStaticMarkup(
      <NotificationListView notifications={[]} />,
    );
    expect(html).toContain("알림");
    // 빈 상태에서는 알림 카드 없음
    expect(html).not.toContain(DEMO_NOTIFICATIONS[0].title);
  });

  it("필터 탭 4개 렌더", () => {
    const html = renderToStaticMarkup(
      <NotificationListView notifications={DEMO_NOTIFICATIONS} />,
    );
    expect(html).toContain("전체");
    expect(html).toContain("여행");
    expect(html).toContain("동행");
    expect(html).toContain("시스템");
  });
});

describe("PlaceDiscoveryView", () => {
  it("렌더 성공 + 장소명 포함", () => {
    const html = renderToStaticMarkup(
      <PlaceDiscoveryView
        tripId="demo-trip-phu-quoc"
        dayIndex={1}
        destination="푸꾸옥"
        places={DEMO_DISCOVER_PLACES}
        verifiedCount={5}
      />,
    );
    expect(html).toContain(DEMO_DISCOVER_PLACES[0].name);
  });

  it("카테고리 필터 렌더", () => {
    const html = renderToStaticMarkup(
      <PlaceDiscoveryView
        tripId="demo-trip-phu-quoc"
        dayIndex={1}
        destination="푸꾸옥"
        places={DEMO_DISCOVER_PLACES}
        verifiedCount={5}
      />,
    );
    expect(html).toContain("전체");
    expect(html).toContain("맛집");
    expect(html).toContain("관광");
  });

  it("badge ai/popular 렌더", () => {
    const html = renderToStaticMarkup(
      <PlaceDiscoveryView
        tripId="demo-trip-phu-quoc"
        dayIndex={1}
        destination="푸꾸옥"
        places={DEMO_DISCOVER_PLACES}
        verifiedCount={5}
      />,
    );
    expect(html).toContain("AI");
    expect(html).toContain("인기");
  });
});

describe("DayRouteMapView", () => {
  it("렌더 성공 + 정류장명 포함", () => {
    const html = renderToStaticMarkup(
      <DayRouteMapView
        tripId="demo-trip-phu-quoc"
        dayIndex={1}
        stops={DEMO_ROUTE_STOPS}
        walkingKm={2.3}
        drivingKm={15.7}
      />,
    );
    expect(html).toContain(DEMO_ROUTE_STOPS[0].name);
    expect(html).toContain(DEMO_ROUTE_STOPS[5].name);
  });

  it("이동 거리 렌더", () => {
    const html = renderToStaticMarkup(
      <DayRouteMapView
        tripId="demo-trip-phu-quoc"
        dayIndex={1}
        stops={DEMO_ROUTE_STOPS}
        walkingKm={2.3}
        drivingKm={15.7}
      />,
    );
    expect(html).toContain("2.3");
    expect(html).toContain("15.7");
  });

  it("정류장 order 번호 렌더", () => {
    const html = renderToStaticMarkup(
      <DayRouteMapView
        tripId="demo-trip-phu-quoc"
        dayIndex={1}
        stops={DEMO_ROUTE_STOPS}
        walkingKm={2.3}
        drivingKm={15.7}
      />,
    );
    // order 1~6 번호가 핀에 렌더
    for (let i = 1; i <= 6; i++) {
      expect(html).toContain(`>${i}<`);
    }
  });
});

describe("PostTripRecapView", () => {
  it("렌더 성공 + 여행 제목 포함", () => {
    const html = renderToStaticMarkup(
      <PostTripRecapView
        tripId="demo-trip-phu-quoc"
        tripTitle="푸꾸옥 여행"
        dateRange="5월 10일 - 5월 13일"
        stats={DEMO_RECAP_STATS}
        highlights={DEMO_RECAP_HIGHLIGHTS}
        moments={DEMO_RECAP_MOMENTS}
      />,
    );
    expect(html).toContain("푸꾸옥 여행");
    expect(html).toContain("5월 10일 - 5월 13일");
  });

  it("통계 카드 렌더 (방문/이동/지출)", () => {
    const html = renderToStaticMarkup(
      <PostTripRecapView
        tripId="demo-trip-phu-quoc"
        tripTitle="푸꾸옥 여행"
        dateRange="5월 10일 - 5월 13일"
        stats={DEMO_RECAP_STATS}
        highlights={DEMO_RECAP_HIGHLIGHTS}
        moments={DEMO_RECAP_MOMENTS}
      />,
    );
    expect(html).toContain(`${DEMO_RECAP_STATS.placesVisited}곳 방문`);
    expect(html).toContain(`${DEMO_RECAP_STATS.totalDistanceKm}km`);
    expect(html).toContain(DEMO_RECAP_STATS.longestStay);
  });

  it("하이라이트 렌더", () => {
    const html = renderToStaticMarkup(
      <PostTripRecapView
        tripId="demo-trip-phu-quoc"
        tripTitle="푸꾸옥 여행"
        dateRange="5월 10일 - 5월 13일"
        stats={DEMO_RECAP_STATS}
        highlights={DEMO_RECAP_HIGHLIGHTS}
        moments={DEMO_RECAP_MOMENTS}
      />,
    );
    for (const h of DEMO_RECAP_HIGHLIGHTS) {
      expect(html).toContain(h.name);
      expect(html).toContain(h.label);
    }
  });

  it("모먼트 dayLabel 렌더", () => {
    const html = renderToStaticMarkup(
      <PostTripRecapView
        tripId="demo-trip-phu-quoc"
        tripTitle="푸꾸옥 여행"
        dateRange="5월 10일 - 5월 13일"
        stats={DEMO_RECAP_STATS}
        highlights={DEMO_RECAP_HIGHLIGHTS}
        moments={DEMO_RECAP_MOMENTS}
      />,
    );
    for (const m of DEMO_RECAP_MOMENTS) {
      expect(html).toContain(m.dayLabel);
    }
  });

  it("공유 버튼 렌더", () => {
    const html = renderToStaticMarkup(
      <PostTripRecapView
        tripId="demo-trip-phu-quoc"
        tripTitle="푸꾸옥 여행"
        dateRange="5월 10일 - 5월 13일"
        stats={DEMO_RECAP_STATS}
        highlights={DEMO_RECAP_HIGHLIGHTS}
        moments={DEMO_RECAP_MOMENTS}
      />,
    );
    expect(html).toContain("카카오톡으로 공유");
  });
});
