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

import Link from "next/link";
import { listDemoTrips } from "@/lib/seed";
import { listCities, PRIMARY_COUNTRY_CODE } from "@/lib/seed/cities";
import { Badge } from "@/components/ui/Badge";
import { BottomNav } from "@/components/ui/BottomNav";
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
    <div className="min-h-screen bg-surface-soft text-ink pb-24">
      {/* TopAppBar */}
      <header className="bg-surface-card border-b border-divider sticky top-0 z-40 flex justify-between items-center w-full px-td-md h-16">
        <div className="flex items-center gap-td-sm">
          <Link
            href="/"
            aria-label="뒤로"
            className="p-2 rounded-full hover:bg-surface-soft transition-colors"
          >
            <span className="material-symbols-outlined text-ink">arrow_back</span>
          </Link>
          <h1 className="text-lg font-bold text-ink tracking-tight">여행 둘러보기</h1>
        </div>
        <span className="text-td-meta text-ink-mute tabular-nums">
          {cards.length}개
        </span>
      </header>

      <main className="max-w-xl mx-auto px-td-md">
        {/* Hero */}
        <section className="py-td-lg">
          <h2 className="text-td-title text-ink mb-td-xxs">
            어디로 떠날까요?
          </h2>
          <p className="text-td-body text-ink-soft">
            한국인 자유여행자 큐레이션 도시 {allCards.length}곳 ·{" "}
            데모 일정 {listDemoTrips().length}건
          </p>
          <Link
            href="/shared"
            className="mt-td-sm inline-flex items-center gap-td-xxs text-td-caption text-purple hover:text-purple-dark"
            aria-label="받은 여행 목록"
          >
            <span className="material-symbols-outlined text-[18px]">inbox</span>
            받은 여행 보기
            <span aria-hidden>→</span>
          </Link>
        </section>

        {/* Sticky chip filter */}
        <nav
          aria-label="도시 필터"
          className="sticky top-16 z-30 bg-surface-soft/90 backdrop-blur-sm py-td-xs flex gap-td-xs overflow-x-auto hide-scrollbar -mx-td-md px-td-md mb-td-md"
        >
          {FILTER_CHIPS.map((chip) => {
            const active = chip.key === filter;
            const href = chip.key === "all" ? "/trips" : `/trips?filter=${chip.key}`;
            return (
              <Link
                key={chip.key}
                href={href}
                className={`flex-none px-td-sm py-td-xxs rounded-full border text-td-caption font-medium tabular-nums transition-colors ${
                  active
                    ? "bg-purple text-white border-purple"
                    : "border-divider text-ink-soft hover:border-purple/40"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {chip.label} <span className="opacity-70">{counts[chip.key]}</span>
              </Link>
            );
          })}
        </nav>

        {/* Card list (1열) */}
        {cards.length === 0 ? (
          <p className="text-td-body text-ink-mute text-center py-td-xl">
            해당 필터에 도시가 없어요.
          </p>
        ) : (
          <ul className="space-y-td-sm">
            {cards.map((c) => (
              <li key={cardSurface(c).code}>{renderCard(c)}</li>
            ))}
          </ul>
        )}

        <p className="text-td-caption text-ink-mute text-center pt-td-md">
          사이클 I (ADR-033) — /trips 라우트.{" "}
          {PRIMARY_COUNTRY_CODE === "VN" && "베트남 우선 출시 정책 적용 중."}
        </p>
      </main>

      {/* Bottom Nav — 사이클 O 컴포넌트 추출 (사이클 I ADR-033) */}
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
  // 사이클 J (ADR-034) — ResolvedTrip 기반 (city 항상 보장됨)
  const { trip, city, itemCount, verifiedCount } = data.resolved;
  const days = trip.nights + 1;

  return (
    <article className="bg-surface-card border border-divider rounded-xl shadow-sm overflow-hidden hover:border-purple/40 transition-colors">
      <Link
        href={`/itinerary/${trip.id}`}
        aria-label={`${city.name} ${trip.nights}박 ${days}일 일정 보기`}
        className="block p-td-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple"
      >
        <div className="flex items-start justify-between gap-td-sm mb-td-xs">
          <div className="min-w-0">
            <p className="text-td-meta text-ink-mute uppercase tabular-nums">
              {trip.destinationCode} · {city.countryCode}
            </p>
            <h3 className="text-td-card-title text-ink mt-td-xxs truncate">
              {city.name}
            </h3>
          </div>
          {verifiedCount > 0 && (
            <Badge tone="success">AI 검증 {verifiedCount}곳</Badge>
          )}
        </div>
        <p className="text-td-meta text-ink-soft tabular-nums">
          {trip.nights}박 {days}일 · {itemCount} 일정
        </p>
      </Link>
      <div className="border-t border-divider px-td-md py-td-xs flex justify-end">
        <Link
          href={`/city/${city.slug}`}
          className="text-td-caption text-purple-deep hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple rounded"
        >
          도시 가이드 →
        </Link>
      </div>
    </article>
  );
}

function CityOnlyCard({ data }: { data: CityOnlyCardData }) {
  const { city } = data;
  return (
    <Link
      href={`/city/${city.slug}`}
      aria-label={`${city.name} 도시 가이드 보기`}
      className="block bg-surface-card border border-divider rounded-xl shadow-sm p-td-md hover:border-amber/60 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber"
    >
      <div className="flex items-start justify-between gap-td-sm mb-td-xs">
        <div className="min-w-0">
          <p className="text-td-meta text-ink-mute uppercase tabular-nums">
            {city.code} · {city.countryCode}
          </p>
          <h3 className="text-td-card-title text-ink mt-td-xxs truncate">
            {city.name}
          </h3>
        </div>
        <Badge tone="amber">도시 가이드만</Badge>
      </div>
      <p className="text-td-meta text-ink-soft">
        응급·결제·교통·상황별 문장 ·{" "}
        {city.curatedGuides.length > 0
          ? `시그니처 가이드 ${city.curatedGuides.length}건`
          : "큐레이션 가이드"}
      </p>
    </Link>
  );
}

function ComingSoonCard({ data }: { data: ComingSoonCardData }) {
  const { city } = data;
  return (
    <div
      aria-disabled="true"
      className="bg-surface-card border border-divider rounded-xl shadow-sm p-td-md opacity-60 cursor-not-allowed"
    >
      <div className="flex items-start justify-between gap-td-sm mb-td-xs">
        <div className="min-w-0">
          <p className="text-td-meta text-ink-mute uppercase tabular-nums">
            {city.code} · {city.countryCode}
          </p>
          <h3 className="text-td-card-title text-ink mt-td-xxs truncate">
            {city.name}
          </h3>
        </div>
        <span className="inline-block bg-surface-soft text-ink-mute border border-divider px-td-xs py-0.5 rounded-full text-td-caption font-bold">
          준비 중
        </span>
      </div>
      <p className="text-td-meta text-ink-mute">
        {city.country} · 다음 단계에서 정식 공개됩니다
      </p>
    </div>
  );
}

