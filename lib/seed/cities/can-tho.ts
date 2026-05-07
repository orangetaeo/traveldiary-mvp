/**
 * 껀터(Cần Thơ, 베트남) City 시드 — 사이클 K (옵션 β, city only).
 *
 * 시그니처: 메콩델타 까이랑 부유시장(Cai Rang Floating Market) 새벽 5시 출발.
 * 호치민(SGN) 1박 당일치기 패턴이라 trip 별도 없이 SGN trip Day 옵션으로 흡수 가능.
 *
 * country VN 정규화 (ADR-032) — phrases·utilities·visa는 country.defaultPhrases 재사용.
 */

import type { City } from "../../types";

export const canThoCity: City = {
  code: "CTH",
  slug: "can-tho",
  name: "껀터",
  country: "베트남",
  countryCode: "VN",

  // ── 응급 연락처 (껀터는 호치민 총영사관 관할) ──────────────────────
  emergencyContacts: [
    {
      label: "주 호치민 대한민국 총영사관 (껀터 관할)",
      phone: "+84 28 3822 5757",
      hours: "평일 08:30~17:00",
      notes: "한국어 가능. 호치민에서 껀터 170km — 야간/주말 +84 93 850 0238",
      category: "embassy",
      url: "https://overseas.mofa.go.kr/vn-hochiminh-ko/index.do",
    },
    {
      label: "껀터 관광경찰 (Tourist Police)",
      phone: "+84 292 3820 077",
      notes: "Ninh Kiều 부두·야시장 외국인 사건 전담",
      category: "police",
    },
    {
      label: "추천 병원 — Hoan My Cuu Long Hospital",
      phone: "+84 292 3917 707",
      notes: "껀터 최대 종합병원. 24시간 응급. 영어 가능 의료진 보유",
      category: "ambulance",
    },
  ],

  // ── 결제 (메콩델타 — 부유시장·노점은 현금) ─────────────────────────
  payment: {
    cardAcceptance: "low",
    cardNotes:
      "부유시장·재래시장·국수 노점은 현금만. 호텔·일부 카페만 카드 OK. ATM은 Ninh Kiều 부두 인근",
    atmAvailable: true,
    tipExpected: false,
    tipNotes: "팁 문화 약함. 보트 가이드에게 5만~10만 동 정도",
  },

  // ── 교통 (도시 차별화 — 보트 + 도보 + 그랩 바이크) ─────────────────
  transport: {
    primary: "walk",
    primaryNotes:
      "시내는 도보 + 그랩 바이크. 메콩 본류·지류 보트가 핵심 관광 교통(Ninh Kiều 부두에서 까이랑 부유시장 1시간 — 공동 보트 5만 동/인, 전세 80만 동)",
    airportToCity: {
      method: "껀터 공항(VCA) → 시내 그랩 또는 호치민에서 버스(Phương Trang 등) 4시간",
      durationMin: 30,
      priceKrw: 8000,
    },
    walkability: "medium",
  },

  // phrases·utilities·visa는 country로 정규화

  // ── 도시별 기후 (메콩델타 — 남부 열대) ──────────────────────────────
  weather: {
    season: "건기 (12~4월) · 우기 (5~11월)",
    avgTempC: { min: 24, max: 33 },
    notes: "건기가 베스트. 우기 5~7월은 부유시장 활기 ↑(과일 수확). 9~11월 메콩 범람기",
    clothing: ["반팔·반바지·샌들 (연중 열대)", "부유시장 새벽 배 위 — 바람막이·모자", "자외선 차단제 필수 (메콩 수면 반사)", "우기엔 방수 샌들·우비"],
  },

  medicalFacilities: [
    { label: "껀터 중앙병원(Bệnh viện Đa khoa TW Cần Thơ)", type: "hospital", address: "315 Nguyễn Văn Linh, Ninh Kiều", phone: "+84 292 3820 072", hours: "24시간", notes: "메콩델타 최대 병원. 영어 제한적" },
    { label: "Nhà Thuốc Long Châu (닌끼에우 부두 인근)", type: "pharmacy", address: "Hai Bà Trưng, Ninh Kiều", hours: "07:00~22:00", notes: "부유시장 부두 도보 5분" },
  ],

  // ── B7 생활 팁 ─────────────────────────────────────────────────────
  practicalTips: {
    waterSafety:
      "수돗물 음용 절대 금지. 부유시장 인근은 강물 오염 주의 — 손 씻기용 물도 생수 사용 권장. 편의점에서 생수 500ml 5천~1만 동.",
    toiletInfo:
      "시설 기본적인 곳 많음 — 미니 휴지·물티슈 반드시 휴대. 부유시장 보트에는 화장실 없음, 출발 전 Ninh Kiều 부두에서 해결.",
    mosquito:
      "강·운하 인근 모기 많음 — 기피제 필수. 새벽 부유시장 보트 탑승 시에도 모기약 뿌려둘 것. DEET 성분 추천.",
    sunProtection:
      "열대 태양 + 메콩 수면 반사로 자외선 강렬 — 부유시장 보트 투어 시 모자·차단제(SPF50+) 필수.",
    haggling:
      "부유시장 가격은 비교적 공정 — 가벼운 흥정 정도. 과일·디저트 1만~3만 동 수준. 전세 보트는 사전 합의 필수.",
    customs: [
      "실내 입장 시 신발 탈것 (특히 사원·현지인 가정)",
      "머리를 만지지 말 것 — 베트남에서 머리는 신성한 부위",
      "메콩 주민 생활 공간 존중 — 허락 없이 가정집 촬영 금지",
      "물건·돈 주고받을 때 양손 사용이 예의",
    ],
  },

  // ── F3 안전 팁 ─────────────────────────────────────────────────────
  safetyTips: {
    scamWarnings: [
      "부유시장 전세 보트 과다 요금 — 탑승 전 왕복 가격·시간 명확 합의 (공동 보트 인당 5만~7만 동 기준 참고)",
      "'스페셜 투어' 업셀 — 기본 코스에 불필요한 추가 코스 끼워넣기, 사전 확인 후 결정",
    ],
    safetyNotes: [
      "보트 탑승 시 구명조끼 착용 확인 — 안전 기준 느슨한 영세 보트 있음",
      "메콩 강 수류 빠름 — 수영·물놀이 절대 금지",
      "전반적으로 치안 좋은 조용한 도시, 기본 소지품 관리만 주의",
    ],
    touristPolice: {
      phone: "113",
      notes:
        "113은 베트남 전국 경찰 신고 번호. 껀터는 소도시라 관광경찰 별도 사무소 제한적 — 호텔 프론트에 먼저 도움 요청 권장.",
    },
    nightSafety:
      "Ninh Kiều 부두·야시장 일대는 저녁 산책에 안전. 전반적으로 조용하고 평화로운 도시. 강변 외곽 어두운 구역은 피할 것.",
  },

  // ── 시그니처 가이드 ─────────────────────────────────────────────────
  curatedGuides: [
    {
      id: "can-tho-floating-market-dawn",
      title: "까이랑 부유시장 새벽 5시 — 메콩 일출",
      subtitle: "Ninh Kiều 부두 출발 → 부유시장 → 쌀국수 보트 아침 → 12시 귀항",
      hero: { emoji: "🚣", gradient: "from-amber to-amber-deep" },
      sections: [
        {
          heading: "1. 새벽 5시 Ninh Kiều 부두 집결",
          body: "보트 출발 5:00~5:30 — 6시 일출에 맞춰 부유시장 도착이 골든. 호텔에서 도보 5~10분(Hai Ba Trung 거리). 공동 보트는 새벽 부두에서 직접 흥정(인당 5만~7만 동), 전세는 전일 호텔/투어로 예약 80만 동.",
          tip: "긴소매 + 모자 + 햇볕 차단제 필수. 새벽엔 모기약. 카메라 방수팩 권장(보트 물튐)",
        },
        {
          heading: "2. 까이랑 부유시장 6~8시",
          body: "메콩 본류 + 지류 합류점에 ~100척 도매 보트 정박. 각 보트 마스트(긴 막대)에 파는 과일 견본 매달아 표시. 파인애플·수박·두리안·코코넛 1개 1만~3만 동. 보트 위 쌀국수 식당은 즉석에서 인덕션·솥 끓이는 구조.",
          tip: "6~7시가 가장 활기. 8시 이후 도매상 철수. 흥정은 30% 정도 깎기 표준",
        },
        {
          heading: "3. 운하 마을 + 쌀국수 보트 아침",
          body: "부유시장 후 메콩 지류 따라 마을 코스 — 쌀국수 공장·코코넛 캔디·과수원. 보트 위에서 분짜·반쌔오 아침 5만~8만 동. 코코넛 디저트(쩨)는 1만 동.",
          tip: "사진보다 영상이 더 잘 나옴. 한국어 후기 728건 중 'Bao Tuyen 보트 가이드' 추천 다수",
        },
        {
          heading: "4. 12시 귀항 → Ninh Kieu 야시장 점심",
          body: "보트 7시간 코스 종료 후 점심은 Ninh Kieu 야시장(낮에도 운영) 또는 Sao Hom 시장. Hu Tieu(호띠우 — 남부 쌀국수) 5만 동, 분맘 7만 동.",
          tip: "더위 피해 호텔 휴식 후 18~22시 야시장 재방문 — 등불 + 강변 산책",
        },
      ],
    },
  ],
};
