/**
 * OTA Offer 시드 — 사이클 12a M8 (ADR-025) + 사이클 C (다낭/방콕/도쿄 인프라).
 *
 * 푸꾸옥 핵심 액티비티에 3 OTA 가격 시드. 매칭 키(matchTag)로
 * ItineraryItem과 결합 — 보통 place.id 또는 카테고리·키워드 기반.
 *
 * 사이클 C (2026-05-02) — 다낭/방콕/도쿄 OTA 인프라 시드 18건 추가.
 *   - matchTag 도시 prefix 표준화: pq-/dn-/bk-/ty-
 *   - itinerary 시드는 별도 사이클 — OTA만 미리 깔아두는 인프라 작업
 *   - findOffersByKeyword 다국가 키워드 분기 보강
 */

import type { OtaOffer } from "../types";

export const phuQuocOtaOffers: OtaOffer[] = [
  // ── 케이블카 (Sun World) ────────────────────────────────────────────
  // matchTag = phuQuocPlaces[].id 와 정확 일치해야 findOffersForItem이 작동 (T12 fix)
  {
    id: "klook-pq-cablecar",
    matchTag: "pq-spot-cablecar",
    ota: "klook",
    title: "푸꾸옥 케이블카 왕복권 (혼통섬)",
    priceKrw: 36000,
    originalPriceKrw: 42000,
    rating: 4.7,
    reviewCount: 1284,
    url: "https://www.klook.com/activity/9999-phu-quoc-cable-car",
  },
  {
    id: "kkday-pq-cablecar",
    matchTag: "pq-spot-cablecar",
    ota: "kkday",
    title: "Sun World Hon Thom 케이블카",
    priceKrw: 38000,
    rating: 4.6,
    reviewCount: 521,
    url: "https://www.kkday.com/product/12345-phu-quoc-cable-car",
  },
  {
    id: "agoda-pq-cablecar",
    matchTag: "pq-spot-cablecar",
    ota: "agoda",
    title: "Hon Thom Cable Car Pass",
    priceKrw: 39500,
    rating: 4.5,
    reviewCount: 312,
    url: "https://www.agoda.com/activities/phu-quoc/cable-car",
  },

  // ── 사오비치 데이투어 ───────────────────────────────────────────────
  {
    id: "klook-pq-saobeach",
    matchTag: "pq-spot-saobeach",
    ota: "klook",
    title: "사오비치 + 남부 어촌 데이투어",
    priceKrw: 52000,
    originalPriceKrw: 65000,
    rating: 4.8,
    reviewCount: 892,
    url: "https://www.klook.com/activity/9100-phu-quoc-sao-beach-tour",
  },
  {
    id: "kkday-pq-saobeach",
    matchTag: "pq-spot-saobeach",
    ota: "kkday",
    title: "사오비치 + 남부 명소 8시간",
    priceKrw: 54000,
    rating: 4.7,
    reviewCount: 421,
    url: "https://www.kkday.com/product/56789-phu-quoc-sao-beach",
  },

  // ── 야시장 워킹투어 ─────────────────────────────────────────────────
  {
    id: "klook-pq-night-market",
    matchTag: "pq-food-night-market",
    ota: "klook",
    title: "즈엉동 야시장 음식 워킹투어 (한국어 가이드)",
    priceKrw: 32000,
    rating: 4.6,
    reviewCount: 521,
    url: "https://www.klook.com/activity/8500-phu-quoc-night-market-tour",
  },
  {
    id: "kkday-pq-night-market",
    matchTag: "pq-food-night-market",
    ota: "kkday",
    title: "Phu Quoc Night Market Walking Tour",
    priceKrw: 30000,
    originalPriceKrw: 35000,
    rating: 4.5,
    reviewCount: 188,
    url: "https://www.kkday.com/product/45678-phu-quoc-night-market",
  },

  // ── VinWonders / 빈펄랜드 ──────────────────────────────────────────
  {
    id: "klook-pq-vinwonders",
    matchTag: "pq-spot-vinwonders",
    ota: "klook",
    title: "VinWonders 푸꾸옥 1일 입장권",
    priceKrw: 45000,
    originalPriceKrw: 52000,
    rating: 4.8,
    reviewCount: 2103,
    url: "https://www.klook.com/activity/8800-vinwonders-phu-quoc",
  },
  {
    id: "agoda-pq-vinwonders",
    matchTag: "pq-spot-vinwonders",
    ota: "agoda",
    title: "VinWonders Phu Quoc Day Pass",
    priceKrw: 48000,
    rating: 4.7,
    reviewCount: 612,
    url: "https://www.agoda.com/activities/vinwonders-phu-quoc",
  },

  // ── 빈펄 사파리 (사이클 B 추가) ──────────────────────────────────
  // 시드 estimatedPrice 650k VND ≈ 36.1k KRW와 정렬 (deltaPct ≈ ±5% 이내)
  {
    id: "klook-pq-safari",
    matchTag: "pq-spot-safari",
    ota: "klook",
    title: "빈펄 사파리 입장권 (Vinpearl Safari)",
    priceKrw: 35000,
    originalPriceKrw: 42000,
    rating: 4.7,
    reviewCount: 982,
    url: "https://www.klook.com/activity/9200-vinpearl-safari-phu-quoc",
  },
  {
    id: "kkday-pq-safari",
    matchTag: "pq-spot-safari",
    ota: "kkday",
    title: "Vinpearl Safari Day Pass",
    priceKrw: 37500,
    rating: 4.6,
    reviewCount: 412,
    url: "https://www.kkday.com/product/56700-vinpearl-safari",
  },
  {
    id: "agoda-pq-safari",
    matchTag: "pq-spot-safari",
    ota: "agoda",
    title: "Vinpearl Safari + Shuttle",
    priceKrw: 38000,
    rating: 4.5,
    reviewCount: 289,
    url: "https://www.agoda.com/activities/phu-quoc/vinpearl-safari",
  },

  // ── 스노클링 / 호 트럼 ────────────────────────────────────────────
  {
    id: "klook-pq-snorkeling",
    matchTag: "pq-spot-snorkeling",
    ota: "klook",
    title: "안 토이 군도 스노클링 (한국어 + 점심 포함)",
    priceKrw: 58000,
    originalPriceKrw: 72000,
    rating: 4.9,
    reviewCount: 412,
    url: "https://www.klook.com/activity/7100-phu-quoc-snorkeling",
  },
  {
    id: "kkday-pq-snorkeling",
    matchTag: "pq-spot-snorkeling",
    ota: "kkday",
    title: "An Thoi Islands Snorkeling Tour",
    priceKrw: 60000,
    rating: 4.7,
    reviewCount: 218,
    url: "https://www.kkday.com/product/67890-phu-quoc-snorkeling",
  },
];

