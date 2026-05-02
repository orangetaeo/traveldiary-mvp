/**
 * 나트랑(Nha Trang) 시드 데이터 — 사이클 G-4 (V1).
 *
 * feedback_city_seed_pattern 답습. 12 일정 / 3박 4일 / OTA 매칭 5건.
 * 차별화: 빈원더스(섬 + 케이블카) + 머드스파 + 4섬 스노클링.
 *
 * matchTag prefix = nh-. 푸꾸옥과 키워드 충돌(빈원더·스노클·야시장) 회피는
 * ota-offers.ts findOffersByKeyword에서 도시 게이트로 처리.
 */

import type {
  Evidence,
  ItemCategory,
  ItineraryItem,
  Trip,
} from "../types";

interface SeedPlace {
  id: string;
  name: string;
  category: ItemCategory;
  location: { lat: number; lng: number; address: string };
  estimatedPrice?: { amount: number; currency: string };
  defaultDurationMinutes: number;
  evidence: Evidence;
}

const VERIFIED_AT = "2026-05-02T00:00:00.000Z";

const nhaTrangPlaces: SeedPlace[] = [
  // ── Day 0 (도착 + 시내) ──────────────────────────────────────────
  {
    id: "nh-rest-checkin",
    name: "비치프론트 호텔 체크인",
    category: "rest",
    location: {
      lat: 12.2388,
      lng: 109.1967,
      address: "Trần Phú, Lộc Thọ, Nha Trang",
    },
    estimatedPrice: { amount: 0, currency: "VND" },
    defaultDurationMinutes: 60,
    evidence: {
      reasons: ["체크인 후 짐 정리·휴식. Tran Phu 비치프론트는 도보 동선 최적"],
      sources: [],
      verifiedAt: VERIFIED_AT,
    },
  },
  {
    id: "nh-spot-beach",
    name: "나트랑 비치 일몰 산책",
    category: "spot",
    location: {
      lat: 12.2419,
      lng: 109.1959,
      address: "Trần Phú Beach, Nha Trang",
    },
    estimatedPrice: { amount: 0, currency: "VND" },
    defaultDurationMinutes: 90,
    evidence: {
      reasons: [
        "6km 백사장 — 베트남 최장 비치 중 하나",
        "일몰 18:00~18:30 명당 (Trần Phú 거리)",
        "네이버 블로그 후기 1,840건 중 90% 긍정",
      ],
      sources: [
        { platform: "naver", reviewCount: 1840, positiveRate: 90, lastVerified: VERIFIED_AT },
      ],
      verifiedAt: VERIFIED_AT,
    },
  },
  {
    // OTA 매칭: nh-food-streetFood (klook 32k, kkday 34k → 중앙값 33k × 18 ≈ 594k VND)
    id: "nh-food-streetFood",
    name: "나트랑 시푸드 야시장 푸드 워킹투어",
    category: "food",
    location: {
      lat: 12.2469,
      lng: 109.1951,
      address: "Cho Dem Night Market, Nha Trang",
    },
    estimatedPrice: { amount: 590000, currency: "VND" },
    defaultDurationMinutes: 150,
    evidence: {
      reasons: [
        "Cho Dem 야시장 7종 시푸드 시식 (랍스터·새우·홍합·게)",
        "한국어 가이드 + 흥정 동행 (가격 50% 절감)",
        "네이버 블로그 후기 728건 중 91% 긍정",
      ],
      sources: [
        { platform: "naver", reviewCount: 728, positiveRate: 91, lastVerified: VERIFIED_AT },
        { platform: "ota", reviewCount: 1480, positiveRate: 93, lastVerified: VERIFIED_AT },
      ],
      verifiedAt: VERIFIED_AT,
    },
  },

  // ── Day 1 (시티투어 + 빈원더스) ──────────────────────────────────
  {
    // OTA 매칭: nh-spot-cityTour (klook 22k, kkday 24k → 중앙값 23k × 18 ≈ 414k VND)
    id: "nh-spot-cityTour",
    name: "폰가나가르 참 타워 + 스톤 카테드랄 시티투어",
    category: "spot",
    location: {
      lat: 12.2668,
      lng: 109.1949,
      address: "2 Tháng 4, Vĩnh Phước, Nha Trang",
    },
    estimatedPrice: { amount: 410000, currency: "VND" },
    defaultDurationMinutes: 180,
    evidence: {
      reasons: [
        "폰가나가르(7~12세기 참파 왕국) + 스톤 카테드랄(1934 프랑스 건축)",
        "한국어 가이드 + 픽업·드롭 포함 패키지",
        "네이버 블로그 후기 482건 중 86% 긍정",
      ],
      sources: [
        { platform: "naver", reviewCount: 482, positiveRate: 86, lastVerified: VERIFIED_AT },
        { platform: "ota", reviewCount: 1120, positiveRate: 89, lastVerified: VERIFIED_AT },
      ],
      verifiedAt: VERIFIED_AT,
    },
  },
  {
    id: "nh-food-seafoodLunch",
    name: "Lac Canh BBQ 시푸드 그릴 점심",
    category: "food",
    location: {
      lat: 12.2493,
      lng: 109.1872,
      address: "44 Nguyễn Bỉnh Khiêm, Vạn Thắng, Nha Trang",
    },
    estimatedPrice: { amount: 380000, currency: "VND" },
    defaultDurationMinutes: 90,
    evidence: {
      reasons: [
        "1985년 시작된 나트랑 시푸드 그릴 명소",
        "테이블 화로 직접 굽는 BBQ 스타일",
        "네이버 블로그 후기 1,240건 중 89% 긍정",
      ],
      sources: [
        { platform: "naver", reviewCount: 1240, positiveRate: 89, lastVerified: VERIFIED_AT },
        { platform: "google", reviewCount: 8420, positiveRate: 87, lastVerified: VERIFIED_AT },
      ],
      verifiedAt: VERIFIED_AT,
    },
  },
  {
    // OTA 매칭: nh-spot-vinwonders (klook 65k, kkday 68k, agoda 70k → 중앙값 68k × 18 ≈ 1.224M VND)
    id: "nh-spot-vinwonders",
    name: "빈원더스 나트랑 (Vinwonders + 케이블카)",
    category: "spot",
    location: {
      lat: 12.2088,
      lng: 109.2148,
      address: "Vinpearl Cable Car Station, Hòn Tre Island",
    },
    estimatedPrice: { amount: 1220000, currency: "VND" },
    defaultDurationMinutes: 360, // 6시간
    evidence: {
      reasons: [
        "혼쩨섬 위치 — 세계 최장 해상 케이블카 3.3km(20분)로 진입",
        "워터파크 + 놀이공원 + 수족관 + 돌고래쇼 통합 입장",
        "푸꾸옥 빈원더스 대비 케이블카 자체가 명물 (해상 노을)",
        "네이버 블로그 후기 3,820건 중 89% 긍정",
      ],
      sources: [
        { platform: "naver", reviewCount: 3820, positiveRate: 89, lastVerified: VERIFIED_AT },
        { platform: "google", reviewCount: 32480, positiveRate: 88, lastVerified: VERIFIED_AT },
        { platform: "ota", reviewCount: 6240, positiveRate: 92, lastVerified: VERIFIED_AT },
      ],
      verifiedAt: VERIFIED_AT,
    },
  },

  // ── Day 2 (4섬 스노클링) ──────────────────────────────────────────
  {
    // OTA 매칭: nh-spot-snorkeling (klook 28k, kkday 30k, agoda 32k → 중앙값 30k × 18 ≈ 540k VND)
    id: "nh-spot-snorkeling",
    name: "혼문 4섬 스노클링 데이투어",
    category: "spot",
    location: {
      lat: 12.1990,
      lng: 109.2185,
      address: "Cau Da Pier, Vĩnh Nguyên, Nha Trang",
    },
    estimatedPrice: { amount: 540000, currency: "VND" },
    defaultDurationMinutes: 480, // 8시간
    evidence: {
      reasons: [
        "혼문·혼묻·혼따·혼미에우 4섬 보트 투어 + 스노클링 + 해상 점심",
        "한국어 가이드 + 보트 디스코(베트남 명물 콘텐츠)",
        "네이버 블로그 후기 2,140건 중 87% 긍정",
      ],
      sources: [
        { platform: "naver", reviewCount: 2140, positiveRate: 87, lastVerified: VERIFIED_AT },
        { platform: "google", reviewCount: 9820, positiveRate: 85, lastVerified: VERIFIED_AT },
        { platform: "ota", reviewCount: 3420, positiveRate: 90, lastVerified: VERIFIED_AT },
      ],
      verifiedAt: VERIFIED_AT,
    },
  },
  {
    id: "nh-spot-massage",
    name: "Su Spa 마사지 (90분)",
    category: "rest",
    location: {
      lat: 12.2425,
      lng: 109.1955,
      address: "93A Nguyễn Thiện Thuật, Lộc Thọ, Nha Trang",
    },
    estimatedPrice: { amount: 350000, currency: "VND" },
    defaultDurationMinutes: 90,
    evidence: {
      reasons: [
        "오랜 운영 + 한국인 후기 많은 1군 스파",
        "베트남 전통 핫스톤 + 아로마 마사지 90분 약 35만 동",
        "네이버 블로그 후기 942건 중 90% 긍정",
      ],
      sources: [
        { platform: "naver", reviewCount: 942, positiveRate: 90, lastVerified: VERIFIED_AT },
      ],
      verifiedAt: VERIFIED_AT,
    },
  },

  // ── Day 3 (머드스파 + 출발) ──────────────────────────────────────
  {
    id: "nh-food-breakfast",
    name: "호텔 조식 / 베트남식 분짜",
    category: "food",
    location: {
      lat: 12.2388,
      lng: 109.1967,
      address: "Trần Phú, Nha Trang",
    },
    estimatedPrice: { amount: 0, currency: "VND" },
    defaultDurationMinutes: 60,
    evidence: {
      reasons: ["호텔 패키지 또는 분짜·반쎄오 로컬 식당"],
      sources: [],
      verifiedAt: VERIFIED_AT,
    },
  },
  {
    // OTA 매칭: nh-spot-mudSpa (klook 18k, kkday 19k → 중앙값 18.5k × 18 ≈ 333k VND)
    id: "nh-spot-mudSpa",
    name: "Thap Ba 머드 스파 + 미네랄 풀",
    category: "rest",
    location: {
      lat: 12.2629,
      lng: 109.1810,
      address: "15 Ngọc Sơn, Ngọc Hiệp, Nha Trang",
    },
    estimatedPrice: { amount: 330000, currency: "VND" },
    defaultDurationMinutes: 180,
    evidence: {
      reasons: [
        "베트남 최대 머드 스파 (개인탕 가능)",
        "머드 베스 30분 + 미네랄 풀 + 온천 풀 코스",
        "네이버 블로그 후기 2,820건 중 88% 긍정",
      ],
      sources: [
        { platform: "naver", reviewCount: 2820, positiveRate: 88, lastVerified: VERIFIED_AT },
        { platform: "ota", reviewCount: 4180, positiveRate: 91, lastVerified: VERIFIED_AT },
      ],
      verifiedAt: VERIFIED_AT,
    },
  },
  {
    id: "nh-rest-airport",
    name: "캄란공항 이동 / 출국",
    category: "rest",
    location: {
      lat: 11.9982,
      lng: 109.2199,
      address: "Cam Ranh International Airport (CXR)",
    },
    estimatedPrice: { amount: 0, currency: "VND" },
    defaultDurationMinutes: 30,
    evidence: {
      reasons: ["체크인 2시간 전 도착. 시내 → 공항 그랩 35분 (정체 시 1시간)"],
      sources: [],
      verifiedAt: VERIFIED_AT,
    },
  },
];

