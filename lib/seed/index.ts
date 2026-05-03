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
import { daLatItinerary, daLatTrip } from "./da-lat";
// 사이클 OO: chiangMai 시드는 lib/seed/chiang-mai.ts에 보존되나 V3 정책(베트남 우선)
// 유지를 위해 listDemoTrips()에는 미포함. 노출 활성화는 별도 ADR + 정책 변경 사이클.

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
  { trip: daLatTrip, items: daLatItinerary },
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