// ═══════════════════════════════════════════════════════════════════
// 다낭 (DAD, VND) — 사이클 C
// ═══════════════════════════════════════════════════════════════════

export const daNangOtaOffers: OtaOffer[] = [
  // ── 바나힐 (Sun World Ba Na Hills) ─────────────────────────────────
  {
    id: "klook-dn-banaHills",
    matchTag: "dn-spot-banaHills",
    ota: "klook",
    title: "바나힐 + 골든브릿지 1일 입장권",
    priceKrw: 68000,
    originalPriceKrw: 75000,
    rating: 4.7,
    reviewCount: 3120,
    url: "https://www.klook.com/activity/1010-ba-na-hills-da-nang",
  },
  {
    id: "kkday-dn-banaHills",
    matchTag: "dn-spot-banaHills",
    ota: "kkday",
    title: "Sun World 바나힐 + 케이블카",
    priceKrw: 71000,
    rating: 4.6,
    reviewCount: 1423,
    url: "https://www.kkday.com/product/22001-ba-na-hills",
  },
  {
    id: "agoda-dn-banaHills",
    matchTag: "dn-spot-banaHills",
    ota: "agoda",
    title: "Ba Na Hills Day Pass",
    priceKrw: 72500,
    rating: 4.5,
    reviewCount: 856,
    url: "https://www.agoda.com/activities/da-nang/ba-na-hills",
  },

  // ── 호이안 데이투어 ────────────────────────────────────────────────
  {
    id: "klook-dn-hoianTour",
    matchTag: "dn-spot-hoianTour",
    ota: "klook",
    title: "호이안 올드타운 + 야경 데이투어 (한국어)",
    priceKrw: 49000,
    originalPriceKrw: 59000,
    rating: 4.8,
    reviewCount: 1850,
    url: "https://www.klook.com/activity/2020-hoi-an-day-tour",
  },
  {
    id: "kkday-dn-hoianTour",
    matchTag: "dn-spot-hoianTour",
    ota: "kkday",
    title: "호이안 + 미선유적 8시간 투어",
    priceKrw: 52000,
    rating: 4.7,
    reviewCount: 720,
    url: "https://www.kkday.com/product/33002-hoi-an-tour",
  },

  // ── 미케비치 액티비티 ──────────────────────────────────────────────
  {
    id: "kkday-dn-mykheBeach",
    matchTag: "dn-spot-mykheBeach",
    ota: "kkday",
    title: "미케비치 패러세일링 + 제트스키 패키지",
    priceKrw: 41000,
    rating: 4.5,
    reviewCount: 312,
    url: "https://www.kkday.com/product/44003-my-khe-beach",
  },
  // single_source 회피 — klook 추가 (사이클 D 부수)
  {
    id: "klook-dn-mykheBeach",
    matchTag: "dn-spot-mykheBeach",
    ota: "klook",
    title: "미케비치 워터스포츠 데이패스",
    priceKrw: 39000,
    originalPriceKrw: 45000,
    rating: 4.6,
    reviewCount: 521,
    url: "https://www.klook.com/activity/4500-my-khe-beach",
  },

  // ── 한시장 푸드 워킹투어 (사이클 D 신규) ───────────────────────────
  {
    id: "klook-dn-hanmarket",
    matchTag: "dn-food-hanmarket",
    ota: "klook",
    title: "다낭 한시장 푸드 워킹투어 (한국어 가이드)",
    priceKrw: 31000,
    originalPriceKrw: 38000,
    rating: 4.7,
    reviewCount: 689,
    url: "https://www.klook.com/activity/4600-han-market-food-tour",
  },
  {
    id: "kkday-dn-hanmarket",
    matchTag: "dn-food-hanmarket",
    ota: "kkday",
    title: "Han Market Street Food Tour",
    priceKrw: 33000,
    rating: 4.5,
    reviewCount: 282,
    url: "https://www.kkday.com/product/4601-han-market",
  },

  // ── 미선유적 데이투어 (사이클 D 신규) ──────────────────────────────
  {
    id: "klook-dn-mySon",
    matchTag: "dn-spot-mySon",
    ota: "klook",
    title: "미선 유적지 + 호이안 콤보 데이투어 (한국어)",
    priceKrw: 47000,
    originalPriceKrw: 58000,
    rating: 4.7,
    reviewCount: 1420,
    url: "https://www.klook.com/activity/4700-my-son-sanctuary",
  },
  {
    id: "kkday-dn-mySon",
    matchTag: "dn-spot-mySon",
    ota: "kkday",
    title: "My Son Half-Day Tour with Lunch",
    priceKrw: 49000,
    rating: 4.6,
    reviewCount: 642,
    url: "https://www.kkday.com/product/4701-my-son",
  },
  {
    id: "agoda-dn-mySon",
    matchTag: "dn-spot-mySon",
    ota: "agoda",
    title: "My Son UNESCO Heritage Tour",
    priceKrw: 52000,
    rating: 4.5,
    reviewCount: 218,
    url: "https://www.agoda.com/activities/da-nang/my-son",
  },

  // ── 응우한선 (Marble Mountains) (사이클 D 신규) ──────────────────────
  {
    id: "klook-dn-marble",
    matchTag: "dn-spot-marble",
    ota: "klook",
    title: "응우한선(대리석산) 입장권 + 영선동굴 가이드",
    priceKrw: 25000,
    originalPriceKrw: 32000,
    rating: 4.7,
    reviewCount: 921,
    url: "https://www.klook.com/activity/4800-marble-mountains",
  },
  {
    id: "kkday-dn-marble",
    matchTag: "dn-spot-marble",
    ota: "kkday",
    title: "Marble Mountains Half-Day Tour",
    priceKrw: 26500,
    rating: 4.6,
    reviewCount: 412,
    url: "https://www.kkday.com/product/4801-marble-mountains",
  },
  {
    id: "agoda-dn-marble",
    matchTag: "dn-spot-marble",
    ota: "agoda",
    title: "Ngu Hanh Son Day Pass + Elevator",
    priceKrw: 28000,
    rating: 4.5,
    reviewCount: 189,
    url: "https://www.agoda.com/activities/da-nang/marble-mountains",
  },
];

