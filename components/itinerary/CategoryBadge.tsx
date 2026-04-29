import { Badge } from "@/components/ui/Badge";
import type { ItemCategory } from "@/lib/types";

/**
 * 카테고리별 배지 — 의미 매핑 (T17 가이드 / docs/03-style-system.md):
 *   food     → amber  (사회적 증거·맛집)
 *   spot     → info   (보라 — 계획·정보)
 *   shopping → neutral (회색)
 *   rest     → success (초록 — 완료·휴식)
 */
const TONE: Record<ItemCategory, "amber" | "info" | "neutral" | "success"> = {
  food: "amber",
  spot: "info",
  shopping: "neutral",
  rest: "success",
};

const LABEL: Record<ItemCategory, string> = {
  food: "맛집",
  spot: "관광",
  shopping: "쇼핑",
  rest: "휴식",
};

export function CategoryBadge({ category }: { category: ItemCategory }) {
  return <Badge tone={TONE[category]}>{LABEL[category]}</Badge>;
}
