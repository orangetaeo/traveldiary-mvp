/**
 * 치앙마이(Chiang Mai, 태국) City 시드 — 사이클 OO (옵션 α, city + trip).
 *
 * 시그니처: 북부 고산 사찰·올드시티·코끼리 보호소·일요 야시장·카오소이.
 * country TH 정규화 (ADR-032). 한국인 인기 ↑ — full trip 시드 동반 (lib/seed/chiang-mai.ts).
 *
 * V3 정책(사이클 F): /city/[slug]는 ComingSoon 분기 — Bangkok과 동일.
 * trip은 listDemoTrips()에 포함 (M8 활성화는 별도 사이클).
 */

import type { City } from "../../types";

export const chiangMaiCity: City = {
  code: "CNX",
  slug: "chiang-mai",
  name: "치앙마이",
  country: "태국",
  countryCode: "TH",

  emergencyContacts: [
    {
      label: "주 태국 대한민국 대사관 (방콕 / 치앙마이 관할)",
      phone: "+66 2 247 7537",
      hours: "평일 08:30~17:00",
      notes: "한국어 가능. 야간/주말 +66 81 914 5803. 치앙마이 700km 거리",
      category: "embassy",
      url: "https://overseas.mofa.go.kr/th-ko/index.do",
    },
    {
      label: "치앙마이 관광경찰 (Tourist Police)",
      phone: "+66 53 247 318",
      notes: "1155 단축번호. Old City + 닌만한 외국인 사건 전담",
      category: "police",
    },
    {
      label: "추천 병원 — Chiang Mai Ram Hospital",
      phone: "+66 53 920 300",
      notes: "치앙마이 대표 종합병원. 24시간 응급 + 영어 통역",
      category: "ambulance",
    },
  ],

  payment: {
    cardAcceptance: "medium",
    cardNotes:
      "닌만한 카페·중대형 식당·호텔 카드 OK. 일요 야시장·재래시장은 현금. ATM 수수료 220 바트",
    atmAvailable: true,
    tipExpected: false,
    tipNotes: "마사지 50~100바트, 음식 배달 10~20바트 권장. 강제 아님",
  },

  transport: {
    primary: "walk",
    primaryNotes:
      "Old City 안에서는 도보 ↔ 송태우(빨간 트럭, 30바트). 외곽(도이수텝·코끼리)은 Grab 또는 송태우 전세. Grab은 시내 잘 잡힘",
    airportToCity: {
      method: "공항 택시 또는 Grab",
      durationMin: 20,
      priceKrw: 6000,
    },
    walkability: "high",
  },

  // phrases·utilities·visa는 country로 정규화 (TH)

  weather: {
    season: "건기 (11~2월, 베스트) · 더위 (3~5월, 헤이즈 시즌) · 우기 (6~10월)",
    avgTempC: { min: 18, max: 32 },
    notes: "11~1월 새벽 15°C까지 — 긴팔 권장. 2~4월 헤이즈(연무) 주의 — 마스크 필수",
  },

  curatedGuides: [
    {
      id: "cnx-doi-suthep-sunset",
      title: "도이수텝(Doi Suthep) 사찰 — 일몰 + 야경",
      subtitle: "16시 출발 → 1080m 산정 사찰 → 18시 일몰 + 치앙마이 야경",
      hero: { emoji: "🛕", gradient: "from-amber to-purple-deep" },
      sections: [
        {
          heading: "1. 16시 송태우 또는 Grab 출발",
          body: "Old City → 도이수텝 산정 16km. 송태우 왕복 200~300바트(흥정), Grab 250바트 편도. 산길 30분.",
          tip: "송태우는 4명 이상이면 가성비. 단독 1~2명은 Grab 권장. 입장료 30바트",
        },
        {
          heading: "2. 17시 사찰 + 309 계단",
          body: "주차장에서 309계단 또는 케이블카(50바트). 황금 체디 + 산정 전망대. 승려 축복(Phra Ratchachanok) 무료.",
          tip: "노출 어깨·짧은 반바지 입장 불가 — 사룽(20바트) 대여",
        },
        {
          heading: "3. 18시 일몰 + 치앙마이 야경",
          body: "산정 전망대에서 치앙마이 시내 360° 조망. 일몰 18:00 직후 시내 불빛 점등.",
          tip: "삼각대 가능 — 야경 인증샷 명소. 하산 19시 송태우 손님 적어 흥정 어려움 → Grab 권장",
        },
      ],
    },
    {
      id: "cnx-sunday-walking-street",
      title: "일요 야시장 (Sunday Walking Street) — 1km 노점",
      subtitle: "일요일 16시~22시. 타패 게이트 → 와트 프라싱 1km 보행자 거리",
      hero: { emoji: "🌃", gradient: "from-purple to-purple-deep" },
      sections: [
        {
          heading: "1. 16시 타패 게이트 도착",
          body: "Old City 동쪽 타패 게이트(Tha Phae Gate)에서 시작. 와트 프라싱까지 1km 직선. 토요일은 와왈라이 거리, 일요일이 메인.",
          tip: "한국인 호스트 후기: 17시가 가장 한적. 18시 이후 인파 폭증",
        },
        {
          heading: "2. 17~20시 길거리 음식 + 핸드메이드",
          body: "팟타이 50~80바트, 망고 스티키라이스 60바트, 코코넛 아이스크림 40바트. 핸드메이드 가죽·도자기·실크.",
          tip: "사찰 안마당에 푸드코트 — 좌석 있고 가격 동일. 깨끗",
        },
        {
          heading: "3. 20~22시 와트 프라싱 야간 라이트업",
          body: "일요 야시장 끝 지점 와트 프라싱(Wat Phra Singh) 사찰 야간 라이트업. 무료 입장. 시그니처 사진 명소.",
          tip: "송태우 22시 이후 흥정 어려움 — Grab 미리 호출",
        },
      ],
    },
  ],
};
