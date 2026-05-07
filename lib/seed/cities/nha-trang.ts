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
    clothing: ["반팔·수영복·샌들 (연중 해변 도시)", "자외선 차단제·래시가드 필수", "우기(9~12월) 방수 자켓·우산", "리조트 저녁 식사 시 가벼운 셔츠"],
  },

  medicalFacilities: [
    { label: "Vinmec 나트랑 국제병원", type: "hospital", address: "42A Trần Phú, Lộc Thọ", phone: "+84 258 3900 168", hours: "24시간 응급실", notes: "한국어 가능 의료진. 보험 직불" },
    { label: "칸호아 종합병원(Khanh Hoa General)", type: "hospital", address: "19 Yersin, Nha Trang", phone: "+84 258 3822 168", hours: "24시간", notes: "공공 병원. 응급 가능" },
    { label: "Nhà Thuốc Long Châu (짠푸 해변로)", type: "pharmacy", address: "Trần Phú, Lộc Thọ", hours: "07:00~22:00", notes: "해변 메인 로드 체인 약국" },
  ],

  // ── B7 생활 팁 ─────────────────────────────────────────────────────
  practicalTips: {
    waterSafety:
      "수돗물 음용 금지. 편의점·호텔에서 생수 구매 — 500ml 5천~1만 동. 리조트·대형 식당 얼음은 안전, 노점 얼음은 주의.",
    toiletInfo:
      "관광지·리조트·호텔 화장실은 양호. 로컬 식당·재래시장은 시설 기본적 — 미니 휴지 휴대 권장.",
    mosquito:
      "해안가 저녁 시간대 모기 보통 수준. 비치 선베드 이용 시 기피제 뿌려두면 편안. 빈마트에서 Soffell 구매 가능.",
    sunProtection:
      "해변 자외선 매우 강렬 — SPF50+ 워터프루프 차단제 필수. 래시가드·모자·선글라스 권장. 11~14시 직사광선 피할 것.",
    haggling:
      "담(Dam) 시장·해변 노점상에서 흥정 기본. 처음 가격의 50~60%에서 시작. 시푸드는 '시가' 표기 주의 — 주문 전 kg당 가격 반드시 확인.",
    customs: [
      "실내 입장 시 신발 탈것 (특히 사원·현지인 가정)",
      "머리를 만지지 말 것 — 베트남에서 머리는 신성한 부위",
      "물건·돈 주고받을 때 양손 사용이 예의",
      "Ponagar 참 타워 등 사원 방문 시 노출 의상 금지 — 어깨·무릎 가리기",
    ],
  },

  // ── F3 안전 팁 ─────────────────────────────────────────────────────
  safetyTips: {
    scamWarnings: [
      "비치 선베드·파라솔 사기 — 앉기 전 가격 반드시 합의, 나중에 바가지 청구 사례 다수",
      "러시아어 투어 업체가 한국인 대상 고가 패키지 판매 — Klook/KKday 등 공인 플랫폼 이용 권장",
      "택시 미터기 조작 — 그랩 앱 이용이 가장 안전, 택시 이용 시 Vinasun·Mai Linh만",
    ],
    safetyNotes: [
      "짠푸(Tran Phu) 비치에서 소지품 관리 주의 — 수영 중 해변 가방 도난 사례 있음",
      "야간 해변(특히 조명 없는 구간) 피할 것 — 파도·조류 위험 + 치안 불안",
      "귀중품은 호텔 금고에 보관, 오토바이 앞 바구니에 가방 걸지 말 것 (날치기)",
    ],
    touristPolice: {
      phone: "+84 258 382 2462",
      notes:
        "짠푸 해변로 인근 관광경찰서. 외국인 사건 전담.",
    },
    nightSafety:
      "짠푸 해변로 관광 거리는 야간에도 비교적 안전. 어두운 골목길·비치 외곽은 피할 것. 야시장 주변은 22시까지 활기.",
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
