/**
 * Place Verification — 사이클 5b-3 (ADR-018, S-03 1~2단계만).
 *
 * 5단계 검증 중 1~2단계 (placeExists, operatingStatus)만 5b-3에서 활성.
 * 3~5단계 (booking·distance·price)는 사이클 5b-5에서 다른 외부 API와 함께.
 */

import "server-only";

import {
  findPlaceFromText,
  getPlaceDetails,
  type PlaceDetails,
} from "./google-places";

export type OperatingStatus = "open" | "closed";

export type VerifyPlaceResult =
  | { mode: "demo" }
  | {
      mode: "verified";
      placeExists: true;
      operatingStatus: OperatingStatus;
      placeId: string;
      rating?: number;
      userRatingsTotal?: number;
      types?: string[];
      cached: boolean;
      fetchDurationMs: number;
    }
  | { mode: "not_found"; placeExists: false; cached: boolean; fetchDurationMs: number }
  | {
      mode: "error";
      code: "google_api_error" | "network" | "internal" | "quota_exceeded";
      message?: string;
    };

export interface VerifyPlaceInput {
  name: string;
  location?: { lat: number; lng: number };
}

export async function verifyPlace(
  input: VerifyPlaceInput,
): Promise<VerifyPlaceResult> {
  const startedAt = Date.now();

  // 1. Find Place from Text
  const find = await findPlaceFromText(input.name, input.location);
  if (find.mode === "demo") return { mode: "demo" };
  if (find.mode === "error") {
    return { mode: "error", code: find.code, message: find.message };
  }
  if (find.mode === "not_found") {
    return {
      mode: "not_found",
      placeExists: false,
      cached: find.cached,
      fetchDurationMs: Date.now() - startedAt,
    };
  }

  // 2. Place Details
  const details = await getPlaceDetails(find.placeId);
  if (details.mode === "demo") return { mode: "demo" };
  if (details.mode === "error") {
    return { mode: "error", code: details.code, message: details.message };
  }
  if (details.mode === "not_found") {
    return {
      mode: "not_found",
      placeExists: false,
      cached: details.cached,
      fetchDurationMs: Date.now() - startedAt,
    };
  }

  return {
    mode: "verified",
    placeExists: true,
    operatingStatus: deriveOperatingStatus(details.details),
    placeId: details.details.placeId,
    rating: details.details.rating,
    userRatingsTotal: details.details.userRatingsTotal,
    types: details.details.types,
    cached: find.cached && details.cached,
    fetchDurationMs: Date.now() - startedAt,
  };
}

function deriveOperatingStatus(d: PlaceDetails): OperatingStatus {
  if (d.businessStatus !== "OPERATIONAL") return "closed";
  if (d.openNow === false) return "closed";
  return "open";
}
