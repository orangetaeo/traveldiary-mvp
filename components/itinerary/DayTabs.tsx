"use client";

import { useState } from "react";
import { ItineraryCard } from "./ItineraryCard";
import type { ItineraryItem } from "@/lib/types";

interface DayTabsProps {
  /** Day별로 정렬된 일정. days[0] = Day 1 */
  days: ItineraryItem[][];
  /** 카드 클릭 시 이동할 URL 베이스 (e.g. /itinerary/<tripId>) */
  hrefBase: string;
}

/**
 * Day 탭 — 일정 전체 화면 메인 인터랙션.
 *
 * 룰 (T17):
 * - 활성 탭은 검정 텍스트 + 코랄 언더라인 (모드: pre-travel — 보라가 더 어울리지만,
 *   "선택 강조"는 액션 색이 적합. 모드 색이 아닌 인터랙션 색으로 코랄 사용 — DDR-002).
 * - 탭은 가로 스크롤 가능 (Day 7박 이상 대응)
 * - 빈 Day엔 "이 날은 비어있어요" 표시
 */
export function DayTabs({ days, hrefBase }: DayTabsProps) {
  const [active, setActive] = useState(0);
  const items = days[active] ?? [];

  return (
    <div>
      <div
        className="flex gap-1 overflow-x-auto pb-2 mb-3 -mx-4 px-4"
        role="tablist"
        aria-label="Day 선택"
      >
        {days.map((dayItems, idx) => {
          const isActive = idx === active;
          return (
            <button
              key={idx}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(idx)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-[12px] transition-colors border ${
                isActive
                  ? "bg-ink text-white border-ink"
                  : "bg-transparent text-ink-soft border-divider hover:border-ink-mute"
              }`}
            >
              Day {idx + 1}
              <span className="ml-1.5 text-[10px] opacity-70">
                {dayItems.length}
              </span>
            </button>
          );
        })}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-10 text-[13px] text-ink-mute">
          이 날은 비어있어요
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((it) => (
            <ItineraryCard key={it.id} item={it} hrefBase={hrefBase} />
          ))}
        </div>
      )}
    </div>
  );
}
