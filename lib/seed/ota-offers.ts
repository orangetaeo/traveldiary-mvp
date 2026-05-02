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
// 통합 풀 — 모든 도시 OTA Offer (호출처는 항상 이걸 통해 매칭)
// ═══════════════════════════════════════════════════════════════════

export const allOtaOffers: OtaOffer[] = [
  ...phuQuocOtaOffers,
  ...daNangOtaOffers,
  ...bangkokOtaOffers,
  ...tokyoOtaOffers,
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
  if (lower.includes("케이블카") || lower.includes("cable car"))
    matched.add("pq-spot-cablecar");
  if (lower.includes("사오비치") || lower.includes("sao beach"))
    matched.add("pq-spot-saobeach");
  if (lower.includes("야시장") || lower.includes("night market"))
    matched.add("pq-food-night-market");
  if (lower.includes("vinwonder") || lower.includes("빈원더"))
    matched.add("pq-spot-vinwonders");
  if (
    lower.includes("스노클") ||
    lower.includes("snorkel") ||
    lower.includes("어드벤처")
  ) {
    matched.add("pq-spot-snorkeling");
  }
  if (lower.includes("사파리") || lower.includes("safari"))
    matched.add("pq-spot-safari");

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
  if (
    lower.includes("차오프라야") ||
    lower.includes("chao phraya") ||
    lower.includes("디너 크루즈") ||
    lower.includes("dinner cruise")
  ) {
    matched.add("bk-food-dinnerCruise");
  }
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

  return allOtaOffers.filter((o) => matched.has(o.matchTag));
}
