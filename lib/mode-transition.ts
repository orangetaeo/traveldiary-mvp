/**
 * Mode Transition — 순수 함수 (S-04).
 *
 * 사이클 3(ADR-014): 데모 토글로만 시연. lib는 자동 전환에 그대로 사용 가능.
 * 사이클 5(ADR-013 예정): Geolocation API + writeAuditLog 결합.
 */

import type { TravelMode, Trip } from "./types";

// ═══════════════════════════════════════════════════════════════════
// 목적지 경계 (Phase 0: 푸꾸옥. Phase 1+에서 확장)
// ═══════════════════════════════════════════════════════════════════

interface GeoBoundary {
  /** 도시 중심 */
  center: { lat: number; lng: number };
  /** 반경 (km) */
  radiusKm: number;
}

const DESTINATION_BOUNDARIES: Record<string, GeoBoundary> = {
  PQC: { center: { lat: 10.225, lng: 103.96 }, radiusKm: 30 },
  // 사이클 5+ 다낭/하노이/도쿄 추가 예정
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
 * 사이클 3 데모 토글은 이 함수 결과를 무시하고 강제 in-travel 가능.
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
