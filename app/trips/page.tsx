/**
 * Trips 라우트 — 사이클 I (ADR-033).
 *
 * 다중 trip + city 가이드 탐색 허브. SSR, useState 0개.
 *
 * 카드 3종:
 *   - trip 있는 베트남 도시 (5): 본체 → /itinerary/[tripId], secondary → /city/[slug]
 *   - city only (HOI 1): 본체 → /city/[slug], amber "도시 가이드만" 뱃지
 *   - ComingSoon (BKK·TYO 2): Link 제거, opacity-60 + "준비 중" 뱃지
 *
 * 필터: ?filter=VN (베트남) / ?filter=coming-soon / 없으면 전체.
 */

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "내 여행 — TRAVELDIARY",
  description: "베트남 여행 일정을 탐색하고 관리하세요.",
};
import { listDemoTrips, isDemoTrip } from "@/lib/seed";
import { listCities, PRIMARY_COUNTRY_CODE } from "@/lib/seed/cities";
import { BottomNav } from "@/components/ui/BottomNav";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  buildCards,
  applyFilter,
  parseFilter,
  cardSurface,
  type CardData,
  type TripCardData,
  type CityOnlyCardData,
  type ComingSoonCardData,
  type FilterKey,
} from "@/lib/services/trips-listing";

interface FilterChip {
  key: FilterKey;
  label: string;
}

const FILTER_CHIPS: FilterChip[] = [
  { key: "all", label: "전체" },
  { key: "VN", label: "베트남" },
  { key: "coming-soon", label: "곧 출시" },
];

