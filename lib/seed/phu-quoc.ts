/**
 * 푸꾸옥(Phú Quốc, 베트남) 시드 데이터 — ADR-009
 *
 * 사이클 1 데모용. 외부 API 키 없이도 M1 추천 근거 패널이 동작하도록
 * Evidence를 정적으로 큐레이션했다.
 *
 * 24곳 (food 8 / spot 8 / shopping 4 / rest 4) + 시연 일정 12개 (3박 4일).
 */

import type {
  Evidence,
  ItemCategory,
  ItineraryItem,
  Trip,
} from "../types";

// ═══════════════════════════════════════════════════════════════════
// PLACES (24곳) — 일정에서 참조하는 풀(pool)
// ═══════════════════════════════════════════════════════════════════

export interface SeedPlace {
  id: string;
  name: string;
  category: ItemCategory;
  location: { lat: number; lng: number; address: string };
  estimatedPrice?: { amount: number; currency: string };
  defaultDurationMinutes: number;
  evidence: Evidence;
}

const VERIFIED_AT = "2026-04-29T00:00:00.000Z";

export const phuQuocPlaces: SeedPlace[] = [
  // ── food (8) ─────────────────────────────────────
  {
    id: "pq-food-night-market",
    name: "즈엉동 야시장 (Dinh Cậu Night Market)",
    category: "food",
    location: {
      lat: 10.2168,
      lng: 103.9596,
      address: "Đ. Võ Thị Sáu, Dương Đông, Phú Quốc",
    },
    // 사이클 B: 워킹투어(가이드+시식) 패키지 기준으로 보정. OTA 31k KRW × 18 ≈ 558k VND
    estimatedPrice: { amount: 550000, currency: "VND" },
    defaultDurationMinutes: 90,
    evidence: {
      reasons: [
        "네이버 블로그 후기 412건 중 89% 긍정",
        "한국인 여행자 가장 많이 방문한 푸꾸옥 야시장",
        "디아동 야경과 도보 4분",
      ],
      sources: [
        { platform: "naver", reviewCount: 412, positiveRate: 89, url: "https://search.naver.com/search.naver?query=푸꾸옥+즈엉동+야시장", lastVerified: VERIFIED_AT },
        { platform: "google", reviewCount: 8421, positiveRate: 86, url: "https://maps.google.com/?q=Dinh+Cau+Night+Market", lastVerified: VERIFIED_AT },
      ],
      verifiedAt: VERIFIED_AT,
      warnings: ["주말 19시 이후 매우 혼잡", "단품 시식만 할 경우 1인 100~200k VND 수준 — 표시 가격은 가이드 워킹투어 패키지 기준"],
    },
  },
  {
    id: "pq-food-cavern",
    name: "더 캐비 (The Cavern Phú Quốc)",
    category: "food",
    location: { lat: 10.1980, lng: 103.9614, address: "Khu phố 7, Dương Đông" },
    estimatedPrice: { amount: 650000, currency: "VND" },
    defaultDurationMinutes: 90,
    evidence: {
      reasons: [
        "네이버 후기 187건 중 94% 긍정",
        "한국인 알레르기 표기 메뉴 운영",
        "당신의 취향 '맛집 위주'와 일치",
      ],
      sources: [
        { platform: "naver", reviewCount: 187, positiveRate: 94, lastVerified: VERIFIED_AT },
        { platform: "instagram", reviewCount: 2300, lastVerified: VERIFIED_AT },
      ],
      verifiedAt: VERIFIED_AT,
    },
  },
  {
    id: "pq-food-yoonskitchen",
    name: "윤스키친 (한식)",
    category: "food",
    location: { lat: 10.2189, lng: 103.9617, address: "Trần Hưng Đạo, Dương Đông" },
    estimatedPrice: { amount: 280000, currency: "VND" },
    defaultDurationMinutes: 60,
    evidence: {
      reasons: [
        "네이버 후기 218건 중 91% 긍정",
        "한국 사장님 운영 — 알레르기 의사소통 안전",
      ],
      sources: [
        { platform: "naver", reviewCount: 218, positiveRate: 91, lastVerified: VERIFIED_AT },
      ],
      verifiedAt: VERIFIED_AT,
    },
  },
  {
    id: "pq-food-luxury-seafood",
    name: "럭셔리 시푸드",
    category: "food",
    location: { lat: 10.2150, lng: 103.9590, address: "Trần Hưng Đạo, Dương Đông" },
    estimatedPrice: { amount: 950000, currency: "VND" },
    defaultDurationMinutes: 90,
    evidence: {
      reasons: [
        "네이버 후기 96건 중 87% 긍정",
        "랍스터·게 시세 매일 갱신, 무게 측정 투명",
      ],
      sources: [
        { platform: "naver", reviewCount: 96, positiveRate: 87, lastVerified: VERIFIED_AT },
      ],
      verifiedAt: VERIFIED_AT,
      warnings: ["새우·갑각류 알레르기 주의"],
    },
  },
  {
    id: "pq-food-coconut",
    name: "코코넛 카페 (Coconut Tree)",
    category: "food",
    location: { lat: 10.2125, lng: 103.9588, address: "Bạch Đằng, Dương Đông" },
    estimatedPrice: { amount: 120000, currency: "VND" },
    defaultDurationMinutes: 45,
    evidence: {
      reasons: [
        "구글 리뷰 1,820건 중 4.6/5",
        "사진 명소 — 인스타 해시태그 12k+",
      ],
      sources: [
        { platform: "google", reviewCount: 1820, positiveRate: 92, lastVerified: VERIFIED_AT },
        { platform: "instagram", reviewCount: 12340, lastVerified: VERIFIED_AT },
      ],
      verifiedAt: VERIFIED_AT,
    },
  },
  {
    id: "pq-food-yen",
    name: "옌식당 (Quán Yến — 한인 백반)",
    category: "food",
    location: { lat: 10.2173, lng: 103.9622, address: "Nguyễn Trung Trực, Dương Đông" },
    estimatedPrice: { amount: 180000, currency: "VND" },
    defaultDurationMinutes: 60,
    evidence: {
      reasons: [
        "네이버 후기 134건 중 88% 긍정",
        "푸꾸옥 한식 가성비 1순위",
      ],
      sources: [
        { platform: "naver", reviewCount: 134, positiveRate: 88, lastVerified: VERIFIED_AT },
      ],
      verifiedAt: VERIFIED_AT,
    },
  },
  {
    id: "pq-food-bunbcha",
    name: "로컬 분짜집 (Bún Chả Hà Nội)",
    category: "food",
    location: { lat: 10.2140, lng: 103.9601, address: "30/4 St., Dương Đông" },
    estimatedPrice: { amount: 80000, currency: "VND" },
    defaultDurationMinutes: 45,
    evidence: {
      reasons: [
        "현지 구글 리뷰 612건 중 4.7/5",
        "당신의 취향 '현지 음식'과 일치",
      ],
      sources: [
        { platform: "google", reviewCount: 612, positiveRate: 93, lastVerified: VERIFIED_AT },
      ],
      verifiedAt: VERIFIED_AT,
    },
  },
  {
    id: "pq-food-hotel-breakfast",
    name: "호텔 조식",
    category: "food",
    location: { lat: 10.2050, lng: 103.9600, address: "리조트 내부, Dương Đông" },
    estimatedPrice: { amount: 0, currency: "VND" },
    defaultDurationMinutes: 60,
    evidence: {
      reasons: ["체크인 시 포함된 조식"],
      sources: [],
      verifiedAt: VERIFIED_AT,
    },
  },

  // ── spot (8) ─────────────────────────────────────
  {
    id: "pq-spot-vinwonders",
    name: "빈원더스 (VinWonders Phú Quốc)",
    category: "spot",
    location: { lat: 10.3266, lng: 103.8410, address: "Bãi Dài, Gành Dầu" },
    estimatedPrice: { amount: 870000, currency: "VND" },
    defaultDurationMinutes: 240,
    evidence: {
      reasons: [
        "네이버 후기 1,247건 중 91% 긍정",
        "Klook 어필리에이트 한국인 BEST",
        "당신의 취향 '가족·친구'와 일치",
      ],
      sources: [
        { platform: "naver", reviewCount: 1247, positiveRate: 91, lastVerified: VERIFIED_AT },
        { platform: "ota", reviewCount: 5840, positiveRate: 93, url: "https://www.klook.com", lastVerified: VERIFIED_AT },
      ],
      verifiedAt: VERIFIED_AT,
    },
  },
  {
    id: "pq-spot-safari",
    name: "빈펄 사파리 (Vinpearl Safari)",
    category: "spot",
    location: { lat: 10.3340, lng: 103.8350, address: "Bãi Dài, Gành Dầu" },
    estimatedPrice: { amount: 650000, currency: "VND" },
    defaultDurationMinutes: 180,
    evidence: {
      reasons: [
        "네이버 후기 873건 중 88% 긍정",
        "오픈 사파리 버스로 기린·코끼리 근접 관찰",
        "빈원더스와 셔틀 연결 (도보 0분)",
      ],
      sources: [
        { platform: "naver", reviewCount: 873, positiveRate: 88, lastVerified: VERIFIED_AT },
        { platform: "ota", reviewCount: 3120, positiveRate: 90, lastVerified: VERIFIED_AT },
      ],
      verifiedAt: VERIFIED_AT,
    },
  },
  {
    id: "pq-spot-saobeach",
    name: "사오비치 (Bãi Sao)",
    category: "spot",
    location: { lat: 10.0392, lng: 104.0274, address: "An Thới, Phú Quốc" },
    // 사이클 B: 데이투어(왕복교통+점심+남부 명소) 패키지 기준. OTA 53k KRW × 18 ≈ 954k VND
    estimatedPrice: { amount: 950000, currency: "VND" },
    defaultDurationMinutes: 180,
    evidence: {
      reasons: [
        "네이버 블로그 후기 968건 중 95% 긍정",
        "푸꾸옥 남부 대표 백사장",
        "당신의 취향 '사진 명소'와 일치",
      ],
      sources: [
        { platform: "naver", reviewCount: 968, positiveRate: 95, lastVerified: VERIFIED_AT },
        { platform: "google", reviewCount: 14200, positiveRate: 92, lastVerified: VERIFIED_AT },
      ],
      verifiedAt: VERIFIED_AT,
      warnings: [
        "해변 입장 자체는 무료 — 표시 가격은 왕복교통+점심 포함 데이투어 기준",
        "선베드는 음식점 이용 시 무료, 단독 대여는 유료",
      ],
    },
  },
  {
    id: "pq-spot-cablecar",
    name: "혼톰 케이블카 (Sun World Hon Thom)",
    category: "spot",
    location: { lat: 10.0480, lng: 104.0164, address: "An Thới, Phú Quốc" },
    estimatedPrice: { amount: 750000, currency: "VND" },
    defaultDurationMinutes: 120,
    evidence: {
      reasons: [
        "세계 최장 해상 케이블카 (7,899m)",
        "네이버 후기 624건 중 93% 긍정",
        "사오비치에서 차량 18분",
      ],
      sources: [
        { platform: "naver", reviewCount: 624, positiveRate: 93, lastVerified: VERIFIED_AT },
        { platform: "ota", reviewCount: 4012, positiveRate: 91, lastVerified: VERIFIED_AT },
      ],
      verifiedAt: VERIFIED_AT,
    },
  },
  {
    id: "pq-spot-hoquoc",
    name: "호국사 (Chùa Hộ Quốc)",
    category: "spot",
    location: { lat: 10.0935, lng: 104.0241, address: "Dương Tơ, Phú Quốc" },
    estimatedPrice: { amount: 0, currency: "VND" },
    defaultDurationMinutes: 60,
    evidence: {
      reasons: [
        "푸꾸옥 최대 사찰 — 바다 전망",
        "구글 리뷰 3,120건 중 4.7/5",
        "케이블카에서 차량 9분",
      ],
      sources: [
        { platform: "google", reviewCount: 3120, positiveRate: 94, lastVerified: VERIFIED_AT },
      ],
      verifiedAt: VERIFIED_AT,
    },
  },
  {
    id: "pq-spot-dinhcau",
    name: "디아동 (Dinh Cậu — 일몰 절벽)",
    category: "spot",
    location: { lat: 10.2167, lng: 103.9577, address: "Dương Đông, Phú Quốc" },
    estimatedPrice: { amount: 0, currency: "VND" },
    defaultDurationMinutes: 60,
    evidence: {
      reasons: [
        "푸꾸옥 일몰 명소 — 인스타 #DinhCau 28k",
        "즈엉동 야시장과 도보 4분",
      ],
      sources: [
        { platform: "instagram", reviewCount: 28400, lastVerified: VERIFIED_AT },
        { platform: "naver", reviewCount: 287, positiveRate: 92, lastVerified: VERIFIED_AT },
      ],
      verifiedAt: VERIFIED_AT,
    },
  },
  {
    id: "pq-spot-hamninh",
    name: "함닌 어촌마을 (Hàm Ninh)",
    category: "spot",
    location: { lat: 10.1875, lng: 104.0357, address: "Hàm Ninh, Phú Quốc" },
    estimatedPrice: { amount: 0, currency: "VND" },
    defaultDurationMinutes: 90,
    evidence: {
      reasons: [
        "전통 어촌 — 새벽 어선 들어옴",
        "구글 리뷰 1,420건 중 4.5/5",
      ],
      sources: [
        { platform: "google", reviewCount: 1420, positiveRate: 88, lastVerified: VERIFIED_AT },
      ],
      verifiedAt: VERIFIED_AT,
    },
  },
  {
    id: "pq-spot-grandworld",
    name: "그랜드월드 (Grand World)",
    category: "spot",
    location: { lat: 10.3257, lng: 103.8585, address: "Bãi Dài, Gành Dầu" },
    estimatedPrice: { amount: 0, currency: "VND" },
    defaultDurationMinutes: 120,
    evidence: {
      reasons: [
        "베네치아 곤돌라 + 야간 미디어쇼",
        "네이버 후기 542건 중 86% 긍정",
      ],
      sources: [
        { platform: "naver", reviewCount: 542, positiveRate: 86, lastVerified: VERIFIED_AT },
      ],
      verifiedAt: VERIFIED_AT,
    },
  },

  // ── shopping (4) ─────────────────────────────────
  {
    id: "pq-shop-vincom",
    name: "빈콤 플라자 (Vincom Plaza)",
    category: "shopping",
    location: { lat: 10.2118, lng: 103.9601, address: "Trần Hưng Đạo, Dương Đông" },
    estimatedPrice: { amount: 0, currency: "VND" },
    defaultDurationMinutes: 90,
    evidence: {
      reasons: ["냉방 쾌적, 환전·약국·SIM 한 번에"],
      sources: [
        { platform: "google", reviewCount: 2890, positiveRate: 88, lastVerified: VERIFIED_AT },
      ],
      verifiedAt: VERIFIED_AT,
    },
  },
  {
    id: "pq-shop-kmarket",
    name: "K-Market (한인 마트)",
    category: "shopping",
    location: { lat: 10.2179, lng: 103.9605, address: "Trần Hưng Đạo, Dương Đông" },
    estimatedPrice: { amount: 0, currency: "VND" },
    defaultDurationMinutes: 30,
    evidence: {
      reasons: ["한국 컵라면·즉석밥 상비, 네이버 후기 다수 언급"],
      sources: [
        { platform: "naver", reviewCount: 78, positiveRate: 90, lastVerified: VERIFIED_AT },
      ],
      verifiedAt: VERIFIED_AT,
    },
  },
  {
    id: "pq-shop-night-market-stalls",
    name: "야시장 잡화 골목",
    category: "shopping",
    location: { lat: 10.2168, lng: 103.9596, address: "Đ. Võ Thị Sáu, Dương Đông" },
    estimatedPrice: { amount: 0, currency: "VND" },
    defaultDurationMinutes: 45,
    evidence: {
      reasons: ["진주·말린 망고·캐슈넛 — 가격 흥정 가능"],
      sources: [],
      verifiedAt: VERIFIED_AT,
    },
  },
  {
    id: "pq-shop-grand-venice",
    name: "그랜드월드 베네치아 상점가",
    category: "shopping",
    location: { lat: 10.3257, lng: 103.8585, address: "Bãi Dài, Gành Dầu" },
    estimatedPrice: { amount: 0, currency: "VND" },
    defaultDurationMinutes: 60,
    evidence: {
      reasons: ["기념품·아오자이 체험, 곤돌라 옆"],
      sources: [],
      verifiedAt: VERIFIED_AT,
    },
  },

  // ── rest (4) ─────────────────────────────────────
  {
    id: "pq-rest-checkin",
    name: "호텔 체크인 / 휴식",
    category: "rest",
    location: { lat: 10.2050, lng: 103.9600, address: "Dương Đông 리조트 지구" },
    estimatedPrice: { amount: 0, currency: "VND" },
    defaultDurationMinutes: 60,
    evidence: {
      reasons: ["3시 체크인 — 비행 직후 시차/피로 회복"],
      sources: [],
      verifiedAt: VERIFIED_AT,
    },
  },
  {
    id: "pq-rest-pool",
    name: "리조트 풀 휴식",
    category: "rest",
    location: { lat: 10.2050, lng: 103.9600, address: "Dương Đông 리조트 지구" },
    estimatedPrice: { amount: 0, currency: "VND" },
    defaultDurationMinutes: 90,
    evidence: {
      reasons: ["여행 중 회복 — 인포메이션에서 타올 무료"],
      sources: [],
      verifiedAt: VERIFIED_AT,
    },
  },
  {
    id: "pq-rest-suoi-tranh",
    name: "짱오 폭포 (Suối Tranh)",
    category: "rest",
    location: { lat: 10.2358, lng: 104.0086, address: "Dương Đông, Phú Quốc" },
    estimatedPrice: { amount: 30000, currency: "VND" },
    defaultDurationMinutes: 60,
    evidence: {
      reasons: ["우기엔 수량 풍부, 짧은 트레킹 후 폭포"],
      sources: [
        { platform: "google", reviewCount: 980, positiveRate: 84, lastVerified: VERIFIED_AT },
      ],
      verifiedAt: VERIFIED_AT,
    },
  },
  {
    id: "pq-rest-airport-departure",
    name: "공항 이동 / 출국",
    category: "rest",
    location: { lat: 10.1700, lng: 103.9920, address: "Phu Quoc International Airport" },
    estimatedPrice: { amount: 0, currency: "VND" },
    defaultDurationMinutes: 30,
    evidence: {
      reasons: ["체크인 2시간 전 도착 권장"],
      sources: [],
      verifiedAt: VERIFIED_AT,
    },
  },
];

