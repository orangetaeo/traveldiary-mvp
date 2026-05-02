/**
 * 방콕(Bangkok, 태국) City 시드 — 사이클 D.
 * 한국인 자유여행자 동남아 핵심 도시.
 *
 * 사이클 H (ADR-032): country 정규화 적용. 도시 차별화 항목만 유지.
 * 사이클 F (V3) 정책으로 사용자 노출은 차단(/city/[slug]에서 ComingSoonCity).
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
      label: "추천 병원 — Bumrungrad / Samitivej",
      phone: "+66 2 066 8888",
      notes: "한국어 가능 의료진. Bumrungrad 24시간 응급실",
      category: "ambulance",
    },
  ],

  payment: {
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

  // phrases·utilities·visa는 country로 정규화

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

  weather: {
    season: "건기 (11~2월, 베스트) · 더위 (3~5월) · 우기 (6~10월)",
    avgTempC: { min: 24, max: 35 },
    notes: "4월 송끄란 매우 더움. 11~2월이 BKK 베스트",
  },
};
