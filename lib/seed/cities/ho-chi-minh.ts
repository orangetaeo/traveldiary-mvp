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
    clothing: ["반팔·반바지·샌들 (연중)", "자외선 차단제·모자 필수", "우기엔 접이식 우산 상비", "쇼핑몰·카페 냉방 강함 — 가벼운 긴팔"],
  },

  medicalFacilities: [
    { label: "FV 병원(Franco-Vietnamese Hospital)", type: "hospital", address: "6 Nguyễn Lương Bằng, Quận 7", phone: "+84 28 5411 3333", hours: "24시간 응급실", notes: "외국인 전용. 한국어 통역 가능. 보험 직불" },
    { label: "Vinmec Central Park", type: "hospital", address: "208 Nguyễn Hữu Cảnh, Bình Thạnh", phone: "+84 28 3622 1166", hours: "24시간 응급실", notes: "한국어 가능 의료진" },
    { label: "Nhà Thuốc Long Châu (1군 중심)", type: "pharmacy", address: "Nguyễn Huệ, Quận 1", hours: "07:00~22:00", notes: "체인 약국. 여행자 밀집 지역" },
    { label: "Nhà Thuốc Pharmacity (벤탄시장 인근)", type: "pharmacy", address: "Lê Thánh Tôn, Quận 1", hours: "07:30~22:00", notes: "벤탄시장 도보 2분. 영어 소통 가능" },
  ],

  // ── B7 생활 팁 ─────────────────────────────────────────────────────
  practicalTips: {
    waterSafety:
      "수돗물 음용 금지. 편의점·카페에서 생수 구매. 식당 얼음은 공장 생산(원통형)이면 안전, 불규칙한 모양은 주의.",
    toiletInfo:
      "쇼핑몰(타카시마야·빈컴센터)·호텔·체인 카페는 서양식 변기 보급. 일부 로컬 식당·재래시장은 쪼그려 앉는 변기 + 휴지 없음 — 미니 휴지 휴대 권장.",
    mosquito:
      "도심은 모기 적은 편이나 공원(탕런 공원·떤딘) 인근은 있음. 저녁 야외 식사 시 기피제 권장.",
    sunProtection:
      "연중 열대 자외선 강렬 — SPF50+ 자외선 차단제 + 모자 필수. 한낮(11~14시) 야외 장시간 노출 주의.",
    haggling:
      "벤탄시장·로컬 재래시장은 흥정 기본 — 처음 가격의 50~60%에서 시작. 쇼핑몰·편의점·프랜차이즈는 정가.",
    customs: [
      "실내·사원 입장 시 신발 탈것",
      "머리를 만지지 말 것 — 베트남에서 머리는 신성한 부위",
      "물건·돈 주고받을 때 양손 사용이 예의",
    ],
  },

  // ── F3 안전 팁 ─────────────────────────────────────────────────────
  safetyTips: {
    scamWarnings: [
      "오토바이 날치기 — 도로변에서 핸드폰·가방을 손에 들고 걷지 말 것. 가방은 도로 반대편 어깨에 메기",
      "구두닦이 사기 — 구시가지에서 강제로 구두를 닦고 바가지 요금 청구. 단호하게 거절",
      "가짜 환전소 — 길거리 환전 시 위조지폐·금액 부족 위험. 은행·공인 환전소·ATM 이용",
      "부이비엔(Bùi Viện) 거리 호객 음식점 — 메뉴판 가격과 다른 금액 청구. 주문 전 가격 확인 필수",
    ],
    safetyNotes: [
      "베트남 최대 도시 — 소지품 관리에 각별히 주의. 핸드폰·지갑은 앞주머니·지퍼 가방에",
      "1군 야간 어두운 골목 단독 보행 피할 것",
      "도로 횡단 시 오토바이 물결 — 일정 속도로 걸으면 오토바이가 피해감. 갑자기 멈추거나 뛰지 말 것",
    ],
    touristPolice: {
      phone: "+84 28 3822 4127",
      notes: "호치민 관광경찰. 1군 벤탄시장·동코이 거리 인근 관할.",
    },
    nightSafety:
      "1군·3군은 야간에도 비교적 안전하고 유동인구 많음. 부이비엔 맥주거리는 새벽까지 활기차지만 소매치기 주의. 외곽 군(7군·빈탄 등)은 야간 단독 이동 자제.",
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
