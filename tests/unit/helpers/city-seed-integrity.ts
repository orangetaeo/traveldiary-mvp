/**
 * 도시 시드 무결성 공통 단언 — DRY 추출.
 *
 * 4개 도시(다낭/호치민/하노이/나트랑)에서 동일하게 반복되는
 * tripId 일치 / scheduledAt 오름차순 / 좌표 비(0,0) 검증을
 * 파라미터화된 빌더로 추출.
 */

import { it, expect } from "vitest";
import type { ItineraryItem } from "@/lib/types";

export interface IntegrityParams {
  /** trip ID 상수 */
  tripId: string;
  /** 시드 itinerary 배열 */
  itinerary: ItineraryItem[];
  /** 최대 dayIndex (예: 3박 → 3) */
  maxDayIndex: number;
}

/**
 * 공통 무결성 단언 3건을 등록.
 * describe 블록 안에서 호출해야 함 (it만 등록).
 */
export function assertSeedIntegrity(params: IntegrityParams) {
  const { tripId, itinerary, maxDayIndex } = params;

  it("모든 일정의 tripId 일치", () => {
    for (const item of itinerary) {
      expect(item.tripId).toBe(tripId);
    }
  });

  it("같은 day 안에서 scheduledAt 오름차순", () => {
    for (let dayIdx = 0; dayIdx <= maxDayIndex; dayIdx++) {
      const dayItems = itinerary
        .filter((item) => item.dayIndex === dayIdx)
        .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
      const original = itinerary.filter((item) => item.dayIndex === dayIdx);
      expect(original.map((item) => item.id)).toEqual(
        dayItems.map((item) => item.id),
      );
    }
  });

  it("좌표 모두 (0,0) 아님", () => {
    for (const item of itinerary) {
      expect(item.location.lat !== 0 || item.location.lng !== 0).toBe(true);
    }
  });
}
