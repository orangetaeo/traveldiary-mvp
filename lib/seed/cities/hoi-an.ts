/**
 * 호이안(Hội An, 베트남) City 시드 — 사이클 G-3 (V1, 옵션 β).
 *
 * 사이클 H (ADR-032): country 정규화 적용. 도시 차별화 항목만 유지.
 * **옵션 β**: 독립 City 시드만. itinerary는 다낭 trip Day 2 부속 활용.
 */

import type { City } from "../../types";

export const hoiAnCity: City = {
  code: "HOI",
  slug: "hoi-an",
  name: "호이안",
  country: "베트남",
  countryCode: "VN",

  // ── 응급 연락처 (호이안은 다낭 총영사관 관할) ──────────────────────
  emergencyContacts: [
    {
      label: "주 다낭 대한민국 총영사관 (호이안 관할)",
      phone: "+84 236 3556 100",
      hours: "평일 08:30~17:00",
      notes: "한국어 가능. 다낭에서 호이안 30km — 야간/주말 +84 90 940 1500",
      category: "embassy",
      url: "https://overseas.mofa.go.kr/vn-danang-ko/index.do",
    },
    {
      label: "호이안 관광경찰 (Tourist Police)",
      phone: "+84 235 3861 204",
      notes: "올드타운 내 외국인 사건 전담",
      category: "police",
    },
    {
      label: "추천 병원 — Hoi An Hospital / Vinmec 다낭",
      phone: "+84 235 3914 660",
      notes: "Vinmec 다낭(30km) 한국어 가능. 응급은 다낭으로",
      category: "ambulance",
    },
  ],

  // ── 결제 (호이안 차별화 — 노점/야시장 현금 위주) ───────────────────
  payment: {
    cardAcceptance: "low",
    cardNotes:
      "올드타운 노점·야시장·강 등불 띄우기는 현금 필수. 호텔·일부 식당만 카드 OK. ATM은 올드타운 외곽에 위치",
    atmAvailable: true,
    tipExpected: false,
    tipNotes: "팁 문화 약함. 자전거 가이드에게 5만~10만 동",
  },

  // ── 교통 (호이안 차별화: 자전거 + 도보) ────────────────────────────
  transport: {
    primary: "walk",
    primaryNotes:
      "올드타운 차량 통제(09~21시) — 자전거 + 도보가 핵심. 호텔에서 자전거 무료 또는 일 5만 동 렌트. 다낭/안방비치는 그랩 또는 호텔 셔틀",
    airportToCity: {
      method: "다낭 공항(DAD) → 호이안 그랩 또는 셔틀",
      durationMin: 60,
      priceKrw: 18000,
    },
    walkability: "high",
  },

  // phrases·utilities·visa는 country로 정규화

  // ── 도시별 기후 (다낭과 동일 중부) ──────────────────────────────────
  weather: {
    season: "건기 (1~7월) · 우기 (8~12월)",
    avgTempC: { min: 22, max: 33 },
    notes: "다낭과 동일 기후. 9~11월 태풍·홍수 주의(투본강 범람 사례). 4~5월이 베스트",
  },

  // ── 시그니처 가이드 (호이안 본질) ───────────────────────────────────
  curatedGuides: [
    {
      id: "hoi-an-lantern-night",
      title: "호이안 등불 야간 골든 6시간",
      subtitle: "16시 도착 → 등불 점등 → 강 등불 띄우기 → 야시장",
      hero: { emoji: "🏮", gradient: "from-amber to-purple-deep" },
      sections: [
        {
          heading: "1. 도착 + 자전거 픽업 (16시)",
          body: "다낭에서 그랩 1시간 또는 호텔 셔틀. 호텔에서 자전거 무료(또는 일 5만 동) — 올드타운은 차량 통제(09~21시)이므로 자전거가 가장 빠름.",
          tip: "보름달 즈음(음력 14·15일) 방문하면 등불 축제 — 차량 완전 통제·전기 끔. 강가 노란 종이 등불 띄우기 1만 동",
        },
        {
          heading: "2. 일본교 + 일본인 묘지 (17~18시)",
          body: "16세기 일본 상인이 만든 'Chùa Cầu' 일본교는 호이안 상징. 다리 안 작은 사찰 입장 무료. 양옆 노란 건물 골목 + 빨간 등불이 인생샷.",
          tip: "통합 입장권(올드타운 패스) 12만 동 — 5개 명소 선택 입장. 일본교는 외관만 봐도 충분",
        },
        {
          heading: "3. 까오 라우 디너 (18~19시)",
          body: "Cao Lầu(까오 라우)는 호이안 명물 면 — 우물 'Bá Lễ' 물로만 만든다는 전설. Quán Cao Lầu Liên(18 Thái Phiên) 또는 Bale Well 추천. 5만~7만 동.",
          tip: "다낭 까오 라우는 진짜가 아니라는 말이 있음 — 호이안 우물 물 사용 여부가 갈리는 지점",
        },
        {
          heading: "4. 강 등불 띄우기 + 야시장 (19~22시)",
          body: "투본강 보트 30분 + 노란 등불 띄우기. 보트 1대 15만 동(2~4인). 다리 건너 야시장 — 등불 가게·한약·실크 의류.",
          tip: "현금 결제만. 흥정은 30~50% 깎기 표준. 한국어 가능 가게 많음(다낭과 묶음 패턴 영향)",
        },
      ],
    },
    {
      id: "hoi-an-anbang-beach",
      title: "안방비치 반나절 — 한가한 다낭 미케 대안",
      subtitle: "오전 자전거 → 안방비치 → 시푸드 점심",
      hero: { emoji: "🏖️", gradient: "from-purple to-purple-deep" },
      sections: [
        {
          heading: "1. 호이안 → 안방비치 자전거 25분",
          body: "올드타운에서 4km. 자전거로 25분(평지). 호텔에서 비치까지 자전거 셔틀 무료 옵션 종종 있음.",
          tip: "다낭 미케비치는 도시 인접 + 패키지 호텔 많아 붐비고, 안방비치는 호이안 분위기로 한가함",
        },
        {
          heading: "2. 비치 클럽 + 시푸드 점심",
          body: "An Bang Beach Bar / Soul Kitchen — 선베드 무료(주문 시) + 시푸드. 새우구이·랍스터·홍합 그릴 1인 30만~50만 동.",
          tip: "11~3월은 파도 큼·수영 비추 (보드만). 4~9월이 베스트 — 단 우기 오후 스콜",
        },
      ],
    },
  ],
};
