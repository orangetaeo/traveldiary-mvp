/**
 * OTA Offer 시드 — 사이클 12a M8 (ADR-025).
 *
 * 푸꾸옥 핵심 액티비티에 3 OTA 가격 시드. 매칭 키(matchTag)로
 * ItineraryItem과 결합 — 보통 place.id 또는 카테고리·키워드 기반.
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

/**
 * 매칭 — ItineraryItem.id 또는 추정 매칭 키로 OtaOffer 찾기.
 * 사이클 12a는 단순한 prefix/keyword 매칭. 12b+에서 정밀화.
 */
export function findOffersForItem(itemId: string): OtaOffer[] {
  // 정확 일치 우선
  const exact = phuQuocOtaOffers.filter((o) => o.matchTag === itemId);
  if (exact.length > 0) return exact;

  // 키워드 매칭 (item.name lowercase 키워드 기반은 호출처에서 처리)
  return [];
}

/** 텍스트(name) 기반 fuzzy 매칭 */
export function findOffersByKeyword(name: string): OtaOffer[] {
  const lower = name.toLowerCase();
  const matched = new Set<string>();

  if (lower.includes("케이블카") || lower.includes("cable")) matched.add("pq-spot-cablecar");
  if (lower.includes("사오비치") || lower.includes("sao beach")) matched.add("pq-spot-saobeach");
  if (lower.includes("야시장") || lower.includes("night market")) matched.add("pq-food-night-market");
  if (lower.includes("vinwonder") || lower.includes("빈원더")) matched.add("pq-spot-vinwonders");
  if (lower.includes("스노클") || lower.includes("snorkel") || lower.includes("어드벤처")) {
    matched.add("pq-spot-snorkeling");
  }

  return phuQuocOtaOffers.filter((o) => matched.has(o.matchTag));
}
