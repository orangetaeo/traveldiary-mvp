"use client";

interface DayTabsBarProps {
  dayCount: number;
  activeDay: number;
  onActiveDayChange: (day: number) => void;
  onAddOpen: () => void;
}

/**
 * 사이클 JJ — Day 탭 + 자유 추가 버튼 묶음 (ItineraryView에서 추출).
 *
 * 답습: 사이클 O(BottomNav) / CC(ReplanTriggerCard) / DD(TripSecondaryActions) / HH(ItineraryItemCard).
 * 모드 강조색: globals.css `--color-mode-primary` 변수로 자동 swap.
 */
export function DayTabsBar({
  dayCount,
  activeDay,
  onActiveDayChange,
  onAddOpen,
}: DayTabsBarProps) {
  return (
    <div className="flex items-center gap-td-xs mb-td-md px-td-md">
      <nav
        className="flex-1 flex gap-td-xs overflow-x-auto pb-2 hide-scrollbar"
        aria-label="여행 일자"
      >
        {Array.from({ length: dayCount }, (_, i) => i).map((d) => {
          const active = d === activeDay;
          return (
            <button
              key={d}
              type="button"
              onClick={() => onActiveDayChange(d)}
              className={`px-td-md py-td-xs rounded-full text-td-meta whitespace-nowrap transition-colors ${
                active
                  ? "bg-mode-primary text-white shadow-sm"
                  : "bg-surface-card text-ink-soft border border-divider hover:bg-surface-soft"
              }`}
              aria-current={active ? "page" : undefined}
            >
              Day {d + 1}
            </button>
          );
        })}
      </nav>
      <button
        type="button"
        onClick={onAddOpen}
        aria-label="일정 추가"
        className="flex-shrink-0 w-11 h-11 rounded-full bg-purple text-white flex items-center justify-center shadow-sm hover:opacity-90 active:scale-95 transition-all"
      >
        <span className="material-symbols-outlined text-[20px]">add</span>
      </button>
    </div>
  );
}