// ═══════════════════════════════════════════════════════════════════
// 방콕 (BKK, THB) — 사이클 C
// ═══════════════════════════════════════════════════════════════════

export const bangkokOtaOffers: OtaOffer[] = [
  // ── 차오프라야 디너 크루즈 ────────────────────────────────────────
  {
    id: "klook-bk-dinnerCruise",
    matchTag: "bk-food-dinnerCruise",
    ota: "klook",
    title: "차오프라야 강 디너 크루즈 (뷔페 + 라이브밴드)",
    priceKrw: 55000,
    originalPriceKrw: 68000,
    rating: 4.7,
    reviewCount: 4210,
    url: "https://www.klook.com/activity/3030-chao-phraya-cruise",
  },
  {
    id: "kkday-bk-dinnerCruise",
    matchTag: "bk-food-dinnerCruise",
    ota: "kkday",
    title: "Wonderful Pearl 디너 크루즈",
    priceKrw: 58000,
    rating: 4.6,
    reviewCount: 1923,
    url: "https://www.kkday.com/product/55004-chao-phraya-cruise",
  },

  // ── 아유타야 데이투어 ──────────────────────────────────────────────
  {
    id: "klook-bk-ayutthaya",
    matchTag: "bk-spot-ayutthaya",
    ota: "klook",
    title: "아유타야 유적지 + 코끼리 트레킹 데이투어",
    priceKrw: 62000,
    originalPriceKrw: 75000,
    rating: 4.8,
    reviewCount: 2890,
    url: "https://www.klook.com/activity/4040-ayutthaya-tour",
  },
  {
    id: "agoda-bk-ayutthaya",
    matchTag: "bk-spot-ayutthaya",
    ota: "agoda",
    title: "Ayutthaya Day Tour with Lunch",
    priceKrw: 65000,
    rating: 4.6,
    reviewCount: 612,
    url: "https://www.agoda.com/activities/bangkok/ayutthaya",
  },

  // ── 왓 아룬 입장권 ────────────────────────────────────────────────
  {
    id: "agoda-bk-watarun",
    matchTag: "bk-spot-watarun",
    ota: "agoda",
    title: "Wat Arun (새벽 사원) Skip-the-line 입장권",
    priceKrw: 4500,
    rating: 4.7,
    reviewCount: 421,
    url: "https://www.agoda.com/activities/bangkok/wat-arun",
  },

  // ── 시암 박물관 패스 ──────────────────────────────────────────────
  {
    id: "kkday-bk-siamPass",
    matchTag: "bk-spot-siamPass",
    ota: "kkday",
    title: "시암 디스커버리 + 시암 파라곤 통합 패스",
    priceKrw: 28500,
    rating: 4.5,
    reviewCount: 285,
    url: "https://www.kkday.com/product/66005-siam-pass",
  },
];

// ═══════════════════════════════════════════════════════════════════
// 도쿄 (TYO, JPY) — 사이클 C
// ═══════════════════════════════════════════════════════════════════

export const tokyoOtaOffers: OtaOffer[] = [
  // ── 디즈니랜드 1Day ───────────────────────────────────────────────
  {
    id: "klook-ty-disneyland",
    matchTag: "ty-spot-disneyland",
    ota: "klook",
    title: "도쿄 디즈니랜드 1Day 패스 (한국어 가이드 옵션)",
    priceKrw: 92000,
    originalPriceKrw: 98000,
    rating: 4.9,
    reviewCount: 5821,
    url: "https://www.klook.com/activity/5050-tokyo-disneyland",
  },
  {
    id: "kkday-ty-disneyland",
    matchTag: "ty-spot-disneyland",
    ota: "kkday",
    title: "도쿄 디즈니랜드/디즈니씨 1Day 티켓",
    priceKrw: 95000,
    rating: 4.8,
    reviewCount: 2941,
    url: "https://www.kkday.com/product/77006-tokyo-disneyland",
  },

  // ── 시부야 스카이 (Shibuya Sky) ────────────────────────────────────
  {
    id: "klook-ty-shibuyaSky",
    matchTag: "ty-spot-shibuyaSky",
    ota: "klook",
    title: "시부야 스카이 전망대 (예약 우선)",
    priceKrw: 24000,
    originalPriceKrw: 28000,
    rating: 4.8,
    reviewCount: 3210,
    url: "https://www.klook.com/activity/6060-shibuya-sky",
  },
  {
    id: "agoda-ty-shibuyaSky",
    matchTag: "ty-spot-shibuyaSky",
    ota: "agoda",
    title: "Shibuya Sky Observatory Ticket",
    priceKrw: 26500,
    rating: 4.6,
    reviewCount: 712,
    url: "https://www.agoda.com/activities/tokyo/shibuya-sky",
  },

  // ── 후지산 데이투어 ────────────────────────────────────────────────
  {
    id: "klook-ty-fujiTour",
    matchTag: "ty-spot-fujiTour",
    ota: "klook",
    title: "후지산 5합목 + 가와구치코 호수 데이투어 (한국어)",
    priceKrw: 118000,
    originalPriceKrw: 135000,
    rating: 4.7,
    reviewCount: 1820,
    url: "https://www.klook.com/activity/7070-mt-fuji-tour",
  },
  {
    id: "kkday-ty-fujiTour",
    matchTag: "ty-spot-fujiTour",
    ota: "kkday",
    title: "Mt. Fuji + Hakone Day Tour from Tokyo",
    priceKrw: 125000,
    rating: 4.6,
    reviewCount: 942,
    url: "https://www.kkday.com/product/88007-mt-fuji-tour",
  },
];

