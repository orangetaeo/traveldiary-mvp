"use server";

/**
 * Place Verification Server Action — 사이클 L+N (ADR-029) + 사이클 E (ADR-031).
 *
 * validateItemAction: 1·2·3·4·5단계 종합 + ValidationResult DB 저장 + google 결과 노출.
 *
 * 정책:
 *   - audit log 동시 호출 (S-13). action="validation.completed" + "evidence.gathered".
 *   - audit log 실패는 비즈니스 막지 않음.
 *   - 24h 캐시 hit 시 audit log 미기록 (fresh-only, 5b-3 정책 답습).
 *   - 권한: canReadTrip만 (ValidationResult는 부속 데이터).
 *
 * 사이클 E (ADR-031):
 *   - ValidationResult.priceStatus / distanceStatus 컬럼 활용 — 캐시 hit 정확화.
 *   - validateItemAction이 verifyPlace 결과 노출 → page.tsx 외부 호출 1회로 통합.
 *   - audit "evidence.gathered" → validateItemAction 안에서 발행.
 */

import { writeAuditLog } from "@/lib/audit-log";
import { verifyPlace, type VerifyPlaceResult } from "@/lib/services/place-verification";
import {
  determineBookingRequired,
  type BookingRuleOutput,
} from "@/lib/services/booking-rules";
import {
  verifyItemPrice,
  type PriceVerificationOutput,
} from "@/lib/services/price-verification";
import {
  verifyItemDistance,
  type NextItemInput,
} from "@/lib/services/distance-verification";
import type { DistanceVerificationOutput } from "@/lib/services/distance-rules";
import {
  canValidateItem,
  createValidation,
  getRecentValidation,
  type ValidationResultRow,
} from "@/lib/repositories/validation.repository";
import { getActorId } from "@/lib/auth/session";
import { isDbConnected } from "@/lib/prisma";
import type { ItineraryItem } from "@/lib/types";
import {
  deriveCachedOpStatus,
  derivePriceFromCache,
  deriveDistanceFromCache,
  deriveGoogleFromCache,
} from "./place-cache-utils";

// ═══════════════════════════════════════════════════════════════════
// validateItemAction — 사이클 L+N (ADR-029) + 사이클 M (ADR-030)
// 1·2단계 (place) + 3단계 (booking) + 4단계 (distance) + 5단계 (price) 종합
// ═══════════════════════════════════════════════════════════════════

export type ValidateItemResult =
  | {
      mode: "ok";
      cached: boolean;
      placeExists: boolean;
      operatingStatus: "open" | "closed" | "demo";
      booking: BookingRuleOutput;
      price: PriceVerificationOutput;
      /** 사이클 M (ADR-030) — 4단계 distanceVerified */
      distance: DistanceVerificationOutput;
      /**
       * 사이클 E (ADR-031) — verifyPlace 결과 노출.
       * page.tsx의 GoogleVerificationBadge가 이 값으로 그림.
       */
      googleResult: VerifyPlaceResult;
      /** DB save 성공 시 row id, 실패/데모 시 null */
      validationId: string | null;
      validatedAt: string;
    }
  | { mode: "forbidden" }
  | { mode: "not_found" };

export interface ValidateItemActionInput {
  item: ItineraryItem;
  /**
   * 같은 dayIndex 안에서 scheduledAt 기준 다음 일정.
   * 마지막 일정·미지정이면 null → distance.status = "no_next".
   */
  nextItem?: NextItemInput;
}

