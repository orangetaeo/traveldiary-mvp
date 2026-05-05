/**
 * Google Places API 통합 — 사이클 5b-3 (ADR-018).
 *
 * 정책:
 *   - server-only — 클라이언트 번들 격리. API 키 노출 절대 금지.
 *   - GOOGLE_PLACES_API_KEY 미설정 시 모든 호출이 { mode: "demo" } 반환.
 *   - 두 엔드포인트만 사용: Find Place from Text, Place Details.
 *   - 캐시 우선 lookup (EvidenceCache 24h/1h TTL).
 */

import "server-only";

import {
  getEvidenceCache,
  setEvidenceCache,
} from "@/lib/repositories/evidence-cache.repository";
import {
  assertQuota,
  recordExternalCall,
  QuotaExceededError,
} from "@/lib/usage-quota";
import { getEnvKey } from "@/lib/utils/env";
import { hashCacheKey } from "@/lib/utils/cache-key";

const FIND_PLACE_TTL_MS = 60 * 60 * 1000; // 1시간
const DETAILS_TTL_MS = 24 * 60 * 60 * 1000; // 24시간

const FIND_PLACE_PLATFORM = "google.find_place";
const DETAILS_PLATFORM = "google.details";

const FIND_PLACE_URL =
  "https://maps.googleapis.com/maps/api/place/findplacefromtext/json";
const DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json";

const DETAILS_FIELDS = [
  "name",
  "formatted_address",
  "place_id",
  "business_status",
  "opening_hours",
  "rating",
  "user_ratings_total",
  "types",
].join(",");

// ═══════════════════════════════════════════════════════════════════
// 공개 타입
// ═══════════════════════════════════════════════════════════════════

export interface PlaceDetails {
  placeId: string;
  name: string;
  formattedAddress: string;
  businessStatus?: "OPERATIONAL" | "CLOSED_TEMPORARILY" | "CLOSED_PERMANENTLY";
  openNow?: boolean;
  rating?: number;
  userRatingsTotal?: number;
  types?: string[];
}

export type FindPlaceOutcome =
  | { mode: "demo" }
  | { mode: "found"; placeId: string; cached: boolean }
  | { mode: "not_found"; cached: boolean }
  | {
      mode: "error";
      code: "google_api_error" | "network" | "quota_exceeded";
      message?: string;
    };

export type DetailsOutcome =
  | { mode: "demo" }
  | { mode: "found"; details: PlaceDetails; cached: boolean }
  | { mode: "not_found"; cached: boolean }
  | {
      mode: "error";
      code: "google_api_error" | "network" | "quota_exceeded";
      message?: string;
    };

// ═══════════════════════════════════════════════════════════════════
// API 키 분기
// ═══════════════════════════════════════════════════════════════════

function getApiKey(): string | null {
  return getEnvKey("GOOGLE_PLACES_API_KEY");
}

export const googlePlacesAvailable = (): boolean => getApiKey() !== null;

// ═══════════════════════════════════════════════════════════════════
// Find Place from Text
// ═══════════════════════════════════════════════════════════════════

export async function findPlaceFromText(
  query: string,
  location?: { lat: number; lng: number },
): Promise<FindPlaceOutcome> {
  const apiKey = getApiKey();
  if (!apiKey) return { mode: "demo" };

  // 캐시 키: query + location 해시
  const cacheKey = hashKey(query, location);
  const cached = await getEvidenceCache<{ placeId: string | null }>(
    cacheKey,
    FIND_PLACE_PLATFORM,
  );
  if (cached) {
    if (cached.data.placeId) {
      return { mode: "found", placeId: cached.data.placeId, cached: true };
    }
    return { mode: "not_found", cached: true };
  }

  try {
    assertQuota("google-places");
  } catch (err) {
    if (err instanceof QuotaExceededError) {
      // 사이클 AAAA7: 차단 시도도 기록 (anthropic-claude.ts AAAA5b 답습).
      recordExternalCall("google-places", { blockedBy: "quota" });
      return {
        mode: "error",
        code: "quota_exceeded",
        message: `cap=${err.cap}, resetAt=${new Date(err.resetAt).toISOString()}`,
      };
    }
    throw err;
  }

  try {
    const params = new URLSearchParams({
      input: query,
      inputtype: "textquery",
      fields: "place_id",
      key: apiKey,
    });
    if (location) {
      params.set("locationbias", `circle:5000@${location.lat},${location.lng}`);
    }

    const resp = await fetch(`${FIND_PLACE_URL}?${params.toString()}`, {
      method: "GET",
      cache: "no-store",
    });

    recordExternalCall("google-places");

    if (!resp.ok) {
      return { mode: "error", code: "google_api_error", message: `HTTP ${resp.status}` };
    }

    const json = (await resp.json()) as {
      status: string;
      candidates?: Array<{ place_id?: string }>;
      error_message?: string;
    };

    if (json.status === "OK" && json.candidates?.[0]?.place_id) {
      const placeId = json.candidates[0].place_id;
      await setEvidenceCache({
        placeId: cacheKey,
        platform: FIND_PLACE_PLATFORM,
        data: { placeId },
        ttlMs: FIND_PLACE_TTL_MS,
      });
      return { mode: "found", placeId, cached: false };
    }

    if (json.status === "ZERO_RESULTS") {
      // 조회는 했지만 결과 없음 — 캐시 (재호출 비용 절감)
      await setEvidenceCache({
        placeId: cacheKey,
        platform: FIND_PLACE_PLATFORM,
        data: { placeId: null },
        ttlMs: FIND_PLACE_TTL_MS,
      });
      return { mode: "not_found", cached: false };
    }

    return {
      mode: "error",
      code: "google_api_error",
      message: json.error_message ?? json.status,
    };
  } catch (err) {
    return {
      mode: "error",
      code: "network",
      message: err instanceof Error ? err.message : "unknown",
    };
  }
}

