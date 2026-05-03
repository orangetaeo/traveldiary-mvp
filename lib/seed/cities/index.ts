/**
 * City 시드 진입점 — 사이클 8 M5.
 *
 * 데모 모드: lib/seed/cities/* 직접 import → /city/[slug] 페이지 즉시 동작.
 * Prisma City 모델은 사이클 8.5+에서 (5b 답습).
 *
 * 사이클 F (V3, 2026-05-02) — 베트남 우선 노출.
 * 사이클 H (ADR-032, 2026-05-02) — Country 모델 도입 + resolveCity() merge.
 *   - getCityBySlug()는 raw seed 그대로 반환 (호환성 유지)
 *   - resolveCity()는 city + country + GLOBAL_EMERGENCY_CONTACTS를 merge한 결과
 *   - 화면(/city/[slug]/page.tsx)은 resolveCity() 사용
 */

import type { City, ResolvedCity } from "../../types";
import { phuQuocCity } from "./phu-quoc";
import { daNangCity } from "./da-nang";
import { hoChiMinhCity } from "./ho-chi-minh";
import { hanoiCity } from "./hanoi";
import { hoiAnCity } from "./hoi-an";
import { nhaTrangCity } from "./nha-trang";
import { canThoCity } from "./can-tho";
import { daLatCity } from "./da-lat";
import { bangkokCity } from "./bangkok";
import { chiangMaiCity } from "./chiang-mai";
import { tokyoCity } from "./tokyo";
import {
  COUNTRIES,
  GLOBAL_EMERGENCY_CONTACTS,
} from "../../constants/countries";

const CITIES: Record<string, City> = {
  [phuQuocCity.slug]: phuQuocCity,
  [daNangCity.slug]: daNangCity,
  [hoChiMinhCity.slug]: hoChiMinhCity,
  [hanoiCity.slug]: hanoiCity,
  [hoiAnCity.slug]: hoiAnCity,
  [nhaTrangCity.slug]: nhaTrangCity,
  [canThoCity.slug]: canThoCity,
  [daLatCity.slug]: daLatCity,
  [bangkokCity.slug]: bangkokCity,
  [chiangMaiCity.slug]: chiangMaiCity,
  [tokyoCity.slug]: tokyoCity,
};

export const PRIMARY_COUNTRY_CODE = "VN";

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

export function isVietnamCity(city: City | null | undefined): boolean {
  return city?.countryCode === PRIMARY_COUNTRY_CODE;
}

/** 사용자 노출용 — 베트남 도시만 (사이클 F V3) */
export function listVietnamCities(): City[] {
  return Object.values(CITIES).filter((c) => c.countryCode === PRIMARY_COUNTRY_CODE);
}

// ═══════════════════════════════════════════════════════════════════
// resolveCity — 사이클 H (ADR-032)
//   city + country + GLOBAL_EMERGENCY_CONTACTS를 merge.
//   화면은 항상 이 resolved 객체를 사용 → 사이클 H 정규화 결과를 view에서
//   100% 동일하게 노출 (raw seed 변경 영향 없음).
// ═══════════════════════════════════════════════════════════════════

/**
 * city + country merge 결과. raw seed의 빈 country level 필드를 country에서 채움.
 * 도시 차별화 항목(transport·weather·curatedGuides·도시별 영사관 등)은 city 그대로.
 *
 * 반환 타입 ResolvedCity — payment 통화 3필드와 phrases가 required로 보장됨.
 */
export function resolveCity(slug: string): ResolvedCity | null {
  const city = getCityBySlug(slug);
  if (!city) return null;
  const country = COUNTRIES[city.countryCode];
  // country 미정의 안전장치 — 시드에 currency가 있을 때만 ResolvedCity로 좁힘
  if (!country) {
    if (
      city.payment.currency &&
      city.payment.currencySymbol &&
      city.payment.approxKrwRate !== undefined &&
      city.phrases &&
      city.phrases.length > 0
    ) {
      return city as ResolvedCity;
    }
    return null;
  }

  return {
    ...city,
    payment: {
      ...city.payment,
      currency: city.payment.currency ?? country.paymentDefaults.currency,
      currencySymbol:
        city.payment.currencySymbol ?? country.paymentDefaults.currencySymbol,
      approxKrwRate:
        city.payment.approxKrwRate ?? country.paymentDefaults.approxKrwRate,
    },
    phrases:
      city.phrases && city.phrases.length > 0
        ? city.phrases
        : country.defaultPhrases,
    utilities: city.utilities ?? country.utilities,
    visa: city.visa ?? country.visa,
    emergencyContacts: [
      ...city.emergencyContacts,
      ...country.countryEmergencyContacts,
      ...GLOBAL_EMERGENCY_CONTACTS,
    ],
  };
}

/** 코드로 ResolvedCity 조회 (사이클 H — travel page 등 코드 기반 호출처용) */
export function resolveCityByCode(code: string): ResolvedCity | null {
  const city = getCityByCode(code);
  if (!city) return null;
  return resolveCity(city.slug);
}
