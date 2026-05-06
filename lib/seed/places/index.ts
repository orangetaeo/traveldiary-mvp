/**
 * 시드 장소 풀 인덱스 — 자동 생성.
 * Discover 페이지 + AddItemModal에서 사용.
 */

export { phuQuocDiscoverPlaces, phuQuocDiscoverCount } from "./phu-quoc-discover";

import phuQuocPlacesJson from "./phu-quoc-places.json";
export const phuQuocPlaces = phuQuocPlacesJson;

import type { DiscoverPlace } from "@/lib/types";

const allDiscoverPlaces: DiscoverPlace[] = [];

// 동적 import를 피하고 정적 배열로 결합
import { phuQuocDiscoverPlaces } from "./phu-quoc-discover";
allDiscoverPlaces.push(...phuQuocDiscoverPlaces);

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
  return [];
}
