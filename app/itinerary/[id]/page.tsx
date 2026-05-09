/**
 * Itinerary 페이지 — Stitch #3 (Pre-trip) + #4 (On-trip) 매핑
 *
 * Stitch screens:
 *   #3 efa93174768e4fe588bff68d57fab330 (Itinerary Home)
 *   #4 5beff0fc64fb455aa3a0a2b2d735f3d1 (Itinerary - On-trip)
 *
 * 모드 분기:
 *   currentMode === "pre-travel"  → 보라 강조 (#3)
 *   currentMode === "in-travel"   → 코랄 강조 + LIVE 뱃지 (#4)
 *
 * 사이클 5b 옵션 C (2026-04-30): Stitch HTML 변환.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ItineraryView } from "@/components/itinerary/ItineraryView";
import { isDemoTrip } from "@/lib/seed";
import { getCityByCode, resolveCityByCode } from "@/lib/seed/cities";
import { resolveTripBundle } from "@/lib/repositories/trip.repository";
import { getDiscoverPlaces } from "@/lib/repositories/place.repository";
import { DEMO_DISCOVER_PLACES } from "@/lib/seed/discover-places";
import { CityContextStrip } from "@/components/city/CityContextStrip";
import { EmergencyHeaderButton } from "@/components/city/EmergencyHeader";
import { BottomNav } from "@/components/ui/BottomNav";
import { todayISO } from "@/lib/seed/demo-date";
import { dDay, parseDayParam } from "@/lib/utils/item-display";

const TODAY_ISO = todayISO(); // C1: 고정 날짜 제거 → 실제 오늘 날짜

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const bundle = await resolveTripBundle(params.id);
  if (!bundle) return { title: "일정" };
  const { trip } = bundle;
  const title = `${trip.destination} ${trip.nights}박 ${trip.nights + 1}일 일정`;
  const description = `${trip.destination} 자유여행 일정. AI가 검증한 맛집·명소·쇼핑 코스.`;
  return { title, description, openGraph: { title, description, type: "website" } };
}

export default async function ItineraryPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { day?: string; debug?: string };
}) {
  try {
    return await renderItinerary(params, searchParams);
  } catch (err) {
    // Railway stdout 로그용 — Server stderr에 stack 노출
    console.error("[ItineraryPage] render throw", err);
    if (searchParams.debug === "1") {
      const message = err instanceof Error ? err.message : String(err);
      const stack = err instanceof Error ? (err.stack ?? "(no stack)") : "(non-Error throw)";
      const cause = err instanceof Error && err.cause ? String(err.cause) : "";
      return (
        <div className="min-h-screen bg-surface-soft p-4 text-ink">
          <h1 className="text-td-title font-bold mb-2">[DEBUG] ItineraryPage throw</h1>
          <p className="text-sm text-ink-soft mb-2">
            URL에 <code>?debug=1</code> 추가 시에만 노출. 평상시엔 error.tsx 표시.
          </p>
          <pre className="bg-surface-card p-3 rounded-md border border-divider whitespace-pre-wrap text-xs overflow-auto">
            <strong>params:</strong> {JSON.stringify(params)}
            {"\n"}
            <strong>tripId:</strong> {params.id}
            {"\n\n"}
            <strong>message:</strong> {message}
            {cause ? `\n\ncause: ${cause}` : ""}
            {"\n\nstack:\n"}
            {stack}
          </pre>
        </div>
      );
    }
    throw err;
  }
}

async function renderItinerary(
  params: { id: string },
  searchParams: { day?: string; debug?: string },
) {
  const bundle = await resolveTripBundle(params.id);
  if (!bundle) notFound();

  const { trip, items } = bundle;
  const isOnTrip = trip.currentMode === "in-travel";
  const dDayNum = dDay(trip.startDate, TODAY_ISO);
  // 사이클 I (ADR-033) — trip → city 단방향 칩
  const city = getCityByCode(trip.destinationCode);
  // 사이클 P (ADR-035) — CityContextStrip + 헤더 응급 버튼 (currentMode 무관)
  const resolvedCity = resolveCityByCode(trip.destinationCode);

  // DB 우선 → 시드 fallback (추천 장소)
  const dbPlaces = await getDiscoverPlaces(trip.destinationCode);
  const suggestions =
    dbPlaces.length > 0
      ? dbPlaces
      : DEMO_DISCOVER_PLACES.filter(
          (p) => !p.destination || p.destination === trip.destination,
        );

  return (
    <div
      className="min-h-screen bg-surface-soft text-ink pb-24"
      data-travel-mode={trip.currentMode ?? "pre-travel"}
    >
      {/* TopAppBar */}
      <header className="bg-surface-card/90 backdrop-blur-md border-b border-divider sticky top-0 z-40 flex justify-between items-center w-full px-td-md h-16">
        <div className="flex items-center gap-td-sm">
          <Link
            href="/"
            aria-label="뒤로"
            className="p-2 rounded-full hover:bg-surface-soft transition-colors"
          >
            <span className="material-symbols-outlined text-ink">arrow_back</span>
          </Link>
          <h1 className="text-td-title font-bold text-ink tracking-tight">TravelDiary</h1>
        </div>
        <div className="flex items-center gap-td-xs">
          {/* 사이클 P (ADR-035) — 응급 빠른 액세스 */}
          {resolvedCity && (
            <EmergencyHeaderButton citySlug={resolvedCity.slug} emphasized={isOnTrip} />
          )}
          {isOnTrip && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-accent-soft text-accent-deep rounded-full text-td-caption font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-deep animate-pulse" aria-hidden />
              LIVE
            </span>
          )}
        </div>
      </header>

      <main className="max-w-xl mx-auto pt-td-lg">
        {/* Hero */}
        <section className="mb-td-md px-td-md">
          <div className="mb-td-xxs flex items-center gap-td-xs">
            <span
              className={`inline-block text-td-badge px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                isOnTrip
                  ? "bg-accent-soft text-accent-deep"
                  : "bg-purple-soft text-purple-deep"
              }`}
            >
              {isOnTrip ? "여행 중 · 실시간 동행" : "AI가 24곳 검증 완료"}
            </span>
            {isDemoTrip(trip.id) && (
              <span className="inline-block text-td-badge px-2 py-0.5 rounded-full font-bold tracking-wider bg-amber-soft text-amber-deep">
                체험 데모
              </span>
            )}
          </div>
          <h2 className="text-td-title text-ink mb-td-xxs">
            {trip.destination} {trip.nights}박 {trip.nights + 1}일
          </h2>
          <div className="flex flex-wrap items-center gap-td-xs mb-td-xs">
            {city && (
              <Link
                href={`/city/${city.slug}`}
                className="inline-flex items-center gap-1 px-td-xs py-0.5 rounded-full bg-purple-soft text-purple-deep text-td-caption font-medium hover:bg-purple/15 transition-colors"
                aria-label={`${city.name} 도시 가이드 보기`}
              >
                <span className="material-symbols-outlined text-td-icon-sm" aria-hidden>
                  travel_explore
                </span>
                도시 가이드 →
              </Link>
            )}
            {/* 옵션 L (디자인 갭 D, Session AA) — trip dashboard 역방향 진입 */}
            <Link
              href={`/trips/${trip.id}`}
              className="inline-flex items-center gap-1 px-td-xs py-0.5 rounded-full bg-amber-soft text-amber-deep text-td-caption font-medium hover:bg-amber/15 transition-colors"
              aria-label="여행 대시보드로 이동"
            >
              <span className="material-symbols-outlined text-td-icon-sm" aria-hidden>
                dashboard
              </span>
              대시보드 →
            </Link>
          </div>
          <p className="text-td-body text-ink-soft mb-td-md">
            {formatRange(trip.startDate, trip.nights)} ·{" "}
            {companionLabel(trip.companion)} · {paceLabel(trip.preferences.pace)}
            {!isOnTrip && (
              <>
                {" "}·{" "}
                <span className="font-semibold text-purple">
                  {dDayNum > 0
                    ? `D-${dDayNum}`
                    : dDayNum === 0
                    ? "출발 당일"
                    : `D+${-dDayNum}`}
                </span>
              </>
            )}
          </p>

          {/* Summary Strip */}
          <div className="grid grid-cols-3 gap-td-xs p-td-sm bg-surface-card rounded-md border border-divider">
            <Stat label="일정" value={`${items.length}곳`} />
            <Stat label="예약" value={`${items.filter((i) => i.flexibility === "booked").length}건`} divider />
            <Stat label="고정" value={`${items.filter((i) => i.flexibility === "fixed").length}건`} divider />
          </div>
        </section>

        {/* 사이클 P (ADR-035) — CityContextStrip currentMode 무관 노출 */}
        {resolvedCity && (
          <div className="mb-td-md">
            <CityContextStrip city={resolvedCity} />
          </div>
        )}

        <ItineraryView
          trip={trip}
          initialItems={items}
          initialDay={parseDayParam(searchParams.day, trip.nights) ?? 0}
          suggestions={suggestions}
        />
      </main>

      <BottomNav active="itinerary" itineraryTripId={trip.id} />
    </div>
  );
}

function Stat({
  label,
  value,
  divider,
}: {
  label: string;
  value: string;
  divider?: boolean;
}) {
  return (
    <div className={`text-center ${divider ? "border-l border-divider" : ""}`}>
      <p className="text-td-caption text-ink-soft">{label}</p>
      <p className="text-td-meta font-bold text-ink mt-0.5">{value}</p>
    </div>
  );
}


function formatRange(startDate: string, nights: number): string {
  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + nights);
  const fmt = (d: Date) => `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일`;
  return `${fmt(start)} – ${fmt(end)}`;
}

function companionLabel(c: string): string {
  return (
    ({
      solo: "혼자",
      friends: "친구·연인",
      family: "가족",
      group: "단체",
    } as Record<string, string>)[c] ?? c
  );
}

function paceLabel(p: string): string {
  return (
    ({
      relaxed: "여유로운 페이스",
      balanced: "균형 페이스",
      packed: "꽉 찬 페이스",
    } as Record<string, string>)[p] ?? p
  );
}

