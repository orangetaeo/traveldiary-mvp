/**
 * Google Directions API 통합 — 사이클 M (ADR-030, 5단계 검증 4단계).
 *
 * 정책 (외부 API 통합 표준 — google-places.ts 답습):
 *   - server-only — 클라이언트 번들 격리. API 키 노출 금지.
 *   - GOOGLE_DIRECTIONS_API_KEY 미설정 시 모든 호출이 { mode: "demo" } 반환.
 *   - 캐시 우선 lookup (EvidenceCache 24h TTL).
 *   - 캐시 키: SHA256(origin|dest|mode), 32자.
 *
 * 응답 가공:
 *   - 첫 route, 첫 leg의 duration.value (초)만 사용. 거리·polyline은 미사용.
 *   - ZERO_RESULTS·NOT_FOUND도 캐시 (재호출 비용 절감).
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
import type { TravelMode } from "./distance-rules";
import { getEnvKey } from "@/lib/utils/env";
import { hashCacheKey } from "@/lib/utils/cache-key";

const DIRECTIONS_TTL_MS = 24 * 60 * 60 * 1000; // 24시간
const DIRECTIONS_PLATFORM = "google.directions";
const DIRECTIONS_URL = "https://maps.googleapis.com/maps/api/directions/json";

// ═══════════════════════════════════════════════════════════════════
// 공개 타입
// ═══════════════════════════════════════════════════════════════════

export type DirectionsOutcome =
  | { mode: "demo" }
  | {
      mode: "found";
      durationSeconds: number;
      distanceMeters: number;
      cached: boolean;
    }
  | { mode: "not_found"; cached: boolean }
  | {
      mode: "error";
      code: "google_api_error" | "network" | "quota_exceeded";
      message?: string;
    };

export interface DirectionsInput {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  mode: TravelMode;
}

// ═══════════════════════════════════════════════════════════════════
// API 키 분기
// ═══════════════════════════════════════════════════════════════════

function getApiKey(): string | null {
  return getEnvKey("GOOGLE_DIRECTIONS_API_KEY");
}

export const googleDirectionsAvailable = (): boolean => getApiKey() !== null;

// ═══════════════════════════════════════════════════════════════════
// Directions
// ═══════════════════════════════════════════════════════════════════

export async function fetchDirections(
  input: DirectionsInput,
): Promise<DirectionsOutcome> {
  const apiKey = getApiKey();
  if (!apiKey) return { mode: "demo" };

  const cacheKey = hashKey(input);
  const cached = await getEvidenceCache<{
    durationSeconds: number | null;
    distanceMeters: number | null;
  }>(cacheKey, DIRECTIONS_PLATFORM);
  if (cached) {
    if (cached.data.durationSeconds !== null && cached.data.distanceMeters !== null) {
      return {
        mode: "found",
        durationSeconds: cached.data.durationSeconds,
        distanceMeters: cached.data.distanceMeters,
        cached: true,
      };
    }
    return { mode: "not_found", cached: true };
  }

  try {
    assertQuota("google-directions");
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
    const params = new URLSearchParams({
      origin: `${input.origin.lat},${input.origin.lng}`,
      destination: `${input.destination.lat},${input.destination.lng}`,
      mode: input.mode,
      key: apiKey,
    });

    const resp = await fetch(`${DIRECTIONS_URL}?${params.toString()}`, {
      method: "GET",
      cache: "no-store",
    });

    recordExternalCall("google-directions");

    if (!resp.ok) {
      return {
        mode: "error",
        code: "google_api_error",
        message: `HTTP ${resp.status}`,
      };
    }

    const json = (await resp.json()) as {
      status: string;
      routes?: Array<{
        legs?: Array<{
          duration?: { value?: number };
          distance?: { value?: number };
        }>;
      }>;
      error_message?: string;
    };

    if (json.status === "OK") {
      const leg = json.routes?.[0]?.legs?.[0];
      const durationSeconds = leg?.duration?.value;
      const distanceMeters = leg?.distance?.value;
      if (
        typeof durationSeconds === "number" &&
        typeof distanceMeters === "number"
      ) {
        await setEvidenceCache({
          placeId: cacheKey,
          platform: DIRECTIONS_PLATFORM,
          data: { durationSeconds, distanceMeters },
          ttlMs: DIRECTIONS_TTL_MS,
        });
        return {
          mode: "found",
          durationSeconds,
          distanceMeters,
          cached: false,
        };
      }
      // OK인데 leg 누락 — not_found 처리
      await setEvidenceCache({
        placeId: cacheKey,
        platform: DIRECTIONS_PLATFORM,
        data: { durationSeconds: null, distanceMeters: null },
        ttlMs: DIRECTIONS_TTL_MS,
      });
      return { mode: "not_found", cached: false };
    }

    if (json.status === "ZERO_RESULTS" || json.status === "NOT_FOUND") {
      await setEvidenceCache({
        placeId: cacheKey,
        platform: DIRECTIONS_PLATFORM,
        data: { durationSeconds: null, distanceMeters: null },
        ttlMs: DIRECTIONS_TTL_MS,
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

function hashKey(input: DirectionsInput): string {
  const seed = `${input.origin.lat.toFixed(4)},${input.origin.lng.toFixed(4)}|${input.destination.lat.toFixed(4)},${input.destination.lng.toFixed(4)}|${input.mode}`;
  return hashCacheKey(seed);
}
