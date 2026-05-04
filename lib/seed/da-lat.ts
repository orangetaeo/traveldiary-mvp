/**
 * 달랏(Đà Lạt, 베트남) 시드 데이터 — 사이클 K (V1, 옵션 α).
 *
 * feedback_city_seed_pattern 답습. 8 일정 / 2박 3일.
 * 차별화: 1500m 고원 + 야시장 + 랑비앙 일출 + 다탄라 알파인 코스터.
 *
 * matchTag prefix = dl-. 다낭/푸꾸옥과 키워드 충돌(야시장·폭포 등) 회피는
 * 도시 게이트로 처리(feedback_keyword_match_collisions).
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

const daLatPlaces: SeedPlace[] = [
  // ── Day 0 (도착 + 야시장) ──────────────────────────────────────
  {
    id: "dl-rest-checkin",
    name: "달랏 시내 호텔 체크인 (Hoa Binh Square 인근)",
    category: "rest",
    location: {
      lat: 11.9416,
      lng: 108.4373,
      address: "Hoa Binh Square, Da Lat",
    },
    estimatedPrice: { amount: 0, currency: "VND" },
    defaultDurationMinutes: 60,
    evidence: {
      reasons: ["체크인 후 짐 정리·휴식. 야시장·쑤언흐엉 호수 도보 5~10분 권역"],
      sources: [],
      verifiedAt: VERIFIED_AT,
    },
  },
  {
    // OTA 매칭: 달랏 야시장 푸드 워킹투어
    id: "dl-food-nightMarket",
    name: "달랏 야시장 푸드 워킹투어 (반짱느엉 + 두유)",
    category: "food",
    location: {
      lat: 11.9420,
      lng: 108.4378,
      address: "Hoa Binh Square Night Market, Da Lat",
    },
    estimatedPrice: { amount: 380000, currency: "VND" },
    defaultDurationMinutes: 150,
    evidence: {
      reasons: [
        "베트남 유일 추운 야시장(13~15°C) — 따뜻한 두유 + 반짱느엉 명물",
        "한국어 가능 가이드 + 7~9종 시식 (베트남 피자·분배·아티초크 차)",
        "네이버 블로그 후기 962건 중 89% 긍정",
      ],
      sources: [
        { platform: "naver", reviewCount: 962, positiveRate: 89, lastVerified: VERIFIED_AT },
        { platform: "ota", reviewCount: 1240, positiveRate: 92, lastVerified: VERIFIED_AT },
      ],
      verifiedAt: VERIFIED_AT,
    },
  },

  // ── Day 1 (랑비앙 일출 + 크레이지 하우스 + 다탄라) ─────────────
  {
    // OTA 매칭: 랑비앙 일출 지프 투어
    id: "dl-spot-langbiang",
    name: "랑비앙 일출 지프 투어 (1929m)",
    category: "spot",
    location: {
      lat: 12.0419,
      lng: 108.4192,
      address: "Lang Biang Mountain, Lac Duong",
    },
    estimatedPrice: { amount: 720000, currency: "VND" },
    defaultDurationMinutes: 240,
    evidence: {
      reasons: [
        "베트남 남부 최고봉 1929m — 일출 + 운해 명당",
        "지프 왕복 30만 동/대 + 호텔 새벽 픽업 포함",
        "네이버 블로그 후기 1,420건 중 91% 긍정 (운해 70% 확률 — 11~3월 건기)",
      ],
      sources: [
        { platform: "naver", reviewCount: 1420, positiveRate: 91, lastVerified: VERIFIED_AT },
        { platform: "ota", reviewCount: 856, positiveRate: 93, lastVerified: VERIFIED_AT },
      ],
      verifiedAt: VERIFIED_AT,
    },
  },
  {
    id: "dl-spot-crazyHouse",
    name: "크레이지 하우스 (Hằng Nga Guest House)",
    category: "spot",
    location: {
      lat: 11.9374,
      lng: 108.4324,
      address: "3 Huỳnh Thúc Kháng, Da Lat",
    },
    estimatedPrice: { amount: 90000, currency: "VND" },
    defaultDurationMinutes: 90,
    evidence: {
      reasons: [
        "건축가 Đặng Việt Nga 50년 작품 — 가우디 풍 동굴·나무 건축",
        "달랏 시내 도보·그랩 10분. 입장료 9만 동",
        "네이버 블로그 후기 1,160건 중 84% 긍정",
      ],
      sources: [
        { platform: "naver", reviewCount: 1160, positiveRate: 84, lastVerified: VERIFIED_AT },
      ],
      verifiedAt: VERIFIED_AT,
    },
  },
  {
    // OTA 매칭: 다탄라 알파인 코스터
    id: "dl-spot-datanla",
    name: "다탄라 폭포 + 알파인 코스터",
    category: "spot",
    location: {
      lat: 11.8889,
      lng: 108.4434,
      address: "Datanla Waterfall, Da Lat",
    },
    estimatedPrice: { amount: 540000, currency: "VND" },
    defaultDurationMinutes: 180,
    evidence: {
      reasons: [
        "달랏 시내 7km — 그랩 15분. 알파인 코스터 1.6km 직접 운전(어른 25만 동)",
        "폭포 3단 + 코스터 + 케이블카 콤보. 한국인 인기 시그니처",
        "네이버 블로그 후기 894건 중 88% 긍정",
      ],
      sources: [
        { platform: "naver", reviewCount: 894, positiveRate: 88, lastVerified: VERIFIED_AT },
        { platform: "ota", reviewCount: 1080, positiveRate: 90, lastVerified: VERIFIED_AT },
      ],
      verifiedAt: VERIFIED_AT,
    },
  },

  // ── Day 2 (꽃밭 + 케이블카 + 출발) ────────────────────────────
  {
    id: "dl-spot-flowerGarden",
    name: "달랏 플라워 가든 + Me Linh 커피 농장",
    category: "spot",
    location: {
      lat: 11.9619,
      lng: 108.4572,
      address: "Da Lat Flower Park",
    },
    estimatedPrice: { amount: 120000, currency: "VND" },
    defaultDurationMinutes: 150,
    evidence: {
      reasons: [
        "달랏 = 베트남 꽃 도시. 11~3월 매화·코스모스·해바라기",
        "Me Linh 커피 농장 견학 + 시음(코피 루왁 포함). 시내 그랩 20분",
        "네이버 블로그 후기 612건 중 86% 긍정",
      ],
      sources: [
        { platform: "naver", reviewCount: 612, positiveRate: 86, lastVerified: VERIFIED_AT },
      ],
      verifiedAt: VERIFIED_AT,
    },
  },
  {
    // OTA 매칭: 봉어비치 케이블카
    id: "dl-spot-cableCar",
    name: "달랏 케이블카 + Truc Lam 사찰",
    category: "spot",
    location: {
      lat: 11.9087,
      lng: 108.4478,
      address: "Da Lat Cable Car Station",
    },
    estimatedPrice: { amount: 220000, currency: "VND" },
    defaultDurationMinutes: 120,
    evidence: {
      reasons: [
        "달랏 시내 → Truc Lam 선원 2.3km 케이블카. 왕복 11만 동",
        "쑤언흐엉 호수 + 소나무숲 파노라마. 사찰 무료 입장",
        "네이버 블로그 후기 524건 중 90% 긍정",
      ],
      sources: [
        { platform: "naver", reviewCount: 524, positiveRate: 90, lastVerified: VERIFIED_AT },
        { platform: "ota", reviewCount: 412, positiveRate: 91, lastVerified: VERIFIED_AT },
      ],
      verifiedAt: VERIFIED_AT,
    },
  },
  {
    id: "dl-rest-airport",
    name: "리엔크엉 공항(DLI) 이동 / 출국",
    category: "rest",
    location: {
      lat: 11.7503,
      lng: 108.3672,
      address: "Lien Khuong International Airport",
    },
    estimatedPrice: { amount: 0, currency: "VND" },
    defaultDurationMinutes: 30,
    evidence: {
      reasons: ["체크인 2시간 전 도착 권장. 공항 셔틀 또는 그랩 40분"],
      sources: [],
      verifiedAt: VERIFIED_AT,
    },
  },
];

// ═══════════════════════════════════════════════════════════════════
// DEMO TRIP — 달랏 2박 3일
// ═══════════════════════════════════════════════════════════════════

const TRIP_ID = "demo-trip-da-lat";
import { demoStartDate } from "./demo-date";
const START_DATE = demoStartDate(24); // 24일 후 (C1: 고정 날짜 제거)

export const daLatTrip: Trip = {
  id: TRIP_ID,
  destination: "달랏",
  destinationCode: "DLI",
  startDate: START_DATE,
  nights: 2,
  companion: "friends",
  preferences: {
    vibes: ["고원 휴양", "야시장", "사진 명소"],
    pace: "balanced",
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
  { placeId: "dl-rest-checkin",     dayIndex: 0, hour: 14, minute: 0,  flexibility: "fixed",    priority: 5, flexMinutes: 0 },
  { placeId: "dl-food-nightMarket", dayIndex: 0, hour: 18, minute: 0,  flexibility: "booked",   priority: 4, flexMinutes: 30 },

  // Day 1 (랑비앙 일출 + 시내 + 다탄라)
  { placeId: "dl-spot-langbiang",   dayIndex: 1, hour: 4,  minute: 30, flexibility: "booked",   priority: 5, flexMinutes: 0 },
  { placeId: "dl-spot-crazyHouse",  dayIndex: 1, hour: 11, minute: 0,  flexibility: "flexible", priority: 3, flexMinutes: 30 },
  { placeId: "dl-spot-datanla",     dayIndex: 1, hour: 14, minute: 0,  flexibility: "booked",   priority: 4, flexMinutes: 30 },

  // Day 2 (꽃밭 + 케이블카 + 출발)
  { placeId: "dl-spot-flowerGarden", dayIndex: 2, hour: 9, minute: 0,  flexibility: "flexible", priority: 3, flexMinutes: 30 },
  { placeId: "dl-spot-cableCar",    dayIndex: 2, hour: 12, minute: 30, flexibility: "booked",   priority: 4, flexMinutes: 30 },
  { placeId: "dl-rest-airport",     dayIndex: 2, hour: 16, minute: 0,  flexibility: "fixed",    priority: 5, flexMinutes: 0 },
];

function buildScheduledAt(dayIndex: number, hour: number, minute: number): string {
  const date = new Date(`${START_DATE}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + dayIndex);
  date.setUTCHours(hour, minute, 0, 0);
  return date.toISOString();
}

const placeMap = new Map<string, SeedPlace>(daLatPlaces.map((p) => [p.id, p]));

export const daLatItinerary: ItineraryItem[] = plan.map((slot, idx) => {
  const place = placeMap.get(slot.placeId);
  if (!place) {
    throw new Error(`Seed data error: unknown place ${slot.placeId}`);
  }
  const prev = idx > 0 ? plan[idx - 1] : null;
  const dependencies =
    prev && prev.dayIndex === slot.dayIndex ? [`dl-item-${idx - 1}`] : [];

  return {
    id: `dl-item-${idx}`,
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

export const DA_LAT_TRIP_ID = TRIP_ID;
