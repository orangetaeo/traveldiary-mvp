/**
 * KKday API 통합 — 사이클 12b (ADR-027).
 * KKDAY_API_KEY 미설정 시 demo. 실 endpoint는 어필리에이트 계약 후 갱신.
 */

import "server-only";

import type { OtaOffer } from "@/lib/types";
import { getEnvKey } from "@/lib/utils/env";
import { fetchOtaWithCache, normalizeMatchTag, OtaHttpError, type OtaOutcome } from "./fetch-ota";

const SEARCH_URL = "https://api.kkday.com/v1/partner/products/search";

export type KKdayOutcome = OtaOutcome;

export async function fetchKKdayOffers(
  query: string,
  location?: { lat: number; lng: number },
): Promise<KKdayOutcome> {
  return fetchOtaWithCache({
    prefix: "kkday",
    platform: "ota.kkday",
    apiKey: getEnvKey("KKDAY_API_KEY"),
    query,
    location,
    apiErrorCode: "kkday_api_error",
    doFetch: async (apiKey) => {
      const params = new URLSearchParams({ keyword: query });
      if (location) {
        params.set("latitude", String(location.lat));
        params.set("longitude", String(location.lng));
      }
      const resp = await fetch(`${SEARCH_URL}?${params.toString()}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        cache: "no-store",
      });

      if (!resp.ok) throw new OtaHttpError(resp.status);

      const json = (await resp.json()) as {
        data?: Array<{
          product_id?: string;
          product_name?: string;
          price?: { sale_price?: number; original_price?: number };
          rating_avg?: number;
          rating_count?: number;
          product_url?: string;
        }>;
      };

      return (json.data ?? [])
        .filter((r) => r.product_id && r.product_name && r.price?.sale_price)
        .map((r): OtaOffer => ({
          id: `kkday-${r.product_id}`,
          matchTag: normalizeMatchTag(query),
          ota: "kkday" as const,
          title: r.product_name!,
          priceKrw: r.price!.sale_price!,
          originalPriceKrw: r.price!.original_price ?? undefined,
          rating: r.rating_avg,
          reviewCount: r.rating_count,
          url: r.product_url ?? `https://www.kkday.com/product/${r.product_id}`,
        }));
    },
  });
}
