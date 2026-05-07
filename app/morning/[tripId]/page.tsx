import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MorningBriefing } from "@/components/morning/MorningBriefing";
import { resolveTripBundle } from "@/lib/repositories/trip.repository";
import { resolveCityByCode } from "@/lib/seed/cities";
import { getWeatherForecast } from "@/lib/seed/weather";
import { calculateTravelDay } from "@/lib/mode-transition";
import { getMorningPhrase } from "@/lib/seed/morning-phrases";

export const metadata: Metadata = {
  title: "오늘의 브리핑",
  description: "여행 중 매일 아침 첫 일정·날씨·베트남어 한 줄을 한 화면에",
};

export const dynamic = "force-dynamic";

/**
 * A1 모닝 브리핑 — `/morning/[tripId]`.
 *
 * D-Day(`/travel/[id]`) 컨텍스트에서 진입. 외부 API 미연동(weather/transport seed).
 * 매일 아침 PWA 푸시 알림은 R1 게이트 후 별도 사이클(자율 무관).
 */
export default async function MorningPage({
  params,
}: {
  params: { tripId: string };
}) {
  const bundle = await resolveTripBundle(params.tripId);
  if (!bundle) notFound();
  const { trip, items } = bundle;

  const city = resolveCityByCode(trip.destinationCode);
  const travelDay = calculateTravelDay(trip.startDate);
  const forecast = getWeatherForecast(trip.destinationCode, trip.nights);
  const todayWeather =
    forecast[Math.min(travelDay - 1, forecast.length - 1)] ?? forecast[0];
  const phrase = getMorningPhrase(travelDay);

  const todayItems = items
    .filter((it) => it.dayIndex === travelDay - 1)
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  const firstItem = todayItems[0] ?? null;

  return (
    <MorningBriefing
      trip={trip}
      city={city}
      travelDay={travelDay}
      todayWeather={todayWeather}
      firstItem={firstItem}
      todayCount={todayItems.length}
      phrase={phrase}
    />
  );
}
