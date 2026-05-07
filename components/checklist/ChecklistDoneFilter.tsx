"use client";

/**
 * 사이클 QQ — 완료 상태 필터 chips.
 *
 * 3-state radio: 전체 / 미완료 / 완료. 진척률(progress)은 unfiltered total 기준 유지.
 * NN(카테고리) + OO(검색)에 이은 3번째 필터 — 헬퍼 진화 답습 (옵션 객체 키 추가).
 *
 * ARIA boolean 속성은 string으로 명시 (feedback_aria_invariant — NN→OO 정착).
 */

import type { ChecklistItem } from "@/lib/types";
import type { DoneFilterValue } from "./ChecklistCategoryFilter";

interface Props {
  items: ChecklistItem[];
  value: DoneFilterValue;
  onChange: (next: DoneFilterValue) => void;
}

const DONE_LABEL: Record<DoneFilterValue, string> = {
  all: "전체",
  todo: "미완료",
  done: "완료",
};

const DONE_ORDER: DoneFilterValue[] = ["all", "todo", "done"];

const DONE_ACTIVE_TONE: Record<DoneFilterValue, string> = {
  all: "bg-ink text-white border-ink",
  todo: "bg-amber-deep text-white border-amber-deep",
  done: "bg-success-deep text-white border-success-deep",
};

export function ChecklistDoneFilter({ items, value, onChange }: Props) {
  const total = items.length;
  const doneCount = items.filter((it) => it.done).length;
  const todoCount = total - doneCount;

  const counts: Record<DoneFilterValue, number> = {
    all: total,
    todo: todoCount,
    done: doneCount,
  };

  const baseChip =
    "shrink-0 px-3 py-1.5 rounded-full text-td-meta font-semibold border transition-colors flex items-center gap-1.5";
  const inactive =
    "bg-surface-card border-divider text-ink-soft hover:text-ink hover:border-ink-mute";

  return (
    <div
      className="flex gap-2 overflow-x-auto hide-scrollbar pb-1 -mx-td-md px-td-md"
      role="radiogroup"
      aria-label="완료 상태 필터"
    >
      {DONE_ORDER.map((opt) => {
        const isActive = value === opt;
        const count = counts[opt];
        const isAll = opt === "all";
        return (
          <button
            key={opt}
            type="button"
            role="radio"
            aria-checked={isActive ? "true" : "false"}
            onClick={() => onChange(opt)}
            disabled={!isAll && count === 0}
            className={`${baseChip} ${
              isActive ? DONE_ACTIVE_TONE[opt] : inactive
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {DONE_LABEL[opt]}
            <span className="tabular-nums opacity-80">{count}</span>
          </button>
        );
      })}
    </div>
  );
}