// ═══════════════════════════════════════════════════════════════════
// 호치민 (SGN, VND) — 사이클 G-1
// ═══════════════════════════════════════════════════════════════════

export const hoChiMinhOtaOffers: OtaOffer[] = [
  // ── 메콩델타 미토 데이투어 ───────────────────────────────────────
  {
    id: "klook-hcm-mekong",
    matchTag: "hcm-spot-mekong",
    ota: "klook",
    title: "메콩델타 미토 1일 투어 (한국어 가이드)",
    priceKrw: 35000,
    originalPriceKrw: 42000,
    rating: 4.6,
    reviewCount: 2840,
    url: "https://www.klook.com/activity/4040-mekong-delta-tour",
  },
  {
    id: "kkday-hcm-mekong",
    matchTag: "hcm-spot-mekong",
    ota: "kkday",
    title: "Mekong Delta My Tho Day Tour",
    priceKrw: 38000,
    rating: 4.5,
    reviewCount: 1230,
    url: "https://www.kkday.com/product/44002-mekong-delta",
  },
  {
    id: "agoda-hcm-mekong",
    matchTag: "hcm-spot-mekong",
    ota: "agoda",
    title: "My Tho Mekong Delta Full Day",
    priceKrw: 40000,
    rating: 4.4,
    reviewCount: 612,
    url: "https://www.agoda.com/activities/ho-chi-minh/mekong-delta",
  },

  // ── 사이공 강 디너 크루즈 ──────────────────────────────────────────
  {
    id: "klook-hcm-dinnerCruise",
    matchTag: "hcm-food-dinnerCruise",
    ota: "klook",
    title: "사이공 강 디너 크루즈 + 베트남 전통 공연",
    priceKrw: 65000,
    originalPriceKrw: 78000,
    rating: 4.5,
    reviewCount: 1820,
    url: "https://www.klook.com/activity/4050-saigon-dinner-cruise",
  },
  {
    id: "kkday-hcm-dinnerCruise",
    matchTag: "hcm-food-dinnerCruise",
    ota: "kkday",
    title: "Saigon River Dinner Cruise (Indochina Queen)",
    priceKrw: 68000,
    rating: 4.4,
    reviewCount: 924,
    url: "https://www.kkday.com/product/44003-saigon-dinner-cruise",
  },

  // ── 통일궁 + 전쟁박물관 콤보 ───────────────────────────────────────
  {
    id: "klook-hcm-warMuseum",
    matchTag: "hcm-spot-warMuseum",
    ota: "klook",
    title: "통일궁 + 전쟁박물관 콤보 입장권",
    priceKrw: 18000,
    rating: 4.6,
    reviewCount: 1240,
    url: "https://www.klook.com/activity/4060-reunification-palace",
  },
  {
    id: "kkday-hcm-warMuseum",
    matchTag: "hcm-spot-warMuseum",
    ota: "kkday",
    title: "Reunification Palace + War Remnants Museum",
    priceKrw: 19000,
    rating: 4.5,
    reviewCount: 682,
    url: "https://www.kkday.com/product/44004-war-museum",
  },

  // ── 시클로 시내투어 ────────────────────────────────────────────────
  {
    id: "klook-hcm-cyclo",
    matchTag: "hcm-spot-cyclo",
    ota: "klook",
    title: "호치민 1군 시클로 2시간 투어 (한국어)",
    priceKrw: 22000,
    originalPriceKrw: 28000,
    rating: 4.5,
    reviewCount: 928,
    url: "https://www.klook.com/activity/4070-cyclo-tour",
  },
  {
    id: "kkday-hcm-cyclo",
    matchTag: "hcm-spot-cyclo",
    ota: "kkday",
    title: "Saigon Cyclo City Tour 2H",
    priceKrw: 24000,
    rating: 4.4,
    reviewCount: 412,
    url: "https://www.kkday.com/product/44005-cyclo-tour",
  },
  {
    id: "agoda-hcm-cyclo",
    matchTag: "hcm-spot-cyclo",
    ota: "agoda",
    title: "Ho Chi Minh Cyclo Tour",
    priceKrw: 25000,
    rating: 4.3,
    reviewCount: 218,
    url: "https://www.agoda.com/activities/ho-chi-minh/cyclo",
  },

  // ── 벤탄 푸드 워킹투어 ────────────────────────────────────────────
  {
    id: "klook-hcm-streetFood",
    matchTag: "hcm-food-streetFood",
    ota: "klook",
    title: "벤탄시장 푸드 워킹투어 (한국어)",
    priceKrw: 28000,
    originalPriceKrw: 34000,
    rating: 4.7,
    reviewCount: 1420,
    url: "https://www.klook.com/activity/4080-ben-thanh-food-tour",
  },
  {
    id: "kkday-hcm-streetFood",
    matchTag: "hcm-food-streetFood",
    ota: "kkday",
    title: "Ben Thanh Street Food Walking Tour",
    priceKrw: 30000,
    rating: 4.6,
    reviewCount: 624,
    url: "https://www.kkday.com/product/44006-ben-thanh-food",
  },
];

// ═══════════════════════════════════════════════════════════════════
// 하노이 (HAN, VND) — 사이클 G-2
// ═══════════════════════════════════════════════════════════════════

