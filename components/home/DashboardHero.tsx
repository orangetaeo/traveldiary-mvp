/**
 * Mode B Hero — 로그인 + 본인 trip ≥1 사용자용.
 *
 * 가장 가까운 본인 trip 1건의 D-Day 대시보드.
 * 다중 trip 시 sticky 칩 selector로 다른 trip 미리보기 진입.
 *
 * 여행 중 (currentMode === "in-travel") 상태면 /travel/[id] 풀 화면으로 유도.
 * 그 외(여행 전·후)는 본 카드에서 D-Day 카운트다운 + 일정 진입 CTA.
 */

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { dDay } from "@/lib/utils/item-display";
import { todayISO } from "@/lib/seed/demo-date";

export interface OwnedTripSummary {
  id: string;
  destination: string;
  destinationCode: string | null;
  nights: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  itemCount: number;
  currentMode: string | null;
}

interface DashboardHeroProps {
  trip: OwnedTripSummary;
  totalTrips: number;
  userName?: string | null;
}

export function DashboardHero({
  trip,
  totalTrips,
  userName,
}: DashboardHeroProps) {
  const today = todayISO();
  const dDayNum = dDay(trip.startDate, today);
  const isInTravel = trip.currentMode === "in-travel";

  const dDayLabel =
    dDayNum > 0
      ? `D-${dDayNum}`
      : dDayNum === 0
      ? "출발 당일"
      : `D+${-dDayNum}`;

  const statusTone: "info" | "amber" | "success" =
    dDayNum > 0 ? "info" : isInTravel || dDayNum === 0 ? "amber" : "success";
  const statusLabel =
    dDayNum > 0
      ? "여행 준비"
      : isInTravel || dDayNum === 0
      ? "여행 중"
      : "여행 종료";

  // 모드별 메인 진입점 — 여행 중이면 풀 화면, 그 외엔 일정 화면
  const primaryHref = isInTravel
    ? `/travel/${trip.id}`
    : `/itinerary/${trip.id}`;
  const primaryLabel = isInTravel ? "여행 중 홈 열기" : "일정 자세히 보기";

  return (
    <section
      className="rounded-lg mx-td-md mt-td-md mb-td-md bg-gradient-to-br from-purple-deep via-purple to-accent text-white shadow-md"
      aria-label="내 여행 대시보드"
    >
      <div className="px-td-md py-td-lg">
        <div className="flex items-center justify-between mb-td-xs">
          <p className="text-td-caption text-white/80 uppercase tracking-wide">
            {userName ? `${userName}님의 여행` : "내 여행"}
            {totalTrips > 1 ? ` · ${totalTrips}개` : ""}
          </p>
          <Badge tone={statusTone}>{statusLabel}</Badge>
        </div>

        <h2 className="text-td-title text-white leading-tight mb-td-xxs">
          {trip.destination}
        </h2>
        <p className="text-td-body text-white/90 mb-td-md">
          {trip.nights}박 {trip.nights + 1}일 · {trip.itemCount}개 일정 ·{" "}
          <span className="font-bold tabular-nums">{dDayLabel}</span>
        </p>

        <div className="flex gap-td-xs">
          <Link
            href={primaryHref}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-td-md py-td-sm rounded-md bg-white text-purple-deep text-td-meta font-bold hover:bg-white/90 transition-colors"
          >
            <span className="material-symbols-outlined text-td-icon-md" aria-hidden>
              {isInTravel ? "directions_walk" : "calendar_today"}
            </span>
            {primaryLabel}
          </Link>
          <Link
            href={`/trips/${trip.id}`}
            className="inline-flex items-center justify-center gap-1.5 px-td-md py-td-sm rounded-md bg-white/10 backdrop-blur-sm text-white border border-white/30 text-td-meta font-semibold hover:bg-white/20 transition-colors"
            aria-label="대시보드"
          >
            <span className="material-symbols-outlined text-td-icon-md" aria-hidden>
              dashboard
            </span>
            대시보드
          </Link>
        </div>
      </div>
    </section>
  );
}

interface OwnedTripsChipsProps {
  trips: OwnedTripSummary[];
  activeId: string;
}

export function OwnedTripsChips({ trips, activeId }: OwnedTripsChipsProps) {
  if (trips.length <= 1) return null;
  return (
    <nav
      className="flex gap-td-xs px-td-md mb-td-md overflow-x-auto touch-pan-x overscroll-x-contain pb-2"
      aria-label="다른 여행"
    >
      {trips.map((t) => {
        const isActive = t.id === activeId;
        const dDayNum = dDay(t.startDate, todayISO());
        const dLabel =
          dDayNum > 0 ? `D-${dDayNum}` : dDayNum === 0 ? "당일" : `D+${-dDayNum}`;
        return (
          <Link
            key={t.id}
            href={`/itinerary/${t.id}`}
            className={`shrink-0 px-td-sm py-td-xs rounded-full text-td-meta whitespace-nowrap transition-colors ${
              isActive
                ? "bg-purple text-white"
                : "bg-surface-card text-ink-soft border border-divider hover:bg-surface-soft"
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            {t.destination} · <span className="tabular-nums">{dLabel}</span>
          </Link>
        );
      })}
    </nav>
  );
}
