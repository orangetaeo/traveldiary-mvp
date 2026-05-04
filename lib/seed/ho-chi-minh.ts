/**
 * 호치민(Hồ Chí Minh, 베트남) 시드 데이터 — 사이클 G-1 (V1).
 *
 * 다낭 시드 패턴(da-nang.ts) 답습. 12 일정 (3박 4일).
 * OTA 매칭 5건 — estimatedPrice를 OTA 중앙값 ±20% 안으로 큐레이션해
 * 모두 verified로 떨어지도록 설계 (도달률 100%/검증 가능 일정 분모).
 *
 * matchTag prefix = hcm- (사이클 C 표준: pq/dn/bk/ty 답습).
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

const hoChiMinhPlaces: SeedPlace[] = [
  // ── Day 0 (도착) ──────────────────────────────────────────────────
  {
    id: "hcm-rest-checkin",
    name: "1군 호텔 체크인",
    category: "rest",
    location: {
      lat: 10.7769,
      lng: 106.7009,
      address: "Đồng Khởi, Quận 1, TP. Hồ Chí Minh",
    },
    estimatedPrice: { amount: 0, currency: "VND" },
    defaultDurationMinutes: 60,
    evidence: {
      reasons: ["체크인 후 짐 정리·휴식. 1군은 도보로 명소 커버 가능"],
      sources: [],
      verifiedAt: VERIFIED_AT,
    },
  },
  {
    // OTA 매칭: hcm-food-streetFood (klook 28k, kkday 30k → 중앙값 29k × 18 ≈ 522k VND)
    id: "hcm-food-streetFood",
    name: "벤탄시장 푸드 워킹투어 (Ben Thanh Street Food)",
    category: "food",
    location: {
      lat: 10.7723,
      lng: 106.6981,
      address: "Lê Lợi, Bến Thành, Quận 1, TP. Hồ Chí Minh",
    },
    estimatedPrice: { amount: 520000, currency: "VND" },
    defaultDurationMinutes: 120,
    evidence: {
      reasons: [
        "네이버 블로그 후기 412건 중 89% 긍정",
        "한국어 가이드 + 6종 시식 (분짜·반쎄오·고이꾸온 등)",
        "벤탄시장 야간(18~22시) 활기",
      ],
      sources: [
        { platform: "naver", reviewCount: 412, positiveRate: 89, lastVerified: VERIFIED_AT },
        { platform: "ota", reviewCount: 924, positiveRate: 92, lastVerified: VERIFIED_AT },
      ],
      verifiedAt: VERIFIED_AT,
    },
  },
  {
    id: "hcm-spot-notreDame",
    name: "사이공 노트르담 성당 + 중앙우체국",
    category: "spot",
    location: {
      lat: 10.7798,
      lng: 106.6991,
      address: "01 Công Xã Paris, Bến Nghé, Quận 1",
    },
    estimatedPrice: { amount: 0, currency: "VND" },
    defaultDurationMinutes: 45,
    evidence: {
      reasons: [
        "1880년 프랑스 식민기 건축 — 호치민 랜드마크",
        "광장 분수 + 야경 인스타 핫스팟",
        "도보 2분 거리 중앙우체국(1891) 함께 관람",
      ],
      sources: [
        { platform: "naver", reviewCount: 1280, positiveRate: 88, lastVerified: VERIFIED_AT },
      ],
      verifiedAt: VERIFIED_AT,
    },
  },

  // ── Day 1 (시내 핵심) ────────────────────────────────────────────
  {
    // OTA 매칭: hcm-spot-warMuseum (klook 18k, kkday 19k → 중앙값 18.5k × 18 ≈ 333k VND)
    id: "hcm-spot-warMuseum",
    name: "통일궁 + 전쟁 박물관 콤보",
    category: "spot",
    location: {
      lat: 10.7793,
      lng: 106.6925,
      address: "28 Võ Văn Tần, Quận 3, TP. Hồ Chí Minh",
    },
    estimatedPrice: { amount: 330000, currency: "VND" },
    defaultDurationMinutes: 180,
    evidence: {
      reasons: [
        "통일궁(1975 베트남 전쟁 종전 현장) + 전쟁박물관 한 묶음",
        "한국어 오디오 가이드 제공",
        "네이버 블로그 후기 982건 중 87% 긍정",
      ],
      sources: [
        { platform: "naver", reviewCount: 982, positiveRate: 87, lastVerified: VERIFIED_AT },
        { platform: "google", reviewCount: 24180, positiveRate: 90, lastVerified: VERIFIED_AT },
        { platform: "ota", reviewCount: 1820, positiveRate: 91, lastVerified: VERIFIED_AT },
      ],
      verifiedAt: VERIFIED_AT,
    },
  },
  {
    id: "hcm-food-bunCha",
    name: "분짜 145 (Bún Chả 145 Bùi Viện)",
    category: "food",
    location: {
      lat: 10.7670,
      lng: 106.6927,
      address: "145 Bùi Viện, Phạm Ngũ Lão, Quận 1",
    },
    estimatedPrice: { amount: 80000, currency: "VND" },
    defaultDurationMinutes: 60,
    evidence: {
      reasons: [
        "하노이식 분짜 — 숯불 돼지구이 + 쌀국수",
        "외국인 백패커 거리(부이비엔) 인근",
        "네이버 블로그 후기 643건 중 88% 긍정",
      ],
      sources: [
        { platform: "naver", reviewCount: 643, positiveRate: 88, lastVerified: VERIFIED_AT },
      ],
      verifiedAt: VERIFIED_AT,
    },
  },
  {
    // OTA 매칭: hcm-food-dinnerCruise (klook 65k, kkday 68k → 중앙값 66.5k × 18 ≈ 1.197M VND)
    id: "hcm-food-dinnerCruise",
    name: "사이공 강 디너 크루즈 (Indochina Queen)",
    category: "food",
    location: {
      lat: 10.7676,
      lng: 106.7059,
      address: "Tôn Đức Thắng, Bến Nghé, Quận 1",
    },
    estimatedPrice: { amount: 1200000, currency: "VND" },
    defaultDurationMinutes: 150,
    evidence: {
      reasons: [
        "2시간 사이공 강 야경 디너 크루즈",
        "베트남 전통 무용 공연 + 코스 디너",
        "네이버 블로그 후기 1,128건 중 86% 긍정",
      ],
      sources: [
        { platform: "naver", reviewCount: 1128, positiveRate: 86, lastVerified: VERIFIED_AT },
        { platform: "ota", reviewCount: 2310, positiveRate: 90, lastVerified: VERIFIED_AT },
      ],
      verifiedAt: VERIFIED_AT,
    },
  },

  // ── Day 2 (메콩델타) ─────────────────────────────────────────────
  {
    // OTA 매칭: hcm-spot-mekong (klook 35k, kkday 38k, agoda 40k → 중앙값 38k × 18 ≈ 684k VND)
    id: "hcm-spot-mekong",
    name: "메콩델타 미토 데이투어 (My Tho Mekong Delta)",
    category: "spot",
    location: {
      lat: 10.3597,
      lng: 106.3650,
      address: "Mỹ Tho, Tiền Giang (1군 출발지)",
    },
    estimatedPrice: { amount: 680000, currency: "VND" },
    defaultDurationMinutes: 540, // 9시간 (왕복 + 투어)
    evidence: {
      reasons: [
        "한국어 가이드 + 미토 메콩강 보트 + 코코넛 캔디 + 정글 카누",
        "1군 픽업·드롭 포함 9시간 풀데이",
        "네이버 블로그 후기 1,840건 중 85% 긍정",
      ],
      sources: [
        { platform: "naver", reviewCount: 1840, positiveRate: 85, lastVerified: VERIFIED_AT },
        { platform: "google", reviewCount: 12380, positiveRate: 86, lastVerified: VERIFIED_AT },
        { platform: "ota", reviewCount: 4290, positiveRate: 91, lastVerified: VERIFIED_AT },
      ],
      verifiedAt: VERIFIED_AT,
    },
  },
  {
    id: "hcm-food-banhMi",
    name: "반미 후인호아 (Bánh Mì Huỳnh Hoa)",
    category: "food",
    location: {
      lat: 10.7672,
      lng: 106.6963,
      address: "26 Lê Thị Riêng, Bến Thành, Quận 1",
    },
    estimatedPrice: { amount: 50000, currency: "VND" },
    defaultDurationMinutes: 30,
    evidence: {
      reasons: [
        "현지인 + 외국인 모두 인정하는 호치민 No.1 반미",
        "햄·파테 듬뿍 — 한 개로 한 끼",
        "네이버 블로그 후기 2,140건 중 94% 긍정",
      ],
      sources: [
        { platform: "naver", reviewCount: 2140, positiveRate: 94, lastVerified: VERIFIED_AT },
        { platform: "google", reviewCount: 8920, positiveRate: 92, lastVerified: VERIFIED_AT },
      ],
      verifiedAt: VERIFIED_AT,
    },
  },

  // ── Day 3 (출발) ─────────────────────────────────────────────────
  {
    id: "hcm-food-breakfast",
    name: "호텔 조식 / 카페 압한",
    category: "food",
    location: {
      lat: 10.7769,
      lng: 106.7009,
      address: "Đồng Khởi, Quận 1",
    },
    estimatedPrice: { amount: 0, currency: "VND" },
    defaultDurationMinutes: 60,
    evidence: {
      reasons: ["호텔 패키지 포함. 또는 카페 압한(Cộng Cà Phê)에서 코코넛 커피"],
      sources: [],
      verifiedAt: VERIFIED_AT,
    },
  },
  {
    // OTA 매칭: hcm-spot-cyclo (klook 22k, kkday 24k, agoda 25k → 중앙값 24k × 18 ≈ 432k VND)
    id: "hcm-spot-cyclo",
    name: "시클로 시내투어 (Cyclo City Tour)",
    category: "spot",
    location: {
      lat: 10.7769,
      lng: 106.7009,
      address: "Đồng Khởi, Quận 1 (출발지)",
    },
    estimatedPrice: { amount: 430000, currency: "VND" },
    defaultDurationMinutes: 120,
    evidence: {
      reasons: [
        "1군 핵심 5곳(중앙우체국·통일궁·벤탄·사이공오페라·티엔허우 사원) 시클로 2시간",
        "한국어 가이드 동행 가능",
        "네이버 블로그 후기 524건 중 90% 긍정",
      ],
      sources: [
        { platform: "naver", reviewCount: 524, positiveRate: 90, lastVerified: VERIFIED_AT },
        { platform: "ota", reviewCount: 1180, positiveRate: 88, lastVerified: VERIFIED_AT },
      ],
      verifiedAt: VERIFIED_AT,
    },
  },
  {
    id: "hcm-rest-airport",
    name: "탄손녓 공항 이동 / 출국",
    category: "rest",
    location: {
      lat: 10.8188,
      lng: 106.6519,
      address: "Tan Son Nhat International Airport (SGN)",
    },
    estimatedPrice: { amount: 0, currency: "VND" },
    defaultDurationMinutes: 30,
    evidence: {
      reasons: ["체크인 2시간 전 도착 권장. 1군 → 공항 그랩 25분"],
      sources: [],
      verifiedAt: VERIFIED_AT,
    },
  },
];

// ═══════════════════════════════════════════════════════════════════
// DEMO TRIP — 호치민 3박 4일
// ═══════════════════════════════════════════════════════════════════

const TRIP_ID = "demo-trip-ho-chi-minh";
import { demoStartDate } from "./demo-date";
const START_DATE = demoStartDate(28); // 4주 후 (C1: 고정 날짜 제거)

export const hoChiMinhTrip: Trip = {
  id: TRIP_ID,
  destination: "호치민",
  destinationCode: "SGN",
  startDate: START_DATE,
  nights: 3,
  companion: "friends",
  preferences: {
    vibes: ["역사 유적", "현지 음식", "강변 야경"],
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
  { placeId: "hcm-rest-checkin",     dayIndex: 0, hour: 14, minute: 0,  flexibility: "fixed",    priority: 5, flexMinutes: 0 },
  { placeId: "hcm-food-streetFood",  dayIndex: 0, hour: 18, minute: 30, flexibility: "booked",   priority: 4, flexMinutes: 0 },
  { placeId: "hcm-spot-notreDame",   dayIndex: 0, hour: 21, minute: 0,  flexibility: "flexible", priority: 3, flexMinutes: 30 },

  // Day 1 (시내 핵심)
  { placeId: "hcm-spot-warMuseum",   dayIndex: 1, hour: 9,  minute: 0,  flexibility: "booked",   priority: 5, flexMinutes: 0 },
  { placeId: "hcm-food-bunCha",      dayIndex: 1, hour: 13, minute: 0,  flexibility: "flexible", priority: 3, flexMinutes: 30 },
  { placeId: "hcm-food-dinnerCruise", dayIndex: 1, hour: 19, minute: 0,  flexibility: "booked",   priority: 5, flexMinutes: 0 },

  // Day 2 (메콩델타 풀데이)
  { placeId: "hcm-spot-mekong",      dayIndex: 2, hour: 8,  minute: 0,  flexibility: "booked",   priority: 5, flexMinutes: 0 },
  { placeId: "hcm-food-banhMi",      dayIndex: 2, hour: 19, minute: 30, flexibility: "flexible", priority: 3, flexMinutes: 30 },

  // Day 3 (시내 마무리 + 출발)
  { placeId: "hcm-food-breakfast",   dayIndex: 3, hour: 8,  minute: 0,  flexibility: "flexible", priority: 2, flexMinutes: 30 },
  { placeId: "hcm-spot-cyclo",       dayIndex: 3, hour: 10, minute: 0,  flexibility: "booked",   priority: 4, flexMinutes: 30 },
  { placeId: "hcm-food-banhMi",      dayIndex: 3, hour: 13, minute: 0,  flexibility: "flexible", priority: 3, flexMinutes: 30 },
  { placeId: "hcm-rest-airport",     dayIndex: 3, hour: 16, minute: 0,  flexibility: "fixed",    priority: 5, flexMinutes: 0 },
];

function buildScheduledAt(dayIndex: number, hour: number, minute: number): string {
  const date = new Date(`${START_DATE}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + dayIndex);
  date.setUTCHours(hour, minute, 0, 0);
  return date.toISOString();
}

const placeMap = new Map<string, SeedPlace>(hoChiMinhPlaces.map((p) => [p.id, p]));

export const hoChiMinhItinerary: ItineraryItem[] = plan.map((slot, idx) => {
  const place = placeMap.get(slot.placeId);
  if (!place) {
    throw new Error(`Seed data error: unknown place ${slot.placeId}`);
  }

  // DAG: 같은 day 안에서 직전 슬롯이 선행
  const prev = idx > 0 ? plan[idx - 1] : null;
  const dependencies =
    prev && prev.dayIndex === slot.dayIndex ? [`hcm-item-${idx - 1}`] : [];

  return {
    id: `hcm-item-${idx}`,
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

export const HO_CHI_MINH_TRIP_ID = TRIP_ID;
