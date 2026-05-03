/**
 * 치앙마이(Chiang Mai, 태국) 시드 데이터 — 사이클 OO (V1, 옵션 α).
 *
 * feedback_city_seed_pattern 답습. 8 일정 / 2박 3일.
 * 차별화: 도이수텝 사찰 + 올드시티 사원 + 코끼리 보호소 + 일요 야시장 + 카오소이.
 *
 * matchTag prefix = cm-. 베트남 도시 키워드 충돌 회피는 도시 게이트로 처리
 * (feedback_keyword_match_collisions). M8 OTA는 별도 사이클.
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

const VERIFIED_AT = "2026-05-03T00:00:00.000Z";

const chiangMaiPlaces: SeedPlace[] = [
  // ── Day 0 (도착 + 카오소이 디너) ────────────────────────────────
  {
    id: "cm-rest-checkin",
    name: "치앙마이 Old City 호텔 체크인 (타패 게이트 인근)",
    category: "rest",
    location: {
      lat: 18.7877,
      lng: 98.9931,
      address: "Tha Phae Gate, Chiang Mai Old City",
    },
    estimatedPrice: { amount: 0, currency: "THB" },
    defaultDurationMinutes: 60,
    evidence: {
      reasons: ["Old City 동측 타패 게이트 — 도보 5분 권역에 식당·사원·송태우"],
      sources: [],
      verifiedAt: VERIFIED_AT,
    },
  },
  {
    id: "cm-food-khaoSoi",
    name: "카오소이 매사이 (Khao Soi Mae Sai) — 북부 카레 누들",
    category: "food",
    location: {
      lat: 18.7989,
      lng: 98.9892,
      address: "29/1 Ratchaphuek Alley, Chiang Mai",
    },
    estimatedPrice: { amount: 80, currency: "THB" },
    defaultDurationMinutes: 60,
    evidence: {
      reasons: [
        "치앙마이 시그니처 — 북부식 카레 누들. 매사이는 1980년부터 운영",
        "치킨 카오소이 65바트 + 망고 스무디 35바트. 한국어 메뉴 있음",
        "네이버 블로그 후기 1,250건 중 92% 긍정",
      ],
      sources: [
        { platform: "naver", reviewCount: 1250, positiveRate: 92, lastVerified: VERIFIED_AT },
        { platform: "ota", reviewCount: 890, positiveRate: 90, lastVerified: VERIFIED_AT },
      ],
      verifiedAt: VERIFIED_AT,
    },
  },

  // ── Day 1 (도이수텝 + 코끼리 보호소 + 닌만한) ─────────────────
  {
    id: "cm-spot-doiSuthep",
    name: "도이수텝(Doi Suthep) 사찰 + 309계단",
    category: "spot",
    location: {
      lat: 18.8049,
      lng: 98.9216,
      address: "Wat Phra That Doi Suthep, Chiang Mai",
    },
    estimatedPrice: { amount: 350, currency: "THB" },
    defaultDurationMinutes: 180,
    evidence: {
      reasons: [
        "치앙마이 1080m 산정 사찰 — 황금 체디 + 시내 360° 조망",
        "송태우 왕복 200바트 + 입장료 30바트 + 케이블카 50바트",
        "네이버 블로그 후기 2,180건 중 94% 긍정 — 치앙마이 1순위",
      ],
      sources: [
        { platform: "naver", reviewCount: 2180, positiveRate: 94, lastVerified: VERIFIED_AT },
        { platform: "ota", reviewCount: 1640, positiveRate: 93, lastVerified: VERIFIED_AT },
      ],
      verifiedAt: VERIFIED_AT,
    },
  },
  {
    id: "cm-spot-elephantSanctuary",
    name: "엘리펀트 자연 보호소 (Elephant Nature Park) — 윤리 투어",
    category: "spot",
    location: {
      lat: 19.2167,
      lng: 98.8500,
      address: "Mae Taeng District, Chiang Mai",
    },
    estimatedPrice: { amount: 2500, currency: "THB" },
    defaultDurationMinutes: 360,
    evidence: {
      reasons: [
        "라이딩·서커스 없는 윤리 코끼리 보호소 — 1995년 운영",
        "픽업 + 점심 + 코끼리 목욕·먹이 주기 포함. 영어 가이드 (한국어 X)",
        "네이버 블로그 후기 1,920건 중 96% 긍정 — 치앙마이 시그니처",
      ],
      sources: [
        { platform: "naver", reviewCount: 1920, positiveRate: 96, lastVerified: VERIFIED_AT },
        { platform: "ota", reviewCount: 3450, positiveRate: 95, lastVerified: VERIFIED_AT },
      ],
      verifiedAt: VERIFIED_AT,
    },
  },
  {
    id: "cm-food-nimman",
    name: "닌만한(Nimmanhaemin) 카페 거리 + 망고탱고 디저트",
    category: "food",
    location: {
      lat: 18.7969,
      lng: 98.9686,
      address: "Nimmanhaemin Road, Chiang Mai",
    },
    estimatedPrice: { amount: 250, currency: "THB" },
    defaultDurationMinutes: 90,
    evidence: {
      reasons: [
        "치앙마이 카페 거리 — Ristr8to Coffee, Mango Tango, Graph Cafe 등",
        "Old City 그랩 8분. 망고탱고 망고 빙수 145바트, 고품질 라떼 80바트",
        "네이버 블로그 후기 1,580건 중 88% 긍정",
      ],
      sources: [
        { platform: "naver", reviewCount: 1580, positiveRate: 88, lastVerified: VERIFIED_AT },
      ],
      verifiedAt: VERIFIED_AT,
    },
  },

  // ── Day 2 (올드시티 사원 + 일요 야시장 + 출발) ────────────────
  {
    id: "cm-spot-oldCityTemples",
    name: "올드시티 사원 3곳 (Wat Phra Singh + Chedi Luang + Chiang Man)",
    category: "spot",
    location: {
      lat: 18.7884,
      lng: 98.9854,
      address: "Wat Phra Singh, Chiang Mai Old City",
    },
    estimatedPrice: { amount: 80, currency: "THB" },
    defaultDurationMinutes: 180,
    evidence: {
      reasons: [
        "치앙마이 700년 역사 사원 3곳 도보 투어 — 모두 Old City 안",
        "Wat Phra Singh(40바트) + Wat Chedi Luang(40바트) + Wat Chiang Man(무료)",
        "네이버 블로그 후기 1,340건 중 90% 긍정",
      ],
      sources: [
        { platform: "naver", reviewCount: 1340, positiveRate: 90, lastVerified: VERIFIED_AT },
      ],
      verifiedAt: VERIFIED_AT,
    },
  },
  {
    id: "cm-spot-sundayMarket",
    name: "일요 야시장 (Sunday Walking Street) — 1km 보행자 거리",
    category: "spot",
    location: {
      lat: 18.7884,
      lng: 98.9931,
      address: "Ratchadamnoen Rd, Chiang Mai (Tha Phae Gate ~ Wat Phra Singh)",
    },
    estimatedPrice: { amount: 400, currency: "THB" },
    defaultDurationMinutes: 180,
    evidence: {
      reasons: [
        "일요일 16~22시 — 타패 게이트 ~ 와트 프라싱 1km 보행자 거리",
        "팟타이 50~80바트, 망고 스티키 60바트, 핸드메이드 가죽·실크 다수",
        "네이버 블로그 후기 1,720건 중 91% 긍정 — 치앙마이 야시장 1순위",
      ],
      sources: [
        { platform: "naver", reviewCount: 1720, positiveRate: 91, lastVerified: VERIFIED_AT },
        { platform: "ota", reviewCount: 980, positiveRate: 89, lastVerified: VERIFIED_AT },
      ],
      verifiedAt: VERIFIED_AT,
    },
  },
  {
    id: "cm-rest-airport",
    name: "치앙마이 국제공항(CNX) 이동 / 출국",
    category: "rest",
    location: {
      lat: 18.7669,
      lng: 98.9628,
      address: "Chiang Mai International Airport",
    },
    estimatedPrice: { amount: 0, currency: "THB" },
    defaultDurationMinutes: 30,
    evidence: {
      reasons: ["Old City → 공항 6km, Grab 15분. 체크인 2시간 전 권장"],
      sources: [],
      verifiedAt: VERIFIED_AT,
    },
  },
];

// ═══════════════════════════════════════════════════════════════════
// DEMO TRIP — 치앙마이 2박 3일
// ═══════════════════════════════════════════════════════════════════

const TRIP_ID = "demo-trip-chiang-mai";
const START_DATE = "2026-07-12"; // 일요일 (일요 야시장 Day 2 보장)

export const chiangMaiTrip: Trip = {
  id: TRIP_ID,
  destination: "치앙마이",
  destinationCode: "CNX",
  startDate: START_DATE,
  nights: 2,
  companion: "friends",
  preferences: {
    vibes: ["사찰", "카페", "코끼리"],
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
  // Day 0 (도착 + 카오소이)
  { placeId: "cm-rest-checkin",            dayIndex: 0, hour: 14, minute: 0,  flexibility: "fixed",    priority: 5, flexMinutes: 0 },
  { placeId: "cm-food-khaoSoi",            dayIndex: 0, hour: 18, minute: 30, flexibility: "flexible", priority: 4, flexMinutes: 30 },

  // Day 1 (도이수텝 + 코끼리 + 닌만한)
  { placeId: "cm-spot-elephantSanctuary",  dayIndex: 1, hour: 7,  minute: 30, flexibility: "booked",   priority: 5, flexMinutes: 0 },
  { placeId: "cm-spot-doiSuthep",          dayIndex: 1, hour: 16, minute: 0,  flexibility: "booked",   priority: 4, flexMinutes: 30 },
  { placeId: "cm-food-nimman",             dayIndex: 1, hour: 20, minute: 0,  flexibility: "flexible", priority: 3, flexMinutes: 30 },

  // Day 2 (올드시티 + 일요 야시장 + 출발)
  { placeId: "cm-spot-oldCityTemples",     dayIndex: 2, hour: 9,  minute: 0,  flexibility: "flexible", priority: 4, flexMinutes: 30 },
  { placeId: "cm-spot-sundayMarket",       dayIndex: 2, hour: 16, minute: 0,  flexibility: "fixed",    priority: 5, flexMinutes: 0 },
  { placeId: "cm-rest-airport",            dayIndex: 2, hour: 21, minute: 0,  flexibility: "fixed",    priority: 5, flexMinutes: 0 },
];

function buildScheduledAt(dayIndex: number, hour: number, minute: number): string {
  const date = new Date(`${START_DATE}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + dayIndex);
  date.setUTCHours(hour, minute, 0, 0);
  return date.toISOString();
}

const placeMap = new Map<string, SeedPlace>(
  chiangMaiPlaces.map((p) => [p.id, p]),
);

export const chiangMaiItinerary: ItineraryItem[] = plan.map((slot, idx) => {
  const place = placeMap.get(slot.placeId);
  if (!place) {
    throw new Error(`Seed data error: unknown place ${slot.placeId}`);
  }
  const prev = idx > 0 ? plan[idx - 1] : null;
  const dependencies =
    prev && prev.dayIndex === slot.dayIndex ? [`cm-item-${idx - 1}`] : [];

  return {
    id: `cm-item-${idx}`,
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

export const CHIANG_MAI_TRIP_ID = TRIP_ID;
