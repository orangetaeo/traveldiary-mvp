"use client";

import { useEffect, useState } from "react";

interface TravelHeaderProps {
  travelDay: number;        // 1-base (Day 1, Day 2…)
  destination: string;
}

/**
 * 여행 중 헤더 — "DAY n · HH:MM"
 *
 * 1분마다 setState로 시계 갱신. 모달 라이브러리 미사용.
 * 강조색은 CSS 변수 `--color-mode-primary` (data-travel-mode 속성 기반).
 */
export function TravelHeader({ travelDay, destination }: TravelHeaderProps) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const time = now ? formatTime(now) : "--:--";

  return (
    <header className="px-5 pt-5 pb-3 border-b border-divider">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p className="text-[10px] font-medium text-mode-primary tracking-widest mb-0.5">
            여행 중 · {destination}
          </p>
          <h1 className="text-[22px] font-medium leading-tight">
            DAY <span className="text-mode-primary">{travelDay}</span>
            <span className="mx-1.5 text-ink-mute">·</span>
            <span className="tabular-nums">{time}</span>
          </h1>
        </div>
        <span
          className="w-2.5 h-2.5 rounded-full bg-mode-primary animate-pulse"
          aria-hidden="true"
        />
      </div>
    </header>
  );
}

function formatTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