export default function TripsPage({
  searchParams,
}: {
  searchParams: { filter?: string };
}) {
  const filter = parseFilter(searchParams.filter);
  const allCards = buildCards(listDemoTrips(), listCities());
  const cards = applyFilter(allCards, filter);

  const counts = {
    all: allCards.length,
    VN: applyFilter(allCards, "VN").length,
    "coming-soon": applyFilter(allCards, "coming-soon").length,
  };

  return (
    <div className="min-h-screen bg-surface text-ink pb-24">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-surface-card/95 backdrop-blur-sm border-b border-divider flex items-center px-4 h-16">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              aria-label="뒤로"
              className="text-purple transition-colors"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
            <h1 className="font-semibold text-lg text-ink">여행 둘러보기</h1>
          </div>
          <span className="text-td-meta text-ink-mute tabular-nums">
            {cards.length}개
          </span>
        </div>
      </header>

      <main className="pt-16 max-w-md mx-auto w-full">
        {/* Hero */}
        <section className="px-6 py-6 bg-surface">
          <h2 className="text-td-title text-ink mb-1">
            어디로 떠날까요?
          </h2>
          <p className="text-td-body text-ink-soft mb-3">
            한국인 자유여행자 큐레이션 도시 {allCards.length}곳 ·{" "}
            데모 일정 {listDemoTrips().length}건
          </p>
          <Link
            href="/shared"
            className="inline-flex items-center gap-1 text-td-caption text-purple font-medium hover:underline"
            aria-label="받은 여행 목록"
          >
            📥 받은 여행 보기 →
          </Link>
        </section>

        {/* Sticky chip filter */}
        <nav
          aria-label="도시 필터"
          className="sticky top-16 z-40 bg-surface-card/80 backdrop-blur-md px-4 py-3 flex gap-2 overflow-x-auto hide-scrollbar"
        >
          {FILTER_CHIPS.map((chip) => {
            const isActive = chip.key === filter;
            const href = chip.key === "all" ? "/trips" : `/trips?filter=${chip.key}`;
            return (
              <Link
                key={chip.key}
                href={href}
                className={`flex-none px-4 py-2 rounded-full text-td-body font-medium tabular-nums transition-colors ${
                  isActive
                    ? "bg-purple text-white"
                    : "border border-divider text-ink-soft bg-surface"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                {chip.label} {counts[chip.key]}
              </Link>
            );
          })}
        </nav>

        {/* Card list */}
        <div className="px-4 py-4 flex flex-col gap-4">
          {cards.length === 0 ? (
            <EmptyState
              icon="filter_alt_off"
              title="조건에 맞는 도시가 없어요"
              description="필터를 바꿔 다른 도시를 둘러보세요."
              secondaryButton={{ label: "전체 보기", href: "/trips" }}
              className="py-8"
            />
          ) : (
            cards.map((c) => (
              <div key={cardSurface(c).code}>{renderCard(c)}</div>
            ))
          )}
        </div>

        {/* Footer */}
        <footer className="py-6 px-4 text-center">
          <p className="text-td-caption text-ink-mute opacity-60">
            {PRIMARY_COUNTRY_CODE === "VN" && "베트남 우선 출시 정책 적용 중"}
          </p>
        </footer>
      </main>

      <BottomNav active="trips" />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Card renderers
// ═══════════════════════════════════════════════════════════════════

function renderCard(c: CardData) {
  if (c.kind === "trip") return <TripCard data={c} />;
  if (c.kind === "city-only") return <CityOnlyCard data={c} />;
  return <ComingSoonCard data={c} />;
}

function TripCard({ data }: { data: TripCardData }) {
  const { trip, city, itemCount, verifiedCount } = data.resolved;
  const days = trip.nights + 1;

  return (
    <article className="bg-surface-card rounded-md border border-divider overflow-hidden shadow-[0_4px_12px_rgba(15,23,42,0.05)] transition-all active:scale-[0.98]">
      <Link
        href={`/trips/${trip.id}`}
        aria-label={`${city.name} ${trip.nights}박 ${days}일 여행 대시보드`}
        className="block p-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple"
      >
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <span className="text-td-meta text-ink-mute uppercase tabular-nums">
              {trip.destinationCode} · {city.countryCode}
            </span>
            {isDemoTrip(trip.id) && (
              <span className="px-2 py-0.5 rounded-lg bg-amber-soft text-amber-deep text-td-caption font-medium">
                체험
              </span>
            )}
          </div>
          {verifiedCount > 0 && (
            <span className="px-2 py-0.5 rounded-lg bg-success-soft text-success-deep border border-success/40 text-td-caption font-medium flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
              AI 검증 {verifiedCount}곳
            </span>
          )}
        </div>
        <h3 className="text-td-card-title text-ink mb-1 truncate">
          {city.name}
        </h3>
        <p className="text-td-meta text-ink-mute tabular-nums mb-3">
          {trip.nights}박 {days}일 · {itemCount} 일정
        </p>
        <hr className="border-divider mb-3" />
        <div className="flex justify-between items-center">
          <span className="text-td-body text-purple font-medium">
            대시보드 보기 →
          </span>
        </div>
      </Link>
    </article>
  );
}

function CityOnlyCard({ data }: { data: CityOnlyCardData }) {
  const { city } = data;
  return (
    <article className="bg-surface-card rounded-md border border-divider overflow-hidden shadow-[0_4px_12px_rgba(15,23,42,0.05)] transition-all active:scale-[0.98]">
      <Link
        href={`/city/${city.slug}`}
        aria-label={`${city.name} 도시 가이드 보기`}
        className="block p-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple"
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-td-meta text-ink-mute uppercase tabular-nums">
            {city.code} · {city.countryCode}
          </span>
          <span className="px-2 py-0.5 rounded-lg bg-amber-soft text-amber-deep text-td-caption font-medium">
            도시 가이드만
          </span>
        </div>
        <h3 className="text-td-card-title text-ink mb-1 truncate">
          {city.name}
        </h3>
        <p className="text-td-meta text-ink-mute mb-3">
          응급·결제·교통·상황별 문장 ·{" "}
          {city.curatedGuides.length > 0
            ? `시그니처 가이드 ${city.curatedGuides.length}건`
            : "큐레이션 가이드"}
        </p>
        <span className="text-td-body text-purple font-medium">
          상세 정보 보기 →
        </span>
      </Link>
    </article>
  );
}

function ComingSoonCard({ data }: { data: ComingSoonCardData }) {
  const { city } = data;
  return (
    <div
      className="opacity-60 bg-surface-card rounded-md border border-divider overflow-hidden p-4"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-td-meta text-ink-mute uppercase tabular-nums">
          {city.code} · {city.countryCode}
        </span>
        <span className="px-2 py-0.5 rounded-lg bg-surface-soft text-ink-mute text-td-caption font-medium">
          준비 중
        </span>
      </div>
      <h3 className="text-td-card-title text-ink mb-1 truncate">
        {city.name}
      </h3>
      <p className="text-td-meta text-ink-mute">
        {city.country} · 다음 단계에서 정식 공개됩니다
      </p>
    </div>
  );
}

