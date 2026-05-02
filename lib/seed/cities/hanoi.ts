/**
 * 하노이(Hà Nội, 베트남) City 시드 — 사이클 G-2.
 *
 * 사이클 H (ADR-032): country 정규화 적용. 도시 차별화 항목만 유지.
 * 차별화: 분짜 본고장 + 4계절 기후 + 하롱베이 게이트웨이 + 구시가지 36거리.
 */

import type { City } from "../../types";

export const hanoiCity: City = {
  code: "HAN",
  slug: "hanoi",
  name: "하노이",
  country: "베트남",
  countryCode: "VN",

  // ── 응급 연락처 (도시 차별화) ──────────────────────────────────────
  emergencyContacts: [
    {
      label: "주 베트남 대한민국 대사관 (하노이 본관)",
      phone: "+84 24 3831 5111",
      hours: "평일 08:30~17:00",
      notes: "한국어 가능. 야간/주말 +84 90 402 6126 긴급",
      category: "embassy",
      url: "https://overseas.mofa.go.kr/vn-ko/index.do",
    },
    {
      label: "추천 병원 — Vinmec Times City / Bach Mai Hospital",
      phone: "+84 24 3974 3556",
      notes: "한국어 가능 의료진. Vinmec 24시간 응급실",
      category: "ambulance",
    },
  ],

  // ── 결제 (도시 차별화) ──────────────────────────────────────────────
  payment: {
    cardAcceptance: "medium",
    cardNotes:
      "구시가지 카페·롯데센터·이온몰은 카드 OK. 분짜·반미·그랩은 현금 필수. 호안끼엠 노점도 현금만",
    atmAvailable: true,
    tipExpected: false,
    tipNotes: "팁 문화 약함. 마사지 5만 동, 호텔 짐꾼 2만 동",
  },

  // ── 교통 ─────────────────────────────────────────────────────────────
  transport: {
    primary: "grab",
    primaryNotes:
      "그랩 + 시클로(구시가지). 노이바이 공항(HAN)은 시내 30km 북쪽 — 1군 비교 시 호치민(7km)보다 훨씬 멀음. 출퇴근 정체 심함",
    airportToCity: {
      method: "그랩 (노이바이 → 구시가지)",
      durationMin: 50,
      priceKrw: 16000,
    },
    walkability: "high",
  },

  // phrases·utilities·visa는 country로 정규화

  // ── 도시별 기후 (하노이는 4계절 — 호치민과 차별화) ──────────────────
  weather: {
    season: "사계절 (봄 3~4월·여름 5~9월·가을 10~11월·겨울 12~2월)",
    avgTempC: { min: 10, max: 32 },
    notes:
      "호치민과 달리 4계절. 12~2월 10도 내외 서늘 — 패딩 필요. 5~9월 우기 + 폭염. 10~11월·3~4월이 베스트 시즌",
  },

  // ── 시그니처 가이드 (북부 차별화) ────────────────────────────────────
  curatedGuides: [
    {
      id: "han-northern-3day",
      title: "하노이 핵심 + 하롱베이 3박 골든 루트",
      subtitle: "구시가지 → 분짜 본고장 → 하롱베이 풀데이",
      hero: { emoji: "🛶", gradient: "from-purple-deep to-accent" },
      sections: [
        {
          heading: "1. 노이바이 공항 → 구시가지 (그랩 50분)",
          body: "하노이 노이바이 공항(HAN)은 시내 북쪽 30km. 호치민보다 멀어 그랩 30만 동 내외. 호안끼엠/구시가지 호텔 추천 — 도보 동선 최강.",
          tip: "공항 도착 즉시 eSIM 활성화 (Viettel/Mobifone). 출퇴근 시간(7~9시·17~19시)은 1시간 이상",
        },
        {
          heading: "2. 분짜 흐엉리엔 (오바마 식당) 점심",
          body: "Bún Chả Hương Liên. 24 Lê Văn Hưu. 오바마 + 앤서니 부르댕 합석 자리(2호점) 그대로 보존. '오바마 콤보' 8.5만 동.",
          tip: "12~13시 줄 길지만 회전 빠름. 분짜 본고장 답게 호치민 분짜와 결정적으로 다름 (북부=숯불향 강함)",
        },
        {
          heading: "3. 하롱베이 데이투어 (Day 2 풀데이)",
          body: "1박 크루즈 vs 데이투어 선택. 데이투어는 8시간(왕복 6h + 관광 2h). 한국어 가이드 패키지 추천 — 동굴·카약·해상 점심 포함.",
          tip: "5~9월 우기 태풍 가능 — 직전 날씨 확인. 12~3월이 베스트(맑음·서늘)",
        },
        {
          heading: "4. 탕롱 수상인형극 (저녁 18시 또는 20시)",
          body: "11세기 시작된 베트남 전통 공연. 호안끼역 호수 옆 극장. 45분 공연 12만 동. 한국어 자막 없음 — 음악·인형 동작으로 충분.",
          tip: "토/일 매진 잦음 — 도착 당일 예매 권장. Klook·KKday 할인 있음",
        },
      ],
    },
  ],
};
