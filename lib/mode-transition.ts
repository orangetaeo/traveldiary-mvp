/**
 * Mode Transition — 순수 함수 (S-04).
 *
 * 사이클 3(ADR-014): 데모 토글 시연.
 * 사이클 5b-4(ADR-017): Geolocation API + AutoModeDetector + setTripMode mutation.
 *   좌표는 클라이언트에서만 사용. 서버에는 mode 값과 trigger="geolocation"만 전송.
 * 사이클 WW(ADR-043, 2026-05-03): 베트남 6 도시(trip 시드 보유)에 boundary 활성화.
 *   M2 자동 전환이 푸꾸옥 외 베트남 trip 전체에서 동작.
 * 사이클 AAA(2026-05-03): audit log metadata 풍부화 — buildModeTransitionMetadata.
 *   기존 trigger/source 외 dDay·boundaryHit·destinationCode·previousMode 4 필드 추가.
 *   좌표 leak 방어: whitelist 화이트리스트만 통과 (ADR-017 §C 유지).
 */

import type { TravelMode, Trip } from "./types";

// ═══════════════════════════════════════════════════════════════════
// 목적지 경계 — 베트남 6 도시 (WW, ADR-043)
//
// 좌표 = 도시 중심(시청/공항 인근). 반경은 도시 규모에 비례:
//   대도시(다낭/호치민/하노이) 25km, 중소도시(나트랑/달랏) 20km, 섬(푸꾸옥) 30km.
// 비-베트남 도시(BKK/CNX/TYO)는 베트남 단일 국가 정책에 따라 미포함.
// 시드 승격 트리거(City.center): Phase 2 동남아 확장 시.
// ═══════════════════════════════════════════════════════════════════

interface GeoBoundary {
  /** 도시 중심 */
  center: { lat: number; lng: number };
  /** 반경 (km) */
  radiusKm: number;
}

const DESTINATION_BOUNDARIES: Record<string, GeoBoundary> = {
  PQC: { center: { lat: 10.225, lng: 103.96 }, radiusKm: 30 },   // 푸꾸옥 섬
  SGN: { center: { lat: 10.7769, lng: 106.7009 }, radiusKm: 25 }, // 호치민
  HAN: { center: { lat: 21.0285, lng: 105.8542 }, radiusKm: 25 }, // 하노이
  DAD: { center: { lat: 16.0544, lng: 108.2022 }, radiusKm: 25 }, // 다낭
  NHA: { center: { lat: 12.2388, lng: 109.1967 }, radiusKm: 20 }, // 나트랑
  DLI: { center: { lat: 11.9404, lng: 108.4583 }, radiusKm: 20 }, // 달랏
};

// ═══════════════════════════════════════════════════════════════════
// D-Day 계산
// ═══════════════════════════════════════════════════════════════════

/**
 * D-Day. startDate 기준 day 단위 차이.
 *   D-Day > 0  → 출발 전 (여행 전)
 *   D-Day = 0  → 출발 당일
 *   D-Day < 0  → 출발 이후 (여행 중 또는 후)
 */