// ═══════════════════════════════════════════════════════════════════
// DEMO TRIP — 푸꾸옥 3박 4일 시연
// ═══════════════════════════════════════════════════════════════════

const TRIP_ID = "demo-trip-phu-quoc";
import { demoStartDate } from "./demo-date";
const START_DATE = demoStartDate(14); // 2주 후 출발 (C1: 고정 날짜 제거)

export const phuQuocTrip: Trip = {
  id: TRIP_ID,
  destination: "푸꾸옥",
  destinationCode: "PQC",
  startDate: START_DATE,
  nights: 3,
  companion: "friends",
  preferences: {
    vibes: ["맛집 위주", "사진 명소", "현지 음식"],
    pace: "balanced",
    excludes: [],
  },
  createdAt: VERIFIED_AT,
  status: "draft",
  currentMode: "pre-travel",
};

// ── 시연 일정 12개 (3박 4일, Day 0~3) ─────────────────────────────

interface PlanSlot {
  placeId: string;
  dayIndex: number;
  hour: number;        // 24h
  minute: number;
  flexibility: "fixed" | "flexible" | "booked";
  priority: 1 | 2 | 3 | 4 | 5;
  flexMinutes: number;
}

const plan: PlanSlot[] = [
  // Day 1 (도착)
  { placeId: "pq-rest-checkin",            dayIndex: 0, hour: 14, minute: 0, flexibility: "fixed",    priority: 5, flexMinutes: 0 },
  { placeId: "pq-food-night-market",       dayIndex: 0, hour: 18, minute: 30, flexibility: "flexible", priority: 4, flexMinutes: 30 },
  { placeId: "pq-spot-dinhcau",            dayIndex: 0, hour: 20, minute: 30, flexibility: "flexible", priority: 3, flexMinutes: 45 },

  // Day 2 (액티비티)
  { placeId: "pq-spot-vinwonders",         dayIndex: 1, hour: 9,  minute: 0, flexibility: "booked",   priority: 5, flexMinutes: 0 },
  { placeId: "pq-spot-safari",             dayIndex: 1, hour: 14, minute: 0, flexibility: "flexible", priority: 4, flexMinutes: 30 },
  { placeId: "pq-food-cavern",             dayIndex: 1, hour: 19, minute: 0, flexibility: "booked",   priority: 4, flexMinutes: 0 },

  // Day 3 (자연)
  { placeId: "pq-spot-saobeach",           dayIndex: 2, hour: 9,  minute: 0, flexibility: "flexible", priority: 4, flexMinutes: 60 },
  { placeId: "pq-food-bunbcha",            dayIndex: 2, hour: 13, minute: 0, flexibility: "flexible", priority: 3, flexMinutes: 45 },
  { placeId: "pq-spot-cablecar",           dayIndex: 2, hour: 15, minute: 0, flexibility: "booked",   priority: 5, flexMinutes: 0 },
  { placeId: "pq-spot-hoquoc",             dayIndex: 2, hour: 17, minute: 30, flexibility: "flexible", priority: 3, flexMinutes: 30 },

  // Day 4 (출발)
  { placeId: "pq-food-hotel-breakfast",    dayIndex: 3, hour: 8,  minute: 0, flexibility: "flexible", priority: 2, flexMinutes: 30 },
  { placeId: "pq-rest-airport-departure",  dayIndex: 3, hour: 12, minute: 0, flexibility: "fixed",    priority: 5, flexMinutes: 0 },
];

