/**
 * 하노이(Hà Nội, 베트남) 시드 데이터 — 사이클 G-2 (V1).
 *
 * 호치민(SGN) 시드 패턴 답습. 12 일정 (3박 4일).
 * 차별화: 하롱베이 + 닌빈 짱안 풀데이 2개 (북부 게이트웨이) + 분짜 본고장 + 수상인형극.
 *
 * OTA 매칭 5건 — verified 100% 보장 (도달률 5/12 ≈ 41.7%).
 * matchTag prefix = han-.
 */

import type {
  Evidence,
  ItemCategory,
  ItineraryItem,
  Trip,
} from "../types";

// ═══════════════════════════════════════════════════════════════════
// PLACES — 일정에서 참조하는 풀 (12곳, 일정 1:1 대응)
// ═══════════════════════════════════════════════════════════════════

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

const hanoiPlaces: SeedPlace[] = [
  // ── Day 0 (도착) ──────────────────────────────────────────────────
  {
    id: "han-rest-checkin",
    name: "구시가지 호텔 체크인",
    category: "rest",
    location: {
      lat: 21.0341,
      lng: 105.8506,
      address: "Hàng Bạc, Hoàn Kiếm, Hà Nội",
    },
    estimatedPrice: { amount: 0, currency: "VND" },
    defaultDurationMinutes: 60,
    evidence: {
      reasons: [
        "체크인 후 짐 정리·휴식. 구시가지(36거리)는 도보로 명소 대부분 커버",
      ],
      sources: [],
      verifiedAt: VERIFIED_AT,
    },
  },
  {
    id: "han-spot-hoanKiem",
    name: "호안끼엠 호수 + 옥산사 산책",
    category: "spot",
    location: {
      lat: 21.0285,
      lng: 105.8542,
      address: "Hoàn Kiếm Lake, Hoàn Kiếm, Hà Nội",
    },
    estimatedPrice: { amount: 0, currency: "VND" },
    defaultDurationMinutes: 90,
    evidence: {
      reasons: [
        "하노이 심장부 — 거북이 전설의 호수",
        "옥산사(Đền Ngọc Sơn) + 빨간 다리 인스타 명소",
        "호수 둘레 1.7km 산책로 — 노을 시간 베스트",
      ],
      sources: [
        { platform: "naver", reviewCount: 2840, positiveRate: 91, lastVerified: VERIFIED_AT },
      ],
      verifiedAt: VERIFIED_AT,
    },
  },
  {
    id: "han-food-eggCoffee",
    name: "카페 자ng 에그커피 (Cafe Giảng)",
    category: "food",
    location: {
      lat: 21.0335,
      lng: 105.8530,
      address: "39 Nguyễn Hữu Huân, Hoàn Kiếm, Hà Nội",
    },
    estimatedPrice: { amount: 35000, currency: "VND" },
    defaultDurationMinutes: 30,
    evidence: {
      reasons: [
        "에그커피 원조 (1946년 응우옌 자ng이 우유 부족기에 계란으로 대체)",
        "현재 손자 운영 — 골목 안쪽 2층 좁은 공간",
        "네이버 블로그 후기 1,420건 중 88% 긍정",
      ],
      sources: [
        { platform: "naver", reviewCount: 1420, positiveRate: 88, lastVerified: VERIFIED_AT },
        { platform: "google", reviewCount: 6820, positiveRate: 89, lastVerified: VERIFIED_AT },
      ],
      verifiedAt: VERIFIED_AT,
    },
  },
  {
    // OTA 매칭: han-food-streetFoodTour (klook 32k, kkday 34k → 중앙값 33k × 18 ≈ 594k VND)
    id: "han-food-streetFoodTour",
    name: "하노이 구시가지 푸드 워킹투어",
    category: "food",
    location: {
      lat: 21.0341,
      lng: 105.8506,
      address: "Hàng Bè, Hoàn Kiếm, Hà Nội (출발지)",
    },
    estimatedPrice: { amount: 590000, currency: "VND" },
    defaultDurationMinutes: 180,
    evidence: {
      reasons: [
        "구시가지 36거리 8종 시식 (분짜·반쿠온·짜까·차오·체)",
        "한국어 가이드 + 가족 운영 식당 위주",
        "네이버 블로그 후기 612건 중 92% 긍정",
      ],
      sources: [
        { platform: "naver", reviewCount: 612, positiveRate: 92, lastVerified: VERIFIED_AT },
        { platform: "ota", reviewCount: 1180, positiveRate: 94, lastVerified: VERIFIED_AT },
      ],
      verifiedAt: VERIFIED_AT,
    },
  },

  // ── Day 1 (닌빈 짱안 풀데이) ──────────────────────────────────────
  {
    // OTA 매칭: han-spot-ninhBinh (klook 42k, kkday 45k → 중앙값 43.5k × 18 ≈ 783k VND)
    id: "han-spot-ninhBinh",
    name: "닌빈 짱안 + 호아루 데이투어 (Trang An + Hoa Lu)",
    category: "spot",
    location: {
      lat: 20.2506,
      lng: 105.9744,
      address: "Tràng An, Ninh Bình (1군 픽업 → 닌빈)",
    },
    estimatedPrice: { amount: 780000, currency: "VND" },
    defaultDurationMinutes: 540, // 9시간 (왕복 + 투어)
    evidence: {
      reasons: [
        "UNESCO 복합유산 — 짱안 보트 투어 + 호아루 옛 수도",
        "'육지의 하롱베이' 카르스트 지형 + 동굴",
        "한국어 가이드 패키지 (Klook/KKday) — 점심 포함",
        "네이버 블로그 후기 980건 중 89% 긍정",
      ],
      sources: [
        { platform: "naver", reviewCount: 980, positiveRate: 89, lastVerified: VERIFIED_AT },
        { platform: "google", reviewCount: 12480, positiveRate: 91, lastVerified: VERIFIED_AT },
        { platform: "ota", reviewCount: 2840, positiveRate: 93, lastVerified: VERIFIED_AT },
      ],
      verifiedAt: VERIFIED_AT,
    },
  },
  {
    id: "han-food-bunCha",
    name: "분짜 흐엉리엔 (오바마 식당)",
    category: "food",
    location: {
      lat: 21.0182,
      lng: 105.8521,
      address: "24 Lê Văn Hưu, Hai Bà Trưng, Hà Nội",
    },
    estimatedPrice: { amount: 85000, currency: "VND" },
    defaultDurationMinutes: 60,
    evidence: {
      reasons: [
        "북부 분짜 본고장 — 호치민 분짜와 결정적 차이(숯불향 강함)",
        "2016년 오바마 + 앤서니 부르댕 합석 자리(2호점) 보존",
        "'오바마 콤보' 8.5만 동 — 분짜 + 짜조 + 맥주",
        "네이버 블로그 후기 2,420건 중 86% 긍정",
      ],
      sources: [
        { platform: "naver", reviewCount: 2420, positiveRate: 86, lastVerified: VERIFIED_AT },
        { platform: "google", reviewCount: 18920, positiveRate: 87, lastVerified: VERIFIED_AT },
      ],
      verifiedAt: VERIFIED_AT,
    },
  },

  // ── Day 2 (하롱베이 풀데이) ──────────────────────────────────────
  {
    // OTA 매칭: han-spot-halong (klook 55k, kkday 58k, agoda 60k → 중앙값 58k × 18 ≈ 1.044M VND)
    id: "han-spot-halong",
    name: "하롱베이 데이투어 (Ha Long Bay Day Cruise)",
    category: "spot",
    location: {
      lat: 20.9101,
      lng: 107.1839,
      address: "Hạ Long Bay, Quảng Ninh (1군 픽업 → 하롱)",
    },
    estimatedPrice: { amount: 1040000, currency: "VND" },
    defaultDurationMinutes: 540, // 9시간 (왕복 + 크루즈)
    evidence: {
      reasons: [
        "UNESCO 자연유산 — 1969개 카르스트 섬",
        "한국어 가이드 + 동굴 탐방 + 카약 + 해상 점심",
        "Klook/KKday 데이투어 패키지 (1박 크루즈 대안)",
        "네이버 블로그 후기 3,480건 중 88% 긍정",
      ],
      sources: [
        { platform: "naver", reviewCount: 3480, positiveRate: 88, lastVerified: VERIFIED_AT },
        { platform: "google", reviewCount: 28920, positiveRate: 90, lastVerified: VERIFIED_AT },
        { platform: "ota", reviewCount: 4980, positiveRate: 92, lastVerified: VERIFIED_AT },
      ],
      verifiedAt: VERIFIED_AT,
    },
  },
  {
    // OTA 매칭: han-spot-waterPuppet (klook 12k, kkday 13k → 중앙값 12.5k × 18 ≈ 225k VND)
    id: "han-spot-waterPuppet",
    name: "탕롱 수상인형극 (Thang Long Water Puppet)",
    category: "spot",
    location: {
      lat: 21.0303,
      lng: 105.8533,
      address: "57B Đinh Tiên Hoàng, Hoàn Kiếm, Hà Nội",
    },
    estimatedPrice: { amount: 220000, currency: "VND" },
    defaultDurationMinutes: 60,
    evidence: {
      reasons: [
        "11세기 시작된 베트남 전통 공연 — 호안끼엠 옆 극장",
        "45분 공연 (음악 + 인형 동작) — 한국어 자막 없어도 충분",
        "Klook/KKday 할인권으로 매진 회피",
        "네이버 블로그 후기 1,820건 중 84% 긍정",
      ],
      sources: [
        { platform: "naver", reviewCount: 1820, positiveRate: 84, lastVerified: VERIFIED_AT },
        { platform: "ota", reviewCount: 3210, positiveRate: 89, lastVerified: VERIFIED_AT },
      ],
      verifiedAt: VERIFIED_AT,
    },
  },

  // ── Day 3 (시내 마무리 + 출발) ────────────────────────────────────
  {
    id: "han-food-breakfast",
    name: "호텔 조식 / 포 가 (Phở Gà)",
    category: "food",
    location: {
      lat: 21.0341,
      lng: 105.8506,
      address: "Hàng Bạc, Hoàn Kiếm, Hà Nội",
    },
    estimatedPrice: { amount: 0, currency: "VND" },
    defaultDurationMinutes: 60,
    evidence: {
      reasons: [
        "호텔 패키지 또는 구시가지 포가(닭쌀국수) — 북부 정통 맑은 국물",
      ],
      sources: [],
      verifiedAt: VERIFIED_AT,
    },
  },
  {
    // OTA 매칭: han-spot-cityTour (klook 25k, kkday 27k → 중앙값 26k × 18 ≈ 468k VND)
    id: "han-spot-cityTour",
    name: "호치민 영묘 + 문묘 시티투어 콤보",
    category: "spot",
    location: {
      lat: 21.0369,
      lng: 105.8345,
      address: "Lăng Chủ tịch Hồ Chí Minh, Ba Đình, Hà Nội",
    },
    estimatedPrice: { amount: 470000, currency: "VND" },
    defaultDurationMinutes: 180,
    evidence: {
      reasons: [
        "호치민 영묘(엄숙복식 필수) + 한기둥 사원(Một Cột) + 문묘(베트남 최초 대학)",
        "한국어 가이드 + 사이클로 패키지 (Klook/KKday)",
        "네이버 블로그 후기 1,240건 중 87% 긍정",
      ],
      sources: [
        { platform: "naver", reviewCount: 1240, positiveRate: 87, lastVerified: VERIFIED_AT },
        { platform: "ota", reviewCount: 1680, positiveRate: 90, lastVerified: VERIFIED_AT },
      ],
      verifiedAt: VERIFIED_AT,
    },
  },
  {
    id: "han-rest-airport",
    name: "노이바이 공항 이동 / 출국",
    category: "rest",
    location: {
      lat: 21.2200,
      lng: 105.8059,
      address: "Noi Bai International Airport (HAN)",
    },
    estimatedPrice: { amount: 0, currency: "VND" },
    defaultDurationMinutes: 30,
    evidence: {
      reasons: [
        "체크인 2시간 전 도착 권장. 구시가지 → 공항 그랩 50분(정체 시 1.5시간)",
      ],
      sources: [],
      verifiedAt: VERIFIED_AT,
    },
  },
];

