"use client";

/**
 * 사이클 NN — 카테고리 필터 chips.
 *
 * 단일 선택 (all + 6 카테고리). 활성 chip은 카테고리 색으로 강조.
 * 진척률(progress)은 unfiltered total 기준 유지 — 필터는 "보기" 변경뿐.
 */

import type { ChecklistCategory, ChecklistItem } from "@/lib/types";

export type CategoryFilterValue = ChecklistCategory | "all";

interface Props {
  items: ChecklistItem[];
  value: CategoryFilterValue;
  onChange: (next: CategoryFilterValue) => void;
}

const CATEGORY_LABEL: Record<ChecklistCategory, string> = {
  documents: "서류",
  clothing: "의류",
  electronics: "전자",
  forbidden: "반입 금지",
  declarable: "신고 대상",
  custom: "기타",
};

const CATEGORY_ORDER: ChecklistCategory[] = [
  "documents",
  "clothing",
  "electronics",
  "forbidden",
  "declarable",
  "custom",
];

const CATEGORY_ACTIVE_TONE: Record<ChecklistCategory, string> = {
  documents: "bg-purple text-white border-purple",
  clothing: "bg-success-deep text-white border-success-deep",
  electronics: "bg-amber-deep text-white border-amber-deep",
  forbidden: "bg-danger-deep text-white border-danger-deep",
  declarable: "bg-accent-deep text-white border-accent-deep",
  custom: "bg-ink text-white border-ink",
};

export function ChecklistCategoryFilter({ items, value, onChange }: Props) {
  const total = items.length;
  const counts = countByCategory(items);

  const baseChip =
    "shrink-0 px-3 py-1.5 rounded-full text-td-meta font-semibold border transition-colors flex items-center gap-1.5";
  const inactive =
    "bg-surface-card border-divider text-ink-soft hover:text-ink hover:border-ink-mute";

  return (
    <div
      className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-td-md px-td-md"
      role="radiogroup"
      aria-label="카테고리 필터"
    >
      <button
        type="button"
        role="radio"
        aria-checked={value === "all" ? "true" : "false"}
        onClick={() => onChange("all")}
        className={`${baseChip} ${
          value === "all"
            ? "bg-ink text-white border-ink"
            : inactive
        }`}
      >
        전체
        <span className="tabular-nums opacity-80">{total}</span>
      </button>
      {CATEGORY_ORDER.map((cat) => {
        const isActive = value === cat;
        const count = counts[cat] ?? 0;
        return (
          <button
            key={cat}
            type="button"
            role="radio"
            aria-checked={isActive ? "true" : "false"}
            onClick={() => onChange(cat)}
            disabled={count === 0}
            className={`${baseChip} ${
              isActive ? CATEGORY_ACTIVE_TONE[cat] : inactive
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {CATEGORY_LABEL[cat]}
            <span className="tabular-nums opacity-80">{count}</span>
          </button>
        );
      })}
    </div>
  );
}

function countByCategory(
  items: ChecklistItem[],
): Record<ChecklistCategory, number> {
  const acc: Record<ChecklistCategory, number> = {
    documents: 0,
    clothing: 0,
    electronics: 0,
    forbidden: 0,
    declarable: 0,
    custom: 0,
  };
  for (const it of items) acc[it.category] += 1;
  return acc;
}

/** ChecklistView에서 사용 — 필터에 매칭되는 항목만 반환 */
export function applyCategoryFilter(
  items: ChecklistItem[],
  filter: CategoryFilterValue,
): ChecklistItem[] {
  if (filter === "all") return items;
  return items.filter((it) => it.category === filter);
}

/**
 * 사이클 OO — 카테고리 + 텍스트 검색 합성.
 * 검색어는 trim + lowercase 후 text·cityNote 부분 일치.
 */
export type DoneFilterValue = "all" | "todo" | "done";

export interface ChecklistFilters {
  category: CategoryFilterValue;
  search: string;
  /** 사이클 QQ — 옵션. 미지정 시 "all"과 동일 (NN→OO 답습으로 키 추가) */
  done?: DoneFilterValue;
}

export function applyChecklistFilters(
  items: ChecklistItem[],
  filters: ChecklistFilters,
): ChecklistItem[] {
  const byCategory = applyCategoryFilter(items, filters.category);
  const byDone =
    !filters.done || filters.done === "all"
      ? byCategory
      : filters.done === "done"
        ? byCategory.filter((it) => it.done)
        : byCategory.filter((it) => !it.done);
  const q = filters.search.trim().toLowerCase();
  if (q.length === 0) return byDone;
  return byDone.filter((it) => {
    const hay = `${it.text}${it.cityNote ?? ""}`.toLowerCase();
    return hay.includes(q);
  });
}
