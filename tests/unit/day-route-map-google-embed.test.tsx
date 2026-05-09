/**
 * 회귀 가드 — DayRouteMapView Google Maps Embed Directions iframe 통합.
 *
 * NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY 분기 + 좌표 우선 + name fallback +
 * waypoints 9개 제한 + ADR-028 referrer 보안 답습.
 *
 * ItineraryMap 테스트 패턴 답습 (process.env 직접 set/delete).
 */

import { describe, it, expect, beforeEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DayRouteMapView } from "@/components/itinerary/DayRouteMapView";
import type { RouteStop } from "@/lib/types";

const STOPS_NO_COORDS: RouteStop[] = [
  {
    id: "s1",
    order: 1,
    name: "빈펄 리조트",
    time: "08:30",
    category: "숙소",
    categoryIcon: "hotel",
    nextTransit: "차량 15분",
    pinX: 25,
    pinY: 20,
  },
  {
    id: "s2",
    order: 2,
    name: "딘까우 사원",
    time: "09:00",
    category: "관광",
    categoryIcon: "temple_buddhist",
    pinX: 35,
    pinY: 30,
  },
];

const STOPS_WITH_COORDS: RouteStop[] = [
  {
    id: "s1",
    order: 1,
    name: "호텔",
    time: "14:00",
    category: "숙소",
    categoryIcon: "hotel",
    nextTransit: "차량 4분",
    pinX: 25,
    pinY: 20,
    lat: 10.225,
    lng: 103.96,
  },
  {
    id: "s2",
    order: 2,
    name: "야시장",
    time: "18:30",
    category: "맛집",
    categoryIcon: "restaurant",
    nextTransit: "도보 4분",
    pinX: 50,
    pinY: 50,
    lat: 10.215,
    lng: 103.95,
  },
  {
    id: "s3",
    order: 3,
    name: "절벽",
    time: "20:30",
    category: "관광",
    categoryIcon: "place",
    pinX: 75,
    pinY: 75,
    lat: 10.218,
    lng: 103.953,
  },
];

const ELEVEN_STOPS: RouteStop[] = Array.from({ length: 11 }, (_, i) => ({
  id: `stop-${i}`,
  order: i + 1,
  name: `장소 ${i + 1}`,
  time: "10:00",
  category: "관광",
  categoryIcon: "place",
  pinX: 10 + i * 5,
  pinY: 50,
  lat: 10 + i * 0.01,
  lng: 103 + i * 0.01,
}));

