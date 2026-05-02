/**
 * 데모 모드 진입점.
 *
 * Phase 0 (사이클 1): DATABASE_URL이 비었거나 마이그레이션이 없을 때
 * 화면이 직접 import해서 시드 데이터를 렌더한다 — ADR-009.
 *
 * 사이클 D: 다낭 데모 trip 추가. trip ID로 분기.
 */

import type { ItineraryItem, Trip } from "../types";
import { phuQuocItinerary, phuQuocTrip } from "./phu-quoc";
import { daNangItinerary, daNangTrip } from "./da-nang";
import { hoChiMinhItinerary, hoChiMinhTrip } from "./ho-chi-minh";
import { hanoiItinerary, hanoiTrip } from "./hanoi";
import { nhaTrangItinerary, nhaTrangTrip } from "./nha-trang";

export interface DemoTripBundle {
  trip: Trip;
  items: ItineraryItem[];
}

const bundles: DemoTripBundle[] = [
  { trip: phuQuocTrip, items: phuQuocItinerary },
  { trip: daNangTrip, items: daNangItinerary },
  { trip: hoChiMinhTrip, items: hoChiMinhItinerary },
  { trip: hanoiTrip, items: hanoiItinerary },
  { trip: nhaTrangTrip, items: nhaTrangItinerary },
];

export function getDemoTrip(tripId: string): DemoTripBundle | null {
  return bundles.find((b) => b.trip.id === tripId) ?? null;
}

export function getDemoItem(tripId: string, itemId: string): ItineraryItem | null {
  const found = getDemoTrip(tripId);
  if (!found) return null;
  return found.items.find((it) => it.id === itemId) ?? null;
}

export function listDemoItemsByDay(tripId: string): ItineraryItem[][] {
  const found = getDemoTrip(tripId);
  if (!found) return [];
  const days: ItineraryItem[][] = Array.from({ length: found.trip.nights + 1 }, () => []);
  for (const it of found.items) {
    if (days[it.dayIndex]) days[it.dayIndex].push(it);
  }
  for (const list of days) {
    list.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  }
  return days;
}

/** 모든 데모 trip 목록 (랜딩/리스트 화면용) */
export function listDemoTrips(): DemoTripBundle[] {
  return bundles;
}

export const DEMO_TRIP_ID = phuQuocTrip.id;
export const DEMO_TRIP_IDS = bundles.map((b) => b.trip.id);
