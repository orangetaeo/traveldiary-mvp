import { Badge } from "@/components/ui/Badge";
import type { ItemCategory } from "@/lib/types";

/**
 * 카테고리별 배지 — 의미 매핑 (T17 가이드 / docs/03-style-system.md / ADR-050):
 *   food     → amber    (사회적 증거·맛집)
 *   spot     → info     (보라 — 계획·정보)
 *   shopping → neutral  (회색)
 *   stay     → success  (초록 — 쉼, rest와 의미 폴딩)
 *   wellness → accent   (코랄 — 강조, ADR-050 신규 tone)
 *   rest     → success  (초록 — 기타 휴식, stay와 의미 폴딩)
 */
const TONE: Record<ItemCategory, "amber" | "info" | "neutral" | "success" | "accent"> = {
  food: "amber",
  spot: "info",
  shopping: "neutral",
  stay: "success",
  wellness: "accent",
  rest: "success",
};

const LABEL: Record<ItemCategory, string> = {
  food: "맛집",
  spot: "관광",
  shopping: "쇼핑",
  stay: "숙소",
  wellness: "마사지",
  rest: "기타 휴식",
};

export function CategoryBadge({ category }: { category: ItemCategory }) {
  return <Badge tone={TONE[category]}>{LABEL[category]}</Badge>;
}
