/**
 * lib/share/sortReceived.ts 단위 테스트.
 *
 * sortReceived — 3가지 정렬 모드.
 */

import { describe, it, expect } from "vitest";
import { sortReceived, SORT_LABELS } from "@/lib/share/sortReceived";

const ITEMS = [
  { destination: "다낭", startDate: "2026-07-01", addedAt: 100 },
  { destination: "호치민", startDate: "2026-06-15", addedAt: 300 },
  { destination: "하노이", startDate: "2026-08-01", addedAt: 200 },
];

describe("sortReceived", () => {
  it("addedAtDesc → 최신 받은 순", () => {
    const r = sortReceived(ITEMS, "addedAtDesc");
    expect(r[0].destination).toBe("호치민"); // 300
    expect(r[1].destination).toBe("하노이"); // 200
    expect(r[2].destination).toBe("다낭");   // 100
  });

  it("startDateAsc → 출발일 가까운 순", () => {
    const r = sortReceived(ITEMS, "startDateAsc");
    expect(r[0].destination).toBe("호치민"); // 06-15
    expect(r[1].destination).toBe("다낭");   // 07-01
    expect(r[2].destination).toBe("하노이"); // 08-01
  });

  it("startDateAsc — startDate 없으면 맨 뒤", () => {
    const items = [
      { destination: "A", startDate: "2026-09-01", addedAt: 1 },
      { destination: "B", addedAt: 2 },
      { destination: "C", startDate: "2026-07-01", addedAt: 3 },
    ];
    const r = sortReceived(items, "startDateAsc");
    expect(r[0].destination).toBe("C"); // 07-01
    expect(r[1].destination).toBe("A"); // 09-01
    expect(r[2].destination).toBe("B"); // 없음 → 맨 뒤
  });

  it("startDateAsc — 둘 다 startDate 없으면 addedAt desc", () => {
    const items = [
      { destination: "X", addedAt: 10 },
      { destination: "Y", addedAt: 50 },
    ];
    const r = sortReceived(items, "startDateAsc");
    expect(r[0].destination).toBe("Y"); // addedAt 50 > 10
    expect(r[1].destination).toBe("X");
  });

  it("destinationAsc → 가나다 순 (ko locale)", () => {
    const r = sortReceived(ITEMS, "destinationAsc");
    expect(r[0].destination).toBe("다낭");
    expect(r[1].destination).toBe("하노이");
    expect(r[2].destination).toBe("호치민");
  });

  it("destinationAsc — destination 없으면 빈 문자열 취급", () => {
    const items = [
      { destination: "호치민", addedAt: 1 },
      { addedAt: 2 },
      { destination: "다낭", addedAt: 3 },
    ];
    const r = sortReceived(items, "destinationAsc");
    expect(r[0].destination).toBeUndefined(); // "" < "다"
    expect(r[1].destination).toBe("다낭");
    expect(r[2].destination).toBe("호치민");
  });

  it("원본 배열 불변 (새 배열 반환)", () => {
    const original = [...ITEMS];
    sortReceived(ITEMS, "addedAtDesc");
    expect(ITEMS).toEqual(original);
  });
});

describe("SORT_LABELS", () => {
  it("3개 라벨 존재", () => {
    expect(SORT_LABELS.addedAtDesc).toBe("받은 날짜 (최신순)");
    expect(SORT_LABELS.startDateAsc).toBe("출발일 (가까운순)");
    expect(SORT_LABELS.destinationAsc).toBe("도시명 (가나다)");
  });
});
