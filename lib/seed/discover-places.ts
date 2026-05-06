/**
 * 장소 탐색 데모 시드 — 푸꾸옥 기준.
 * DB 미구현 단계에서 UI 데모용.
 */

import type { DiscoverPlace } from "@/components/itinerary/PlaceDiscoveryView";

export const DEMO_DISCOVER_PLACES: DiscoverPlace[] = [
  {
    id: "discover-dinh-cau",
    name: "딘까우 야시장",
    category: "food",
    rating: 4.6,
    reviewCount: 273,
    distance: "도보 15분",
    badge: "ai",
  },
  {
    id: "discover-duong-dong",
    name: "즈엉동 비치",
    category: "spot",
    rating: 4.8,
    reviewCount: 512,
    distance: "차량 10분",
    badge: "popular",
  },
  {
    id: "discover-vinpearl",
    name: "빈펄 사파리",
    category: "nature",
    rating: 4.5,
    reviewCount: 189,
    distance: "차량 25분",
  },
  {
    id: "discover-coconut-prison",
    name: "코코넛 프리즌",
    category: "spot",
    rating: 4.3,
    reviewCount: 98,
    distance: "차량 20분",
  },
  {
    id: "discover-sao-beach",
    name: "사오비치",
    category: "nature",
    rating: 4.7,
    reviewCount: 341,
    distance: "차량 30분",
    badge: "popular",
  },
  {
    id: "discover-hon-thom",
    name: "혼톰 케이블카",
    category: "spot",
    rating: 4.6,
    reviewCount: 267,
    distance: "차량 35분",
    badge: "ai",
  },
  {
    id: "discover-grand-world",
    name: "그랜드월드",
    category: "shopping",
    rating: 4.2,
    reviewCount: 156,
    distance: "차량 15분",
  },
  {
    id: "discover-coconut-cafe",
    name: "코코넛 카페",
    category: "cafe",
    rating: 4.4,
    reviewCount: 87,
    distance: "도보 10분",
  },
  {
    id: "discover-the-cavern",
    name: "더 캐비",
    category: "food",
    rating: 4.5,
    reviewCount: 142,
    distance: "차량 10분",
    badge: "ai",
  },
  {
    id: "discover-ho-quoc",
    name: "호국사",
    category: "spot",
    rating: 4.4,
    reviewCount: 203,
    distance: "차량 40분",
  },
];
