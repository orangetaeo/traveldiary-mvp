"use client";

interface DayTabsBarProps {
  dayCount: number;
  activeDay: number;
  onActiveDayChange: (day: number) => void;
}

/**
 * Day 탭 (사이클 JJ 추출, 사이클 디자인 갭 #1에서 + FAB 분리).
 *
 * 사용자 진단: 헤더 옆 + 버튼이 "Day 추가"로 오해됨 (실제로는 일정 추가).
 * → + 버튼 제거. "+ 일정 추가" 진입점은 ItineraryView가 Day 카드 섹션 마지막에
 *    `AddItemDashedCard`로 노출 (위치만으로 의미 전달).
 *
 * 모드 강조색: globals.css `--color-mode-primary` 변수로 자동 swap.
 */
export function DayTabsBar({
  dayCount,
  activeDay,
  onActiveDayChange,
}: DayTabsBarProps) {
  return (
    <nav
      className="flex gap-td-xs overflow-x-auto pb-2 hide-scrollbar mb-td-md px-td-md"
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
  );
}
