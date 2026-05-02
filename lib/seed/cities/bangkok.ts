/**
 * 방콕(Bangkok, 태국) City 시드 — 사이클 D.
 * 한국인 자유여행자 동남아 핵심 도시.
 */

import type { City } from "../../types";

export const bangkokCity: City = {
  code: "BKK",
  slug: "bangkok",
  name: "방콕",
  country: "태국",
  countryCode: "TH",

  emergencyContacts: [
    {
      label: "주 태국 대한민국 대사관",
      phone: "+66 2 247 7537",
      hours: "평일 08:30~17:00",
      notes: "한국어 가능. 야간은 +66 81 914 5803 긴급",
      category: "embassy",
    },
    {
      label: "태국 관광경찰",
      phone: "1155",
      notes: "영어 가능. 외국인 사건 전담",
      category: "police",
    },
    {
      label: "태국 응급 의료",
      phone: "1669",
      notes: "Bumrungrad·Samitivej 등 한국어 가능 병원 추천",
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
    currency: "THB",
    currencySymbol: "฿",
    approxKrwRate: 0.025, // 1 KRW ≈ 0.025 THB (1 THB ≈ 40원)
    cardAcceptance: "high",
    cardNotes:
      "MBK·시암파라곤 등 쇼핑몰 카드 OK. 야시장·튜툭은 현금. ATM 수수료 220 바트",
    atmAvailable: true,
    tipExpected: false,
    tipNotes: "고급 식당 7~10%, 마사지 50~100바트 권장",
  },

  transport: {
    primary: "metro",
    primaryNotes:
      "BTS 스카이트레인 + MRT 지하철로 시내 대부분 커버. Grab은 비 오거나 늦은 밤. 미터기 택시는 거부 빈번 — Grab 추천",
    airportToCity: {
      method: "ARL Airport Rail Link → BTS",
      durationMin: 35,
      priceKrw: 1800,
    },
    walkability: "medium",
  },

  phrases: [
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
  ],

  curatedGuides: [
    {
      id: "bkk-first-night",
      title: "방콕 첫날 밤 — 시암 + 카오산 24시간",
      subtitle: "공항 도착 → 시암 BTS → 카오산 야시장 → 새벽 마사지",
      hero: { emoji: "🛺", gradient: "from-amber to-purple-deep" },
      sections: [
        {
          heading: "1. 공항 → 시암 (ARL + BTS, 35분)",
          body: "Suvarnabhumi 지하 ARL → 파야타이 → BTS 환승 → Siam. 약 60바트.",
          tip: "Grab 콜은 비 올 때만 (러시아워 정체로 1시간+)",
        },
        {
          heading: "2. 시암파라곤 + MBK 쇼핑 (저녁 18~22시)",
          body: "시암파라곤 푸드코트는 가성비 최고. MBK 7층 푸드 & 휴대폰 액세서리.",
          tip: "MBK는 흥정 가능 — 50% 컷 시도",
        },
        {
          heading: "3. 카오산 로드 야시장 (자정까지)",
          body: "Grab 30분, 약 200바트. Pad Thai·Mango Sticky Rice·맥주 첫 잔.",
          tip: "지갑은 앞주머니, 가방은 앞쪽으로",
        },
        {
          heading: "4. 24시간 마사지 (체크인 전 푸리)",
          body: "Health Land 24시간 점포. 1시간 마사지 약 500바트.",
        },
      ],
    },
  ],

  utilities: {
    voltage: "220V",
    plugType: "A/B/C",
    simAvailable: true,
  },

  visa: {
    visaFreeDays: 90,
    eVisaRequired: false,
    notes: "한국 여권 무비자 90일 (2026년 기준)",
  },

  weather: {
    season: "건기 (11~2월, 베스트) · 더위 (3~5월) · 우기 (6~10월)",
    avgTempC: { min: 24, max: 35 },
    notes: "4월 송끄란 매우 더움. 11~2월이 BKK 베스트",
  },
};