export const hanoiOtaOffers: OtaOffer[] = [
  // ── 하롱베이 데이투어 ─────────────────────────────────────────────
  {
    id: "klook-han-halong",
    matchTag: "han-spot-halong",
    ota: "klook",
    title: "하롱베이 1일 크루즈 (한국어 가이드 + 카약)",
    priceKrw: 55000,
    originalPriceKrw: 68000,
    rating: 4.6,
    reviewCount: 4280,
    url: "https://www.klook.com/activity/5050-halong-bay-day-cruise",
  },
  {
    id: "kkday-han-halong",
    matchTag: "han-spot-halong",
    ota: "kkday",
    title: "Ha Long Bay Day Cruise from Hanoi",
    priceKrw: 58000,
    rating: 4.5,
    reviewCount: 1820,
    url: "https://www.kkday.com/product/55001-halong-bay",
  },
  {
    id: "agoda-han-halong",
    matchTag: "han-spot-halong",
    ota: "agoda",
    title: "Halong Bay Full Day from Hanoi",
    priceKrw: 60000,
    rating: 4.4,
    reviewCount: 924,
    url: "https://www.agoda.com/activities/hanoi/halong-bay",
  },

  // ── 닌빈 짱안 + 호아루 데이투어 ─────────────────────────────────
  {
    id: "klook-han-ninhBinh",
    matchTag: "han-spot-ninhBinh",
    ota: "klook",
    title: "닌빈 짱안 + 호아루 1일 투어 (한국어)",
    priceKrw: 42000,
    originalPriceKrw: 52000,
    rating: 4.7,
    reviewCount: 2240,
    url: "https://www.klook.com/activity/5060-ninh-binh-tour",
  },
  {
    id: "kkday-han-ninhBinh",
    matchTag: "han-spot-ninhBinh",
    ota: "kkday",
    title: "Trang An Boat + Hoa Lu Ancient Capital",
    priceKrw: 45000,
    rating: 4.6,
    reviewCount: 928,
    url: "https://www.kkday.com/product/55002-ninh-binh",
  },

  // ── 호치민 영묘 + 문묘 시티투어 ─────────────────────────────────
  {
    id: "klook-han-cityTour",
    matchTag: "han-spot-cityTour",
    ota: "klook",
    title: "하노이 시티투어 (영묘 + 문묘 + 한기둥 사원)",
    priceKrw: 25000,
    rating: 4.5,
    reviewCount: 1180,
    url: "https://www.klook.com/activity/5070-hanoi-city-tour",
  },
  {
    id: "kkday-han-cityTour",
    matchTag: "han-spot-cityTour",
    ota: "kkday",
    title: "Hanoi Half Day Old Quarter + Mausoleum",
    priceKrw: 27000,
    rating: 4.4,
    reviewCount: 612,
    url: "https://www.kkday.com/product/55003-hanoi-city",
  },

  // ── 구시가지 푸드 워킹투어 ────────────────────────────────────────
  {
    id: "klook-han-streetFoodTour",
    matchTag: "han-food-streetFoodTour",
    ota: "klook",
    title: "하노이 구시가지 36거리 푸드투어 (한국어)",
    priceKrw: 32000,
    originalPriceKrw: 38000,
    rating: 4.7,
    reviewCount: 1620,
    url: "https://www.klook.com/activity/5080-hanoi-street-food",
  },
  {
    id: "kkday-han-streetFoodTour",
    matchTag: "han-food-streetFoodTour",
    ota: "kkday",
    title: "Hanoi Old Quarter Street Food Walking Tour",
    priceKrw: 34000,
    rating: 4.6,
    reviewCount: 728,
    url: "https://www.kkday.com/product/55004-hanoi-food",
  },

  // ── 탕롱 수상인형극 ───────────────────────────────────────────────
  {
    id: "klook-han-waterPuppet",
    matchTag: "han-spot-waterPuppet",
    ota: "klook",
    title: "탕롱 수상인형극 입장권",
    priceKrw: 12000,
    rating: 4.4,
    reviewCount: 3420,
    url: "https://www.klook.com/activity/5090-thang-long-water-puppet",
  },
  {
    id: "kkday-han-waterPuppet",
    matchTag: "han-spot-waterPuppet",
    ota: "kkday",
    title: "Thang Long Water Puppet Show Ticket",
    priceKrw: 13000,
    rating: 4.3,
    reviewCount: 1240,
    url: "https://www.kkday.com/product/55005-water-puppet",
  },
];

// ═══════════════════════════════════════════════════════════════════
// 나트랑 (NHA / CXR, VND) — 사이클 G-4
// ═══════════════════════════════════════════════════════════════════

