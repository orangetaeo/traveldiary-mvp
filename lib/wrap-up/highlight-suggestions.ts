/**
 * Wrap-up 페이지 "이 순간이 좋았어요" 섹션 — trip별 자동 highlight 선정.
 *
 * 기존 DEMO_HIGHLIGHTS 정적 배열(매 trip 동일)을 실제 itineraryItem 데이터로 대체.
 * 사용자 보고 가능 갭: "AI 추천이라더니 매번 똑같음".
 *
 * 선정 알고리즘 (per day 1개):
 *   1) photos 있는 item 우선 (시각적 highlight)
 *   2) priority 높은 item (5 → 4 → 3 ...)
 *   3) evidence.reasons 많은 item (검증 강도)
 *   4) scheduledAt 빠른 item (안정 정렬)
 */

import type { ItineraryItem, ItemCategory } from "@/lib/types";

export interface WrapUpHighlight {
  itemId: string;
  day: number; // 1-based (Day 1, Day 2, ...)
  title: string;
  category: ItemCategory;
  photoUrl?: string;
}

const CATEGORY_SUBTITLE: Record<ItemCategory, string> = {
  food: "기억에 남은 식사",
  spot: "다녀온 명소",
  shopping: "기념이 된 쇼핑",
  rest: "쉼이 있던 순간",
};

/**
 * items에서 day별 highlight 1개씩 선정 후 day asc 정렬 반환 (최대 maxCount).
 *
 * items가 비어있으면 빈 배열. 최대 maxCount(default 5).
 */
export function getWrapUpHighlights(
  items: readonly ItineraryItem[],
  options: { maxCount?: number } = {},
): WrapUpHighlight[] {
  const maxCount = options.maxCount ?? 5;
  if (items.length === 0) return [];

  // dayIndex별 그룹핑 (0-based key)
  const byDay = new Map<number, ItineraryItem[]>();
  for (const item of items) {
    const list = byDay.get(item.dayIndex) ?? [];
    list.push(item);
    byDay.set(item.dayIndex, list);
  }

  // day별 1개 선정 + day asc 정렬
  const selected: WrapUpHighlight[] = [];
  const dayKeys = Array.from(byDay.keys()).sort((a, b) => a - b);
  for (const day of dayKeys) {
    const dayItems = byDay.get(day) ?? [];
    const best = pickBestItem(dayItems);
    if (!best) continue;
    selected.push({
      itemId: best.id,
      day: day + 1, // 1-based 변환
      title: best.name,
      category: best.category,
      photoUrl: best.photos?.[0],
    });
    if (selected.length >= maxCount) break;
  }
  return selected;
}

export function highlightSubtitle(category: ItemCategory): string {
  return CATEGORY_SUBTITLE[category];
}

function pickBestItem(items: readonly ItineraryItem[]): ItineraryItem | null {
  if (items.length === 0) return null;

  // 정렬 키: photos 있음 → priority desc → evidence.reasons 길이 desc → scheduledAt asc
  return items.slice().sort((a, b) => {
    const aHasPhoto = (a.photos?.length ?? 0) > 0 ? 1 : 0;
    const bHasPhoto = (b.photos?.length ?? 0) > 0 ? 1 : 0;
    if (aHasPhoto !== bHasPhoto) return bHasPhoto - aHasPhoto;

    if (a.priority !== b.priority) return b.priority - a.priority;

    const aReasons = a.evidence?.reasons?.length ?? 0;
    const bReasons = b.evidence?.reasons?.length ?? 0;
    if (aReasons !== bReasons) return bReasons - aReasons;

    return a.scheduledAt.localeCompare(b.scheduledAt);
  })[0] ?? null;
}
