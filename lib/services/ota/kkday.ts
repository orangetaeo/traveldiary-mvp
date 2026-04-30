/**
 * KKday API 통합 — 사이클 12b (ADR-027).
 * KKDAY_API_KEY 미설정 시 demo. 실 endpoint는 어필리에이트 계약 후 갱신.
 */

import "server-only";

import { createHash } from "crypto";
import {
  getEvidenceCache,
  setEvidenceCache,
} from "@/lib/repositories/evidence-cache.repository";
import type { OtaOffer } from "@/lib/types";

const TTL_MS = 6 * 60 * 60 * 1000;
const PLATFORM = "ota.kkday";
const SEARCH_URL = "https://api.kkday.com/v1/partner/products/search";

export type KKdayOutcome =
  | { mode: "demo" }
  | { mode: "ok"; offers: OtaOffer[]; cached: boolean }
  | { mode: "error"; code: "kkday_api_error" | "network"; message?: string };

function getApiKey(): string | null {
  const k = process.env.KKDAY_API_KEY;
  return k && k.length > 0 ? k : null;
}

export async function fetchKKdayOffers(
  query: string,
  location?: { lat: number; lng: number },
): Promise<KKdayOutcome> {
  const apiKey = getApiKey();
  if (!apiKey) return { mode: "demo" };

  const cacheKey = createHash("sha256")
    .update(`kkday:${query}:${location ? `${location.lat},${location.lng}` : ""}`)
    .digest("hex")
    .slice(0, 32);

  const cached = await getEvidenceCache<{ offers: OtaOffer[] }>(cacheKey, PLATFORM);
  if (cached) return { mode: "ok", offers: cached.data.offers, cached: true };

  try {
    const params = new URLSearchParams({ keyword: query });
    if (location) {
      params.set("latitude", String(location.lat));
      params.set("longitude", String(location.lng));
    }
    const resp = await fetch(`${SEARCH_URL}?${params.toString()}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    });

    if (!resp.ok) {
      return { mode: "error", code: "kkday_api_error", message: `HTTP ${resp.status}` };
    }

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

    const offers: OtaOffer[] = (json.data ?? [])
      .filter((r) => r.product_id && r.product_name && r.price?.sale_price)
      .map((r) => ({
        id: `kkday-${r.product_id}`,
        matchTag: query.toLowerCase().replace(/\s+/g, "-").slice(0, 40),
        ota: "kkday" as const,
        title: r.product_name!,
        priceKrw: r.price!.sale_price!,
        originalPriceKrw: r.price!.original_price ?? undefined,
        rating: r.rating_avg,
        reviewCount: r.rating_count,
        url: r.product_url ?? `https://www.kkday.com/product/${r.product_id}`,
      }));

    await setEvidenceCache({
      placeId: cacheKey,
      platform: PLATFORM,
      data: { offers },
      ttlMs: TTL_MS,
    });

    return { mode: "ok", offers, cached: false };
  } catch (err) {
    return {
      mode: "error",
      code: "network",
      message: err instanceof Error ? err.message : "unknown",
    };
  }
}
