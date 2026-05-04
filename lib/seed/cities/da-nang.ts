/**
 * 다낭(Đà Nẵng) City 시드 — 사이클 8.5 (M5 보강).
 *
 * 사이클 H (ADR-032): country 단위 데이터를 lib/constants/countries.ts로 정규화.
 * 도시 차별화 항목만 유지 (영사관·추천 병원·환율 메모·교통·기후·큐레이션).
 */

import type { City } from "../../types";

export const daNangCity: City = {
  code: "DAD",
  slug: "da-nang",
  name: "다낭",
  country: "베트남",
  countryCode: "VN",

  // ── 응급 연락처 (도시 차별화만) ────────────────────────────────────
  emergencyContacts: [
    {
      label: "주 다낭 대한민국 총영사관",
      phone: "+84 236 3556 100",
      hours: "평일 08:30~17:00",
      notes: "한국어 가능. 야간/주말은 +84 90 940 1500 긴급",
      category: "embassy",
      url: "https://overseas.mofa.go.kr/vn-danang-ko/index.do",
    },
    {
      label: "추천 병원 — Vinmec 다낭 / Family Hospital",
      phone: "+84 236 3711 111",
      notes: "한국어 가능 의료진. Vinmec 24시간 응급실",
      category: "ambulance",
    },
  ],

  // ── 결제 (도시 차별화) ──────────────────────────────────────────────
  payment: {
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

  // phrases·utilities·visa는 country로 정규화 (resolveCity merge)

  // ── 도시별 기후 ──────────────────────────────────────────────────────
  weather: {
    season: "건기 (1~7월) · 우기 (8~12월)",
    avgTempC: { min: 22, max: 33 },
    notes: "9~11월 태풍 가능. 4~5월이 베스트 시즌",
  },

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
          heading: "2. 한시장 + 콩카페 오후 (14~16시)",
          body: "한시장(Hàn Market)에서 건과일·커피·드라이망고 쇼핑. 2층 기념품보다 1층 식품이 가성비. 인근 콩카페(Cộng Cà Phê)에서 코코넛 스무디 4만 동.",
          tip: "한시장은 정가제 아닌 흥정 시장 — 처음 부르는 가격의 60~70%가 적정",
        },
        {
          heading: "3. 호이안 등불 야간 (저녁 18~22시)",
          body: "다낭 시내 → 호이안 그랩 1시간, 약 25만 동. 등불 꼭대기는 17시 점등. 강 등불 띄우기는 1만 동.",
          tip: "월요일 저녁은 야간시장 일부 휴무 — 화/수/목 권장",
        },
        {
          heading: "4. 새벽 미케 비치 일출 (5:30~6:00)",
          body: "한씨장에서 도보 15분. 5월 일출 ~5:25. 인생샷 + 카페 코코넛 (My An Pier 24시간 카페).",
        },
        {
          heading: "5. 바나힐 + 골든브릿지 (Day 2 오전)",
          body: "다낭 시내에서 그랩 40분. 케이블카 왕복 + 테마파크 포함 입장료 약 85만 동. 골든브릿지(거대 손 조형물) 인생샷은 오전 9~10시가 안개 걷히고 인파 적음.",
          tip: "오후보다 오전이 구름 적음. 케이블카 20분 — 멀미 주의. 산 위 기온은 시내보다 5~8도 낮음",
        },
        {
          heading: "6. 용다리 + 한강 야경 (저녁 20~21시)",
          body: "용다리(Dragon Bridge) 불쇼 — 토/일 21시 용 입에서 불+물 분출 5분. 한강변 산책로 + 야시장 노점 + 아이스 코코넛.",
          tip: "불쇼 때 다리 양쪽 인파 밀집 — 동쪽(APEC 공원) 쪽이 사진 앵글 좋음",
        },
      ],
    },
  ],
};