// ═══════════════════════════════════════════════════════════════════
// Place Details
// ═══════════════════════════════════════════════════════════════════

export async function getPlaceDetails(
  placeId: string,
): Promise<DetailsOutcome> {
  const apiKey = getApiKey();
  if (!apiKey) return { mode: "demo" };

  const cached = await getEvidenceCache<PlaceDetails | null>(
    placeId,
    DETAILS_PLATFORM,
  );
  if (cached) {
    if (cached.data) {
      return { mode: "found", details: cached.data, cached: true };
    }
    return { mode: "not_found", cached: true };
  }

  try {
    assertQuota("google-places");
  } catch (err) {
    if (err instanceof QuotaExceededError) {
      // 사이클 AAAA7: 차단 시도도 기록 (anthropic-claude.ts AAAA5b 답습).
      recordExternalCall("google-places", { blockedBy: "quota" });
      return {
        mode: "error",
        code: "quota_exceeded",
        message: `cap=${err.cap}, resetAt=${new Date(err.resetAt).toISOString()}`,
      };
    }
    throw err;
  }

  try {
    const params = new URLSearchParams({
      place_id: placeId,
      fields: DETAILS_FIELDS,
      key: apiKey,
    });

    const resp = await fetch(`${DETAILS_URL}?${params.toString()}`, {
      method: "GET",
      cache: "no-store",
    });

    recordExternalCall("google-places");

    if (!resp.ok) {
      return { mode: "error", code: "google_api_error", message: `HTTP ${resp.status}` };
    }

    const json = (await resp.json()) as {
      status: string;
      result?: {
        place_id?: string;
        name?: string;
        formatted_address?: string;
        business_status?: PlaceDetails["businessStatus"];
        opening_hours?: { open_now?: boolean };
        rating?: number;
        user_ratings_total?: number;
        types?: string[];
      };
      error_message?: string;
    };

    if (json.status === "OK" && json.result?.place_id) {
      const r = json.result;
      const details: PlaceDetails = {
        placeId: r.place_id!,
        name: r.name ?? "",
        formattedAddress: r.formatted_address ?? "",
        businessStatus: r.business_status,
        openNow: r.opening_hours?.open_now,
        rating: r.rating,
        userRatingsTotal: r.user_ratings_total,
        types: r.types,
      };
      await setEvidenceCache({
        placeId,
        platform: DETAILS_PLATFORM,
        data: details,
        ttlMs: DETAILS_TTL_MS,
      });
      return { mode: "found", details, cached: false };
    }

    if (json.status === "NOT_FOUND" || json.status === "ZERO_RESULTS") {
      await setEvidenceCache({
        placeId,
        platform: DETAILS_PLATFORM,
        data: null,
        ttlMs: DETAILS_TTL_MS,
      });
      return { mode: "not_found", cached: false };
    }

    return {
      mode: "error",
      code: "google_api_error",
      message: json.error_message ?? json.status,
    };
  } catch (err) {
    return {
      mode: "error",
      code: "network",
      message: err instanceof Error ? err.message : "unknown",
    };
  }
}

// ═══════════════════════════════════════════════════════════════════
// 헬퍼
// ═══════════════════════════════════════════════════════════════════

function hashKey(query: string, location?: { lat: number; lng: number }): string {
  const seed = location
    ? `${query}|${location.lat.toFixed(3)},${location.lng.toFixed(3)}`
    : query;
  return hashCacheKey(seed);
}