function buildScheduledAt(dayIndex: number, hour: number, minute: number): string {
  const date = new Date(`${START_DATE}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + dayIndex);
  date.setUTCHours(hour, minute, 0, 0);
  return date.toISOString();
}

const placeMap = new Map<string, SeedPlace>(phuQuocPlaces.map((p) => [p.id, p]));

export const phuQuocItinerary: ItineraryItem[] = plan.map((slot, idx) => {
  const place = placeMap.get(slot.placeId);
  if (!place) {
    throw new Error(`Seed data error: unknown place ${slot.placeId}`);
  }

  // DAG 의존성: 같은 day 안에서 직전 슬롯이 선행
  const prev = idx > 0 ? plan[idx - 1] : null;
  const dependencies =
    prev && prev.dayIndex === slot.dayIndex ? [`pq-item-${idx - 1}`] : [];

  return {
    id: `pq-item-${idx}`,
    tripId: TRIP_ID,
    dayIndex: slot.dayIndex,
    scheduledAt: buildScheduledAt(slot.dayIndex, slot.hour, slot.minute),
    durationMinutes: place.defaultDurationMinutes,
    flexibility: slot.flexibility,
    priority: slot.priority,
    flexMinutes: slot.flexMinutes,
    name: place.name,
    category: place.category,
    location: place.location,
    estimatedPrice: place.estimatedPrice,
    evidence: place.evidence,
    photos: [
      `https://picsum.photos/seed/${place.id}/800/500`,
      `https://picsum.photos/seed/${place.id}-2/800/500`,
    ],
    dependencies,
  };
});
