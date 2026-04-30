/**
 * City 시드 진입점 — 사이클 8 M5.
 *
 * 데모 모드: lib/seed/cities/* 직접 import → /city/[slug] 페이지 즉시 동작.
 * Prisma City 모델은 사이클 8.5+에서 (5b 답습).
 */

import type { City } from "../../types";
import { phuQuocCity } from "./phu-quoc";

const CITIES: Record<string, City> = {
  [phuQuocCity.slug]: phuQuocCity,
  // 사이클 8.5+에서 다낭 추가:
  // [daNangCity.slug]: daNangCity,
};

export const DEMO_CITY_SLUG = phuQuocCity.slug;

export function getCityBySlug(slug: string): City | null {
  return CITIES[slug] ?? null;
}

export function getCityByCode(code: string): City | null {
  for (const city of Object.values(CITIES)) {
    if (city.code === code) return city;
  }
  return null;
}

export function listCities(): City[] {
  return Object.values(CITIES);
}
