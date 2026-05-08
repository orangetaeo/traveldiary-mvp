/**
 * 내 여행 섹션 — /trips 페이지 상단 (cap 7, 2026-05-08).
 *
 * 갭: /trips는 데모 카드 + 받은 trip만 표시, 사용자 본인 trip 부재.
 * 답습: cap 6 sortTripsByPriority + cap 4 "+ 새 여행" trailing CTA.
 *
 * Server Component — Prisma 조회는 부모(page.tsx)에서 수행, 정렬된 카드만 props.
 */

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { dDay } from "@/lib/utils/item-display";
import { todayISO } from "@/lib/seed/demo-date";

export interface OwnedTripCardData {
  id: string;
  destination: string;
  destinationCode: string | null;
  nights: number;
  startDate: string;
  itemCount: number;
  currentMode: string | null;
}

interface OwnedTripsSectionProps {
  trips: OwnedTripCardData[];
}

export function OwnedTripsSection({ trips }: OwnedTripsSectionProps) {
  if (trips.length === 0) return null;
  const today = todayISO();

  return (
    <section className="px-4 pt-2 pb-4" aria-label="내 여행">
      <div className="flex items-baseline justify-between mb-td-sm">
        <h2 className="text-td-card-title text-ink">
          내 여행 <span className="text-ink-mute tabular-nums">{trips.length}개</span>
        </h2>
        <Link
          href="/onboarding"
          className="inline-flex items-center gap-1 text-td-caption text-purple-deep hover:underline"
          aria-label="새 여행 만들기 — 온보딩"
        >
          <span
            className="material-symbols-outlined text-td-icon-sm"
            aria-hidden
          >
            add
          </span>
          새 여행
        </Link>
      </div>

      <div className="flex flex-col gap-td-sm">
        {trips.map((trip) => (
          <OwnedTripCard key={trip.id} trip={trip} today={today} />
        ))}
      </div>
    </section>
  );
}

function OwnedTripCard({
  trip,
  today,
}: {
  trip: OwnedTripCardData;
  today: string;
}) {
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

  // 여행 중이면 풀 화면, 그 외엔 일정 화면 (DashboardHero 패턴 답습)
  const primaryHref = isInTravel
    ? `/travel/${trip.id}`
    : `/itinerary/${trip.id}`;

  return (
    <article className="bg-surface-card rounded-md border border-divider overflow-hidden shadow-[0_4px_12px_rgba(15,23,42,0.05)] transition-all active:scale-[0.98]">
      <Link
        href={primaryHref}
        aria-label={`${trip.destination} ${trip.nights}박 ${
          trip.nights + 1
        }일 — ${dDayLabel}`}
        className="block p-td-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple"
      >
        <div className="flex justify-between items-start mb-td-xs gap-2">
          <div className="flex items-center gap-2">
            <span className="text-td-meta text-ink-mute uppercase tabular-nums">
              {trip.destinationCode ?? "—"}
            </span>
            <Badge tone={statusTone}>{statusLabel}</Badge>
          </div>
          <span className="text-td-meta font-bold tabular-nums text-purple-deep">
            {dDayLabel}
          </span>
        </div>
        <h3 className="text-td-card-title text-ink mb-td-xxs">
          {trip.destination}
        </h3>
        <p className="text-td-caption text-ink-soft">
          {trip.nights}박 {trip.nights + 1}일 · {trip.itemCount}개 일정
        </p>
      </Link>
    </article>
  );
}
