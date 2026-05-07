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
    clothing: ["반팔·반바지·샌들 (3~8월)", "자외선 차단제·모자 필수", "우기엔 우산·방수 자켓", "바나힐은 시내보다 5~8도 낮음 — 긴팔 챙길 것"],
  },

  medicalFacilities: [
    { label: "Vinmec 다낭 국제병원", type: "hospital", address: "30 Tháng 4, Hải Châu", phone: "+84 236 3711 111", hours: "24시간 응급실", notes: "한국어 가능 의료진. 보험 직불 가능" },
    { label: "패밀리 메디컬 프랙티스(Family Medical Practice)", type: "clinic", address: "96-98 Nguyễn Hữu Thọ, Hải Châu", phone: "+84 236 3582 700", hours: "월~토 08:00~17:00", notes: "외국인 전용 클리닉. 영어·한국어 통역 가능" },
    { label: "Nhà Thuốc Long Châu (한시장 인근)", type: "pharmacy", address: "Trần Phú, Hải Châu", hours: "07:00~22:00", notes: "체인 약국. 영어 기본 소통 가능" },
    { label: "Nhà Thuốc An Khang (미케비치)", type: "pharmacy", address: "Võ Nguyên Giáp, Sơn Trà", hours: "07:30~21:30", notes: "해변 인근 약국. 자외선 차단제·모기약 구비" },
  ],

  // ── B7 생활 팁 ─────────────────────────────────────────────────────
  practicalTips: {
    waterSafety:
      "수돗물 음용 금지. 편의점(빈마트·서클K·미니스톱)에서 생수 구매. 식당 얼음은 대부분 공장 생산이라 안전하나, 노점은 주의.",
    toiletInfo:
      "관광지·쇼핑몰·카페는 서양식 변기 보급률 높음. 로컬 식당·재래시장은 휴지 비치 안 된 곳 있음 — 미니 휴지 휴대 권장.",
    mosquito:
      "도심 지역은 모기 적은 편이나 바나힐 산간·호이안 수로 인근은 모기 있음. 저녁 야외 식사 시 기피제 권장.",
    sunProtection:
      "해변 자외선 강렬 — SPF50+ 자외선 차단제 + 래시가드 권장. 미케비치 한낮(11~14시)은 특히 주의.",
    haggling:
      "한시장(Hàn Market)은 흥정 가능 — 처음 가격의 60~70%가 적정. 쇼핑몰·편의점·프랜차이즈 카페는 정가.",
    customs: [
      "실내·사원 입장 시 신발 탈것",
      "머리를 만지지 말 것 — 베트남에서 머리는 신성한 부위",
      "물건·돈 주고받을 때 양손 사용이 예의",
    ],
  },

  // ── F3 안전 팁 ─────────────────────────────────────────────────────
  safetyTips: {
    scamWarnings: [
      "시클로(cyclo)·쎄옴(xe ôm) 바가지 — 탑승 전 가격 합의 필수, 그랩이 가장 안전",
      "가짜 그랩 기사 — 공항·관광지에서 '그랩?' 호객 시 앱 호출 아닌 사설 택시. 반드시 앱으로 직접 호출",
      "해변 노점 바가지 — 코코넛·해산물 가격 확인 후 주문, 메뉴판 없는 노점 주의",
    ],
    safetyNotes: [
      "전반적으로 베트남에서 가장 안전한 도시 중 하나 — 치안 양호",
      "미케비치에서 소지품 관리 주의 — 해변 방치 시 도난 위험",
      "오토바이 렌탈 시 국제면허 필수, 헬멧 미착용 벌금 있음",
    ],
    touristPolice: {
      phone: "+84 236 382 2077",
      notes: "다낭 관광경찰. 한강변·미케비치 인근 순찰 있음.",
    },
    nightSafety:
      "용다리(Dragon Bridge) 일대·한강변은 야간에도 조명 밝고 안전. 미케비치도 주요 구간 가로등 있음. 한시장 뒷골목은 야간에 어두울 수 있음.",
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
