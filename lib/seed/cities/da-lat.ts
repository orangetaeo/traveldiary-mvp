/**
 * 달랏(Đà Lạt, 베트남) City 시드 — 사이클 K (옵션 α, city + trip).
 *
 * 시그니처: 1500m 고원 휴양·신혼·꽃 도시. 야시장 + 랑비앙 + 다탄라 폭포 + 크레이지 하우스.
 * 한국인 인기 ↑↑ — full trip 시드 동반 (lib/seed/da-lat.ts).
 *
 * country VN 정규화 (ADR-032).
 */

import type { City } from "../../types";

export const daLatCity: City = {
  code: "DLI",
  slug: "da-lat",
  name: "달랏",
  country: "베트남",
  countryCode: "VN",

  // ── 응급 연락처 (달랏은 호치민 총영사관 관할) ──────────────────────
  emergencyContacts: [
    {
      label: "주 호치민 대한민국 총영사관 (달랏 관할)",
      phone: "+84 28 3822 5757",
      hours: "평일 08:30~17:00",
      notes: "한국어 가능. 호치민에서 달랏 300km — 야간/주말 +84 93 850 0238",
      category: "embassy",
      url: "https://overseas.mofa.go.kr/vn-hochiminh-ko/index.do",
    },
    {
      label: "달랏 관광경찰 (Tourist Police)",
      phone: "+84 263 3822 032",
      notes: "Hoa Binh Square + 야시장 외국인 사건 전담",
      category: "police",
    },
    {
      label: "추천 병원 — Lam Dong General Hospital",
      phone: "+84 263 3821 369",
      notes: "달랏 최대 종합병원. 24시간 응급. 통역은 콜센터 1577",
      category: "ambulance",
    },
  ],

  // ── 결제 (관광지 — 카드 보통) ──────────────────────────────────────
  payment: {
    cardAcceptance: "medium",
    cardNotes:
      "호텔·중대형 식당·카페 카드 OK. 야시장·재래시장·꽃밭 입장은 현금. ATM은 Hoa Binh Square 인근",
    atmAvailable: true,
    tipExpected: false,
    tipNotes: "팁 문화 약함. 영하수 가이드(Easy Rider)에게 일 10만~20만 동",
  },

  // ── 교통 (고원 — 도보 + 그랩 + Easy Rider) ─────────────────────────
  transport: {
    primary: "walk",
    primaryNotes:
      "시내(Hoa Binh Square·야시장·쑤언흐엉 호수)는 도보 ↔ 그랩. 외곽(랑비앙·다탄라·푸응어우엔)은 그랩 또는 Easy Rider(오토바이 가이드 일 50만 동~). 봉어비치 케이블카 110만 동",
    airportToCity: {
      method: "리엔크엉 공항(DLI) → 시내 셔틀 또는 그랩",
      durationMin: 40,
      priceKrw: 12000,
    },
    walkability: "high",
  },

  // phrases·utilities·visa는 country로 정규화

  // ── 도시별 기후 (고원 — 연중 서늘) ──────────────────────────────────
  weather: {
    season: "건기 (12~3월) · 우기 (4~11월)",
    avgTempC: { min: 12, max: 24 },
    notes: "연평균 18°C — 베트남 유일 가을·겨울 도시. 새벽엔 5°C까지. 긴팔 + 가벼운 자켓 필수. 1~2월 매화·12월 코스모스",
    clothing: ["두꺼운 자켓·니트 필수 (새벽 5°C)", "긴바지·운동화 (고원 트레킹)", "우기엔 방수 자켓·방수 신발", "베트남 유일 겨울 옷 필요 도시"],
  },

  medicalFacilities: [
    { label: "달랏 종합병원(Bệnh viện Đa khoa Lâm Đồng)", type: "hospital", address: "4 Phạm Ngọc Thạch, Phường 6", phone: "+84 263 3822 154", hours: "24시간", notes: "달랏 최대 공공 병원. 영어 제한적" },
    { label: "Nhà Thuốc Long Châu (달랏 시장 인근)", type: "pharmacy", address: "Nguyễn Thị Minh Khai, Phường 1", hours: "07:00~22:00", notes: "달랏 야시장 도보 3분. 감기약·진통제 구비" },
  ],

  // ── B7 생활 팁 ─────────────────────────────────────────────────────
  practicalTips: {
    waterSafety:
      "수돗물 음용 금지 (저지대 도시보다 수질은 나은 편). 편의점·카페에서 생수 구매 — 500ml 5천~1만 동.",
    toiletInfo:
      "관광지·카페·호텔 화장실은 양호. 랑비앙·다탄라 폭포 등 외곽 명소는 시설 기본적 — 미니 휴지 휴대 권장.",
    mosquito:
      "해발 1,500m 고원이라 저지대보다 모기 적음. 다만 호수·정원 인근에는 있으므로 기피제 준비하면 안심.",
    sunProtection:
      "자외선은 보통 수준이지만 서늘한 기온에 속아 화상 주의 — 차단제(SPF30+) 바르기. 고원 트레킹 시 모자 권장.",
    haggling:
      "달랏 야시장(Night Market)에서 흥정 기본. 아티초크 차·딸기잼·꽃 등 특산품은 여러 가게 비교 후 구매. 처음 가격의 60~70%에서 시작.",
    customs: [
      "실내 입장 시 신발 탈것 (특히 사원·현지인 가정)",
      "머리를 만지지 말 것 — 베트남에서 머리는 신성한 부위",
      "꽃밭·딸기 농장 무단 진입·꽃 꺾기 금지 — 입장료 지불 후 이용",
      "물건·돈 주고받을 때 양손 사용이 예의",
    ],
  },

  // ── F3 안전 팁 ─────────────────────────────────────────────────────
  safetyTips: {
    scamWarnings: [
      "캐녀닝(canyoning) 투어 안전 문제 — 사고 이력 있는 업체 존재, 운영 경력·안전 장비·보험 여부 반드시 확인",
      "오토바이 렌탈 후 기존 흠집 배상 요구 — 대여 전 사진·영상 촬영 필수",
      "'달랏산 딸기·아티초크' 가짜 특산품 — 야시장에서 포장만 달랏이고 중국산인 경우 있음, 신뢰 가게 이용",
    ],
    safetyNotes: [
      "산악 도로 오토바이 운전 위험 — 급커브·안개·비 시 사고 다발, 경험 없으면 Easy Rider(가이드) 이용",
      "새벽·야간 기온 5°C 이하 — 저체온증 주의, 방한복 필수",
      "귀중품은 호텔 금고에 보관, 야시장 인파 속 소매치기 주의",
    ],
    touristPolice: {
      phone: "+84 263 382 2337",
      notes:
        "Hoa Binh 광장·야시장 인근 관광경찰. 외국인 사건 전담.",
    },
    nightSafety:
      "야시장(Night Market)·Hoa Binh 광장 일대는 야간에도 활기차고 안전. 산악 도로는 야간 주행 금지 — 가로등 없는 구간 많고 안개 위험.",
  },

  // ── 시그니처 가이드 ─────────────────────────────────────────────────
  curatedGuides: [
    {
      id: "da-lat-night-market-cold",
      title: "달랏 야시장 — 베트남 유일 추운 야시장",
      subtitle: "17시 일몰 → 야시장 6시간 → 두유 + 반짱느엉 + 따뜻한 케 디저트",
      hero: { emoji: "🌃", gradient: "from-purple to-purple-deep" },
      sections: [
        {
          heading: "1. 17시 Hoa Binh Square 도착",
          body: "달랏 시내 중심 광장. 일몰 17:30 직후 노점 준비 시작 — 18시부터 본격 활기. 광장 시계탑 옆이 야시장 메인 입구. 호텔 도보 5~15분 권역.",
          tip: "긴팔 자켓 필수 — 18시 이후 13~15°C. 베트남 평지(33°C)와 갭 큼. 호텔에 맡긴 짧은 옷 갈아입고 출발",
        },
        {
          heading: "2. 18~20시 야시장 메인 코스",
          body: "Bánh Tráng Nướng(반짱느엉, 베트남식 피자) 2만~4만 동 — 달랏 명물. Sữa Đậu Nành(따뜻한 두유) 1만 동, 분배(Bún Bò) 5만~7만 동. 채소·딸기·아티초크 차 등 고원 농산물 노점.",
          tip: "유명한 'Bánh Tráng Nướng Dì Đinh' 줄 30분~1시간. Hoa Binh Square 시계 반대 방향 골목으로 들어가면 한적한 노점 다수",
        },
        {
          heading: "3. 20~22시 쑤언흐엉 호수 야간 산책",
          body: "야시장에서 도보 5분. 5km 호수 둘레길 + 야간 조명. 백조 보트 30분 5만 동. 호숫가 카페에서 따뜻한 코코아·아티초크 차.",
          tip: "신혼·커플 인증샷 명소. 'Cong Ca Phe' 호숫가 지점은 22시까지 운영",
        },
      ],
    },
    {
      id: "da-lat-langbiang-sunrise",
      title: "랑비앙(Langbiang) 일출 — 1929m 산정",
      subtitle: "새벽 4시 출발 → 지프 또는 트레킹 → 6시 일출 + 운해",
      hero: { emoji: "⛰️", gradient: "from-amber to-purple-deep" },
      sections: [
        {
          heading: "1. 새벽 4시 호텔 출발",
          body: "달랏 시내 → 랑비앙 입구 12km, 그랩 30분. 입장료 5만 동. 정상까지 지프(왕복 30만 동/대) 또는 도보 트레킹 1.5시간. 대부분 지프 권장 — 일출 맞추려면.",
          tip: "사전에 Easy Rider 또는 호텔 픽업 예약 — 새벽 그랩은 잡기 어려울 수 있음. 패딩 + 장갑 (정상 5°C 이하)",
        },
        {
          heading: "2. 5:30~6:30 정상 일출 + 운해",
          body: "Lang Biang 정상(1929m) 전망대. 동쪽으로 일출, 서쪽으로 달랏 시내 운해. 360° 파노라마. 정상 카페·기념품샵 5:30 오픈.",
          tip: "운해는 11~3월 건기 새벽 70% 확률. 우기엔 비·구름 가림 — 일기예보 필수 확인",
        },
        {
          heading: "3. 7~9시 라트 빌리지 + 아침 식사",
          body: "랑비앙 산자락 라트 K'ho 소수민족 마을 방문(전통 의상·악기). 마을 카페에서 베트남식 아침(반미·쌀국수) + 달랏 커피.",
          tip: "마을 사진 촬영 시 양해 구하기. 기부금 박스 1만~2만 동",
        },
      ],
    },
  ],
};
