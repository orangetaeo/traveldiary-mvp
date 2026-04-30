"use server";

/**
 * Place Verification Server Action — 사이클 5b-3 (ADR-018).
 *
 * 호출 위치: app/itinerary/[id]/item/[itemId]/page.tsx (Server Component에서 직접 호출).
 * Server Action으로 export하는 이유: 사이클 5b-5에서 "재검증" 버튼이 호출할 때 그대로 재사용.
 *
 * 정책:
 *   - audit log 동시 호출 (S-13). action="evidence.gathered".
 *   - audit log 실패는 비즈니스 막지 않음 (try/catch 격리).
 *   - cached:true 인 경우 audit log 행은 기록 X (캐시 히트는 진짜 변경 아님).
 */

import { writeAuditLog } from "@/lib/audit-log";
import { verifyPlace, type VerifyPlaceResult } from "@/lib/services/place-verification";

export interface VerifyPlaceActionInput {
  itemId: string;
  name: string;
  location?: { lat: number; lng: number };
}

export async function verifyPlaceAction(
  input: VerifyPlaceActionInput,
): Promise<VerifyPlaceResult> {
  const result = await verifyPlace({
    name: input.name,
    location: input.location,
  });

  // 캐시 히트는 audit log 미기록 — 진짜 외부 호출 한 경우만 기록
  const isFreshFetch =
    (result.mode === "verified" && !result.cached) ||
    (result.mode === "not_found" && !result.cached);

  if (isFreshFetch) {
    await writeAuditLog({
      actorId: null,
      action: "evidence.gathered",
      resource: "ItineraryItem",
      resourceId: input.itemId,
      before: null,
      after:
        result.mode === "verified"
          ? {
              placeExists: true,
              operatingStatus: result.operatingStatus,
              placeId: result.placeId,
              rating: result.rating,
              userRatingsTotal: result.userRatingsTotal,
            }
          : { placeExists: false },
      metadata: {
        source: "google",
        query: input.name,
        cached: false,
        fetchDurationMs:
          result.mode === "verified" || result.mode === "not_found"
            ? result.fetchDurationMs
            : undefined,
      },
    });
  } else if (result.mode === "error") {
    await writeAuditLog({
      actorId: null,
      action: "evidence.gathered",
      resource: "ItineraryItem",
      resourceId: input.itemId,
      before: null,
      after: null,
      metadata: {
        source: "google",
        query: input.name,
        error: result.code,
        errorMessage: result.message,
      },
    });
  }

  return result;
}
