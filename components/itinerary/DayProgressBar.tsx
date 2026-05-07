"use client";

/**
 * Day 진행률 바 — A2 (Session X cap 2, 2026-05-07).
 *
 * 디자인 갭 #7 (장소 도착 체크인) 보조 UI.
 * 현재 active day의 itineraryItems 중 체크인 비율을 시각화.
 *
 * - 0건: 숨김 (visually-hidden)
 * - 1건 이상: "오늘 진행 N/M" + 진행 바 + 100% 시 ✨
 */

import { computeDayProgress, type CheckinMap } from "@/lib/hooks/useItemCheckins";

interface DayProgressBarProps {
  dayItems: Array<{ id: string }>;
  checkins: CheckinMap;
  /** in-travel 모드일 때만 의미 있음. 다른 모드면 hint 톤만 표시. */
  isOnTrip: boolean;
}

export function DayProgressBar({ dayItems, checkins, isOnTrip }: DayProgressBarProps) {
  const { done, total, ratio } = computeDayProgress(dayItems, checkins);
  if (total === 0) return null;

  const percent = Math.round(ratio * 100);
  const allDone = done === total;

  return (
    <div
      className="px-td-md py-td-xs bg-surface-card border-b border-divider"
      role="status"
      aria-live="polite"
      aria-label={`오늘 진행 ${done}/${total} (${percent}%)`}
    >
      <div className="flex items-center justify-between mb-td-xxs">
        <span
          className={`text-td-meta font-bold ${
            isOnTrip ? "text-mode-primary" : "text-ink-soft"
          }`}
        >
          {isOnTrip ? "오늘 진행" : "체크인 진행 (데모)"}
        </span>
        <span className="text-td-caption text-ink-soft tabular-nums">
          {allDone && <span className="mr-td-xxs" aria-hidden>✨</span>}
          {done}/{total}
        </span>
      </div>
      <div
        className="h-2 rounded-full bg-surface-soft overflow-hidden"
        aria-hidden
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            allDone ? "bg-success" : "bg-mode-primary"
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
