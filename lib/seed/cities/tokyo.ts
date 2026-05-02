/**
 * 도쿄(Tokyo, 일본) City 시드 — 사이클 D.
 * 한국인이 가장 많이 가는 일본 도시.
 */

import type { City } from "../../types";

export const tokyoCity: City = {
  code: "TYO",
  slug: "tokyo",
  name: "도쿄",
  country: "일본",
  countryCode: "JP",

  emergencyContacts: [
    {
      label: "주 일본 대한민국 대사관",
      phone: "+81 3 3455 2601",
      hours: "평일 09:00~17:30",
      notes: "한국어 가능. 야간 +81 90 4544 6602 긴급",
      category: "embassy",
    },
    {
      label: "일본 경찰",
      phone: "110",
      notes: "영어 일부 가능. 외국인 상담은 #9110",
      category: "police",
    },
    {
      label: "일본 응급 (구급차)",
      phone: "119",
      notes: "구급+소방 통합. 한국어 통역 연결 요청",
      category: "ambulance",
    },
    {
      label: "한국어 통역 (영사 콜센터)",
      phone: "+82 2 3210 0404",
      hours: "24시간",
      notes: "외교부 무료. 통신비만 부담",
      category: "translator",
    },
    {
      label: "신용카드 분실 (한국 카드사)",
      phone: "+82 2 1577 0000",
      notes: "24시간",
      category: "card_lost",
    },
  ],

  payment: {
    currency: "JPY",
    currencySymbol: "¥",
    approxKrwRate: 0.11, // 1 KRW ≈ 0.11 JPY (1 JPY ≈ 9원)
    cardAcceptance: "high",
    cardNotes:
      "편의점·체인 식당·교통 IC 카드 모두 OK. 작은 식당·재래시장은 현금. 7-Eleven ATM은 한국 카드 인출 가능",
    atmAvailable: true,
    tipExpected: false,
    tipNotes: "팁 문화 없음 — 주지 마세요",
  },

  transport: {
    primary: "metro",
    primaryNotes:
      "JR + Tokyo Metro + 사철 합쳐 압도적. Suica/PASMO IC 카드 필수. 택시는 비싸 (기본 500엔)",
    airportToCity: {
      method: "Narita Express 또는 Skyliner",
      durationMin: 60,
      priceKrw: 30000,
    },
    walkability: "high",
  },

  phrases: [
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
  ],

  curatedGuides: [
    {
      id: "tyo-first-night",
      title: "도쿄 첫날 — 시부야 + 신주쿠 야경 코스",
      subtitle: "공항 → 시부야 스크램블 → 신주쿠 골든가이 → 라멘 마무리",
      hero: { emoji: "🗼", gradient: "from-purple to-accent" },
      sections: [
        {
          heading: "1. 공항 → 도쿄 (Narita Express, 60분)",
          body: "나리타 → 도쿄/시부야/신주쿠 직행. JR Pass 있으면 무료. 약 3,000엔 (한국 카드 OK).",
          tip: "공항 JR EAST 카운터에서 Suica 충전 (5,000엔 권장)",
        },
        {
          heading: "2. 시부야 스크램블 + 109 (저녁 18~20시)",
          body: "출구 8번 직행. 스타벅스 2층 창가에서 인생샷.",
          tip: "사람 가장 많은 19시 직전이 베스트",
        },
        {
          heading: "3. 신주쿠 골든가이 야경 + 술 (21~23시)",
          body: "JR 야마노테선 신주쿠 → 동쪽 출구. 골든가이 270개 골목 술집. 외국인 환영 술집은 입구에 영어 메뉴.",
          tip: "테이블 차지 500~1,000엔 — 사전 확인",
        },
        {
          heading: "4. 일창 라멘 마무리 (23시~새벽)",
          body: "이치란/이치란 신주쿠점 24시간. 톤코츠 라멘 약 1,000엔. 자판기 주문.",
        },
      ],
    },
  ],

  utilities: {
    voltage: "100V",
    plugType: "A",
    simAvailable: true,
  },

  visa: {
    visaFreeDays: 90,
    eVisaRequired: false,
    notes: "한국 여권 무비자 90일 (2026년 기준)",
  },

  weather: {
    season: "봄 (3~5월, 벚꽃) · 여름 (6~8월, 습) · 가을 (9~11월, 베스트) · 겨울 (12~2월, 건조)",
    avgTempC: { min: 5, max: 30 },
    notes: "벚꽃 4월 초·단풍 11월 중 베스트. 여름 매우 습함",
  },
};
