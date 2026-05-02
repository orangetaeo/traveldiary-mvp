/**
 * 푸꾸옥(Phú Quốc) City 시드 — 사이클 8 M5 (ADR 없음, 5b-2 정책 답습).
 *
 * 사이클 H (ADR-032): country 단위 데이터(phrases·utilities·visa·payment 일부·
 * 영사 콜센터·카드 분실·국가 경찰/응급)를 lib/constants/countries.ts로 정규화.
 * 도시 차별화 항목(영사관·추천 병원·환율·결제 메모·교통·기후·큐레이션)만 city에 유지.
 */

import type { City } from "../../types";

export const phuQuocCity: City = {
  code: "PQC",
  slug: "phu-quoc",
  name: "푸꾸옥",
  country: "베트남",
  countryCode: "VN",

  // ── 응급 연락처 (도시별 영사관 + 추천 병원만; 국가 경찰/응급·영사콜센터·
  //    카드 분실은 country/GLOBAL로 정규화)
  emergencyContacts: [
    {
      label: "주 호치민 대한민국 총영사관 (푸꾸옥 관할)",
      phone: "+84 28 3822 5757",
      hours: "평일 08:30~17:00 (한국시간 +0)",
      notes: "한국어 가능. 야간/주말은 +84 90 940 1500 긴급 라인",
      category: "embassy",
    },
    {
      label: "추천 병원 — 빈멕(Vinmec) 푸꾸옥",
      phone: "+84 297 3985 588",
      notes: "한국어 가능 의료진. 24시간 응급실. 일반 응급 115와 별도 직통",
      category: "ambulance",
    },
  ],

  // ── 결제 (도시 차별화 항목만; currency/symbol/rate는 country로 정규화) ──
  payment: {
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

  // phrases는 country.defaultPhrases(베트남어 7개)로 정규화 (resolveCity merge)

  // ── 도시별 기후 (country로 옮기지 않음 — 베트남 북부/중부/남부 다름) ───
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
