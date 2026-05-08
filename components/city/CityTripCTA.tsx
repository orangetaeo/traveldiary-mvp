/**
 * City → Trip 역방향 CTA (사이클 J, ADR-034).
 * 도시 가이드 페이지에서 해당 도시 trip으로 이동.
 *
 * 2026-05-08: ownedTrips prop 추가 — 사용자 본인 trip(같은 도시 destinationCode)
 * 우선 노출. 본인 trip 있으면 강조 카드(purple-soft) + 데모 추천은 secondary.
 */

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import type { ResolvedTrip } from "@/lib/services/resolved-trip";

export interface OwnedCityTrip {
  id: string;
  nights: number;
  startDate: string; // YYYY-MM-DD
  itemCount: number;
  currentMode: string | null;
  /** D-Day 라벨 — 호출 측에서 dDay() 계산해 주입. 컴포넌트는 표시만. */
  dDayLabel: string;
}

export function CityTripCTA({
  trips,
  cityName,
  ownedTrips = [],
}: {
  trips: ResolvedTrip[];
  cityName: string;
  ownedTrips?: OwnedCityTrip[];
}) {
  // 본인 trip 우선 노출 — 데모 추천 위
  if (ownedTrips.length > 0) {
    const [primary, ...rest] = ownedTrips;
    const days = primary.nights + 1;
    const isInTravel = primary.currentMode === "in-travel";
    const primaryHref = isInTravel
      ? `/travel/${primary.id}`
      : `/itinerary/${primary.id}`;

    return (
      <section className="mb-td-lg">
        <article className="bg-purple-soft border border-purple/40 rounded-md shadow-sm overflow-hidden">
          <Link
            href={primaryHref}
            aria-label={`내 ${cityName} ${primary.nights}박 ${days}일 여행 — ${primary.dDayLabel}`}
            className="block p-td-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple"
          >
            <div className="flex items-start justify-between gap-td-sm mb-td-xs">
              <div className="min-w-0">
                <p className="text-td-meta text-purple-deep uppercase tabular-nums font-bold">
                  내 여행
                </p>
                <h3 className="text-td-card-title text-ink mt-td-xxs truncate">
                  {cityName} {primary.nights}박 {days}일
                </h3>
              </div>
              <Badge tone="info">{primary.dDayLabel}</Badge>
            </div>
            <p className="text-td-meta text-ink-soft tabular-nums mb-td-sm">
              {primary.itemCount}개 일정
              {isInTravel && " · 진행 중"}
            </p>
            <span className="inline-flex items-center gap-1 text-td-meta text-purple-deep font-bold">
              {isInTravel ? "여행 중 홈 열기" : "내 일정 자세히 보기"}
              <span
                className="material-symbols-outlined text-td-icon-md"
                aria-hidden
              >
                arrow_forward
              </span>
            </span>
          </Link>
        </article>
        {rest.length > 0 && (
          <p className="mt-td-xs text-td-caption text-ink-mute text-right">
            이 도시 내 여행 {ownedTrips.length}건 ·{" "}
            <Link href="/trips" className="text-purple-deep hover:underline">
              전체 보기 →
            </Link>
          </p>
        )}
        {/* 데모 추천도 같이 노출 — 영감용 (BC 보존) */}
        {trips.length > 0 && (
          <DemoRecommendationCard
            trips={trips}
            cityName={cityName}
            compact
          />
        )}
      </section>
    );
  }

  if (trips.length === 0) {
    return (
      <section className="mb-td-lg">
        <div className="bg-amber-soft border border-amber/40 rounded-md p-td-md">
          <p className="text-td-card-title text-amber-deep mb-td-xxs">
            {cityName} 일정은 준비 중이에요
          </p>
          <p className="text-td-meta text-ink-soft mb-td-sm">
            우선 다른 도시의 큐레이션 일정을 둘러보실 수 있어요.
          </p>
          <Link
            href="/trips"
            className="inline-flex items-center gap-1 text-td-meta text-purple-deep font-medium hover:underline"
          >
            <span
              className="material-symbols-outlined text-td-icon-md"
              aria-hidden
            >
              explore
            </span>
            다른 도시 일정 둘러보기 →
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-td-lg">
      <DemoRecommendationCard trips={trips} cityName={cityName} />
    </section>
  );
}

function DemoRecommendationCard({
  trips,
  cityName,
  compact = false,
}: {
  trips: ResolvedTrip[];
  cityName: string;
  compact?: boolean;
}) {
  const [first, ...rest] = trips;
  const days = first.trip.nights + 1;

  return (
    <>
      <article
        className={`bg-surface-card border border-divider rounded-md shadow-sm overflow-hidden ${
          compact ? "mt-td-md" : ""
        }`}
      >
        <Link
          href={`/itinerary/${first.trip.id}`}
          aria-label={`${cityName} ${first.trip.nights}박 ${days}일 일정 보기`}
          className="block p-td-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple"
        >
          <div className="flex items-start justify-between gap-td-sm mb-td-xs">
            <div className="min-w-0">
              <p className="text-td-meta text-ink-soft uppercase tabular-nums">
                {compact ? "데모 추천" : "추천 일정"}
              </p>
              <h3 className="text-td-card-title text-ink mt-td-xxs truncate">
                {cityName} {first.trip.nights}박 {days}일
              </h3>
            </div>
            {first.verifiedCount > 0 && (
              <Badge tone="success">AI 검증 {first.verifiedCount}곳</Badge>
            )}
          </div>
          <p className="text-td-meta text-ink-soft tabular-nums mb-td-sm">
            {first.itemCount} 일정 · 한국인 큐레이션
          </p>
          <span className="inline-flex items-center gap-1 text-td-meta text-purple-deep font-medium">
            일정 보기
            <span
              className="material-symbols-outlined text-td-icon-md"
              aria-hidden
            >
              arrow_forward
            </span>
          </span>
        </Link>
      </article>
      {!compact && rest.length > 0 && (
        <p className="mt-td-xs text-td-caption text-ink-mute text-right">
          이 도시 일정 {trips.length}건 ·{" "}
          <Link href="/trips" className="text-purple-deep hover:underline">
            전체 보기 →
          </Link>
        </p>
      )}
    </>
  );
}