describe("DayRouteMapView — Google Maps Embed Directions", () => {
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;
  });

  describe("키 미설정 시 placeholder 폴백", () => {
    it("API key 미설정 → 안내 텍스트 표시 + iframe 미렌더", () => {
      const html = renderToStaticMarkup(
        <DayRouteMapView
          tripId="t1"
          dayIndex={0}
          stops={STOPS_WITH_COORDS}
          walkingKm={0.2}
          drivingKm={1.3}
        />,
      );
      expect(html).toContain("지도 키가 곧 연결될 예정입니다");
      expect(html).not.toContain("google.com/maps/embed/v1/directions");
    });

    it("키 미설정이어도 헤더·timeline·CTA는 보존 (BC)", () => {
      const html = renderToStaticMarkup(
        <DayRouteMapView
          tripId="t1"
          dayIndex={0}
          stops={STOPS_WITH_COORDS}
          walkingKm={0.2}
          drivingKm={1.3}
        />,
      );
      expect(html).toContain("Day 1 동선");
      expect(html).toContain("길찾기 시작");
      expect(html).toContain("호텔");
      expect(html).toContain("야시장");
      expect(html).toContain("절벽");
      expect(html).toContain("도보 0.2km");
      expect(html).toContain("차량 1.3km");
    });
  });

  describe("키 설정 시 iframe 렌더", () => {
    it("API key 설정 + stops>=2 → embed/v1/directions iframe", () => {
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY = "test-embed-key";
      const html = renderToStaticMarkup(
        <DayRouteMapView
          tripId="t1"
          dayIndex={0}
          stops={STOPS_WITH_COORDS}
          walkingKm={0.2}
          drivingKm={1.3}
        />,
      );
      expect(html).toContain("https://www.google.com/maps/embed/v1/directions");
      expect(html).toContain("key=test-embed-key");
      expect(html).toContain("origin=10.225%2C103.96");
      expect(html).toContain("destination=10.218%2C103.953");
    });

    it("mode=driving 기본값 포함", () => {
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY = "key";
      const html = renderToStaticMarkup(
        <DayRouteMapView
          tripId="t1"
          dayIndex={0}
          stops={STOPS_WITH_COORDS}
          walkingKm={0}
          drivingKm={0}
        />,
      );
      expect(html).toContain("mode=driving");
    });

    it("iframe title에 dayIndex 반영 (Day N 동선 지도)", () => {
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY = "key";
      const html = renderToStaticMarkup(
        <DayRouteMapView
          tripId="t1"
          dayIndex={2}
          stops={STOPS_WITH_COORDS}
          walkingKm={0}
          drivingKm={0}
        />,
      );
      expect(html).toContain('title="Day 3 동선 지도"');
    });

    it("referrerPolicy=no-referrer-when-downgrade (ADR-028 답습)", () => {
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY = "key";
      const html = renderToStaticMarkup(
        <DayRouteMapView
          tripId="t1"
          dayIndex={0}
          stops={STOPS_WITH_COORDS}
          walkingKm={0}
          drivingKm={0}
        />,
      );
      expect(html).toContain('referrerPolicy="no-referrer-when-downgrade"');
      expect(html).toContain('loading="lazy"');
    });
  });

  describe("좌표 우선, name fallback", () => {
    it("lat/lng 있으면 좌표 사용 (origin=lat,lng)", () => {
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY = "k";
      const html = renderToStaticMarkup(
        <DayRouteMapView
          tripId="t1"
          dayIndex={0}
          stops={STOPS_WITH_COORDS}
          walkingKm={0}
          drivingKm={0}
        />,
      );
      expect(html).toContain("origin=10.225%2C103.96");
    });

    it("lat/lng 없으면 name fallback", () => {
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY = "k";
      const html = renderToStaticMarkup(
        <DayRouteMapView
          tripId="t1"
          dayIndex={0}
          stops={STOPS_NO_COORDS}
          walkingKm={0}
          drivingKm={0}
        />,
      );
      // "빈펄 리조트" → URL 인코딩
      expect(html).toContain("origin=%EB%B9%88%ED%8E%84+%EB%A6%AC%EC%A1%B0%ED%8A%B8");
    });
  });

  describe("waypoints 처리", () => {
    it("stops > 2 → 중간 waypoints pipe-separated", () => {
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY = "k";
      const html = renderToStaticMarkup(
        <DayRouteMapView
          tripId="t1"
          dayIndex={0}
          stops={STOPS_WITH_COORDS}
          walkingKm={0}
          drivingKm={0}
        />,
      );
      // 중간 1개 (s2) — URL encoded "|"는 "%7C", lat,lng의 ","는 "%2C"
      expect(html).toContain("waypoints=10.215%2C103.95");
    });

    it("stops 11개 → waypoints 9개 제한 (Embed API 제한)", () => {
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY = "k";
      const html = renderToStaticMarkup(
        <DayRouteMapView
          tripId="t1"
          dayIndex={0}
          stops={ELEVEN_STOPS}
          walkingKm={0}
          drivingKm={0}
        />,
      );
      // waypoints param의 pipe(%7C) 개수 — 9개면 8개의 구분자
      const match = html.match(/waypoints=([^"&]+)/);
      expect(match).toBeTruthy();
      const pipeCount = (match![1].match(/%7C/g) ?? []).length;
      expect(pipeCount).toBe(8); // 9 stops → 8 separators
    });

    it("stops 2개 → waypoints param 없음", () => {
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY = "k";
      const html = renderToStaticMarkup(
        <DayRouteMapView
          tripId="t1"
          dayIndex={0}
          stops={STOPS_WITH_COORDS.slice(0, 2)}
          walkingKm={0}
          drivingKm={0}
        />,
      );
      // iframe URL에 waypoints param 없어야 함
      const match = html.match(/embed\/v1\/directions\?[^"]+/);
      expect(match).toBeTruthy();
      expect(match![0]).not.toContain("waypoints=");
    });
  });

  describe("폴백 — stops 부족", () => {
    it("stops < 2 + 키 있음 → '일정이 부족합니다' 안내", () => {
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY = "k";
      const html = renderToStaticMarkup(
        <DayRouteMapView
          tripId="t1"
          dayIndex={0}
          stops={STOPS_WITH_COORDS.slice(0, 1)}
          walkingKm={0}
          drivingKm={0}
        />,
      );
      expect(html).toContain("지도에 표시할 일정이 부족합니다");
      expect(html).not.toContain("embed/v1/directions");
    });
  });

  describe("기존 placeholder 잔존 코드 제거 확인", () => {
    it("SVG polyline 제거", () => {
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY = "k";
      const html = renderToStaticMarkup(
        <DayRouteMapView
          tripId="t1"
          dayIndex={0}
          stops={STOPS_WITH_COORDS}
          walkingKm={0}
          drivingKm={0}
        />,
      );
      expect(html).not.toContain("<polyline");
      expect(html).not.toContain("strokeDasharray");
    });

    it("절대 좌표 핀 제거 (style left:%, top:%)", () => {
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY = "k";
      const html = renderToStaticMarkup(
        <DayRouteMapView
          tripId="t1"
          dayIndex={0}
          stops={STOPS_WITH_COORDS}
          walkingKm={0}
          drivingKm={0}
        />,
      );
      // pinX/pinY 기반 절대 좌표 style 사라졌는지
      expect(html).not.toContain('style="left:25%;top:20%"');
      expect(html).not.toContain('style="left:50%;top:50%"');
    });

    it("기존 dotted SVG 배경 패턴 제거", () => {
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY = "k";
      const html = renderToStaticMarkup(
        <DayRouteMapView
          tripId="t1"
          dayIndex={0}
          stops={STOPS_WITH_COORDS}
          walkingKm={0}
          drivingKm={0}
        />,
      );
      // 기존 inline SVG data URL 패턴 제거
      expect(html).not.toContain("data:image/svg+xml,%3Csvg width='60'");
    });
  });
});