export const nhaTrangOtaOffers: OtaOffer[] = [
  // ── 빈원더스 나트랑 ──────────────────────────────────────────────
  {
    id: "klook-nh-vinwonders",
    matchTag: "nh-spot-vinwonders",
    ota: "klook",
    title: "빈원더스 나트랑 + 케이블카 통합권",
    priceKrw: 65000,
    originalPriceKrw: 78000,
    rating: 4.7,
    reviewCount: 4820,
    url: "https://www.klook.com/activity/6010-vinwonders-nha-trang",
  },
  {
    id: "kkday-nh-vinwonders",
    matchTag: "nh-spot-vinwonders",
    ota: "kkday",
    title: "Vinwonders Nha Trang + Cable Car",
    priceKrw: 68000,
    rating: 4.6,
    reviewCount: 1840,
    url: "https://www.kkday.com/product/66001-vinwonders-nha-trang",
  },
  {
    id: "agoda-nh-vinwonders",
    matchTag: "nh-spot-vinwonders",
    ota: "agoda",
    title: "Vinpearl Land Day Pass",
    priceKrw: 70000,
    rating: 4.5,
    reviewCount: 928,
    url: "https://www.agoda.com/activities/nha-trang/vinwonders",
  },

  // ── 4섬 스노클링 데이투어 ─────────────────────────────────────────
  {
    id: "klook-nh-snorkeling",
    matchTag: "nh-spot-snorkeling",
    ota: "klook",
    title: "혼문 4섬 스노클링 + 보트 디스코 (한국어)",
    priceKrw: 28000,
    originalPriceKrw: 35000,
    rating: 4.5,
    reviewCount: 2820,
    url: "https://www.klook.com/activity/6020-4-island-snorkeling",
  },
  {
    id: "kkday-nh-snorkeling",
    matchTag: "nh-spot-snorkeling",
    ota: "kkday",
    title: "Nha Trang 4 Islands Day Tour",
    priceKrw: 30000,
    rating: 4.4,
    reviewCount: 1240,
    url: "https://www.kkday.com/product/66002-4-island-tour",
  },
  {
    id: "agoda-nh-snorkeling",
    matchTag: "nh-spot-snorkeling",
    ota: "agoda",
    title: "4 Islands Snorkeling Tour",
    priceKrw: 32000,
    rating: 4.3,
    reviewCount: 624,
    url: "https://www.agoda.com/activities/nha-trang/4-islands",
  },

  // ── Thap Ba 머드 스파 ────────────────────────────────────────────
  {
    id: "klook-nh-mudSpa",
    matchTag: "nh-spot-mudSpa",
    ota: "klook",
    title: "Thap Ba 머드 스파 + 미네랄 풀 (개인탕)",
    priceKrw: 18000,
    rating: 4.5,
    reviewCount: 3420,
    url: "https://www.klook.com/activity/6030-thap-ba-mud-spa",
  },
  {
    id: "kkday-nh-mudSpa",
    matchTag: "nh-spot-mudSpa",
    ota: "kkday",
    title: "Thap Ba Hot Springs Mud Bath",
    priceKrw: 19000,
    rating: 4.4,
    reviewCount: 1280,
    url: "https://www.kkday.com/product/66003-thap-ba-spa",
  },

  // ── 야시장 시푸드 푸드투어 ────────────────────────────────────────
  {
    id: "klook-nh-streetFood",
    matchTag: "nh-food-streetFood",
    ota: "klook",
    title: "나트랑 시푸드 야시장 푸드투어 (한국어)",
    priceKrw: 32000,
    originalPriceKrw: 38000,
    rating: 4.6,
    reviewCount: 1680,
    url: "https://www.klook.com/activity/6040-nha-trang-food-tour",
  },
  {
    id: "kkday-nh-streetFood",
    matchTag: "nh-food-streetFood",
    ota: "kkday",
    title: "Nha Trang Seafood Night Market Tour",
    priceKrw: 34000,
    rating: 4.5,
    reviewCount: 728,
    url: "https://www.kkday.com/product/66004-nha-trang-food",
  },

  // ── 폰가나가르 + 스톤성당 시티투어 ───────────────────────────────
  {
    id: "klook-nh-cityTour",
    matchTag: "nh-spot-cityTour",
    ota: "klook",
    title: "나트랑 시티투어 (폰가나가르 + 스톤성당)",
    priceKrw: 22000,
    rating: 4.5,
    reviewCount: 1180,
    url: "https://www.klook.com/activity/6050-nha-trang-city-tour",
  },
  {
    id: "kkday-nh-cityTour",
    matchTag: "nh-spot-cityTour",
    ota: "kkday",
    title: "Nha Trang Half Day City Tour",
    priceKrw: 24000,
    rating: 4.4,
    reviewCount: 612,
    url: "https://www.kkday.com/product/66005-city-tour",
  },
];

// ═══════════════════════════════════════════════════════════════════
// 달랏 (DLI, VND) — 사이클 N
// ═══════════════════════════════════════════════════════════════════

export const daLatOtaOffers: OtaOffer[] = [
  // ── 달랏 야시장 푸드 워킹투어 (보조 — 2 offer) ────────────────────
  {
    id: "klook-dl-nightMarket",
    matchTag: "dl-food-nightMarket",
    ota: "klook",
    title: "달랏 야시장 푸드 워킹투어 (반짱느엉 + 두유)",
    priceKrw: 22000,
    originalPriceKrw: 28000,
    rating: 4.6,
    reviewCount: 928,
    url: "https://www.klook.com/activity/7710-da-lat-night-market",
  },
  {
    id: "kkday-dl-nightMarket",
    matchTag: "dl-food-nightMarket",
    ota: "kkday",
    title: "Da Lat Night Market Food Walking Tour",
    priceKrw: 24000,
    rating: 4.5,
    reviewCount: 412,
    url: "https://www.kkday.com/product/77001-da-lat-night-market",
  },

  // ── 랑비앙 일출 지프 투어 (시그니처 — 3 offer) ────────────────────
  {
    id: "klook-dl-langbiang",
    matchTag: "dl-spot-langbiang",
    ota: "klook",
    title: "랑비앙 일출 지프 투어 (호텔 새벽 픽업)",
    priceKrw: 38000,
    originalPriceKrw: 45000,
    rating: 4.7,
    reviewCount: 1240,
    url: "https://www.klook.com/activity/7720-langbiang-sunrise",
  },
  {
    id: "kkday-dl-langbiang",
    matchTag: "dl-spot-langbiang",
    ota: "kkday",
    title: "Langbiang Mountain Sunrise + Jeep",
    priceKrw: 41000,
    rating: 4.6,
    reviewCount: 624,
    url: "https://www.kkday.com/product/77002-langbiang-sunrise",
  },
  {
    id: "agoda-dl-langbiang",
    matchTag: "dl-spot-langbiang",
    ota: "agoda",
    title: "Langbiang Sunrise Tour with Pickup",
    priceKrw: 42000,
    rating: 4.5,
    reviewCount: 218,
    url: "https://www.agoda.com/activities/da-lat/langbiang",
  },

  // ── 다탄라 폭포 + 알파인 코스터 (시그니처 — 3 offer) ──────────────
  {
    id: "klook-dl-datanla",
    matchTag: "dl-spot-datanla",
    ota: "klook",
    title: "다탄라 폭포 + 알파인 코스터 1.6km (한국어)",
    priceKrw: 29000,
    originalPriceKrw: 35000,
    rating: 4.7,
    reviewCount: 1620,
    url: "https://www.klook.com/activity/7730-datanla-coaster",
  },
  {
    id: "kkday-dl-datanla",
    matchTag: "dl-spot-datanla",
    ota: "kkday",
    title: "Datanla Waterfall Alpine Coaster",
    priceKrw: 31000,
    rating: 4.6,
    reviewCount: 728,
    url: "https://www.kkday.com/product/77003-datanla",
  },
  {
    id: "agoda-dl-datanla",
    matchTag: "dl-spot-datanla",
    ota: "agoda",
    title: "Datanla Falls + Coaster Day Pass",
    priceKrw: 32000,
    rating: 4.5,
    reviewCount: 312,
    url: "https://www.agoda.com/activities/da-lat/datanla",
  },

  // ── 달랏 케이블카 + Truc Lam 사찰 (보조 — 2 offer) ────────────────
  {
    id: "klook-dl-cableCar",
    matchTag: "dl-spot-cableCar",
    ota: "klook",
    title: "달랏 케이블카 왕복 + Truc Lam 선원",
    priceKrw: 11000,
    rating: 4.5,
    reviewCount: 540,
    url: "https://www.klook.com/activity/7740-da-lat-cable-car",
  },
  {
    id: "kkday-dl-cableCar",
    matchTag: "dl-spot-cableCar",
    ota: "kkday",
    title: "Da Lat Cable Car + Truc Lam Pagoda",
    priceKrw: 13000,
    rating: 4.4,
    reviewCount: 282,
    url: "https://www.kkday.com/product/77004-da-lat-cable-car",
  },
];

