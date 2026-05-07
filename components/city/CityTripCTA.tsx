/**
 * City → Trip 역방향 CTA (사이클 J, ADR-034).
 * 도시 가이드 페이지에서 해당 도시 trip으로 이동.
 */

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import type { ResolvedTrip } from "@/lib/services/resolved-trip";

export function CityTripCTA({
  trips,
  cityName,
}: {
  trips: ResolvedTrip[];
  cityName: string;
}) {
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
            <span className="material-symbols-outlined text-td-icon-md" aria-hidden>
              explore
            </span>
            다른 도시 일정 둘러보기 →
          </Link>
        </div>
      </section>
    );
  }

  const [first, ...rest] = trips;
  const days = first.trip.nights + 1;

  return (
    <section className="mb-td-lg">
      <article className="bg-surface-card border border-purple/30 rounded-md shadow-sm overflow-hidden">
        <Link
          href={`/itinerary/${first.trip.id}`}
          aria-label={`${cityName} ${first.trip.nights}박 ${days}일 일정 보기`}
          className="block p-td-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple"
        >
          <div className="flex items-start justify-between gap-td-sm mb-td-xs">
            <div className="min-w-0">
              <p className="text-td-meta text-purple-deep uppercase tabular-nums">
                추천 일정
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
            <span className="material-symbols-outlined text-td-icon-md" aria-hidden>
              arrow_forward
            </span>
          </span>
        </Link>
      </article>
      {rest.length > 0 && (
        <p className="mt-td-xs text-td-caption text-ink-mute text-right">
          이 도시 일정 {trips.length}건 ·{" "}
          <Link href="/trips" className="text-purple-deep hover:underline">
            전체 보기 →
          </Link>
        </p>
      )}
    </section>
  );
}
