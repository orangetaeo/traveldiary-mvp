/**
 * 비용 관리 공유 상수 — DRY 추출.
 *
 * CostEntriesList / AddCostForm 2곳에서 동일 상수를 사용하므로 단일 정본으로 통합.
 */

import type { CostStatus } from "@/lib/types";

export const COST_CATEGORY_LABEL: Record<string, string> = {
  food: "식비",
  transport: "교통",
  accommodation: "숙박",
  shopping: "쇼핑",
  activity: "액티비티",
  other: "기타",
};

export const COST_CATEGORY_OPTIONS = [
  { id: "food", label: "식비" },
  { id: "transport", label: "교통" },
  { id: "accommodation", label: "숙박" },
  { id: "shopping", label: "쇼핑" },
  { id: "activity", label: "액티비티" },
  { id: "other", label: "기타" },
] as const;

export const STATUS_LABEL: Record<CostStatus, string> = {
  paid: "결제 완료",
  booked: "예약 (선결제)",
  planned: "예정",
};

export const STATUS_TONE: Record<CostStatus, string> = {
  paid: "bg-success-soft text-success-deep",
  booked: "bg-purple-soft text-purple-deep",
  planned: "bg-amber-soft text-amber-deep",
};