// ═══════════════════════════════════════════════════════════════════
// 통합 풀 — 모든 도시 OTA Offer (호출처는 항상 이걸 통해 매칭)
// ═══════════════════════════════════════════════════════════════════

export const allOtaOffers: OtaOffer[] = [
  ...phuQuocOtaOffers,
  ...daNangOtaOffers,
  ...bangkokOtaOffers,
  ...tokyoOtaOffers,
  ...hoChiMinhOtaOffers,
  ...hanoiOtaOffers,
  ...nhaTrangOtaOffers,
  ...daLatOtaOffers,
];

/**
 * 매칭 — ItineraryItem.id 또는 추정 매칭 키로 OtaOffer 찾기.
 * 사이클 12a는 단순한 prefix/keyword 매칭. 12b+에서 정밀화.
 * 사이클 C: 푸꾸옥 + 다낭/방콕/도쿄 통합 풀에서 검색.
 */
export function findOffersForItem(itemId: string): OtaOffer[] {
  // 정확 일치 우선
  const exact = allOtaOffers.filter((o) => o.matchTag === itemId);
  if (exact.length > 0) return exact;

  // 키워드 매칭 (item.name lowercase 키워드 기반은 호출처에서 처리)
  return [];
}

/**
 * 텍스트(name) 기반 fuzzy 매칭 — 도시별 키워드 분기.
 * 사이클 C: 다낭/방콕/도쿄 한·영 키워드 보강.
 */
