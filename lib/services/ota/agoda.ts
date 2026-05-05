/**
 * Agoda Activity API 통합 — 사이클 12b (ADR-027).
 * AGODA_API_KEY 미설정 시 demo. 실 endpoint는 Partner Hub 계약 후 갱신.
 */

import "server-only";

import type { OtaOffer } from "@/lib/types";
import { getEnvKey } from "@/lib/utils/env";
import { fetchOtaWithCache, normalizeMatchTag, OtaHttpError, type OtaOutcome } from "./fetch-ota";

const SEARCH_URL = "https://affiliateapi.agoda.com/api/v3/activities/search";

export type AgodaOutcome = OtaOutcome;

export async function fetchAgodaOffers(
  query: string,
  location?: { lat: number; lng: number },
): Promise<AgodaOutcome> {
  return fetchOtaWithCache({
    prefix: "agoda",
    platform: "ota.agoda",
    apiKey: getEnvKey("AGODA_API_KEY"),
    query,
    location,
    apiErrorCode: "agoda_api_error",
    doFetch: async (apiKey) => {
      const body = JSON.stringify({
        query,
        location: location
          ? { latitude: location.lat, longitude: location.lng }
          : undefined,
        currency: "KRW",
      });
      const resp = await fetch(SEARCH_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body,
        cache: "no-store",
      });

      if (!resp.ok) throw new OtaHttpError(resp.status);

      const json = (await resp.json()) as {
        activities?: Array<{
          id?: string;
          name?: string;
          price?: { current?: number; was?: number };
          review?: { score?: number; count?: number };
          bookingUrl?: string;
        }>;
      };

      return (json.activities ?? [])
        .filter((r) => r.id && r.name && r.price?.current)
        .map((r): OtaOffer => ({
          id: `agoda-${r.id}`,
          matchTag: normalizeMatchTag(query),
          ota: "agoda" as const,
          title: r.name!,
          priceKrw: r.price!.current!,
          originalPriceKrw: r.price!.was,
          rating: r.review?.score,
          reviewCount: r.review?.count,
          url: r.bookingUrl ?? `https://www.agoda.com/activities/${r.id}`,
        }));
    },
  });
}
