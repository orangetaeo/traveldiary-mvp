/**
 * 푸꾸옥(Phú Quốc) City 시드 — 사이클 8 M5 (ADR 없음, 5b-2 정책 답습).
 *
 * MVP 필드 채움: emergencyContacts, payment, transport, phrases, curatedGuides 1건.
 * 후속 필드(utilities, visa, weather)는 사이클 8.5+에서.
 *
 * 콘텐츠는 한국인 자유여행자 시각으로 큐레이션. 단순 정보 나열이 아닌
 * "처음 가도 안전하게" 우선순위 설정.
 */

import type { City } from "../../types";

export const phuQuocCity: City = {
  code: "PQC",
  slug: "phu-quoc",
  name: "푸꾸옥",
  country: "베트남",
  countryCode: "VN",

  // ── 응급 연락처 (T16 검증) ──────────────────────────────────────────
  emergencyContacts: [
    {
      label: "주 호치민 대한민국 총영사관",
      phone: "+84 28 3822 5757",
      hours: "평일 08:30~17:00 (한국시간 +0)",
      notes: "한국어 가능. 야간/주말은 +84 90 940 1500 긴급 라인",
      category: "embassy",
    },
    {
      label: "베트남 경찰",
      phone: "113",
      notes: "영어 제한적. 호텔 도움 받을 것",
      category: "police",
    },
    {
      label: "베트남 응급 의료",
      phone: "115",
      notes: "현지 병원 — 빈멕(Vinmec) 푸꾸옥 추천",
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
    approxKrwRate: 18, // 1 KRW ≈ 18 VND (변동)
    cardAcceptance: "medium",
    cardNotes:
      "리조트·고급 식당·대형 마트는 카드 OK. 야시장·로컬 식당·그랩은 현금 필수.",
    atmAvailable: true,
    tipExpected: false,
    tipNotes: "팁 문화 약함. 호텔 짐꾼·마사지에 2만~5만 동 정도면 충분",
  },

  // ── 교통 ─────────────────────────────────────────────────────────────
  transport: {
    primary: "grab",
    primaryNotes:
      "그랩이 압도적. 미터기 택시는 우회 위험 — 그랩 우선. 오토바이 그랩(GrabBike)은 $1~2 수준",
    airportToCity: {
      method: "그랩 (즈엉동 시내까지)",
      durationMin: 25,
      priceKrw: 8000,
    },
    walkability: "low",
  },

  // ── 상황별 한마디 (B8) ────────────────────────────────────────────────
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

  // ── 후속 필드 (사이클 8.5 보강) ─────────────────────────────────────
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
    season: "건기 (11~4월, 베스트) · 우기 (5~10월)",
    avgTempC: { min: 24, max: 32 },
    notes: "5~10월 스콜성 비 잦음. 11~3월이 일출/해변 베스트",
  },

  // ── 시그니처 가이드 (1건) ────────────────────────────────────────────
  curatedGuides: [
    {
      id: "pq-first-night",
      title: "푸꾸옥 도착 첫날 밤",
      subtitle: "공항 도착 → 즈엉동 야시장 3시간 코스",
      hero: { emoji: "🌙", gradient: "from-purple to-accent" },
      sections: [
        {
          heading: "1. 공항에서 그랩으로 시내",
          body: "공항 출구 우측 그랩 픽업 존. 즈엉동 시내까지 25분, 약 8만~12만 동. Grab 앱 미설치 시 공항 와이파이로 설치 후 호출.",
          tip: "현금 옵션 선택해두면 카드 없이도 결제됨",
        },
        {
          heading: "2. 호텔 체크인 후 즈엉동 야시장 (Dinh Cậu Night Market)",
          body: "해 진 후 18~22시가 절정. 입구쪽보다 안쪽 골목으로 들어가면 가격이 30% 내려감.",
          tip: "포 요리·해산물·코코넛 아이스크림 3종은 필수",
        },
        {
          heading: "3. 사오비치 사진 명소 5분",
          body: "야시장에서 그랩 7분. 야간 조명이 들어와 흰 모래가 보랏빛으로 보임. 인생샷 1컷.",
          tip: "21시 이후엔 인적 드문 구간 피할 것",
        },
        {
          heading: "4. 24시간 편의점에서 다음 날 준비물",
          body: "물 2L·자외선 차단제·모기 기피제. 빈마트(VinMart) 24시간 매장 근처에 있음.",
        },
      ],
    },
  ],
};
