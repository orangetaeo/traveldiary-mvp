/**
 * Klook API 통합 — 사이클 12b (ADR-027).
 *
 * KLOOK_API_KEY 미설정 시 demo 즉시 반환.
 * 어필리에이트 계약 후 실제 endpoint URL 갱신 필요.
 */

import "server-only";

import { createHash } from "crypto";
import {
  getEvidenceCache,
  setEvidenceCache,
} from "@/lib/repositories/evidence-cache.repository";
import type { OtaOffer } from "@/lib/types";

const TTL_MS = 6 * 60 * 60 * 1000; // 6시간
const PLATFORM = "ota.klook";

// Stub — 어필리에이트 계약 후 실제 endpoint 갱신
const SEARCH_URL = "https://api.klook.com/v1/affiliate/search";

export type KlookOutcome =
  | { mode: "demo" }
  | { mode: "ok"; offers: OtaOffer[]; cached: boolean }
  | { mode: "error"; code: "klook_api_error" | "network"; message?: string };

function getApiKey(): string | null {
  const k = process.env.KLOOK_API_KEY;
  return k && k.length > 0 ? k : null;
}

export async function fetchKlookOffers(
  query: string,
  location?: { lat: number; lng: number },
): Promise<KlookOutcome> {
  const apiKey = getApiKey();
  if (!apiKey) return { mode: "demo" };

  const cacheKey = createHash("sha256")
    .update(`klook:${query}:${location ? `${location.lat},${location.lng}` : ""}`)
    .digest("hex")
    .slice(0, 32);

  const cached = await getEvidenceCache<{ offers: OtaOffer[] }>(cacheKey, PLATFORM);
  if (cached) {
    return { mode: "ok", offers: cached.data.offers, cached: true };
  }

  try {
    const params = new URLSearchParams({ q: query });
    if (location) {
      params.set("lat", String(location.lat));
      params.set("lng", String(location.lng));
    }
    const resp = await fetch(`${SEARCH_URL}?${params.toString()}`, {
      headers: { "X-Klook-Api-Key": apiKey },
      cache: "no-store",
    });

    if (!resp.ok) {
      return { mode: "error", code: "klook_api_error", message: `HTTP ${resp.status}` };
    }

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

    const offers: OtaOffer[] = (json.results ?? [])
      .filter((r) => r.activity_id && r.title && r.price?.selling_price)
      .map((r) => ({
        id: `klook-${r.activity_id}`,
        matchTag: query.toLowerCase().replace(/\s+/g, "-").slice(0, 40),
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
