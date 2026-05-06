/**
 * Post-Trip Recap 데모 시드 — 푸꾸옥 기준.
 * DB 미구현 단계에서 UI 데모용.
 */

import type { RecapStats, RecapHighlight, RecapMoment } from "@/lib/types";

export const DEMO_RECAP_STATS: RecapStats = {
  placesVisited: 12,
  longestStay: "빈펄 사파리 (3시간)",
  totalDistanceKm: 47,
  totalSteps: 32000,
  totalSpentKRW: 1180000,
  biggestCategory: "숙소 (42%)",
};

export const DEMO_RECAP_HIGHLIGHTS: RecapHighlight[] = [
  {
    id: "hl-food",
    label: "베스트 맛집",
    emoji: "🏆",
    name: "딘까우 야시장",
    icon: "restaurant",
    color: "purple",
  },
  {
    id: "hl-view",
    label: "베스트 뷰",
    emoji: "📸",
    name: "즈엉동 비치 석양",
    icon: "photo_camera",
    color: "coral",
  },
  {
    id: "hl-value",
    label: "가성비 왕",
    emoji: "💰",
    name: "킹콩마트 장보기",
    icon: "savings",
    color: "amber",
  },
];

export const DEMO_RECAP_MOMENTS: RecapMoment[] = [
  {
    id: "moment-safari",
    dayLabel: "Day 1 · 빈펄 사파리",
    alt: "빈펄 사파리",
  },
  {
    id: "moment-pool",
    dayLabel: "Day 2 · 숙소 수영장",
    alt: "숙소 수영장",
  },
  {
    id: "moment-market",
    dayLabel: "Day 3 · 야시장",
    alt: "야시장",
  },
  {
    id: "moment-sunset",
    dayLabel: "Day 4 · 즈엉동 비치",
    alt: "즈엉동 비치 석양",
  },
];