export async function validateItemAction(
  input: ValidateItemActionInput,
): Promise<ValidateItemResult> {
  const { item, nextItem = null } = input;
  const actorId = await getActorId();

  // ── 권한 검증 (canReadTrip만 — T14 권장)
  // T13 리뷰 fix: prisma 연결된 상태에서 권한 없으면 명시적 forbidden 반환.
  // 데모 모드(prisma 미연결)에서만 권한 체크 스킵.
  const tripId = await canValidateItem(item.id, actorId);
  if (isDbConnected && tripId === null) {
    // DB는 살아있는데 item을 못 찾거나 권한 없음 → forbidden 반환 (env 누설 방지)
    return { mode: "forbidden" };
  }

  // ── 24h 캐시 lookup (fresh-only audit log 정책)
  const cached = await getRecentValidation(item.id);
  if (cached) {
    return {
      mode: "ok",
      cached: true,
      placeExists: cached.placeExists,
      operatingStatus: deriveCachedOpStatus(cached.operatingStatus),
      booking: {
        required: cached.bookingRequired,
        reason: "24h 캐시 hit",
        source: "fallback",
      },
      price: derivePriceFromCache(cached),
      distance: deriveDistanceFromCache(cached),
      // 캐시 hit 시 google 결과 미보존 — operatingStatus만으로 demo/verified 추정
      googleResult: deriveGoogleFromCache(cached),
      validationId: cached.id,
      validatedAt: cached.validatedAt.toISOString(),
    };
  }

  // ── 1·2단계: place verification (외부 API or demo)
  const placeResult = await verifyPlace({
    name: item.name,
    location: { lat: item.location.lat, lng: item.location.lng },
  });

  let placeExists = false;
  let operatingStatus: "open" | "closed" | "demo" = "demo";
  let placeTypes: string[] | undefined;
  let placeRating: number | undefined;
  let placeReviews: number | undefined;

  if (placeResult.mode === "verified") {
    placeExists = true;
    operatingStatus = placeResult.operatingStatus;
    placeTypes = placeResult.types;
    placeRating = placeResult.rating;
    placeReviews = placeResult.userRatingsTotal;
  } else if (placeResult.mode === "not_found") {
    placeExists = false;
    operatingStatus = "closed";
  } else if (placeResult.mode === "demo") {
    // 데모 모드 — placeExists는 시드 신뢰 (true 가정), 운영상태 미확인
    placeExists = true;
    operatingStatus = "demo";
  } else {
    // error — 1·2단계 회귀 안전 fallback
    placeExists = true;
    operatingStatus = "demo";
  }

  // ── 3단계: bookingRequired (순수 함수, 단계별 격리)
  let booking: BookingRuleOutput;
  try {
    booking = determineBookingRequired({
      category: item.category,
      name: item.name,
      types: placeTypes,
      rating: placeRating,
      userRatingsTotal: placeReviews,
    });
  } catch (err) {
    console.error("[validateItemAction] booking rule failed", err);
    booking = {
      required: false,
      reason: "검증 실패 (룰 에러)",
      source: "fallback",
    };
  }

  // ── 5단계: priceVerified (외부 OTA 호출 + 비교)
  let price: PriceVerificationOutput;
  try {
    price = await verifyItemPrice(item);
  } catch (err) {
    console.error("[validateItemAction] price verify failed", err);
    price = {
      status: "no_offers",
      verified: false,
      reason: "OTA 호출 실패",
      deltaPct: null,
      medianOtaPriceKrw: null,
      otaSourceCount: 0,
    };
  }

  // ── 4단계: distanceVerified (사이클 M, ADR-030)
  let distance: DistanceVerificationOutput;
  try {
    distance = await verifyItemDistance({ item, nextItem });
  } catch (err) {
    console.error("[validateItemAction] distance verify failed", err);
    distance = {
      status: "missing_location",
      verified: false,
      reason: "이동 검증 실패",
      travelMinutes: null,
      gapMinutes: null,
      distanceKm: null,
      mode: null,
      source: "none",
    };
  }

  // ── DB 저장 (prisma 미연결이면 null)
  const saved: ValidationResultRow | null = await createValidation({
    itemId: item.id,
    placeExists,
    operatingStatus,
    bookingRequired: booking.required,
    distanceVerified: distance.verified,
    priceVerified: price.verified,
    // 사이클 E (ADR-031) — enum status 영속화
    priceStatus: price.status,
    distanceStatus: distance.status,
  });

  // ── audit log (fresh fetch만 — 캐시 hit는 위에서 early return)
  await writeAuditLog({
    actorId,
    action: "validation.completed",
    resource: "ItineraryItem",
    resourceId: item.id,
    before: null,
    after: {
      placeExists,
      operatingStatus,
      bookingRequired: booking.required,
      distanceVerified: distance.verified,
      priceVerified: price.verified,
    },
    metadata: {
      source: "validation",
      tripId,
      bookingReason: booking.reason,
      bookingSource: booking.source,
      priceStatus: price.status,
      priceReason: price.reason,
      priceDeltaPct: price.deltaPct,
      medianOtaPriceKrw: price.medianOtaPriceKrw,
      otaSourceCount: price.otaSourceCount,
      distanceStatus: distance.status,
      distanceSource: distance.source,
      distanceTravelMinutes: distance.travelMinutes,
      distanceGapMinutes: distance.gapMinutes,
      distanceKm: distance.distanceKm,
      distanceMode: distance.mode,
      placeMode: placeResult.mode,
      cacheHit: false,
    },
  });

  // 사이클 E (ADR-031) — evidence.gathered audit 발행 (place fresh fetch 시)
  const isPlaceFresh =
    (placeResult.mode === "verified" && !placeResult.cached) ||
    (placeResult.mode === "not_found" && !placeResult.cached);
  if (isPlaceFresh) {
    await writeAuditLog({
      actorId,
      action: "evidence.gathered",
      resource: "ItineraryItem",
      resourceId: item.id,
      before: null,
      after:
        placeResult.mode === "verified"
          ? {
              placeExists: true,
              operatingStatus: placeResult.operatingStatus,
              placeId: placeResult.placeId,
              rating: placeResult.rating,
              userRatingsTotal: placeResult.userRatingsTotal,
            }
          : { placeExists: false },
      metadata: {
        source: "google",
        query: item.name,
        cached: false,
        fetchDurationMs:
          placeResult.mode === "verified" || placeResult.mode === "not_found"
            ? placeResult.fetchDurationMs
            : undefined,
        viaValidateItem: true, // 사이클 E 통합 추적
      },
    });
  }

  return {
    mode: "ok",
    cached: false,
    placeExists,
    operatingStatus,
    booking,
    price,
    distance,
    googleResult: placeResult,
    validationId: saved?.id ?? null,
    validatedAt: (saved?.validatedAt ?? new Date()).toISOString(),
  };
}

// 캐시 복원 함수 → place-cache-utils.ts로 추출 (테스트 가능)
