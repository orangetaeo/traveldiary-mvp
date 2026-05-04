/**
 * 다낭(Đà Nẵng, 베트남) 시드 데이터 — 사이클 D.
 *
 * 푸꾸옥 시드 패턴(phu-quoc.ts) 답습. 12 일정 (3박 4일).
 * OTA 매칭 6건 (도달률 50% 목표) — estimatedPrice를 OTA 중앙값 ±20% 안으로
 * 큐레이션해 모두 verified로 떨어지도록 설계.
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

const daNangPlaces: SeedPlace[] = [
  // ── Day 0 (도착) ──────────────────────────────────────────────────
  {
    id: "dn-rest-checkin",
    name: "호텔 체크인",
    category: "rest",
    location: {
      lat: 16.0656,
      lng: 108.2447,
      address: "Võ Nguyên Giáp, Đà Nẵng",
    },
    estimatedPrice: { amount: 0, currency: "VND" },
    defaultDurationMinutes: 60,
    evidence: {
      reasons: ["체크인 후 짐 정리·휴식"],
      sources: [],
      verifiedAt: VERIFIED_AT,
    },
  },
  {
    // OTA 매칭: dn-food-hanmarket (klook 31k, kkday 33k → 중앙값 32k × 18 ≈ 576k VND)
    id: "dn-food-hanmarket",
    name: "한시장 푸드 워킹투어 (Han Market Food Tour)",
    category: "food",
    location: {
      lat: 16.0683,
      lng: 108.2235,
      address: "119 Trần Phú, Hải Châu, Đà Nẵng",
    },
    estimatedPrice: { amount: 580000, currency: "VND" },
    defaultDurationMinutes: 90,
    evidence: {
      reasons: [
        "네이버 블로그 후기 348건 중 91% 긍정",
        "한국어 가이드 + 5종 시식 (반쎄오·반세오·미꽝 등)",
      ],
      sources: [
        { platform: "naver", reviewCount: 348, positiveRate: 91, lastVerified: VERIFIED_AT },
        { platform: "ota", reviewCount: 689, positiveRate: 94, lastVerified: VERIFIED_AT },
      ],
      verifiedAt: VERIFIED_AT,
    },
  },
  {
    id: "dn-spot-pinkChurch",
    name: "다낭 대성당 (Pink Cathedral)",
    category: "spot",
    location: {
      lat: 16.0664,
      lng: 108.2229,
      address: "156 Trần Phú, Hải Châu, Đà Nẵng",
    },
    estimatedPrice: { amount: 0, currency: "VND" },
    defaultDurationMinutes: 30,
    evidence: {
      reasons: ["프랑스 식민기 1923년 건립 — 핑크 사진 명소", "야경 인스타 핫스팟"],
      sources: [
        { platform: "instagram", reviewCount: 0, lastVerified: VERIFIED_AT },
      ],
      verifiedAt: VERIFIED_AT,
    },
  },

  // ── Day 1 (바나힐) ─────────────────────────────────────────────────
  {
    // OTA 매칭: dn-spot-banaHills (klook 68k, kkday 71k, agoda 72.5k → 중앙값 71k × 18 ≈ 1.278M VND)
    id: "dn-spot-banaHills",
    name: "바나힐 + 골든브릿지 (Sun World Ba Na Hills)",
    category: "spot",
    location: {
      lat: 15.9978,
      lng: 107.9899,
      address: "Hoà Ninh, Hòa Vang, Đà Nẵng",
    },
    estimatedPrice: { amount: 1280000, currency: "VND" },
    defaultDurationMinutes: 480, // 8시간 (왕복 + 관람)
    evidence: {
      reasons: [
        "네이버 블로그 후기 2,140건 중 88% 긍정",
        "골든브릿지 + 케이블카 + 프렌치빌리지 콤보",
        "한국인 방문 1순위 — 다낭 대표 액티비티",
      ],
      sources: [
        { platform: "naver", reviewCount: 2140, positiveRate: 88, lastVerified: VERIFIED_AT },
        { platform: "google", reviewCount: 18920, positiveRate: 87, lastVerified: VERIFIED_AT },
        { platform: "ota", reviewCount: 5399, positiveRate: 92, lastVerified: VERIFIED_AT },
      ],
      verifiedAt: VERIFIED_AT,
    },
  },
  {
    id: "dn-food-cauRong",
    name: "Cau Rong (용교) 강변 디너 — 까오 라우",
    category: "food",
    location: {
      lat: 16.0612,
      lng: 108.2246,
      address: "Bạch Đằng, Hải Châu, Đà Nẵng",
    },
    estimatedPrice: { amount: 350000, currency: "VND" },
    defaultDurationMinutes: 90,
    evidence: {
      reasons: ["한식보다 베트남 까오 라우 추천 (호이안 명물)", "용교 21:00 불쇼 관람"],
      sources: [
        { platform: "naver", reviewCount: 521, positiveRate: 84, lastVerified: VERIFIED_AT },
      ],
      verifiedAt: VERIFIED_AT,
    },
  },

  // ── Day 2 (미선 + 호이안) ──────────────────────────────────────────
  {
    // OTA 매칭: dn-spot-mySon (klook 47k, kkday 49k, agoda 52k → 중앙값 49k × 18 ≈ 882k VND)
    id: "dn-spot-mySon",
    name: "미선 유적 (My Son Sanctuary) 데이투어",
    category: "spot",
    location: {
      lat: 15.7639,
      lng: 108.1244,
      address: "Duy Phú, Duy Xuyên, Quảng Nam",
    },
    estimatedPrice: { amount: 880000, currency: "VND" },
    defaultDurationMinutes: 240,
    evidence: {
      reasons: [
        "UNESCO 세계문화유산 — 4~14세기 참파 왕국 사원",
        "한국어 가이드 포함 패키지",
        "네이버 블로그 후기 612건 중 86% 긍정",
      ],
      sources: [
        { platform: "naver", reviewCount: 612, positiveRate: 86, lastVerified: VERIFIED_AT },
        { platform: "ota", reviewCount: 2280, positiveRate: 91, lastVerified: VERIFIED_AT },
      ],
      verifiedAt: VERIFIED_AT,
    },
  },
  {
    id: "dn-food-hoianLunch",
    name: "반미 프엉 점심",
    category: "food",
    location: {
      lat: 15.8800,
      lng: 108.3273,
      address: "2B Phan Châu Trinh, Hội An",
    },
    estimatedPrice: { amount: 120000, currency: "VND" },
    defaultDurationMinutes: 60,
    evidence: {
      reasons: ["오바마 대통령 방문 베트남 반미 가게", "노란 건물 — 호이안 명물"],
      sources: [
        { platform: "naver", reviewCount: 1820, positiveRate: 92, lastVerified: VERIFIED_AT },
      ],
      verifiedAt: VERIFIED_AT,
    },
  },
  {
    // OTA 매칭: dn-spot-hoianTour (klook 49k, kkday 52k → 중앙값 50.5k × 18 ≈ 909k VND)
    id: "dn-spot-hoianOldtown",
    name: "호이안 올드타운 + 야경 등불",
    category: "spot",
    location: {
      lat: 15.8801,
      lng: 108.3380,
      address: "Hội An Ancient Town, Quảng Nam",
    },
    estimatedPrice: { amount: 910000, currency: "VND" },
    defaultDurationMinutes: 240,
    evidence: {
      reasons: [
        "UNESCO 문화유산 — 16~17세기 무역항 보존",
        "야경 등불 + 강 위 소원 등불 띄우기 (한국인 인스타 핫스팟)",
        "네이버 블로그 후기 3,210건 중 93% 긍정",
      ],
      sources: [
        { platform: "naver", reviewCount: 3210, positiveRate: 93, lastVerified: VERIFIED_AT },
        { platform: "google", reviewCount: 28210, positiveRate: 89, lastVerified: VERIFIED_AT },
        { platform: "ota", reviewCount: 2570, positiveRate: 94, lastVerified: VERIFIED_AT },
      ],
      verifiedAt: VERIFIED_AT,
    },
  },

  // ── Day 3 (다낭 시내) ─────────────────────────────────────────────
  {
    id: "dn-food-breakfast",
    name: "호텔 조식",
    category: "food",
    location: {
      lat: 16.0656,
      lng: 108.2447,
      address: "Võ Nguyên Giáp, Đà Nẵng",
    },
    estimatedPrice: { amount: 0, currency: "VND" },
    defaultDurationMinutes: 60,
    evidence: {
      reasons: ["호텔 패키지 포함"],
      sources: [],
      verifiedAt: VERIFIED_AT,
    },
  },
  {
    // OTA 매칭: dn-spot-marble (klook 25k, kkday 26.5k, agoda 28k → 중앙값 26.5k × 18 ≈ 477k VND)
    id: "dn-spot-marble",
    name: "응우한선 (Marble Mountains, 대리석산)",
    category: "spot",
    location: {
      lat: 16.0034,
      lng: 108.2622,
      address: "52 Huyền Trân Công Chúa, Ngũ Hành Sơn, Đà Nẵng",
    },
    estimatedPrice: { amount: 470000, currency: "VND" },
    defaultDurationMinutes: 150,
    evidence: {
      reasons: [
        "5개 산(목·화·토·금·수) 동굴 사찰",
        "엘리베이터 옵션 (도보 285계단 부담 시)",
        "네이버 블로그 후기 921건 중 89% 긍정",
      ],
      sources: [
        { platform: "naver", reviewCount: 921, positiveRate: 89, lastVerified: VERIFIED_AT },
        { platform: "ota", reviewCount: 1522, positiveRate: 92, lastVerified: VERIFIED_AT },
      ],
      verifiedAt: VERIFIED_AT,
    },
  },
  {
    // OTA 매칭: dn-spot-mykheBeach (klook 39k, kkday 41k → 중앙값 40k × 18 ≈ 720k VND)
    id: "dn-spot-mykheBeach",
    name: "미케비치 액티비티 (My Khe Beach)",
    category: "spot",
    location: {
      lat: 16.0656,
      lng: 108.2447,
      address: "Phước Mỹ, Sơn Trà, Đà Nẵng",
    },
    estimatedPrice: { amount: 720000, currency: "VND" },
    defaultDurationMinutes: 120,
    evidence: {
      reasons: [
        "포브스 선정 세계 6대 매혹 해변",
        "패러세일링 + 제트스키 패키지",
        "네이버 블로그 후기 1,485건 중 87% 긍정",
      ],
      sources: [
        { platform: "naver", reviewCount: 1485, positiveRate: 87, lastVerified: VERIFIED_AT },
        { platform: "ota", reviewCount: 833, positiveRate: 91, lastVerified: VERIFIED_AT },
      ],
      verifiedAt: VERIFIED_AT,
    },
  },
  {
    id: "dn-rest-airport",
    name: "다낭 공항 이동 / 출국",
    category: "rest",
    location: {
      lat: 16.0439,
      lng: 108.1994,
      address: "Da Nang International Airport",
    },
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
// DEMO TRIP — 다낭 3박 4일
// ═══════════════════════════════════════════════════════════════════

const TRIP_ID = "demo-trip-da-nang";
import { demoStartDate } from "./demo-date";
const START_DATE = demoStartDate(21); // 3주 후 (C1: 고정 날짜 제거)

export const daNangTrip: Trip = {
  id: TRIP_ID,
  destination: "다낭",
  destinationCode: "DAD",
  startDate: START_DATE,
  nights: 3,
  companion: "friends",
  preferences: {
    vibes: ["UNESCO 유적", "사진 명소", "현지 음식"],
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
  // Day 0 (도착)
  { placeId: "dn-rest-checkin",      dayIndex: 0, hour: 14, minute: 0,  flexibility: "fixed",    priority: 5, flexMinutes: 0 },
  { placeId: "dn-food-hanmarket",    dayIndex: 0, hour: 18, minute: 30, flexibility: "booked",   priority: 4, flexMinutes: 0 },
  { placeId: "dn-spot-pinkChurch",   dayIndex: 0, hour: 20, minute: 30, flexibility: "flexible", priority: 3, flexMinutes: 30 },

  // Day 1 (바나힐 풀데이)
  { placeId: "dn-spot-banaHills",    dayIndex: 1, hour: 9,  minute: 0,  flexibility: "booked",   priority: 5, flexMinutes: 0 },
  { placeId: "dn-food-cauRong",      dayIndex: 1, hour: 19, minute: 0,  flexibility: "flexible", priority: 3, flexMinutes: 30 },

  // Day 2 (미선 + 호이안)
  { placeId: "dn-spot-mySon",        dayIndex: 2, hour: 9,  minute: 0,  flexibility: "booked",   priority: 5, flexMinutes: 0 },
  { placeId: "dn-food-hoianLunch",   dayIndex: 2, hour: 13, minute: 0,  flexibility: "flexible", priority: 3, flexMinutes: 30 },
  { placeId: "dn-spot-hoianOldtown", dayIndex: 2, hour: 16, minute: 0,  flexibility: "booked",   priority: 5, flexMinutes: 0 },

  // Day 3 (다낭 시내 + 출발)
  { placeId: "dn-food-breakfast",    dayIndex: 3, hour: 8,  minute: 0,  flexibility: "flexible", priority: 2, flexMinutes: 30 },
  { placeId: "dn-spot-marble",       dayIndex: 3, hour: 10, minute: 0,  flexibility: "booked",   priority: 4, flexMinutes: 30 },
  { placeId: "dn-spot-mykheBeach",   dayIndex: 3, hour: 13, minute: 0,  flexibility: "booked",   priority: 4, flexMinutes: 30 },
  { placeId: "dn-rest-airport",      dayIndex: 3, hour: 17, minute: 0,  flexibility: "fixed",    priority: 5, flexMinutes: 0 },
];

function buildScheduledAt(dayIndex: number, hour: number, minute: number): string {
  const date = new Date(`${START_DATE}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + dayIndex);
  date.setUTCHours(hour, minute, 0, 0);
  return date.toISOString();
}

const placeMap = new Map<string, SeedPlace>(daNangPlaces.map((p) => [p.id, p]));

export const daNangItinerary: ItineraryItem[] = plan.map((slot, idx) => {
  const place = placeMap.get(slot.placeId);
  if (!place) {
    throw new Error(`Seed data error: unknown place ${slot.placeId}`);
  }

  // DAG: 같은 day 안에서 직전 슬롯이 선행
  const prev = idx > 0 ? plan[idx - 1] : null;
  const dependencies =
    prev && prev.dayIndex === slot.dayIndex ? [`dn-item-${idx - 1}`] : [];

  return {
    id: `dn-item-${idx}`,
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

export const DA_NANG_TRIP_ID = TRIP_ID;
