/**
 * 사이클 FF — sortReceived 단위 테스트.
 */

import { describe, it, expect } from "vitest";
import {
  sortReceived,
  SORT_LABELS,
  type ReceivedSortMode,
  type SortableReceivedItem,
} from "@/lib/share/sortReceived";

const ITEMS: SortableReceivedItem[] = [
  { destination: "다낭", startDate: "2026-06-01T00:00:00.000Z", addedAt: 100 },
  { destination: "푸꾸옥", startDate: "2026-05-15T00:00:00.000Z", addedAt: 300 },
  { destination: "하노이", startDate: "2026-07-10T00:00:00.000Z", addedAt: 200 },
  { destination: "Bangkok", addedAt: 150 }, // startDate 없음
];

describe("sortReceived", () => {
  it("addedAtDesc — 받은 날짜 내림차순", () => {
    const sorted = sortReceived(ITEMS, "addedAtDesc");
    expect(sorted.map((it) => it.destination)).toEqual([
      "푸꾸옥",
      "하노이",
      "Bangkok",
      "다낭",
    ]);
  });

  it("startDateAsc — 출발일자 오름차순, startDate 없는 건 맨 뒤", () => {
    const sorted = sortReceived(ITEMS, "startDateAsc");
    expect(sorted[0].destination).toBe("푸꾸옥");
    expect(sorted[1].destination).toBe("다낭");
    expect(sorted[2].destination).toBe("하노이");
    // startDate 없는 건 마지막
    expect(sorted[3].destination).toBe("Bangkok");
  });

  it("destinationAsc — 도시명 가나다(ko locale, 한글 우선)", () => {
    const sorted = sortReceived(ITEMS, "destinationAsc");
    const names = sorted.map((it) => it.destination);
    // 한글끼리는 가나다순 (안정 검증)
    expect(names.indexOf("다낭")).toBeLessThan(names.indexOf("푸꾸옥"));
    expect(names.indexOf("푸꾸옥")).toBeLessThan(names.indexOf("하노이"));
    // Bangkok 위치는 ICU 구현 의존이라 인덱스만 확인 (포함 여부)
    expect(names).toContain("Bangkok");
  });

  it("원본 배열 미변경 (immutable)", () => {
    const original = ITEMS.map((it) => ({ ...it }));
    sortReceived(ITEMS, "addedAtDesc");
    expect(ITEMS).toEqual(original);
  });

  it("SORT_LABELS — 3 mode 모두 한국어", () => {
    const modes: ReceivedSortMode[] = [
      "addedAtDesc",
      "startDateAsc",
      "destinationAsc",
    ];
    for (const m of modes) {
      expect(SORT_LABELS[m]).toMatch(/[가-힣]/);
    }
  });

  it("빈 배열 → 빈 배열", () => {
    expect(sortReceived([], "addedAtDesc")).toEqual([]);
  });
});
