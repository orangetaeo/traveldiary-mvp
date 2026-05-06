/**
 * 시드 파이프라인 설정 — 도시별 구역(Zone) + API 설정.
 *
 * 사용법: GOOGLE_PLACES_API_KEY 환경변수 필수.
 *   npx tsx scripts/seed-pipeline/01-google-nearby.ts
 */

import type { SearchZone } from "./types";

// ═══════════════════════════════════════════════════════════════════
// 푸꾸옥 6개 구역 (전체 섬 커버)
// ═══════════════════════════════════════════════════════════════════

export const PHU_QUOC_ZONES: SearchZone[] = [
  {
    id: "pq-duong-dong",
    name: "즈엉동 해변 (중심가/관광 핵심)",
    lat: 10.225,
    lng: 103.960,
    radiusMeters: 3000,
  },
  {
    id: "pq-ong-lang",
    name: "옹랑 비치 (리조트/카페)",
    lat: 10.280,
    lng: 103.930,
    radiusMeters: 3000,
  },
  {
    id: "pq-an-thoi",
    name: "안터이 (남부/케이블카/VinWonders)",
    lat: 10.040,
    lng: 104.030,
    radiusMeters: 4000,
  },
  {
    id: "pq-cua-can",
    name: "꺼이쩐 (야시장/시내)",
    lat: 10.210,
    lng: 103.970,
    radiusMeters: 2000,
  },
  {
    id: "pq-bai-dai",
    name: "바이다이/빈펄 (테마파크/리조트)",
    lat: 10.075,
    lng: 104.010,
    radiusMeters: 4000,
  },
  {
    id: "pq-ham-ninh",
    name: "함닌/북부 (자연/스노클링/어촌)",
    lat: 10.340,
    lng: 103.950,
    radiusMeters: 5000,
  },
];

// ═══════════════════════════════════════════════════════════════════
// 다낭 6개 구역
// ═══════════════════════════════════════════════════════════════════

export const DA_NANG_ZONES: SearchZone[] = [
  {
    id: "dn-my-khe",
    name: "미케 비치 (한국인 밀집)",
    lat: 16.047,
    lng: 108.245,
    radiusMeters: 2500,
  },
  {
    id: "dn-han-river",
    name: "한강/시내 (야경/쇼핑)",
    lat: 16.060,
    lng: 108.220,
    radiusMeters: 2000,
  },
  {
    id: "dn-son-tra",
    name: "선짜반도 (자연/관음상)",
    lat: 16.100,
    lng: 108.280,
    radiusMeters: 4000,
  },
  {
    id: "dn-ba-na",
    name: "바나힐 (골든브릿지/테마파크)",
    lat: 15.995,
    lng: 107.995,
    radiusMeters: 3000,
  },
  {
    id: "dn-hoi-an",
    name: "호이안 구시가지 (유네스코)",
    lat: 15.880,
    lng: 108.335,
    radiusMeters: 2500,
  },
  {
    id: "dn-ngu-hanh-son",
    name: "오행산/논누억 (대리석 마을)",
    lat: 16.003,
    lng: 108.263,
    radiusMeters: 2000,
  },
];

// ═══════════════════════════════════════════════════════════════════
// 도시 설정 매핑
// ═══════════════════════════════════════════════════════════════════

export const CITY_CONFIGS = {
  "phu-quoc": {
    code: "PQC",
    name: "푸꾸옥",
    zones: PHU_QUOC_ZONES,
    targetCount: 800,
  },
  "da-nang": {
    code: "DAD",
    name: "다낭",
    zones: DA_NANG_ZONES,
    targetCount: 400,
  },
} as const;

export type CityKey = keyof typeof CITY_CONFIGS;

// ═══════════════════════════════════════════════════════════════════
// Google Places API 검색 타입 (카테고리별)
// ═══════════════════════════════════════════════════════════════════

export const SEARCH_TYPES = [
  // food
  "restaurant",
  "cafe",
  "bar",
  "bakery",
  "meal_delivery",
  "meal_takeaway",
  // spot
  "tourist_attraction",
  "museum",
  "park",
  "aquarium",
  "amusement_park",
  "art_gallery",
  "church",
  "hindu_temple",
  "zoo",
  // shopping
  "shopping_mall",
  "store",
  "clothing_store",
  "jewelry_store",
  "book_store",
  // rest
  "lodging",
  "spa",
  "beauty_salon",
] as const;

// 카테고리 매핑: Google types → 우리 4분류
export const TYPE_TO_CATEGORY: Record<string, "food" | "spot" | "shopping" | "rest"> = {
  restaurant: "food",
  cafe: "food",
  bar: "food",
  bakery: "food",
  meal_delivery: "food",
  meal_takeaway: "food",
  food: "food",
  tourist_attraction: "spot",
  museum: "spot",
  park: "spot",
  aquarium: "spot",
  amusement_park: "spot",
  art_gallery: "spot",
  church: "spot",
  hindu_temple: "spot",
  zoo: "spot",
  point_of_interest: "spot",
  natural_feature: "spot",
  shopping_mall: "shopping",
  store: "shopping",
  clothing_store: "shopping",
  jewelry_store: "shopping",
  book_store: "shopping",
  supermarket: "shopping",
  convenience_store: "shopping",
  lodging: "rest",
  spa: "rest",
  beauty_salon: "rest",
  gym: "rest",
};

// ═══════════════════════════════════════════════════════════════════
// API 요청 제한
// ═══════════════════════════════════════════════════════════════════

export const API_CONFIG = {
  /** Nearby Search 요청 간 딜레이 (ms) — 429 방지 */
  delayBetweenRequests: 200,
  /** 한 구역당 최대 Nearby Search 페이지 수 (Google 최대 3 = 60건) */
  maxPagesPerZone: 3,
  /** Details 요청 간 딜레이 */
  detailsDelay: 150,
  /** 한 번에 처리할 Details 배치 크기 */
  detailsBatchSize: 10,
};

// ═══════════════════════════════════════════════════════════════════
// 출력 경로
// ═══════════════════════════════════════════════════════════════════

export const OUTPUT_DIR = "data/seeds";