// ═══════════════════════════════════════════════════════════════════
// DEMO TRIP — 하노이 3박 4일
// ═══════════════════════════════════════════════════════════════════

const TRIP_ID = "demo-trip-hanoi";
const START_DATE = "2026-07-02"; // 목요일 (호치민 6-18, 다낭 6-04 다음)

export const hanoiTrip: Trip = {
  id: TRIP_ID,
  destination: "하노이",
  destinationCode: "HAN",
  startDate: START_DATE,
  nights: 3,
  companion: "friends",
  preferences: {
    vibes: ["UNESCO 유산", "구시가지", "북부 자연"],
    pace: "balanced",
    excludes: [],
  },
  createdAt: VERIFIED_AT,
  status: "draft",
  currentMode: "pre-travel",
};

// ── 시연 일정 12개 (Day 0~3) ──────────────────────────────────────

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
  // Day 0 (도착 + 구시가지)
  { placeId: "han-rest-checkin",       dayIndex: 0, hour: 14, minute: 0,  flexibility: "fixed",    priority: 5, flexMinutes: 0 },
  { placeId: "han-spot-hoanKiem",      dayIndex: 0, hour: 16, minute: 0,  flexibility: "flexible", priority: 3, flexMinutes: 30 },
  { placeId: "han-food-eggCoffee",     dayIndex: 0, hour: 17, minute: 30, flexibility: "flexible", priority: 2, flexMinutes: 30 },
  { placeId: "han-food-streetFoodTour", dayIndex: 0, hour: 18, minute: 30, flexibility: "booked",   priority: 5, flexMinutes: 0 },

  // Day 1 (닌빈 풀데이)
  { placeId: "han-spot-ninhBinh",      dayIndex: 1, hour: 8,  minute: 0,  flexibility: "booked",   priority: 5, flexMinutes: 0 },
  { placeId: "han-food-bunCha",        dayIndex: 1, hour: 19, minute: 0,  flexibility: "flexible", priority: 4, flexMinutes: 30 },

  // Day 2 (하롱베이 풀데이)
  { placeId: "han-spot-halong",        dayIndex: 2, hour: 8,  minute: 0,  flexibility: "booked",   priority: 5, flexMinutes: 0 },
  { placeId: "han-spot-waterPuppet",   dayIndex: 2, hour: 18, minute: 0,  flexibility: "booked",   priority: 4, flexMinutes: 0 },

  // Day 3 (시내 마무리 + 출발)
  { placeId: "han-food-breakfast",     dayIndex: 3, hour: 8,  minute: 0,  flexibility: "flexible", priority: 2, flexMinutes: 30 },
  { placeId: "han-spot-cityTour",      dayIndex: 3, hour: 9,  minute: 30, flexibility: "booked",   priority: 4, flexMinutes: 30 },
  { placeId: "han-food-bunCha",        dayIndex: 3, hour: 13, minute: 0,  flexibility: "flexible", priority: 3, flexMinutes: 30 },
  { placeId: "han-rest-airport",       dayIndex: 3, hour: 16, minute: 0,  flexibility: "fixed",    priority: 5, flexMinutes: 0 },
];

function buildScheduledAt(dayIndex: number, hour: number, minute: number): string {
  const date = new Date(`${START_DATE}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + dayIndex);
  date.setUTCHours(hour, minute, 0, 0);
  return date.toISOString();
}

const placeMap = new Map<string, SeedPlace>(hanoiPlaces.map((p) => [p.id, p]));

export const hanoiItinerary: ItineraryItem[] = plan.map((slot, idx) => {
  const place = placeMap.get(slot.placeId);
  if (!place) {
    throw new Error(`Seed data error: unknown place ${slot.placeId}`);
  }

  const prev = idx > 0 ? plan[idx - 1] : null;
  const dependencies =
    prev && prev.dayIndex === slot.dayIndex ? [`han-item-${idx - 1}`] : [];

  return {
    id: `han-item-${idx}`,
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

export const HANOI_TRIP_ID = TRIP_ID;
