/**
 * 나트랑(Nha Trang, 베트남) City 시드 — 사이클 G-4.
 *
 * 사이클 H (ADR-032): country 정규화 적용. 도시 차별화 항목만 유지.
 * 본토 6km 백사장 + 빈원더스(섬) + 머드스파.
 */

import type { City } from "../../types";

export const nhaTrangCity: City = {
  code: "NHA",
  slug: "nha-trang",
  name: "나트랑",
  country: "베트남",
  countryCode: "VN",

  // ── 응급 연락처 (도시 차별화) ──────────────────────────────────────
  emergencyContacts: [
    {
      label: "주 호치민 대한민국 총영사관 (나트랑 관할)",
      phone: "+84 28 3824 2639",
      hours: "평일 08:30~17:00",
      notes: "한국어 가능. 나트랑은 호치민 총영사관 관할 — 야간 +84 93 850 0238",
      category: "embassy",
      url: "https://overseas.mofa.go.kr/vn-hochiminh-ko/index.do",
    },
    {
      label: "추천 병원 — Vinmec Nha Trang / VK Hospital",
      phone: "+84 258 3528 100",
      notes: "한국어 가능 의료진. Vinmec 24시간 응급실",
      category: "ambulance",
    },
  ],

  // ── 결제 (도시 차별화) ──────────────────────────────────────────────
  payment: {
    cardAcceptance: "medium",
    cardNotes:
      "리조트·빈원더스·대형 식당은 카드 OK. 야시장·로컬 시푸드·그랩은 현금 필수",
    atmAvailable: true,
    tipExpected: false,
    tipNotes: "팁 문화 약함. 마사지 5만~10만 동, 호텔 짐꾼 2만 동",
  },

  // ── 교통 ─────────────────────────────────────────────────────────────
  transport: {
    primary: "grab",
    primaryNotes:
      "그랩 + 도보(시내 해변 6km). 캄란공항(CXR)은 시내 30km 남쪽 — 그랩 약 30만~35만 동. 빈원더스는 케이블카(세계 최장 해상 케이블카 3.3km)",
    airportToCity: {
      method: "그랩 또는 셔틀버스 (CXR → 시내)",
      durationMin: 35,
      priceKrw: 16000,
    },
    walkability: "medium",
  },

  // phrases·utilities·visa는 country로 정규화

  // ── 도시별 기후 (남부 — 우기 가장 짧음) ────────────────────────────
  weather: {
    season: "건기 (1~8월) · 우기 (9~12월)",
    avgTempC: { min: 22, max: 33 },
    notes: "베트남 도시 중 우기 가장 짧음 (9~12월만). 1~8월 건조·맑음. 10~11월 태풍 가끔",
  },

  // ── 시그니처 가이드 (해변 휴양 차별화) ─────────────────────────────
  curatedGuides: [
    {
      id: "nha-trang-resort-day",
      title: "리조트 휴양 + 빈원더스 골든 24시간",
      subtitle: "비치 → 야시장 → 빈원더스 풀데이",
      hero: { emoji: "🏖️", gradient: "from-purple to-amber" },
      sections: [
        {
          heading: "1. CXR 공항 → 시내 호텔 (그랩 35분)",
          body: "캄란공항(CXR) → 시내 30km 남쪽. 그랩 30만~35만 동 또는 호텔 셔틀(15만~20만 동, 사전 예약). 호텔은 비치프론트(Tran Phu) 권장.",
          tip: "캄란공항은 작아서 입국심사 빠름(20분). 도착 즉시 eSIM(Viettel 7일 30만 동)",
        },
        {
          heading: "2. 나트랑 비치 + 시푸드 야시장 (오후~저녁)",
          body: "Tran Phu 비치는 6km 백사장. 일몰 18:00~18:30. Cho Dem 야시장(주차장 옆)은 시푸드·기념품. Lac Canh BBQ(44 Nguyễn Bỉnh Khiêm) 그릴 시푸드 명소.",
          tip: "야시장은 흥정 30~50% 깎기. 시푸드는 '시가' 표기 주의 — 주문 전 가격 확인",
        },
        {
          heading: "3. 빈원더스 나트랑 (Day 1 풀데이)",
          body: "혼쩨섬(Hon Tre) 위치. 세계 최장 해상 케이블카 3.3km(20분 소요)로 진입. 워터파크·놀이공원·수족관·돌고래쇼 통합 입장권 약 1.2M 동.",
          tip: "푸꾸옥 빈원더스보다 액티비티 다양 + 케이블카 자체가 명물. 평일 권장 (주말은 현지인+한국인 인파)",
        },
      ],
    },
    {
      id: "nha-trang-mud-spa",
      title: "Thap Ba 머드 스파 반나절",
      subtitle: "온천 + 머드 베스 + 미네랄 풀",
      hero: { emoji: "🛁", gradient: "from-amber-deep to-purple-deep" },
      sections: [
        {
          heading: "1. Thap Ba Hot Springs (시내 북쪽 4km)",
          body: "베트남 최대 머드 스파. 개인탕(Private)·단체탕(Group) 선택. 머드 베스 30분 → 미네랄 풀 → 온천. 약 18만~25만 동.",
          tip: "머드는 화장 모두 지우고 입수. 머드 마른 후 행구는 곳 줄 길음 — 평일 오전 권장",
        },
        {
          heading: "2. Ponagar 참 타워 콤보 (스파 후 2km)",
          body: "7~12세기 참파 왕국 사원. 스톤 카테드랄(1934 프랑스 식민기)도 도보 거리. 시티투어 패키지로 묶으면 한국어 가이드 포함 약 22만~24만 동.",
          tip: "참 타워는 노출 의상 금지 — 어깨/무릎 가리기. 입장권 3만 동",
        },
      ],
    },
  ],
};
