/**
 * OTA Aggregator — 3 OTA 병렬 호출 + 시드 fallback (사이클 12b, ADR-027).
 *
 * 모든 OTA 키 미설정 → 시드만 (12a 회귀 0).
 * 일부 키 설정 → 해당 OTA만 실 API, 나머지는 시드.
 * 결과는 같은 matchTag 중복 시 실 API 우선 (실시간 가격이 정확).
 */

import "server-only";

import { fetchKlookOffers } from "./ota/klook";
import { fetchKKdayOffers } from "./ota/kkday";
import { fetchAgodaOffers } from "./ota/agoda";
import {
  findOffersForItem,
  findOffersByKeyword,
} from "@/lib/seed/ota-offers";
import type { ItineraryItem, OtaOffer } from "@/lib/types";

export async function aggregateOffersForItem(
  item: ItineraryItem,
): Promise<OtaOffer[]> {
  // 1. 시드 우선 — 매칭이 있으면 시드 사용 (사이클 12a 동작)
  const seedExact = findOffersForItem(item.id);
  const seedKeyword = seedExact.length > 0 ? [] : findOffersByKeyword(item.name);
  const seedOffers = [...seedExact, ...seedKeyword];

  // 2. 실 API 병렬 호출 (키 미설정 OTA는 demo 즉시 반환)
  const query = item.name;
  const location = { lat: item.location.lat, lng: item.location.lng };

  const [klookRes, kkdayRes, agodaRes] = await Promise.allSettled([
    fetchKlookOffers(query, location),
    fetchKKdayOffers(query, location),
    fetchAgodaOffers(query, location),
  ]);

  const realOffers: OtaOffer[] = [];

  if (klookRes.status === "fulfilled" && klookRes.value.mode === "ok") {
    realOffers.push(...klookRes.value.offers);
  }
  if (kkdayRes.status === "fulfilled" && kkdayRes.value.mode === "ok") {
    realOffers.push(...kkdayRes.value.offers);
  }
  if (agodaRes.status === "fulfilled" && agodaRes.value.mode === "ok") {
    realOffers.push(...agodaRes.value.offers);
  }

  // 3. 통합 — 같은 (ota, matchTag) 중복 시 실 API 우선
  const merged = new Map<string, OtaOffer>();
  for (const offer of seedOffers) {
    merged.set(`${offer.ota}:${offer.matchTag}`, offer);
  }
  for (const offer of realOffers) {
    merged.set(`${offer.ota}:${offer.matchTag}`, offer);
  }

  return Array.from(merged.values());
}
