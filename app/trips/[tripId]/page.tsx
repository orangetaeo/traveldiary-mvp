/**
 * /trips/[tripId] — Trip Dashboard (Stitch #2 시안, 사이클 (Session F+1)).
 *
 * SSR. 단일 trip 단위 4 영역 요약 (itinerary / cost / checklist / vote) + 5일 날씨 mock.
 *
 * 데이터:
 *   - Trip metadata: lib/seed/index.ts (시드 fallback — DB 미구성 시연 모드)
 *   - 4 영역 aggregate: lib/services/trip-dashboard.ts (Promise.all 병렬)
 *   - 5일 날씨: lib/seed/weather.ts (mock — 라이브 wiring 후속 사이클)
 *
 * /trips listing 카드 → /itinerary/[id]는 그대로 유지(이번 PR scope X).
 * /trips/[tripId]는 직접 URL 진입.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BottomNav } from "@/components/ui/BottomNav";
import { TripHero } from "@/components/dashboard/TripHero";
import { BentoSummary } from "@/components/dashboard/BentoSummary";
import { WeatherStrip } from "@/components/dashboard/WeatherStrip";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { FocusScroller } from "@/components/dashboard/FocusScroller";
import { getDemoTrip } from "@/lib/seed";
import { getCityBySlug } from "@/lib/seed/cities";
import { getWeatherForecast } from "@/lib/seed/weather";
import {
  loadTripDashboardData,
  buildTripDashboardData,
} from "@/lib/services/trip-dashboard";
import { dDay } from "@/lib/utils/item-display";
import { formatStartDateLabel, todayKstISO } from "@/lib/utils/trip-display";
import { parseFocusKey, focusElementId } from "@/lib/utils/focus-key";

export async function generateMetadata({
  params,
}: {
  params: { tripId: string };
}): Promise<Metadata> {
  const found = getDemoTrip(params.tripId);
  if (!found) return { title: "여행 — TRAVELDIARY" };
  const { trip } = found;
  return {
    title: `${trip.destination} ${trip.nights}박 — TRAVELDIARY`,
    description: `${trip.destination} 여행 요약 — 일정·예산·준비물·투표 한눈에 보기`,
  };
}

const COUNTRY_FLAG: Record<string, string> = {
  VN: "🇻🇳",
  TH: "🇹🇭",
  JP: "🇯🇵",
  KR: "🇰🇷",
};

export default async function TripDashboardPage({
  params,
  searchParams,
}: {
  params: { tripId: string };
  searchParams?: { focus?: string };
}) {
  const found = getDemoTrip(params.tripId);
  if (!found) notFound();

  const { trip, items } = found;
  const focusKey = parseFocusKey(searchParams?.focus);

  // 시드 + DB aggregate (DB 미구성 시 모든 영역 0/시드 fallback)
  const data = await loadTripDashboardData(params.tripId, {
    seedItems: items,
  }).catch(() =>
    // DB 예외 시 시드만으로 합성 (graceful degradation)
    buildTripDashboardData({ seedItems: items }, null, null, null),
  );

  const forecast = getWeatherForecast(trip.destinationCode, trip.nights);
  const city = getCityBySlug(slugFromTrip(trip.destination));
  const flag = COUNTRY_FLAG[trip.destinationCode === "PQC" ? "VN" : ""] ??
    (city ? COUNTRY_FLAG[city.countryCode] : undefined);

  // city 시드의 첫 curatedGuide hero를 시각 fallback으로 차용 (없으면 default)
  const heroVisual = city?.curatedGuides[0]?.hero;

  return (
    <div className="min-h-screen bg-surface text-ink pb-24">
      {/* TopAppBar */}
      <header className="sticky top-0 z-40 bg-surface-card/90 backdrop-blur-md border-b border-divider flex items-center px-4 h-16">
        <div className="flex items-center justify-between w-full max-w-md mx-auto">
          <Link
            href="/trips"
            aria-label="여행 목록으로"
            className="text-purple p-2 -ml-2 rounded-full hover:bg-surface-soft transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="font-semibold text-lg text-ink">TravelDiary</h1>
          <span className="w-10" aria-hidden />
        </div>
      </header>

      <main className="max-w-md mx-auto w-full px-td-md">
        <TripHero
          destination={trip.destination}
          destinationFlag={flag}
          nights={trip.nights}
          startDateLabel={formatStartDateLabel(trip.startDate)}
          dDayValue={dDay(trip.startDate, todayKstISO())}
          partySize={data.party.size}
          hero={heroVisual}
        />

        <BentoSummary data={data} focusKey={focusKey} />

        <WeatherStrip forecast={forecast} />

        <QuickActions tripId={trip.id} />
      </main>

      {focusKey && <FocusScroller targetId={focusElementId(focusKey)} />}

      <BottomNav active="trips" />
    </div>
  );
}

/** Trip.destination(한글)은 City.slug와 다름 → 매핑이 없으면 undefined 처리.
 *  city seed lookup은 시각 fallback 용도일 뿐이므로 누락 시 default hero 사용. */
function slugFromTrip(destination: string): string {
  const m: Record<string, string> = {
    "푸꾸옥": "phu-quoc",
    "다낭": "da-nang",
    "호치민": "ho-chi-minh",
    "하노이": "hanoi",
    "나트랑": "nha-trang",
    "달랏": "da-lat",
  };
  return m[destination] ?? "";
}
