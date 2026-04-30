/**
 * 다낭(Đà Nẵng) City 시드 — 사이클 8.5 (M5 보강).
 *
 * 한국인이 가장 많이 가는 베트남 도시 중 하나. 호이안·후에 인근.
 * 푸꾸옥 시드 패턴 답습. MVP 필드 + visa/utilities/weather 채움.
 */

import type { City } from "../../types";

export const daNangCity: City = {
  code: "DAD",
  slug: "da-nang",
  name: "다낭",
  country: "베트남",
  countryCode: "VN",

  // ── 응급 연락처 ────────────────────────────────────────────────────
  emergencyContacts: [
    {
      label: "주 다낭 대한민국 총영사관",
      phone: "+84 236 3556 100",
      hours: "평일 08:30~17:00",
      notes: "한국어 가능. 야간/주말은 +84 90 940 1500 긴급",
      category: "embassy",
    },
    {
      label: "베트남 경찰",
      phone: "113",
      notes: "영어 제한적",
      category: "police",
    },
    {
      label: "베트남 응급 의료",
      phone: "115",
      notes: "Vinmec 다낭, Family Hospital 추천",
      category: "ambulance",
    },
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
  ],

  // ── 결제 ─────────────────────────────────────────────────────────────
  payment: {
    currency: "VND",
    currencySymbol: "₫",
    approxKrwRate: 18,
    cardAcceptance: "medium",
    cardNotes:
      "리조트·대형 식당·쇼핑몰은 카드 OK. 야시장·로컬 식당·그랩은 현금 필수.",
    atmAvailable: true,
    tipExpected: false,
    tipNotes: "팁 문화 약함. 마사지·호텔 짐꾼에 2만~5만 동",
  },

  // ── 교통 ─────────────────────────────────────────────────────────────
  transport: {
    primary: "grab",
    primaryNotes:
      "그랩 압도적. 다낭 시내 ↔ 호이안(약 30km)도 그랩으로 1시간. 미터기 택시는 우회 위험",
    airportToCity: {
      method: "그랩 (시내까지)",
      durationMin: 15,
      priceKrw: 6000,
    },
    walkability: "medium",
  },

  // ── 상황별 한마디 ────────────────────────────────────────────────────
  phrases: [
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
  ],

  // ── 시그니처 가이드 ──────────────────────────────────────────────────
  curatedGuides: [
    {
      id: "dad-first-day",
      title: "다낭 첫날, 호이안 야간 + 미케 비치 일출",
      subtitle: "공항 도착 → 야간 호이안 등불 → 새벽 미케 일출 26시간",
      hero: { emoji: "🏮", gradient: "from-accent to-purple-deep" },
      sections: [
        {
          heading: "1. 공항 → 호텔 (그랩 15분)",
          body: "다낭 국제공항 → 한씨장 강변 호텔 추천. 그랩 6만 동 내외.",
          tip: "공항에서 eSIM 즉시 활성화 (Viettel 7일권 약 30만 동)",
        },
        {
          heading: "2. 호이안 등불 야간 (저녁 18~22시)",
          body: "다낭 시내 → 호이안 그랩 1시간, 약 25만 동. 등불 꼭대기는 17시 점등. 강 등불 띄우기는 1만 동.",
          tip: "월요일 저녁은 야간시장 일부 휴무 — 화/수/목 권장",
        },
        {
          heading: "3. 새벽 미케 비치 일출 (5:30~6:00)",
          body: "한씨장에서 도보 15분. 5월 일출 ~5:25. 인생샷 + 카페 코코넛 (My An Pier 24시간 카페).",
        },
      ],
    },
  ],

  // ── 후속 필드 (사이클 8.5 신규 채움) ────────────────────────────────
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

  weather: {
    season: "건기 (1~7월) · 우기 (8~12월)",
    avgTempC: { min: 22, max: 33 },
    notes: "9~11월 태풍 가능. 4~5월이 베스트 시즌",
  },
};
