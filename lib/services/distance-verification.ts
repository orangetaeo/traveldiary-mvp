/**
 * Distance Verification — 사이클 M (ADR-030, 5단계 검증 4단계).
 *
 * 외부 API(Google Directions) 호출은 thin wrapper.
 * 모드 결정 + 비교 룰은 distance-rules.ts (순수 함수, 단위 테스트 100%).
 *
 * 호출 흐름:
 *   1. nextItem 없거나 좌표 누락 → 즉시 compareDistanceVerification (early return)
 *   2. 거리 계산 → 모드 결정 → Directions API 호출
 *   3. API 결과(actualTravelMinutes) 포함하여 compareDistanceVerification
 *   4. API 데모/error → fallback 추정 (Haversine)
 */

import "server-only";

import type { ItineraryItem } from "@/lib/types";
import { hasValidCoords } from "@/lib/utils/geo";
import {
  compareDistanceVerification,
  haversineKm,
  pickTravelMode,
  type DistanceVerificationOutput,
} from "./distance-rules";
import { fetchDirections } from "./google-directions";

export type NextItemInput = Pick<
  ItineraryItem,
  "scheduledAt" | "location"
> | null;

export interface VerifyDistanceInput {
  item: Pick<
    ItineraryItem,
    "id" | "scheduledAt" | "durationMinutes" | "flexMinutes" | "location"
  >;
  nextItem: NextItemInput;
}

export async function verifyItemDistance(
  input: VerifyDistanceInput,
): Promise<DistanceVerificationOutput> {
  const { item, nextItem } = input;

  // ── early return: 다음 일정 없음 / 좌표 누락
  if (!nextItem) {
    return compareDistanceVerification({ item, nextItem: null });
  }
  if (!hasValidCoords(item.location) || !hasValidCoords(nextItem.location)) {
    return compareDistanceVerification({ item, nextItem });
  }

  // ── 거리 + 모드
  const distanceKm = haversineKm(item.location, nextItem.location);
  const mode = pickTravelMode(distanceKm);

  // ── Directions API (키 미설정 → demo)
  const directions = await fetchDirections({
    origin: item.location,
    destination: nextItem.location,
    mode,
  });

  if (directions.mode === "demo") {
    // 데모 fallback — Haversine 추정으로 비교
    const out = compareDistanceVerification({ item, nextItem });
    if (out.status === "verified") {
      // demo 모드는 사용자에게 "추정" 표시 — verified여도 source는 fallback로 통일
      return { ...out, status: "demo", verified: false, source: "fallback" };
    }
    return out;
  }

  if (directions.mode === "found") {
    const actualTravelMinutes = directions.durationSeconds / 60;
    return compareDistanceVerification({
      item,
      nextItem,
      actualTravelMinutes,
    });
  }

  if (directions.mode === "not_found") {
    // 경로 자체가 없음 (섬·차단 등) → 추정 fallback (회귀 안전)
    return compareDistanceVerification({ item, nextItem });
  }

  // mode: "error" — 회귀 안전 fallback
  return compareDistanceVerification({ item, nextItem });
}
