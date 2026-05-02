/**
 * Country 데이터 모델 — 사이클 H (ADR-032).
 *
 * 정적 lib (Prisma 미승격). City 시드의 country 단위 중복 데이터를 정규화.
 * `resolveCity()`(lib/seed/cities/index.ts)가 city + country + GLOBAL_EMERGENCY_CONTACTS를 merge.
 *
 * Prisma 승격 트리거 (ADR-032 §"미래"):
 *   1. 두 번째 country full 출시
 *   2. country 단위 query 필요
 *   3. 사용자가 country 데이터 편집 (환율 자동 업데이트 등)
 */

import type { Country, EmergencyContact, SituationalPhrase } from "../types";

// ═══════════════════════════════════════════════════════════════════
// 모든 country 공통 — 한국 발신 응급
// ═══════════════════════════════════════════════════════════════════

export const GLOBAL_EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    label: "한국어 통역 서비스 (영사 콜센터)",
    phone: "+82 2 3210 0404",
    hours: "24시간",
    notes: "외교부 무료. 통신비만 부담",
    category: "translator",
  },
  {
    label: "신용카드 분실 (KB·신한·삼성·현대)",
    phone: "+82 2 1577 0000",
    notes: "한국 카드사 통합 콜센터. 24시간",
    category: "card_lost",
  },
];

// ═══════════════════════════════════════════════════════════════════
// 베트남어 phrases (베트남 도시 공통)
// ═══════════════════════════════════════════════════════════════════

const VIETNAMESE_PHRASES: SituationalPhrase[] = [
  {
    situation: "greeting",
    korean: "안녕하세요",
    local: "Xin chào",
    pronunciation: "신짜오",
  },
  {
    situation: "thanks",
    korean: "감사합니다",
    local: "Cảm ơn",
    pronunciation: "깜언",
  },
  {
    situation: "checkout",
    korean: "계산할게요",
    local: "Tính tiền",
    pronunciation: "띤 띠엔",
  },
  {
    situation: "price",
    korean: "얼마예요?",
    local: "Bao nhiêu tiền?",
    pronunciation: "바오 니에우 띠엔",
  },
  {
    situation: "help",
    korean: "도와주세요",
    local: "Giúp tôi với",
    pronunciation: "지웁 또이 버이",
  },
  {
    situation: "slow",
    korean: "천천히 말씀해 주세요",
    local: "Xin nói chậm",
    pronunciation: "신 노이 짬",
  },
  {
    situation: "spicy",
    korean: "맵지 않게 해주세요",
    local: "Không cay",
    pronunciation: "콩 까이",
  },
];

// ═══════════════════════════════════════════════════════════════════
// 태국어 phrases (방콕 검증 데이터)
// ═══════════════════════════════════════════════════════════════════

const THAI_PHRASES: SituationalPhrase[] = [
  {
    situation: "greeting",
    korean: "안녕하세요 (남성)",
    local: "Sawatdee khrap",
    pronunciation: "사왓디 크랍",
  },
  {
    situation: "greeting",
    korean: "안녕하세요 (여성)",
    local: "Sawatdee kha",
    pronunciation: "사왓디 카",
  },
  {
    situation: "thanks",
    korean: "감사합니다",
    local: "Khop khun",
    pronunciation: "콥쿤",
  },
  {
    situation: "checkout",
    korean: "계산할게요",
    local: "Check bin",
    pronunciation: "첵빈",
  },
  {
    situation: "price",
    korean: "얼마예요?",
    local: "Tao rai?",
    pronunciation: "타오라이",
  },
  {
    situation: "spicy",
    korean: "맵지 않게 해주세요",
    local: "Mai phet",
    pronunciation: "마이펫",
  },
  {
    situation: "help",
    korean: "도와주세요",
    local: "Chuay duay",
    pronunciation: "추아이 두아이",
  },
];

// ═══════════════════════════════════════════════════════════════════
// 일본어 phrases (도쿄 검증 데이터)
// ═══════════════════════════════════════════════════════════════════

