/**
 * trip-priority 단위 테스트 (cap 6, 2026-05-08).
 *
 * 우선순위 검증 — in-travel > 다가오는 가까운 > 과거 가까운.
 */

import { describe, it, expect } from "vitest";
import {
  tripPriorityScore,
  sortTripsByPriority,
  type TripPriorityInput,
} from "@/lib/utils/trip-priority";

const TODAY = "2026-05-08";

describe("tripPriorityScore — 우선순위 점수", () => {
  it("in-travel trip — 모든 다른 trip 대비 최우선 (-1)", () => {
    expect(
      tripPriorityScore(
        { startDate: "2026-04-01", currentMode: "in-travel" },
        TODAY,
      ),
    ).toBe(-1);
  });

  it("다가오는 trip — dDay 그대로 (D-1 → 1, D-30 → 30)", () => {
    expect(
      tripPriorityScore(
        { startDate: "2026-05-09", currentMode: null }, // D-1
        TODAY,
      ),
    ).toBe(1);
    expect(
      tripPriorityScore(
        { startDate: "2026-06-07", currentMode: null }, // D-30
        TODAY,
      ),
    ).toBe(30);
  });

  it("출발 당일 — D-0 → 0", () => {
    expect(
      tripPriorityScore(
        { startDate: TODAY, currentMode: null },
        TODAY,
      ),
    ).toBe(0);
  });

  it("과거 trip — 10000 + |dDay| (D+1 → 10001, D+30 → 10030)", () => {
    expect(
      tripPriorityScore(
        { startDate: "2026-05-07", currentMode: null }, // D+1
        TODAY,
      ),
    ).toBe(10_001);
    expect(
      tripPriorityScore(
        { startDate: "2026-04-08", currentMode: null }, // D+30
        TODAY,
      ),
    ).toBe(10_030);
  });

  it("과거 trip이라도 in-travel이면 최우선 (in-travel 우선 검증)", () => {
    // 데이터 모순 케이스이지만 currentMode 우선 보장
    expect(
      tripPriorityScore(
        { startDate: "2026-04-01", currentMode: "in-travel" }, // D+37
        TODAY,
      ),
    ).toBe(-1);
  });
});

describe("sortTripsByPriority — 정렬", () => {
  it("기본 케이스 — 과거 + 다가오는 혼합 → 다가오는 가까운 → 과거 가까운", () => {
    const trips: TripPriorityInput[] = [
      { startDate: "2026-04-01", currentMode: null }, // D+37 (오래된 과거)
      { startDate: "2026-06-15", currentMode: null }, // D-38 (먼 미래)
      { startDate: "2026-05-09", currentMode: null }, // D-1 (가까운 미래)
      { startDate: "2026-05-07", currentMode: null }, // D+1 (최근 과거)
    ];
    const sorted = sortTripsByPriority(trips, TODAY);
    expect(sorted.map((t) => t.startDate)).toEqual([
      "2026-05-09", // D-1 (다가오는 가까운)
      "2026-06-15", // D-38 (다가오는 먼)
      "2026-05-07", // D+1 (과거 가까운)
      "2026-04-01", // D+37 (과거 먼)
    ]);
  });

  it("in-travel은 모든 dDay 대비 최우선", () => {
    const trips: TripPriorityInput[] = [
      { startDate: "2026-05-09", currentMode: null }, // D-1
      { startDate: "2026-04-01", currentMode: "in-travel" }, // D+37 in-travel
    ];
    const sorted = sortTripsByPriority(trips, TODAY);
    expect(sorted[0].currentMode).toBe("in-travel");
    expect(sorted[0].startDate).toBe("2026-04-01");
    expect(sorted[1].startDate).toBe("2026-05-09");
  });

  it("다중 in-travel — startDate asc 차순위 정렬 (안정성)", () => {
    const trips: TripPriorityInput[] = [
      { startDate: "2026-05-01", currentMode: "in-travel" },
      { startDate: "2026-04-25", currentMode: "in-travel" },
    ];
    const sorted = sortTripsByPriority(trips, TODAY);
    expect(sorted[0].startDate).toBe("2026-04-25");
    expect(sorted[1].startDate).toBe("2026-05-01");
  });

  it("원본 배열 비파괴 — slice 후 sort", () => {
    const trips: TripPriorityInput[] = [
      { startDate: "2026-04-01", currentMode: null },
      { startDate: "2026-06-15", currentMode: null },
    ];
    const original = [...trips];
    sortTripsByPriority(trips, TODAY);
    expect(trips).toEqual(original);
  });

  it("빈 배열 / 단일 trip — 동작 일관", () => {
    expect(sortTripsByPriority([], TODAY)).toEqual([]);
    const single: TripPriorityInput[] = [
      { startDate: "2026-05-09", currentMode: null },
    ];
    expect(sortTripsByPriority(single, TODAY)).toEqual(single);
  });
});