export function findOffersByKeyword(name: string): OtaOffer[] {
  const lower = name.toLowerCase();
  const matched = new Set<string>();

  // ── 푸꾸옥 (사이클 12a)
  // 사이클 G-4: vinwonder/snorkel/야시장/케이블카는 나트랑과 충돌 → 도시 게이트 도입
  if (lower.includes("사오비치") || lower.includes("sao beach"))
    matched.add("pq-spot-saobeach");
  if (lower.includes("사파리") || lower.includes("safari"))
    matched.add("pq-spot-safari");
  // 도시 게이트가 필요한 키워드 — 도시 키워드 명시 시만
  const isPhuQuocCtx =
    lower.includes("푸꾸옥") || lower.includes("phu quoc");
  const isNhaTrangCtx =
    lower.includes("나트랑") ||
    lower.includes("냐짱") ||
    lower.includes("nha trang");
  // 사이클 N: 달랏 게이트 추가 (야시장·케이블카 충돌 회피)
  const isDaLatCtx =
    lower.includes("달랏") || lower.includes("da lat") || lower.includes("dalat");
  if (lower.includes("케이블카") || lower.includes("cable car")) {
    if (isPhuQuocCtx) matched.add("pq-spot-cablecar");
    if (isDaLatCtx) matched.add("dl-spot-cableCar");
    // 나트랑 빈원더스 케이블카는 빈원더스 시드에 통합 (별도 시드 없음)
  }
  if (lower.includes("야시장") || lower.includes("night market")) {
    if (isPhuQuocCtx) matched.add("pq-food-night-market");
    if (isNhaTrangCtx) matched.add("nh-food-streetFood");
    if (isDaLatCtx) matched.add("dl-food-nightMarket");
    // 어느 쪽도 명시 안 된 모호한 입력은 매칭 X (오탐 방지)
  }
  if (lower.includes("vinwonder") || lower.includes("빈원더")) {
    if (isPhuQuocCtx) matched.add("pq-spot-vinwonders");
    if (isNhaTrangCtx) matched.add("nh-spot-vinwonders");
  }
  if (
    lower.includes("스노클") ||
    lower.includes("snorkel") ||
    lower.includes("어드벤처")
  ) {
    if (isPhuQuocCtx) matched.add("pq-spot-snorkeling");
    if (isNhaTrangCtx) matched.add("nh-spot-snorkeling");
    // "어드벤처" 단독은 맥락 부족 — 도시 키워드 필수
  }

  // ── 다낭 (사이클 C + D)
  if (lower.includes("바나힐") || lower.includes("ba na"))
    matched.add("dn-spot-banaHills");
  if (lower.includes("호이안") || lower.includes("hoi an"))
    matched.add("dn-spot-hoianTour");
  if (lower.includes("미케") || lower.includes("my khe"))
    matched.add("dn-spot-mykheBeach");
  if (lower.includes("한시장") || lower.includes("han market"))
    matched.add("dn-food-hanmarket");
  if (lower.includes("미선") || lower.includes("my son"))
    matched.add("dn-spot-mySon");
  if (
    lower.includes("응우한선") ||
    lower.includes("대리석산") ||
    lower.includes("marble mountain")
  ) {
    matched.add("dn-spot-marble");
  }

  // ── 방콕 (사이클 C)
  // 사이클 G-1: dinner cruise는 호치민과 키워드 충돌 → 도시 게이트 도입
  if (lower.includes("차오프라야") || lower.includes("chao phraya"))
    matched.add("bk-food-dinnerCruise");
  if (lower.includes("아유타야") || lower.includes("ayutthaya"))
    matched.add("bk-spot-ayutthaya");
  if (
    lower.includes("왓아룬") ||
    lower.includes("왓 아룬") ||
    lower.includes("wat arun")
  ) {
    matched.add("bk-spot-watarun");
  }
  if (lower.includes("시암") || lower.includes("siam"))
    matched.add("bk-spot-siamPass");

  // ── 도쿄 (사이클 C)
  if (
    lower.includes("디즈니") ||
    lower.includes("disney")
  ) {
    matched.add("ty-spot-disneyland");
  }
  if (
    lower.includes("시부야 스카이") ||
    lower.includes("shibuya sky")
  ) {
    matched.add("ty-spot-shibuyaSky");
  }
  if (
    lower.includes("후지") ||
    lower.includes("fuji") ||
    lower.includes("하코네") ||
    lower.includes("hakone")
  ) {
    matched.add("ty-spot-fujiTour");
  }

  // ── 호치민 (사이클 G-1)
  if (lower.includes("메콩") || lower.includes("mekong"))
    matched.add("hcm-spot-mekong");
  if (lower.includes("indochina queen") || lower.includes("사이공 강 디너"))
    matched.add("hcm-food-dinnerCruise");
  if (
    lower.includes("통일궁") ||
    lower.includes("전쟁 박물관") ||
    lower.includes("전쟁박물관") ||
    lower.includes("reunification") ||
    lower.includes("war remnants")
  ) {
    matched.add("hcm-spot-warMuseum");
  }
  if (lower.includes("시클로") || lower.includes("cyclo"))
    matched.add("hcm-spot-cyclo");
  if (
    lower.includes("벤탄") ||
    lower.includes("ben thanh") ||
    lower.includes("benthanh")
  ) {
    matched.add("hcm-food-streetFood");
  }

  // ── 일반 "디너 크루즈" + 도시 키워드 (방콕/호치민 공통 fallback)
  if (lower.includes("디너 크루즈") || lower.includes("dinner cruise")) {
    if (lower.includes("방콕") || lower.includes("bangkok"))
      matched.add("bk-food-dinnerCruise");
    if (
      lower.includes("사이공") ||
      lower.includes("호치민") ||
      lower.includes("saigon")
    ) {
      matched.add("hcm-food-dinnerCruise");
    }
  }

  // ── 나트랑 (사이클 G-4)
  // vinwonder/snorkel/야시장은 위 푸꾸옥 블록에서 도시 게이트로 처리.
  // 여기서는 나트랑 고유 키워드만.
  if (
    lower.includes("머드 스파") ||
    lower.includes("머드스파") ||
    lower.includes("thap ba") ||
    lower.includes("mud spa") ||
    lower.includes("mud bath")
  ) {
    matched.add("nh-spot-mudSpa");
  }
  if (
    lower.includes("폰가나가르") ||
    lower.includes("ponagar") ||
    lower.includes("스톤 카테드랄") ||
    lower.includes("스톤 성당") ||
    lower.includes("스톤성당")
  ) {
    matched.add("nh-spot-cityTour");
  }
  if (
    lower.includes("4섬") ||
    lower.includes("4 island") ||
    lower.includes("four island") ||
    lower.includes("혼문") ||
    lower.includes("hon mun")
  ) {
    matched.add("nh-spot-snorkeling");
  }
  if (
    lower.includes("시푸드 야시장") ||
    lower.includes("seafood night market") ||
    lower.includes("cho dem")
  ) {
    matched.add("nh-food-streetFood");
  }

  // ── 달랏 (사이클 N) — 고유 키워드는 도시 게이트 불필요
  if (lower.includes("랑비앙") || lower.includes("langbiang") || lower.includes("lang biang"))
    matched.add("dl-spot-langbiang");
  if (
    lower.includes("다탄라") ||
    lower.includes("datanla") ||
    lower.includes("알파인 코스터") ||
    lower.includes("alpine coaster")
  ) {
    matched.add("dl-spot-datanla");
  }

  // ── 하노이 (사이클 G-2)
  if (
    lower.includes("하롱") ||
    lower.includes("ha long") ||
    lower.includes("halong")
  ) {
    matched.add("han-spot-halong");
  }
  if (
    lower.includes("닌빈") ||
    lower.includes("짱안") ||
    lower.includes("호아루") ||
    lower.includes("ninh binh") ||
    lower.includes("trang an") ||
    lower.includes("hoa lu")
  ) {
    matched.add("han-spot-ninhBinh");
  }
  if (
    lower.includes("호치민 영묘") ||
    lower.includes("문묘") ||
    lower.includes("한기둥") ||
    lower.includes("ho chi minh mausoleum") ||
    lower.includes("temple of literature")
  ) {
    matched.add("han-spot-cityTour");
  }
  // "구시가지" 단독은 호텔/체크인 등에 오탐 → "36거리" 또는 "old quarter" 또는 "푸드 워킹"
  if (
    lower.includes("36거리") ||
    lower.includes("old quarter") ||
    lower.includes("푸드 워킹")
  ) {
    matched.add("han-food-streetFoodTour");
  }
  if (
    lower.includes("수상인형") ||
    lower.includes("탕롱") ||
    lower.includes("water puppet") ||
    lower.includes("thang long")
  ) {
    matched.add("han-spot-waterPuppet");
  }

  return allOtaOffers.filter((o) => matched.has(o.matchTag));
}