// ═══════════════════════════════════════════════════════════════════
// DEMO TRIP — 나트랑 3박 4일
// ═══════════════════════════════════════════════════════════════════

const TRIP_ID = "demo-trip-nha-trang";
const START_DATE = "2026-07-16"; // 목요일

export const nhaTrangTrip: Trip = {
  id: TRIP_ID,
  destination: "나트랑",
  destinationCode: "NHA",
  startDate: START_DATE,
  nights: 3,
  companion: "friends",
  preferences: {
    vibes: ["해변 휴양", "리조트", "시푸드"],
    pace: "relaxed",
    excludes: [],
  },
  createdAt: VERIFIED_AT,
  status: "draft",
  currentMode: "pre-travel",
};

interface PlanSlot {
  placeId: string;
  dayIndex: number;
  hour: number;
  minute: number;
  flexibility: "fixed" | "flexible" | "booked";
  priority: 1 | 2 | 3 | 4 | 5;
  flexMinutes: number;
}

const plan: PlanSlot[] = [
  // Day 0 (도착)
  { placeId: "nh-rest-checkin",     dayIndex: 0, hour: 14, minute: 0,  flexibility: "fixed",    priority: 5, flexMinutes: 0 },
  { placeId: "nh-spot-beach",       dayIndex: 0, hour: 16, minute: 30, flexibility: "flexible", priority: 3, flexMinutes: 30 },
  { placeId: "nh-food-streetFood",  dayIndex: 0, hour: 18, minute: 30, flexibility: "booked",   priority: 5, flexMinutes: 0 },

  // Day 1 (시티투어 + 빈원더스)
  { placeId: "nh-spot-cityTour",    dayIndex: 1, hour: 9,  minute: 0,  flexibility: "booked",   priority: 4, flexMinutes: 0 },
  { placeId: "nh-food-seafoodLunch", dayIndex: 1, hour: 12, minute: 30, flexibility: "flexible", priority: 3, flexMinutes: 30 },
  { placeId: "nh-spot-vinwonders",  dayIndex: 1, hour: 14, minute: 30, flexibility: "booked",   priority: 5, flexMinutes: 0 },

  // Day 2 (4섬 스노클링)
  { placeId: "nh-spot-snorkeling",  dayIndex: 2, hour: 8,  minute: 0,  flexibility: "booked",   priority: 5, flexMinutes: 0 },
  { placeId: "nh-spot-massage",     dayIndex: 2, hour: 19, minute: 30, flexibility: "flexible", priority: 3, flexMinutes: 30 },

  // Day 3 (머드스파 + 출발)
  { placeId: "nh-food-breakfast",   dayIndex: 3, hour: 8,  minute: 0,  flexibility: "flexible", priority: 2, flexMinutes: 30 },
  { placeId: "nh-spot-mudSpa",      dayIndex: 3, hour: 10, minute: 0,  flexibility: "booked",   priority: 4, flexMinutes: 30 },
  { placeId: "nh-food-seafoodLunch", dayIndex: 3, hour: 13, minute: 30, flexibility: "flexible", priority: 3, flexMinutes: 30 },
  { placeId: "nh-rest-airport",     dayIndex: 3, hour: 16, minute: 0,  flexibility: "fixed",    priority: 5, flexMinutes: 0 },
];

function buildScheduledAt(dayIndex: number, hour: number, minute: number): string {
  const date = new Date(`${START_DATE}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + dayIndex);
  date.setUTCHours(hour, minute, 0, 0);
  return date.toISOString();
}

const placeMap = new Map<string, SeedPlace>(nhaTrangPlaces.map((p) => [p.id, p]));

export const nhaTrangItinerary: ItineraryItem[] = plan.map((slot, idx) => {
  const place = placeMap.get(slot.placeId);
  if (!place) {
    throw new Error(`Seed data error: unknown place ${slot.placeId}`);
  }

  const prev = idx > 0 ? plan[idx - 1] : null;
  const dependencies =
    prev && prev.dayIndex === slot.dayIndex ? [`nh-item-${idx - 1}`] : [];

  return {
    id: `nh-item-${idx}`,
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

export const NHA_TRANG_TRIP_ID = TRIP_ID;
