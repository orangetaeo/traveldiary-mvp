/**
 * 체크리스트 공유 상수 — DRY 추출.
 *
 * AddChecklistForm / ChecklistBucketList / ChecklistCategoryFilter 3곳에서
 * 동일 상수를 사용하므로 단일 정본으로 통합.
 */

import type { ChecklistCategory, DDayBucket } from "@/lib/types";

export const BUCKET_ORDER: DDayBucket[] = [
  "D-30",
  "D-14",
  "D-7",
  "D-1",
  "during",
  "after",
];

export const BUCKET_LABEL: Record<DDayBucket, string> = {
  "D-30": "D-30 · 사전 준비",
  "D-14": "D-14 · 예약 마감",
  "D-7": "D-7 · 짐 준비",
  "D-1": "D-1 · 출발 직전",
  during: "여행 중",
  after: "귀국 후",
};

export const CHECKLIST_CATEGORY_LABEL: Record<ChecklistCategory, string> = {
  documents: "서류",
  clothing: "의류",
  electronics: "전자",
  forbidden: "반입 금지",
  declarable: "신고 대상",
  custom: "기타",
};

export const CATEGORY_ORDER: ChecklistCategory[] = [
  "documents",
  "clothing",
  "electronics",
  "forbidden",
  "declarable",
  "custom",
];

export const CATEGORY_TONE: Record<ChecklistCategory, string> = {
  documents: "bg-purple-soft text-purple-deep",
  clothing: "bg-success-soft text-success-deep",
  electronics: "bg-amber-soft text-amber-deep",
  forbidden: "bg-danger-soft text-danger-deep",
  declarable: "bg-accent-soft text-accent-deep",
  custom: "bg-surface-soft text-ink-soft",
};

export const CATEGORY_ICON: Record<ChecklistCategory, string> = {
  documents: "description",
  clothing: "checkroom",
  electronics: "devices",
  forbidden: "block",
  declarable: "warning",
  custom: "more_horiz",
};

export const CATEGORY_ACTIVE_TONE: Record<ChecklistCategory, string> = {
  documents: "bg-purple text-white border-purple",
  clothing: "bg-success-deep text-white border-success-deep",
  electronics: "bg-amber-deep text-white border-amber-deep",
  forbidden: "bg-danger-deep text-white border-danger-deep",
  declarable: "bg-accent-deep text-white border-accent-deep",
  custom: "bg-ink text-white border-ink",
};
