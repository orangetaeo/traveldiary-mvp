/**
 * 데모 모드 진입점.
 *
 * Phase 0 (사이클 1): DATABASE_URL이 비었거나 마이그레이션이 없을 때
 * 화면이 직접 import해서 시드 데이터를 렌더한다 — ADR-009.
 */

import type { ItineraryItem, Trip } from "../types";
import { phuQuocItinerary, phuQuocTrip } from "./phu-quoc";

export interface DemoTripBundle {
  trip: Trip;
  items: ItineraryItem[];
}

const bundle: DemoTripBundle = {
  trip: phuQuocTrip,
  items: phuQuocItinerary,
};

export function getDemoTrip(tripId: string): DemoTripBundle | null {
  return tripId === bundle.trip.id ? bundle : null;
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

export const DEMO_TRIP_ID = bundle.trip.id;
