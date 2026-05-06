/**
 * ValidationResult 캐시 hit 시 결과 복원 순수 함수.
 *
 * actions/place.ts에서 추출 (사이클 E ADR-031 원본).
 * 캐시 row → 타입별 Output 변환. 외부 의존 0.
 */

import type { ValidationResultRow } from "@/lib/repositories/validation.repository";
import type { PriceVerificationOutput } from "@/lib/services/price-verification";
import type { DistanceVerificationOutput } from "@/lib/services/distance-rules";
import type { VerifyPlaceResult } from "@/lib/services/place-verification";

/** operatingStatus 문자열 → 유효 enum 변환. 미지 값은 "demo" fallback. */
export function deriveCachedOpStatus(stored: string): "open" | "closed" | "demo" {
  if (stored === "open" || stored === "closed" || stored === "demo") {
    return stored;
  }
  return "demo";
}

/**
 * 캐시 hit → PriceVerificationOutput 복원.
 * 새 row(priceStatus 존재) → 정확 복원. 기존 row(NULL) → priceVerified 기반 보수적 fallback.
 */
export function derivePriceFromCache(cached: ValidationResultRow): PriceVerificationOutput {
  if (cached.priceStatus) {
    return {
      status: cached.priceStatus as PriceVerificationOutput["status"],
      verified: cached.priceVerified,
      reason: "24h 캐시 hit",
      deltaPct: null,
      medianOtaPriceKrw: null,
      otaSourceCount: 0,
    };
  }
  return {
    status: cached.priceVerified ? "verified" : "warn",
    verified: cached.priceVerified,
    reason: "24h 캐시 hit",
    deltaPct: null,
    medianOtaPriceKrw: null,
    otaSourceCount: 0,
  };
}

/**
 * 캐시 hit → DistanceVerificationOutput 복원.
 * 새 row(distanceStatus 존재) → 정확 복원. 기존 row(NULL) → distanceVerified 기반 보수적 fallback.
 */
export function deriveDistanceFromCache(cached: ValidationResultRow): DistanceVerificationOutput {
  if (cached.distanceStatus) {
    return {
      status: cached.distanceStatus as DistanceVerificationOutput["status"],
      verified: cached.distanceVerified,
      reason: "24h 캐시 hit",
      travelMinutes: null,
      gapMinutes: null,
      distanceKm: null,
      mode: null,
      source: "none",
    };
  }
  return {
    status: cached.distanceVerified ? "verified" : "warn",
    verified: cached.distanceVerified,
    reason: "24h 캐시 hit",
    travelMinutes: null,
    gapMinutes: null,
    distanceKm: null,
    mode: null,
    source: "none",
  };
}

/**
 * 캐시 hit → VerifyPlaceResult (Google Places) 복원.
 * rating·types 미보존 → operatingStatus 기반 추정.
 */
export function deriveGoogleFromCache(cached: ValidationResultRow): VerifyPlaceResult {
  if (cached.operatingStatus === "demo") return { mode: "demo" };
  if (!cached.placeExists) {
    return {
      mode: "not_found",
      placeExists: false,
      cached: true,
      fetchDurationMs: 0,
    };
  }
  return {
    mode: "verified",
    placeExists: true,
    operatingStatus:
      cached.operatingStatus === "open" || cached.operatingStatus === "closed"
        ? cached.operatingStatus
        : "open",
    placeId: "",
    cached: true,
    fetchDurationMs: 0,
  };
}
