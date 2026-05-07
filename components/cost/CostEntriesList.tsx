"use client";

/**
 * 사이클 NN — CostEntriesList (CostView에서 추출).
 *
 * 답습: 사이클 LL AddCostForm (presentation 컴포넌트 추출).
 * 책임: 비용 entry 카드 리스트 + 빈 상태 + 삭제 버튼. 삭제 액션은 부모 콜백.
 */

import type { CostEntry } from "@/lib/types";
import {
  COST_CATEGORY_LABEL,
  STATUS_LABEL,
  STATUS_TONE,
} from "@/lib/utils/cost-constants";

interface Props {
  entries: CostEntry[];
  onDelete: (entry: CostEntry) => void;
}

export function CostEntriesList({ entries, onDelete }: Props) {
  return (
    <section>
      <h3 className="text-td-card-title text-ink mb-td-sm">최근 입력</h3>
      {entries.length === 0 ? (
        <div className="text-center py-td-lg bg-surface-card border border-divider rounded-md px-td-md">
          <span className="material-symbols-outlined text-ink-mute text-[32px] mb-td-xs block" aria-hidden>
            receipt_long
          </span>
          <p className="text-td-body text-ink-soft">
            아직 입력된 비용이 없어요.
          </p>
          <p className="text-td-caption text-ink-mute mt-td-xxs mb-td-sm">
            여행 경비를 기록하면 자동 정산까지 도와드려요.
          </p>
          <button
            type="button"
            onClick={() => document.getElementById("add-cost-form")?.scrollIntoView({ behavior: "smooth" })}
            className="bg-purple text-white py-2 px-td-md rounded-md text-td-body font-semibold hover:opacity-90 transition-opacity"
          >
            첫 비용 기록하기
          </button>
        </div>
      ) : (
        <ul className="space-y-td-xs">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="bg-surface-card border border-divider rounded-md p-td-sm flex items-start justify-between group"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-td-xs flex-wrap mb-td-xxs">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-td-caption font-bold ${
                      STATUS_TONE[entry.status]
                    }`}
                  >
                    {STATUS_LABEL[entry.status]}
                  </span>
                  <span className="text-td-caption text-ink-mute tabular-nums">
                    {entry.date}
                  </span>
                  {entry.category && (
                    <span className="text-td-caption text-ink-soft">
                      · {COST_CATEGORY_LABEL[entry.category] ?? entry.category}
                    </span>
                  )}
                </div>
                <p className="text-td-body text-ink truncate">{entry.label}</p>
                <p className="text-td-card-title text-ink tabular-nums mt-td-xxs">
                  {entry.amountKrw.toLocaleString()}원
                  {entry.amountLocal && (
                    <span className="text-td-meta text-ink-soft ml-td-xs">
                      ({entry.amountLocal.value.toLocaleString()}{" "}
                      {entry.amountLocal.currency})
                    </span>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onDelete(entry)}
                aria-label="삭제"
                className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 text-ink-mute hover:text-danger transition-opacity ml-td-sm flex-shrink-0"
              >
                <span className="material-symbols-outlined text-td-icon">
                  close
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
