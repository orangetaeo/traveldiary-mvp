/**
 * Klook API 통합 — 사이클 12b (ADR-027).
 *
 * KLOOK_API_KEY 미설정 시 demo 즉시 반환.
 * 어필리에이트 계약 후 실제 endpoint URL 갱신 필요.
 */

import "server-only";

import type { OtaOffer } from "@/lib/types";
import { getEnvKey } from "@/lib/utils/env";
import { fetchOtaWithCache, normalizeMatchTag, OtaHttpError, type OtaOutcome } from "./fetch-ota";

// Stub — 어필리에이트 계약 후 실제 endpoint 갱신
const SEARCH_URL = "https://api.klook.com/v1/affiliate/search";

export type KlookOutcome = OtaOutcome;

export async function fetchKlookOffers(
  query: string,
  location?: { lat: number; lng: number },
): Promise<KlookOutcome> {
  return fetchOtaWithCache({
    prefix: "klook",
    platform: "ota.klook",
    apiKey: getEnvKey("KLOOK_API_KEY"),
    query,
    location,
    apiErrorCode: "klook_api_error",
    doFetch: async (apiKey) => {
      const params = new URLSearchParams({ q: query });
      if (location) {
        params.set("lat", String(location.lat));
        params.set("lng", String(location.lng));
      }
      const resp = await fetch(`${SEARCH_URL}?${params.toString()}`, {
        headers: { "X-Klook-Api-Key": apiKey },
        cache: "no-store",
      });

      if (!resp.ok) throw new OtaHttpError(resp.status);

      const json = (await resp.json()) as {
        results?: Array<{
          activity_id?: string;
          title?: string;
          price?: { selling_price?: number; market_price?: number };
          rating?: number;
          review_count?: number;
          url?: string;
        }>;
      };

      return (json.results ?? [])
        .filter((r) => r.activity_id && r.title && r.price?.selling_price)
        .map((r): OtaOffer => ({
          id: `klook-${r.activity_id}`,
          matchTag: normalizeMatchTag(query),
          ota: "klook" as const,
          title: r.title!,
          priceKrw: Math.round(r.price!.selling_price! * 1300), // USD→KRW 가정 (실 endpoint는 KRW 직접)
          originalPriceKrw: r.price!.market_price
            ? Math.round(r.price!.market_price * 1300)
            : undefined,
          rating: r.rating,
          reviewCount: r.review_count,
          url: r.url ?? `https://www.klook.com/activity/${r.activity_id}`,
        }));
    },
  });
}
