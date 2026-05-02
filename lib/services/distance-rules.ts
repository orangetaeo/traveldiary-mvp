/**
 * Distance Rules — 사이클 M (ADR-030, 5단계 검증 4단계).
 *
 * 순수 함수 (외부 API·DB 의존 ❌) — 단위 테스트 100%.
 *  1. Haversine 거리 (km)
 *  2. 모드 결정 룰 (walking / driving)
 *  3. 데모 fallback 이동시간 추정 (분)
 *  4. 비교 룰: 이동시간 vs 갭(+ flexMinutes) → status 결정
 *
 * R1 조건: 매직 넘버는 모듈 상수로 분리 (인라인 ❌).
 *   - 평균 속도, 우회 보정계수, 모드 분기점, 허용 임계값
 *
 * "다음 일정"은 호출처가 결정 (같은 dayIndex 내 scheduledAt 기준 다음 노드).
 * 마지막 일정은 nextItem=null → status: "no_next" (검증 면제).
 */

import type { ItineraryItem } from "@/lib/types";

// ═══════════════════════════════════════════════════════════════════
// 상수 (R1 조건 — 매직 넘버 모듈 상수)
// ═══════════════════════════════════════════════════════════════════

/** 지구 반지름 (km) — Haversine 공식 표준 */
export const EARTH_RADIUS_KM = 6371;

/** Haversine 직선거리에 곱하는 우회 보정계수 (도시 격자 평균) */
export const DRIVE_DETOUR_FACTOR = 1.4;
export const WALK_DETOUR_FACTOR = 1.4;

/** 모드 분기점 — 이 거리 미만은 도보, 이상은 차량 (T2 합의) */
export const WALKING_DISTANCE_THRESHOLD_KM = 1.0;

/** 평균 속도 (km/h) — 데모 fallback 이동시간 계산용 */
export const WALKING_SPEED_KMH = 4;
export const DRIVING_SPEED_KMH = 60;

/**
 * 비교 임계값 (T4 + R1 합의):
 *   travel ≤ gap                   → verified
 *   gap < travel ≤ gap + flexMin   → warn
 *   travel > gap + flexMin         → mismatch
 *
 * priceVerification과 같은 status enum 패턴 답습.
 */
export const DISTANCE_TOLERANCE = {
  /** flexMinutes 없을 때도 허용할 최소 여유분 (분) — UI/시계 오차 */
  baselineFlexMinutes: 0,
} as const;

// ═══════════════════════════════════════════════════════════════════
// 공개 타입
// ═══════════════════════════════════════════════════════════════════

export type TravelMode = "walking" | "driving";

export type DistanceVerificationStatus =
  | "verified"
  | "warn"
  | "mismatch"
  | "no_next"
  | "demo"
  | "missing_location";

export interface DistanceVerificationOutput {
  status: DistanceVerificationStatus;
  /** DB 저장용 boolean — verified만 true */
  verified: boolean;
  reason: string;
  /** 추정·실측 이동시간 (분) — null이면 비교 불가 */
  travelMinutes: number | null;
  /** 일정 N의 종료 ~ 일정 N+1의 시작 사이 갭 (분) — null이면 다음 없음 */
  gapMinutes: number | null;
  /** 직선거리 (km) — null이면 좌표 누락/모드 미결정 */
  distanceKm: number | null;
  mode: TravelMode | null;
  /** "directions" = 실 API · "fallback" = Haversine 추정 */
  source: "directions" | "fallback" | "none";
}

export interface CompareDistanceInput {
  /** 직전 일정 (검증 대상) */
  item: Pick<ItineraryItem, "id" | "scheduledAt" | "durationMinutes" | "flexMinutes" | "location">;
  /** 다음 일정 — null이면 no_next */
  nextItem: Pick<ItineraryItem, "scheduledAt" | "location"> | null;
  /**
   * 실측 이동시간 (분) — Google Directions API 결과.
   * undefined면 Haversine fallback (source="fallback").
   */
  actualTravelMinutes?: number;
  /** 모드 강제 지정 (테스트용) — 미지정 시 거리 기반 자동 결정 */
  forceMode?: TravelMode;
}

// ═══════════════════════════════════════════════════════════════════
// Haversine — 직선 거리 (km)
// ═══════════════════════════════════════════════════════════════════

