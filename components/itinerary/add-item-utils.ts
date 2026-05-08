/**
 * AddItemModal 순수 유틸리티 — 카테고리 매핑 + 추천 정렬 + 소요시간 추정.
 */

import type {
  ItemCategory,
  ItemFlexibility,
  DiscoverPlace,
  PlaceCategory,
} from "@/lib/types";

/** PlaceCategory → ItemCategory 매핑 (nature/activity→spot, cafe→food, nightlife→food) */
export const PLACE_TO_ITEM_CATEGORY: Record<PlaceCategory, ItemCategory> = {
  food: "food",
  spot: "spot",
  shopping: "shopping",
  nature: "spot",
  cafe: "food",
  activity: "spot",
  nightlife: "food",
};

export const CATEGORY_OPTIONS: { id: ItemCategory; label: string; icon: string }[] = [
  { id: "food", label: "음식점", icon: "restaurant" },
  { id: "spot", label: "관광", icon: "photo_camera" },
  { id: "shopping", label: "쇼핑", icon: "shopping_bag" },
  { id: "rest", label: "휴식", icon: "bed" },
];

export const FLEXIBILITY_OPTIONS: { id: ItemFlexibility; label: string }[] = [
  { id: "flexible", label: "유연 (변경 OK)" },
  { id: "booked", label: "예약 (변경 시 취소)" },
  { id: "fixed", label: "고정 (절대 변경 X)" },
];

/** AI 추천 장소 중 상위 N개 (ai 배지 우선). */
export function topSuggestions(
  suggestions: DiscoverPlace[],
  limit = 5,
): DiscoverPlace[] {
  return suggestions
    .slice()
    .sort((a, b) => (a.badge === "ai" ? -1 : 0) - (b.badge === "ai" ? -1 : 0))
    .slice(0, limit);
}

/** PlaceCategory → 추천 소요시간 (분). 음식/카페=90, 야간=150, 그 외=120. */
export function suggestDuration(category: PlaceCategory): number {
  if (category === "food" || category === "cafe") return 90;
  if (category === "nightlife") return 150;
  return 120;
}
