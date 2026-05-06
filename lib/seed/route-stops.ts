/**
 * Day Route Map 데모 시드 — 푸꾸옥 Day 2 기준.
 * DB 미구현 단계에서 UI 데모용.
 */

import type { RouteStop } from "@/components/itinerary/DayRouteMapView";

export const DEMO_ROUTE_STOPS: RouteStop[] = [
  {
    id: "route-hotel",
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
    id: "route-dinh-cau",
    order: 2,
    name: "딘까우 사원",
    time: "09:00",
    category: "관광",
    categoryIcon: "temple_buddhist",
    nextTransit: "도보 10분",
    pinX: 35,
    pinY: 30,
  },
  {
    id: "route-night-market",
    order: 3,
    name: "딘까우 야시장",
    time: "09:30",
    category: "맛집",
    categoryIcon: "restaurant",
    nextTransit: "차량 20분",
    pinX: 40,
    pinY: 38,
  },
  {
    id: "route-sao-beach",
    order: 4,
    name: "사오비치",
    time: "10:30",
    category: "자연",
    categoryIcon: "beach_access",
    isActive: true,
    nextTransit: "차량 25분",
    pinX: 55,
    pinY: 50,
  },
  {
    id: "route-hon-thom",
    order: 5,
    name: "혼톰 케이블카",
    time: "13:00",
    category: "관광",
    categoryIcon: "gondola_lift",
    nextTransit: "차량 30분",
    pinX: 65,
    pinY: 62,
  },
  {
    id: "route-grand-world",
    order: 6,
    name: "그랜드월드",
    time: "16:00",
    category: "쇼핑",
    categoryIcon: "shopping_bag",
    pinX: 75,
    pinY: 75,
  },
];
