/**
 * 시드 장소 풀 인덱스 — 6개 도시 통합.
 * Discover 페이지 + AddItemModal에서 사용.
 */

export { phuQuocDiscoverPlaces, phuQuocDiscoverCount } from "./phu-quoc-discover";
export { daNangDiscoverPlaces, daNangDiscoverCount } from "./da-nang-discover";
export { hoChiMinhDiscoverPlaces, hoChiMinhDiscoverCount } from "./ho-chi-minh-discover";
export { hanoiDiscoverPlaces, hanoiDiscoverCount } from "./hanoi-discover";
export { nhaTrangDiscoverPlaces, nhaTrangDiscoverCount } from "./nha-trang-discover";
export { daLatDiscoverPlaces, daLatDiscoverCount } from "./da-lat-discover";

import phuQuocPlacesJson from "./phu-quoc-places.json";
export const phuQuocPlaces = phuQuocPlacesJson;

import daNangPlacesJson from "./da-nang-places.json";
export const daNangPlaces = daNangPlacesJson;

import hoChiMinhPlacesJson from "./ho-chi-minh-places.json";
export const hoChiMinhPlaces = hoChiMinhPlacesJson;

import hanoiPlacesJson from "./hanoi-places.json";
export const hanoiPlaces = hanoiPlacesJson;

import nhaTrangPlacesJson from "./nha-trang-places.json";
export const nhaTrangPlaces = nhaTrangPlacesJson;

import daLatPlacesJson from "./da-lat-places.json";
export const daLatPlaces = daLatPlacesJson;

import type { DiscoverPlace } from "@/lib/types";

import { phuQuocDiscoverPlaces } from "./phu-quoc-discover";
import { daNangDiscoverPlaces } from "./da-nang-discover";
import { hoChiMinhDiscoverPlaces } from "./ho-chi-minh-discover";
import { hanoiDiscoverPlaces } from "./hanoi-discover";
import { nhaTrangDiscoverPlaces } from "./nha-trang-discover";
import { daLatDiscoverPlaces } from "./da-lat-discover";

const allDiscoverPlaces: DiscoverPlace[] = [
  ...phuQuocDiscoverPlaces,
  ...daNangDiscoverPlaces,
  ...hoChiMinhDiscoverPlaces,
  ...hanoiDiscoverPlaces,
  ...nhaTrangDiscoverPlaces,
  ...daLatDiscoverPlaces,
];

/** 전체 discover places (모든 도시 합산) */
export function getAllDiscoverPlaces(): DiscoverPlace[] {
  return allDiscoverPlaces;
}

/** 도시별 discover places 필터 */
export function getDiscoverPlacesByDestination(destination: string): DiscoverPlace[] {
  return allDiscoverPlaces.filter(
    (p) => !p.destination || p.destination === destination,
  );
}

/** 전체 seed places (JSON) — 도시별 */
export function getSeedPlaces(city: string) {
  if (city === "phu-quoc" || city === "푸꾸옥") return phuQuocPlacesJson;
  if (city === "da-nang" || city === "다낭") return daNangPlacesJson;
  if (city === "ho-chi-minh" || city === "호치민") return hoChiMinhPlacesJson;
  if (city === "hanoi" || city === "하노이") return hanoiPlacesJson;
  if (city === "nha-trang" || city === "나트랑") return nhaTrangPlacesJson;
  if (city === "da-lat" || city === "달랏") return daLatPlacesJson;
  return [];
}
