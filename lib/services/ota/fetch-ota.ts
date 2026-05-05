/**
 * OTA fetch 공통 래퍼 — DRY 추출 (agoda/kkday/klook 공유).
 *
 * 패턴: apiKey 체크 → 캐시 조회 → quota 체크 → fetch → parse → 캐시 저장.
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
import type { OtaOffer } from "@/lib/types";
import { hashCacheKey } from "@/lib/utils/cache-key";

const TTL_MS = 6 * 60 * 60 * 1000;

export type OtaOutcome =
  | { mode: "demo" }
  | { mode: "ok"; offers: OtaOffer[]; cached: boolean }
  | {
      mode: "error";
      code: string;
      message?: string;
    };

export interface OtaFetchConfig {
  /** 캐시 키 프리픽스 (예: "agoda") */
  prefix: string;
  /** 플랫폼 식별자 (예: "ota.agoda") */
  platform: string;
  /** API 키 (null이면 demo 반환) */
  apiKey: string | null;
  /** 검색어 */
  query: string;
  /** 위치 (선택) */
  location?: { lat: number; lng: number };
  /** fetch 실행 + OtaOffer[] 파싱 콜백 */
  doFetch: (apiKey: string) => Promise<OtaOffer[]>;
  /** HTTP 에러 코드 (예: "agoda_api_error") */
  apiErrorCode: string;
}

export async function fetchOtaWithCache(config: OtaFetchConfig): Promise<OtaOutcome> {
  const { prefix, platform, apiKey, query, location, doFetch, apiErrorCode } = config;

  if (!apiKey) return { mode: "demo" };

  const cacheKey = hashCacheKey(
    `${prefix}:${query}:${location ? `${location.lat},${location.lng}` : ""}`,
  );

  const cached = await getEvidenceCache<{ offers: OtaOffer[] }>(cacheKey, platform);
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
    const offers = await doFetch(apiKey);
    recordExternalCall("ota");

    await setEvidenceCache({
      placeId: cacheKey,
      platform,
      data: { offers },
      ttlMs: TTL_MS,
    });

    return { mode: "ok", offers, cached: false };
  } catch (err) {
    // HTTP 에러 vs 네트워크 에러 구분
    if (err instanceof OtaHttpError) {
      recordExternalCall("ota");
      return { mode: "error", code: apiErrorCode, message: err.message };
    }
    return {
      mode: "error",
      code: "network",
      message: err instanceof Error ? err.message : "unknown",
    };
  }
}

/** fetch 콜백에서 HTTP 에러를 구분하기 위한 클래스 */
export class OtaHttpError extends Error {
  constructor(status: number) {
    super(`HTTP ${status}`);
    this.name = "OtaHttpError";
  }
}
