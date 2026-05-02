/**
 * 도쿄(Tokyo, 일본) City 시드 — 사이클 D.
 * 한국인이 가장 많이 가는 일본 도시.
 *
 * 사이클 H (ADR-032): country 정규화 적용. 도시 차별화 항목만 유지.
 * 사이클 F (V3) 정책으로 사용자 노출은 차단(/city/[slug]에서 ComingSoonCity).
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
      label: "추천 병원 — St. Luke's International / Tokyo Medical",
      phone: "+81 3 3541 5151",
      notes: "St. Luke's는 영어 가능. 한국어는 통역 서비스 호출",
      category: "ambulance",
    },
  ],

  payment: {
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

  // phrases·utilities·visa는 country로 정규화

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

  weather: {
    season: "봄 (3~5월, 벚꽃) · 여름 (6~8월, 습) · 가을 (9~11월, 베스트) · 겨울 (12~2월, 건조)",
    avgTempC: { min: 5, max: 30 },
    notes: "벚꽃 4월 초·단풍 11월 중 베스트. 여름 매우 습함",
  },
};