const JAPANESE_PHRASES: SituationalPhrase[] = [
  {
    situation: "greeting",
    korean: "안녕하세요",
    local: "こんにちは",
    pronunciation: "콘니치와",
  },
  {
    situation: "thanks",
    korean: "감사합니다",
    local: "ありがとうございます",
    pronunciation: "아리가또 고자이마스",
  },
  {
    situation: "checkout",
    korean: "계산할게요",
    local: "お会計お願いします",
    pronunciation: "오카이케 오네가이시마스",
  },
  {
    situation: "price",
    korean: "얼마예요?",
    local: "いくらですか",
    pronunciation: "이쿠라데스카",
  },
  {
    situation: "help",
    korean: "도와주세요",
    local: "助けてください",
    pronunciation: "타스케테 쿠다사이",
  },
  {
    situation: "slow",
    korean: "천천히 말씀해 주세요",
    local: "ゆっくり話してください",
    pronunciation: "윳쿠리 하나시테 쿠다사이",
  },
  {
    situation: "vegetarian",
    korean: "고기·생선 빼주세요",
    local: "肉と魚を抜いてください",
    pronunciation: "니쿠토 사카나오 누이테 쿠다사이",
  },
];

// ═══════════════════════════════════════════════════════════════════
// COUNTRIES
// ═══════════════════════════════════════════════════════════════════

export const COUNTRIES: Record<string, Country> = {
  // ── VN: 베트남 (사이클 G 시리즈 — 6도시) ─────────────────────────
  VN: {
    code: "VN",
    name: "베트남",
    defaultPhrases: VIETNAMESE_PHRASES,
    paymentDefaults: {
      currency: "VND",
      currencySymbol: "₫",
      approxKrwRate: 18, // 1 KRW ≈ 18 VND (변동)
    },
    utilities: {
      voltage: "220V",
      plugType: "A/C/G",
      simAvailable: true,
    },
    visa: {
      visaFreeDays: 45,
      eVisaRequired: false,
      notes: "한국 여권 무비자 45일 (2026년 기준)",
    },
    countryEmergencyContacts: [
      {
        label: "베트남 경찰",
        phone: "113",
        notes: "영어 제한적",
        category: "police",
      },
      {
        label: "베트남 응급 의료",
        phone: "115",
        notes: "도시별 추천 병원은 city.emergencyContacts 참조",
        category: "ambulance",
      },
    ],
  },

  // ── TH: 태국 (방콕 시드 검증 데이터) ──────────────────────────────
  TH: {
    code: "TH",
    name: "태국",
    defaultPhrases: THAI_PHRASES,
    paymentDefaults: {
      currency: "THB",
      currencySymbol: "฿",
      approxKrwRate: 0.025, // 1 KRW ≈ 0.025 THB (1 THB ≈ 40 KRW)
    },
    utilities: {
      voltage: "220V",
      plugType: "A/C",
      simAvailable: true,
    },
    visa: {
      visaFreeDays: 90,
      eVisaRequired: false,
      notes: "한국 여권 무비자 90일",
    },
    countryEmergencyContacts: [
      {
        label: "태국 관광경찰",
        phone: "1155",
        notes: "영어 가능. 외국인 사건 전담",
        category: "police",
      },
      {
        label: "태국 응급 의료",
        phone: "1669",
        notes: "Bumrungrad·Samitivej 등 한국어 가능 병원은 도시별 city.emergencyContacts 참조",
        category: "ambulance",
      },
    ],
  },

  // ── JP: 일본 (도쿄 시드 검증 데이터) ──────────────────────────────
  JP: {
    code: "JP",
    name: "일본",
    defaultPhrases: JAPANESE_PHRASES,
    paymentDefaults: {
      currency: "JPY",
      currencySymbol: "¥",
      approxKrwRate: 0.11, // 1 KRW ≈ 0.11 JPY (1 JPY ≈ 9원)
    },
    utilities: {
      voltage: "100V",
      plugType: "A",
      simAvailable: true,
    },
    visa: {
      visaFreeDays: 90,
      eVisaRequired: false,
      notes: "한국 여권 무비자 90일",
    },
    countryEmergencyContacts: [
      {
        label: "일본 경찰",
        phone: "110",
        notes: "영어 일부 가능. 외국인 상담은 #9110",
        category: "police",
      },
      {
        label: "일본 응급 (구급차)",
        phone: "119",
        notes: "도시별 추천 병원은 city.emergencyContacts 참조",
        category: "ambulance",
      },
    ],
  },
};

export function getCountry(code: string): Country | null {
  return COUNTRIES[code] ?? null;
}

export function listCountries(): Country[] {
  return Object.values(COUNTRIES);
}
