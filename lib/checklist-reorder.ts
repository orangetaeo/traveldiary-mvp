/**
 * Checklist 정렬 순수 헬퍼 — 사이클 BBB(2026-05-03).
 *
 * 같은 dDayBucket 안에서 인접 항목과 sortOrder + 배열 위치를 swap.
 * 클라이언트 옵티미스틱 업데이트 + 테스트 가능 분리(사이클 AAA buildModeTransitionMetadata 답습).
 */

import type { ChecklistItem } from "./types";

/**
 * 같은 버킷 안에서 itemId의 인접 항목과 swap.
 * 버킷 끝에 있어 swap할 인접 항목이 없으면 원본 반환(no_op).
 */
export function swapWithinBucket(
  items: ChecklistItem[],
  itemId: string,
  direction: "up" | "down",
): ChecklistItem[] {
  const target = items.find((it) => it.id === itemId);
  if (!target) return items;

  const sameBucket = items
    .filter((it) => it.dDayBucket === target.dDayBucket)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const idx = sameBucket.findIndex((it) => it.id === itemId);
  if (idx === -1) return items;

  const neighborIdx = direction === "up" ? idx - 1 : idx + 1;
  if (neighborIdx < 0 || neighborIdx >= sameBucket.length) return items;

  const neighbor = sameBucket[neighborIdx];
  const targetOrder = target.sortOrder;
  const neighborOrder = neighbor.sortOrder;

  return items.map((it) => {
    if (it.id === target.id) return { ...it, sortOrder: neighborOrder };
    if (it.id === neighbor.id) return { ...it, sortOrder: targetOrder };
    return it;
  });
}
