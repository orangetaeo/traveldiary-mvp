/**
 * 시드 장소 풀 인덱스 — 수동 관리.
 * Discover 페이지 + AddItemModal에서 사용.
 */

export { phuQuocDiscoverPlaces, phuQuocDiscoverCount } from "./phu-quoc-discover";
export { daNangDiscoverPlaces, daNangDiscoverCount } from "./da-nang-discover";

import phuQuocPlacesJson from "./phu-quoc-places.json";
export const phuQuocPlaces = phuQuocPlacesJson;

import daNangPlacesJson from "./da-nang-places.json";
export const daNangPlaces = daNangPlacesJson;

import type { DiscoverPlace } from "@/lib/types";

import { phuQuocDiscoverPlaces } from "./phu-quoc-discover";
import { daNangDiscoverPlaces } from "./da-nang-discover";

const allDiscoverPlaces: DiscoverPlace[] = [
  ...phuQuocDiscoverPlaces,
  ...daNangDiscoverPlaces,
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
  return [];
}
