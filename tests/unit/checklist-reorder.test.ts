/**
 * 사이클 BBB — swapWithinBucket 회귀.
 *
 * 검증:
 *  1. up swap — 인접 두 항목의 sortOrder 정확히 swap
 *  2. down swap — up의 미러
 *  3. 버킷 첫 항목 up — no_op (원본 동일)
 *  4. 버킷 마지막 항목 down — no_op (원본 동일)
 *  5. 다른 버킷 항목과는 swap 안 됨 (D-30 첫 항목 up은 during 버킷 보지 않음)
 *  6. itemId 미존재 — 원본 동일
 *  7. sortOrder 비연속(0, 5, 10) 정확 swap
 *  8. 다른 항목들은 sortOrder 변경 없음
 *  9. ChecklistItem 다른 필드(text/done/category)는 보존
 */

import { describe, it, expect } from "vitest";
import { swapWithinBucket } from "@/lib/checklist-reorder";
import type { ChecklistItem } from "@/lib/types";

const NOW = "2026-05-03T00:00:00Z";

function item(
  id: string,
  sortOrder: number,
  overrides: Partial<ChecklistItem> = {},
): ChecklistItem {
  return {
    id,
    tripId: "t1",
    category: "documents",
    text: `item-${id}`,
    dDayBucket: "D-30",
    done: false,
    sortOrder,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

describe("사이클 BBB — swapWithinBucket", () => {
  it("up swap — sortOrder 정확히 swap", () => {
    const items = [item("a", 0), item("b", 1), item("c", 2)];
    const result = swapWithinBucket(items, "b", "up");
    expect(result.find((it) => it.id === "a")?.sortOrder).toBe(1);
    expect(result.find((it) => it.id === "b")?.sortOrder).toBe(0);
    expect(result.find((it) => it.id === "c")?.sortOrder).toBe(2);
  });

  it("down swap — up의 미러", () => {
    const items = [item("a", 0), item("b", 1), item("c", 2)];
    const result = swapWithinBucket(items, "b", "down");
    expect(result.find((it) => it.id === "a")?.sortOrder).toBe(0);
    expect(result.find((it) => it.id === "b")?.sortOrder).toBe(2);
    expect(result.find((it) => it.id === "c")?.sortOrder).toBe(1);
  });

  it("버킷 첫 항목 up → no_op (원본 동일)", () => {
    const items = [item("a", 0), item("b", 1), item("c", 2)];
    const result = swapWithinBucket(items, "a", "up");
    expect(result).toEqual(items);
  });

  it("버킷 마지막 항목 down → no_op (원본 동일)", () => {
    const items = [item("a", 0), item("b", 1), item("c", 2)];
    const result = swapWithinBucket(items, "c", "down");
    expect(result).toEqual(items);
  });

  it("다른 버킷 항목과는 swap 안 됨", () => {
    const items = [
      item("a", 0, { dDayBucket: "D-30" }),
      item("b", 0, { dDayBucket: "during" }), // 다른 버킷의 sortOrder=0
    ];
    // a를 up — D-30 버킷에 a 위가 없으므로 no_op
    const result = swapWithinBucket(items, "a", "up");
    expect(result).toEqual(items);
  });

  it("itemId 미존재 → 원본 동일", () => {
    const items = [item("a", 0), item("b", 1)];
    const result = swapWithinBucket(items, "x", "up");
    expect(result).toEqual(items);
  });

  it("sortOrder 비연속(0, 5, 10) 정확 swap", () => {
    const items = [item("a", 0), item("b", 5), item("c", 10)];
    const result = swapWithinBucket(items, "c", "up");
    expect(result.find((it) => it.id === "a")?.sortOrder).toBe(0);
    expect(result.find((it) => it.id === "b")?.sortOrder).toBe(10);
    expect(result.find((it) => it.id === "c")?.sortOrder).toBe(5);
  });

  it("swap 무관한 항목들은 sortOrder 보존", () => {
    const items = [
      item("a", 0),
      item("b", 1),
      item("c", 2),
      item("d", 3, { dDayBucket: "during" }),
    ];
    const result = swapWithinBucket(items, "a", "down");
    // d는 다른 버킷 — sortOrder 그대로
    expect(result.find((it) => it.id === "d")?.sortOrder).toBe(3);
    // c도 swap에 미관여 — 그대로
    expect(result.find((it) => it.id === "c")?.sortOrder).toBe(2);
  });

  it("다른 필드(text/done/category)는 swap 후에도 보존", () => {
    const items = [
      item("a", 0, { text: "여권", done: true, category: "documents" }),
      item("b", 1, { text: "양말", done: false, category: "clothing" }),
    ];
    const result = swapWithinBucket(items, "b", "up");
    const a = result.find((it) => it.id === "a")!;
    const b = result.find((it) => it.id === "b")!;
    expect(a.text).toBe("여권");
    expect(a.done).toBe(true);
    expect(a.category).toBe("documents");
    expect(b.text).toBe("양말");
    expect(b.done).toBe(false);
    expect(b.category).toBe("clothing");
  });

  it("같은 버킷에서만 인접 — 다른 버킷 sortOrder=0인 항목과는 swap 안 함", () => {
    // c (during 버킷)가 sortOrder=0이라도 a(D-30, sortOrder=0) up 시 무시
    const items = [
      item("a", 0, { dDayBucket: "D-30" }),
      item("b", 1, { dDayBucket: "D-30" }),
      item("c", 0, { dDayBucket: "during" }),
    ];
    const result = swapWithinBucket(items, "a", "up");
    // a는 D-30 버킷의 첫 → no_op
    expect(result.find((it) => it.id === "a")?.sortOrder).toBe(0);
    expect(result.find((it) => it.id === "c")?.sortOrder).toBe(0);
  });

  it("배열 길이 불변 (swap 후에도 같은 항목 수)", () => {
    const items = [item("a", 0), item("b", 1), item("c", 2)];
    const result = swapWithinBucket(items, "b", "up");
    expect(result.length).toBe(3);
    expect(new Set(result.map((it) => it.id))).toEqual(
      new Set(["a", "b", "c"]),
    );
  });
});
