/**
 * 호치민(Hồ Chí Minh, 베트남) City 시드 — 사이클 G-1.
 *
 * 사이클 H (ADR-032): country 정규화 적용. 도시 차별화 항목만 유지.
 */

import type { City } from "../../types";

export const hoChiMinhCity: City = {
  code: "SGN",
  slug: "ho-chi-minh",
  name: "호치민",
  country: "베트남",
  countryCode: "VN",

  // ── 응급 연락처 (도시 차별화) ──────────────────────────────────────
  emergencyContacts: [
    {
      label: "주 호치민 대한민국 총영사관",
      phone: "+84 28 3824 2639",
      hours: "평일 08:30~17:00",
      notes: "한국어 가능. 야간/주말은 +84 93 850 0238 긴급",
      category: "embassy",
      url: "https://overseas.mofa.go.kr/vn-hochiminh-ko/index.do",
    },
    {
      label: "추천 병원 — FV Hospital / Vinmec Central Park",
      phone: "+84 28 5411 3333",
      notes: "한국어 가능 의료진. FV Hospital 24시간 응급실",
      category: "ambulance",
    },
  ],

  // ── 결제 (도시 차별화) ──────────────────────────────────────────────
  payment: {
    cardAcceptance: "medium",
    cardNotes:
      "1군 대형 식당·쇼핑몰(타카시마야·다이아몬드 플라자)은 카드 OK. 벤탄시장·로컬 분짜집·그랩은 현금 필수.",
    atmAvailable: true,
    tipExpected: false,
    tipNotes: "팁 문화 약함. 마사지 5만 동, 호텔 짐꾼 2만 동",
  },

  // ── 교통 ─────────────────────────────────────────────────────────────
  transport: {
    primary: "grab",
    primaryNotes:
      "그랩 압도적. 1군 → 3군 5만~10만 동. 출퇴근(7~9시·17~19시) 정체 심함",
    airportToCity: {
      method: "그랩 (탄손녓 → 1군)",
      durationMin: 25,
      priceKrw: 9000,
    },
    walkability: "medium",
  },

  // phrases·utilities·visa는 country로 정규화

  // ── 도시별 기후 ──────────────────────────────────────────────────────
  weather: {
    season: "건기 (12~4월) · 우기 (5~11월)",
    avgTempC: { min: 24, max: 34 },
    notes: "12~2월이 베스트(선선·건조). 우기 오후 스콜 30분~1시간",
  },

  // ── 시그니처 가이드 ──────────────────────────────────────────────────
  curatedGuides: [
    {
      id: "sgn-first-day",
      title: "1군 핵심 + 노트르담 야경 24시간",
      subtitle: "탄손녓 공항 → 동코이 거리 → 노트르담 → 분짜 디너",
      hero: { emoji: "🛺", gradient: "from-purple to-purple-deep" },
      sections: [
        {
          heading: "1. 공항 → 호텔 (그랩 25분)",
          body: "탄손녓 공항(SGN)은 시내 7km. 그랩 15만~20만 동. 1군(동코이·벤탄 인근) 호텔 추천 — 도보로 명소 대부분 커버.",
          tip: "공항 도착 즉시 eSIM 활성화 (Viettel 7일 30만 동 / Mobifone 7일 25만 동)",
        },
        {
          heading: "2. 동코이 거리 + 노트르담 성당 (오후 16~18시)",
          body: "동코이 거리는 사이공의 명동. 노트르담 성당(1880년 프랑스 건축) 광장 분수 + 사진 명소. 인근 사이공 중앙우체국까지 도보 2분.",
          tip: "성당 내부는 보수공사 중일 수 있음 — 외관 사진만으로도 충분",
        },
        {
          heading: "3. 벤탄시장 + 맥주 거리 (저녁 18~20시)",
          body: "벤탄시장(Bến Thành) 안에서 기념품 구경 + 시장 밖 야시장 펼쳐짐(17시~). Bui Vien 맥주 거리 — 생맥주(bia hơi) 1만~2만 동, 길거리 시푸드 바비큐 10만 동.",
          tip: "벤탄시장 안은 흥정 필수 (첫 가격의 50~60%). 밖 야시장은 비교적 정가 운영",
        },
        {
          heading: "4. 분짜 / 반미 디너 (저녁 20~21시)",
          body: "1군 분짜 145(Bún Chả 145) 또는 반미 후인호아(Bánh Mì Huỳnh Hoa). 분짜 8만 동, 반미 5만 동.",
          tip: "후인호아는 줄이 길지만 회전 빠름(10분 내). 1군은 야간도 안전",
        },
        {
          heading: "5. 전쟁 박물관 + 통일궁 (Day 2 오전 9~12시)",
          body: "전쟁잔혹물 박물관(War Remnants Museum, 입장료 4만 동) → 통일궁(Reunification Palace, 6.5만 동) 도보 15분 코스. 사이공 역사의 두 축.",
          tip: "전쟁 박물관 3층 사진 전시가 가장 충격적 — 민감한 내용 포함. 아이 동반 시 참고",
        },
        {
          heading: "6. 루프탑 바 + 사이공 야경 (저녁 21~23시)",
          body: "Bitexco Tower 전망대(20만 동) 또는 인근 루프탑 바(Saigon Saigon Bar, Chill Sky Bar). 칵테일 20~30만 동. 사이공 강변 야경 + 도시 스카이라인 파노라마.",
          tip: "Chill Sky Bar는 스마트 캐주얼 드레스 코드 — 슬리퍼·반바지 입장 불가",
        },
      ],
    },
  ],
};
