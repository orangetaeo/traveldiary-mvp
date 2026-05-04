"use client";

/**
 * 사이클 QQ — ChecklistBucketList (ChecklistView에서 추출).
 * 사이클 BBB(2026-05-03) — 위/아래 화살표 정렬 (ADR-022 백로그 활성).
 *
 * 답습: 사이클 LL/NN (presentation 컴포넌트 추출).
 * 책임: D-Day 버킷별 항목 그룹 + 토글/삭제 + 위/아래 정렬 버튼. 액션은 부모 콜백.
 */

import type {
  ChecklistCategory,
  ChecklistItem,
  DDayBucket,
} from "@/lib/types";

interface Props {
  items: ChecklistItem[];
  onToggle: (item: ChecklistItem) => void;
  onDelete: (item: ChecklistItem) => void;
  onMove?: (item: ChecklistItem, direction: "up" | "down") => void;
  /** 사이클 II — 선택 모드 시 클릭 = 선택/해제, move/delete 비활성 */
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  onSelectToggle?: (item: ChecklistItem) => void;
}

const BUCKET_ORDER: DDayBucket[] = [
  "D-30",
  "D-14",
  "D-7",
  "D-1",
  "during",
  "after",
];

const BUCKET_LABEL: Record<DDayBucket, string> = {
  "D-30": "D-30 · 사전 준비",
  "D-14": "D-14 · 예약 마감",
  "D-7": "D-7 · 짐 준비",
  "D-1": "D-1 · 출발 직전",
  during: "여행 중",
  after: "귀국 후",
};

const CATEGORY_LABEL: Record<ChecklistCategory, string> = {
  documents: "서류",
  clothing: "의류",
  electronics: "전자",
  forbidden: "반입 금지",
  declarable: "신고 대상",
  custom: "기타",
};

const CATEGORY_TONE: Record<ChecklistCategory, string> = {
  documents: "bg-purple-soft text-purple-deep",
  clothing: "bg-success-soft text-success-deep",
  electronics: "bg-amber-soft text-amber-deep",
  forbidden: "bg-danger-soft text-danger-deep",
  declarable: "bg-accent-soft text-accent-deep",
  custom: "bg-surface-soft text-ink-soft",
};

export function ChecklistBucketList({
  items,
  onToggle,
  onDelete,
  onMove,
  selectionMode = false,
  selectedIds,
  onSelectToggle,
}: Props) {
  return (
    <section className="space-y-td-md">
      {BUCKET_ORDER.map((bucket) => {
        const bucketItems = items
          .filter((it) => it.dDayBucket === bucket)
          .sort((a, b) => a.sortOrder - b.sortOrder);
        if (bucketItems.length === 0) return null;
        const bucketDone = bucketItems.filter((it) => it.done).length;
        return (
          <article
            key={bucket}
            className="bg-surface-card border border-divider rounded-xl overflow-hidden"
          >
            <header className="px-td-md py-td-sm flex justify-between items-center bg-surface-soft border-b border-divider">
              <h3 className="text-td-card-title text-ink">
                {BUCKET_LABEL[bucket]}
              </h3>
              <span className="text-td-meta text-ink-soft tabular-nums">
                {bucketDone}/{bucketItems.length}
              </span>
            </header>
            <ul>
              {bucketItems.map((item, idx) => {
                const canMoveUp = idx > 0;
                const canMoveDown = idx < bucketItems.length - 1;
                const isSelected = !!selectedIds?.has(item.id);
                return (
                  <li
                    key={item.id}
                    className={`px-td-md py-td-sm border-b border-divider last:border-b-0 flex items-start gap-td-sm group transition-colors ${
                      selectionMode && isSelected
                        ? "bg-purple-soft border-l-2 border-l-purple"
                        : ""
                    }`}
                  >
                    {selectionMode ? (
                      <button
                        type="button"
                        role="checkbox"
                        onClick={() => onSelectToggle?.(item)}
                        aria-label={isSelected ? "선택 해제" : "선택"}
                        aria-checked={isSelected ? "true" : "false"}
                        className="mt-0.5 flex-shrink-0"
                      >
                        <span
                          className={`material-symbols-outlined ${
                            isSelected ? "filled text-purple" : "text-ink-mute"
                          }`}
                        >
                          {isSelected ? "check_box" : "check_box_outline_blank"}
                        </span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onToggle(item)}
                        aria-label={item.done ? "체크 해제" : "체크"}
                        className="mt-0.5 flex-shrink-0"
                      >
                        <span
                          className={`material-symbols-outlined ${
                            item.done ? "filled text-purple" : "text-ink-mute"
                          }`}
                        >
                          {item.done ? "check_circle" : "radio_button_unchecked"}
                        </span>
                      </button>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-td-xs flex-wrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-td-caption font-bold ${
                            CATEGORY_TONE[item.category]
                          }`}
                        >
                          {CATEGORY_LABEL[item.category]}
                        </span>
                        <p
                          className={`text-td-body ${
                            item.done
                              ? "line-through text-ink-mute"
                              : "text-ink"
                          }`}
                        >
                          {item.text}
                        </p>
                      </div>
                      {item.cityNote && (
                        <p className="text-td-caption text-ink-mute mt-td-xxs">
                          💡 {item.cityNote}
                        </p>
                      )}
                    </div>
                    {!selectionMode && onMove && (
                      <div className="flex flex-col flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => onMove(item, "up")}
                          disabled={!canMoveUp}
                          aria-label="위로 이동"
                          className="text-ink-mute hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors h-5 flex items-center"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            keyboard_arrow_up
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onMove(item, "down")}
                          disabled={!canMoveDown}
                          aria-label="아래로 이동"
                          className="text-ink-mute hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors h-5 flex items-center"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            keyboard_arrow_down
                          </span>
                        </button>
                      </div>
                    )}
                    {!selectionMode && (
                      <button
                        type="button"
                        onClick={() => onDelete(item)}
                        aria-label="삭제"
                        className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 text-ink-mute hover:text-danger transition-opacity flex-shrink-0"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          close
                        </span>
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </article>
        );
      })}
    </section>
  );
}