export function haversineKm(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(destination.lat - origin.lat);
  const dLng = toRad(destination.lng - origin.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(origin.lat)) *
      Math.cos(toRad(destination.lat)) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

// ═══════════════════════════════════════════════════════════════════
// 모드 결정 — 거리 기반 자동
// ═══════════════════════════════════════════════════════════════════

export function pickTravelMode(distanceKm: number): TravelMode {
  return distanceKm < WALKING_DISTANCE_THRESHOLD_KM ? "walking" : "driving";
}

// ═══════════════════════════════════════════════════════════════════
// Fallback 이동시간 추정 (분)
// ═══════════════════════════════════════════════════════════════════

export function estimateTravelMinutes(
  distanceKm: number,
  mode: TravelMode,
): number {
  const speedKmh = mode === "walking" ? WALKING_SPEED_KMH : DRIVING_SPEED_KMH;
  const detourFactor = mode === "walking" ? WALK_DETOUR_FACTOR : DRIVE_DETOUR_FACTOR;
  const minutes = (distanceKm * detourFactor * 60) / speedKmh;
  return Math.ceil(minutes);
}

// ═══════════════════════════════════════════════════════════════════
// 비교 룰 — 메인 함수
// ═══════════════════════════════════════════════════════════════════

export function compareDistanceVerification(
  input: CompareDistanceInput,
): DistanceVerificationOutput {
  const { item, nextItem, actualTravelMinutes, forceMode } = input;

  // ── 다음 일정 없음 (검증 면제)
  if (!nextItem) {
    return {
      status: "no_next",
      verified: false,
      reason: "마지막 일정 — 이동 검증 대상 없음",
      travelMinutes: null,
      gapMinutes: null,
      distanceKm: null,
      mode: null,
      source: "none",
    };
  }

  // ── 좌표 누락 (시드 신뢰성 한계)
  const hasOriginCoords = item.location.lat !== 0 || item.location.lng !== 0;
  const hasDestCoords = nextItem.location.lat !== 0 || nextItem.location.lng !== 0;
  if (!hasOriginCoords || !hasDestCoords) {
    return {
      status: "missing_location",
      verified: false,
      reason: "좌표 누락 — 거리 검증 불가",
      travelMinutes: null,
      gapMinutes: null,
      distanceKm: null,
      mode: null,
      source: "none",
    };
  }

  // ── 거리 + 모드 + 이동시간
  const distanceKm = haversineKm(item.location, nextItem.location);
  const mode = forceMode ?? pickTravelMode(distanceKm);
  const isFromApi = typeof actualTravelMinutes === "number" && actualTravelMinutes >= 0;
  const travelMinutes = isFromApi
    ? Math.ceil(actualTravelMinutes!)
    : estimateTravelMinutes(distanceKm, mode);
  const source: DistanceVerificationOutput["source"] = isFromApi
    ? "directions"
    : "fallback";

  // ── 갭 계산 (분)
  const startMs = new Date(item.scheduledAt).getTime();
  const nextStartMs = new Date(nextItem.scheduledAt).getTime();
  if (Number.isNaN(startMs) || Number.isNaN(nextStartMs)) {
    return {
      status: "missing_location",
      verified: false,
      reason: "일정 시간 파싱 실패",
      travelMinutes: null,
      gapMinutes: null,
      distanceKm: Math.round(distanceKm * 1000) / 1000,
      mode,
      source: "none",
    };
  }
  const gapMinutes = Math.floor(
    (nextStartMs - startMs) / 60000 - item.durationMinutes,
  );
  const flexMin = item.flexMinutes ?? 0;
  const gapWithFlex = gapMinutes + flexMin;

  // ── 비교
  const distanceLabel = `${formatKm(distanceKm)} ${labelMode(mode)} · 추정 ${travelMinutes}분`;
  if (travelMinutes <= gapMinutes) {
    return {
      status: "verified",
      verified: true,
      reason: `${distanceLabel} (여유 ${gapMinutes - travelMinutes}분)`,
      travelMinutes,
      gapMinutes,
      distanceKm: round3(distanceKm),
      mode,
      source,
    };
  }

  if (travelMinutes <= gapWithFlex) {
    return {
      status: "warn",
      verified: false,
      reason: `${distanceLabel} — 갭 ${gapMinutes}분 + 유연 ${flexMin}분 빠듯`,
      travelMinutes,
      gapMinutes,
      distanceKm: round3(distanceKm),
      mode,
      source,
    };
  }

  return {
    status: "mismatch",
    verified: false,
    reason: `${distanceLabel} — 갭 ${gapMinutes}분 + 유연 ${flexMin}분 부족 (${travelMinutes - gapWithFlex}분 초과)`,
    travelMinutes,
    gapMinutes,
    distanceKm: round3(distanceKm),
    mode,
    source,
  };
}

// ═══════════════════════════════════════════════════════════════════
// 헬퍼
// ═══════════════════════════════════════════════════════════════════

function labelMode(mode: TravelMode): string {
  return mode === "walking" ? "도보" : "차량";
}

function formatKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}

function round3(km: number): number {
  return Math.round(km * 1000) / 1000;
}