export function calculateDDay(startDate: string, now: Date = new Date()): number {
  const start = new Date(`${startDate}T00:00:00Z`);
  if (isNaN(start.getTime())) return Number.POSITIVE_INFINITY;
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const ms = start.getTime() - today.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

/** 현재가 startDate로부터 며칠째인가 (1-base). 여행 중일 때만 의미 있음. */
export function calculateTravelDay(startDate: string, now: Date = new Date()): number {
  const dDay = calculateDDay(startDate, now);
  return Math.max(1, 1 - dDay);
}

// ═══════════════════════════════════════════════════════════════════
// 경계 검사
// ═══════════════════════════════════════════════════════════════════

export interface GeoLocation {
  lat: number;
  lng: number;
}

/** Haversine 거리 (km) */
export function distanceKm(a: GeoLocation, b: GeoLocation): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function isWithinBoundary(
  loc: GeoLocation,
  destinationCode: string,
): boolean {
  const b = DESTINATION_BOUNDARIES[destinationCode];
  if (!b) return false;
  return distanceKm(loc, b.center) <= b.radiusKm;
}

// ═══════════════════════════════════════════════════════════════════
// 모드 감지
// ═══════════════════════════════════════════════════════════════════

/**
 * 자동 모드 결정. 위치 미제공 시 D-Day만으로 보수적으로 판단(여행 전 유지).
 * AutoModeDetector(5b-4)가 클라이언트에서 호출. 데모 토글로 강제 전환도 병존.
 */
export function detectMode(
  trip: Trip,
  now: Date = new Date(),
  location?: GeoLocation,
): TravelMode {
  const dDay = calculateDDay(trip.startDate, now);
  const inDestination = location
    ? isWithinBoundary(location, trip.destinationCode)
    : false;

  // 여행 전 → 여행 중: D-Day ≤ 0 + 도시 경계 안 (위치 없으면 미전환)
  if (dDay <= 0 && inDestination) {
    if (dDay < -trip.nights) return "post-travel";
    return "in-travel";
  }

  // 위치 없이 마지막 일정 종료 후 24시간 경과 → post-travel (보수적)
  if (dDay < -trip.nights - 1) return "post-travel";

  return "pre-travel";
}

// ═══════════════════════════════════════════════════════════════════
// 진행률
// ═══════════════════════════════════════════════════════════════════

import type { ItineraryItem } from "./types";

/**
 * 오늘(dayIndex) 일정 중 종료 시각이 now 이전인 항목 비율.
 * 여행 중 홈의 "진행률 2/5" 카드 데이터.
 */
export function dayProgress(
  items: ItineraryItem[],
  dayIndex: number,
  now: Date = new Date(),
): { done: number; total: number; current: ItineraryItem | null; next: ItineraryItem | null } {
  const today = items
    .filter((it) => it.dayIndex === dayIndex)
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));

  let done = 0;
  let current: ItineraryItem | null = null;
  let next: ItineraryItem | null = null;

  for (const it of today) {
    const start = new Date(it.scheduledAt);
    const end = new Date(start.getTime() + it.durationMinutes * 60 * 1000);
    if (end <= now) {
      done += 1;
    } else if (start <= now && now < end) {
      current = it;
    } else if (now < start && next === null) {
      next = it;
    }
  }

  return { done, total: today.length, current, next };
}

// ═══════════════════════════════════════════════════════════════════
// Audit Log metadata — 사이클 AAA
//
// trip.mode_transition audit log의 metadata 빌더. 좌표 leak 방어를 위해
// 화이트리스트 필드만 통과시킨다. 호출자가 lat/lng 같은 위험 키를 넘겨도
// 결과 객체에 포함되지 않는다.
// ═══════════════════════════════════════════════════════════════════

export type ModeTransitionTrigger = "manual" | "geolocation";

export interface ModeTransitionContext {
  /** D-Day (calculateDDay 결과). 음수면 출발 후. */
  dDay?: number;
  /** geolocation trigger의 boundary 평가 결과. manual에서는 보통 미설정. */
  boundaryHit?: boolean;
  /** trip.destinationCode (PQC/SGN 등 IATA-like). */
  destinationCode?: string;
}

export interface ModeTransitionMetadataInput {
  trigger: ModeTransitionTrigger;
  previousMode: TravelMode;
  context?: ModeTransitionContext;
}

/**
 * trip.mode_transition audit log의 metadata 객체를 만든다.
 * 좌표(lat/lng)는 어떤 경우에도 결과에 포함되지 않는다.
 */
export function buildModeTransitionMetadata(
  input: ModeTransitionMetadataInput,
): Record<string, unknown> {
  const meta: Record<string, unknown> = {
    trigger: input.trigger,
    source: "web",
    previousMode: input.previousMode,
  };
  const ctx = input.context;
  if (ctx) {
    if (typeof ctx.dDay === "number" && Number.isFinite(ctx.dDay)) {
      meta.dDay = ctx.dDay;
    }
    if (typeof ctx.boundaryHit === "boolean") {
      meta.boundaryHit = ctx.boundaryHit;
    }
    if (typeof ctx.destinationCode === "string" && ctx.destinationCode.length > 0) {
      meta.destinationCode = ctx.destinationCode;
    }
  }
  return meta;
}
