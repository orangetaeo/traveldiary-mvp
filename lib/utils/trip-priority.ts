/**
 * Trip 우선순위 정렬 — 홈 / Mode B Dashboard primary trip 선택용.
 *
 * 문제: `orderBy startDate asc`만으로는 과거 trip이 미래 trip보다 위에 옴.
 * 사용자가 과거 trip 1건 + 다가오는 trip 1건 보유 시 DashboardHero가 과거 trip 표시.
 *
 * 우선순위 (낮을수록 priority high):
 *   1. currentMode === "in-travel" — 가장 우선 (현재 진행 중)
 *   2. 다가오는 trip (dDay >= 0) — D-N 작은 순 (D-1 > D-7 > D-30)
 *   3. 과거 trip (dDay < 0) — D+N 작은 순 (D+1 > D+7 > D+30, 즉 최근 종료 우선)
 *
 * 순수 함수 — schema 의존 0, todayISO 주입.
 */

import { dDay } from "./item-display";

export interface TripPriorityInput {
  startDate: string; // YYYY-MM-DD
  currentMode: string | null;
}

/**
 * 우선순위 점수 — 낮을수록 우선.
 *
 * - in-travel: -1 (모든 다른 trip보다 위)
 * - 다가오는: dDay (D-1 → 1, D-30 → 30)
 * - 과거: 10000 + |dDay| (D+1 → 10001, D+30 → 10030)
 *   10000 오프셋으로 다가오는 trip이 모두 과거 trip보다 위
 */
export function tripPriorityScore(
  trip: TripPriorityInput,
  todayIso: string,
): number {
  if (trip.currentMode === "in-travel") return -1;
  const d = dDay(trip.startDate, todayIso);
  if (d >= 0) return d;
  return 10_000 + -d;
}

/**
 * 우선순위로 정렬 — 원본 배열 비파괴 (slice 후 sort).
 *
 * 동률 시 startDate asc 차순위 정렬 (안정적 결과).
 */
export function sortTripsByPriority<T extends TripPriorityInput>(
  trips: readonly T[],
  todayIso: string,
): T[] {
  return [...trips].sort((a, b) => {
    const aScore = tripPriorityScore(a, todayIso);
    const bScore = tripPriorityScore(b, todayIso);
    if (aScore !== bScore) return aScore - bScore;
    return a.startDate.localeCompare(b.startDate);
  });
}
