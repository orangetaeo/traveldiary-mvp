/**
 * Agoda Activity API 통합 — 사이클 12b (ADR-027).
 * AGODA_API_KEY 미설정 시 demo. 실 endpoint는 Partner Hub 계약 후 갱신.
 */

import "server-only";

import { createHash } from "crypto";
import {
  getEvidenceCache,
  setEvidenceCache,
} from "@/lib/repositories/evidence-cache.repository";
import {
  assertQuota,
  recordExternalCall,
  QuotaExceededError,
} from "@/lib/usage-quota";
import type { OtaOffer } from "@/lib/types";

const TTL_MS = 6 * 60 * 60 * 1000;
const PLATFORM = "ota.agoda";
const SEARCH_URL = "https://affiliateapi.agoda.com/api/v3/activities/search";

export type AgodaOutcome =
  | { mode: "demo" }
  | { mode: "ok"; offers: OtaOffer[]; cached: boolean }
  | {
      mode: "error";
      code: "agoda_api_error" | "network" | "quota_exceeded";
      message?: string;
    };

function getApiKey(): string | null {
  const k = process.env.AGODA_API_KEY;
  return k && k.length > 0 ? k : null;
}

export async function fetchAgodaOffers(
  query: string,
  location?: { lat: number; lng: number },
): Promise<AgodaOutcome> {
  const apiKey = getApiKey();
  if (!apiKey) return { mode: "demo" };

  const cacheKey = createHash("sha256")
    .update(`agoda:${query}:${location ? `${location.lat},${location.lng}` : ""}`)
    .digest("hex")
    .slice(0, 32);

  const cached = await getEvidenceCache<{ offers: OtaOffer[] }>(cacheKey, PLATFORM);
  if (cached) return { mode: "ok", offers: cached.data.offers, cached: true };

  try {
    assertQuota("ota");
  } catch (err) {
    if (err instanceof QuotaExceededError) {
      return {
        mode: "error",
        code: "quota_exceeded",
        message: `cap=${err.cap}, resetAt=${new Date(err.resetAt).toISOString()}`,
      };
    }
    throw err;
  }

  try {
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

    recordExternalCall("ota");

    if (!resp.ok) {
      return { mode: "error", code: "agoda_api_error", message: `HTTP ${resp.status}` };
    }

    const json = (await resp.json()) as {
      activities?: Array<{
        id?: string;
        name?: string;
        price?: { current?: number; was?: number };
        review?: { score?: number; count?: number };
        bookingUrl?: string;
      }>;
    };

    const offers: OtaOffer[] = (json.activities ?? [])
      .filter((r) => r.id && r.name && r.price?.current)
      .map((r) => ({
        id: `agoda-${r.id}`,
        matchTag: query.toLowerCase().replace(/\s+/g, "-").slice(0, 40),
        ota: "agoda" as const,
        title: r.name!,
        priceKrw: r.price!.current!,
        originalPriceKrw: r.price!.was,
        rating: r.review?.score,
        reviewCount: r.review?.count,
        url: r.bookingUrl ?? `https://www.agoda.com/activities/${r.id}`,
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
