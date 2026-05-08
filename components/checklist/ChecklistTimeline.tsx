/**
 * D-bucket 타임라인 스텝퍼 — 체크리스트 진행 시각화.
 *
 * D-30 → D-14 → D-7 → D-1 → 여행 중 → 귀국 후 6단계.
 * 각 버킷의 완료율로 색상 + 도트 크기 결정.
 */

import type { ChecklistItem, DDayBucket } from "@/lib/types";
import { BUCKET_ORDER } from "@/lib/utils/checklist-constants";

interface Props {
  items: ChecklistItem[];
}

const SHORT_LABEL: Record<DDayBucket, string> = {
  "D-30": "D-30",
  "D-14": "D-14",
  "D-7": "D-7",
  "D-1": "D-1",
  during: "여행 중",
  after: "귀국 후",
};

export function ChecklistTimeline({ items }: Props) {
  if (items.length === 0) return null;

  const bucketStats = BUCKET_ORDER.map((bucket) => {
    const bucketItems = items.filter((it) => it.dDayBucket === bucket);
    const total = bucketItems.length;
    const done = bucketItems.filter((it) => it.done).length;
    return { bucket, total, done, percent: total === 0 ? -1 : Math.round((done / total) * 100) };
  });

  return (
    <div className="flex items-start justify-between gap-0 overflow-x-auto touch-pan-x overscroll-x-contain hide-scrollbar py-td-xs">
      {bucketStats.map((s, i) => {
        const isEmpty = s.percent === -1;
        const isComplete = s.percent === 100;
        const isPartial = s.percent > 0 && s.percent < 100;

        return (
          <div key={s.bucket} className="flex flex-col items-center flex-1 min-w-0 relative">
            {/* 연결선 */}
            {i > 0 && (
              <div
                className={`absolute top-[9px] right-1/2 w-full h-0.5 -z-10 ${
                  bucketStats[i - 1].percent === 100
                    ? "bg-purple"
                    : "bg-divider"
                }`}
              />
            )}
            {/* 도트 */}
            <div
              className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center shrink-0 ${
                isComplete
                  ? "bg-purple border-purple"
                  : isPartial
                    ? "bg-surface-card border-purple"
                    : isEmpty
                      ? "bg-surface-soft border-divider"
                      : "bg-surface-card border-divider"
              }`}
            >
              {isComplete && (
                <span className="material-symbols-outlined text-white text-td-icon-xs filled" aria-hidden="true">
                  check
                </span>
              )}
              {isPartial && (
                <div className="w-2 h-2 rounded-full bg-purple" />
              )}
            </div>
            {/* 라벨 */}
            <span
              className={`text-td-micro mt-1 text-center leading-tight ${
                isComplete
                  ? "text-purple font-bold"
                  : isEmpty
                    ? "text-ink-mute"
                    : "text-ink-soft font-medium"
              }`}
            >
              {SHORT_LABEL[s.bucket]}
            </span>
            {/* 카운트 */}
            {!isEmpty && (
              <span className="text-[8px] text-ink-mute tabular-nums">
                {s.done}/{s.total}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
