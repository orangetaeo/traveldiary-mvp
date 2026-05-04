/**
 * Cost 페이지 — 사이클 9 M6 (ADR-022).
 * 사이클 XX (ADR-044): 시드 trip 자동 부트스트래핑. 데모 분기 제거.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "비용 관리",
  description: "여행 경비 기록 및 정산 — 일별 지출 내역 관리",
};
import { CostView } from "@/components/cost/CostView";
import { fetchTripFromDb } from "@/lib/repositories/trip.repository";
import { listCostByTrip } from "@/lib/repositories/cost.repository";
import { getDemoTrip } from "@/lib/seed";
import { resolveCityByCode } from "@/lib/seed/cities";
import { BottomNav } from "@/components/ui/BottomNav";

export default async function CostPage({
  params,
  searchParams,
}: {
  params: { tripId: string };
  searchParams: { day?: string };
}) {
  const dbBundle = await fetchTripFromDb(params.tripId);
  const trip = dbBundle?.trip ?? getDemoTrip(params.tripId)?.trip;
  if (!trip) notFound();

  const entries = (await listCostByTrip(params.tripId)) ?? [];

  // 사이클 H (ADR-032): resolveCityByCode로 country 정규화 데이터 merge → fallback 불필요
  const city = resolveCityByCode(trip.destinationCode);

  return (
    <>
      <CostView
        trip={trip}
        initialEntries={entries}
        currency={city?.payment.currency ?? "USD"}
        currencySymbol={city?.payment.currencySymbol ?? "$"}
        approxKrwRate={city?.payment.approxKrwRate ?? 1}
        initialDay={parseDayParam(searchParams.day, trip.nights)}
      />
      <BottomNav active="itinerary" />
    </>
  );
}

/** C4 — ?day= 파라미터 → 0-based dayIndex. 범위 밖이면 undefined. */
function parseDayParam(raw: string | undefined, nights: number): number | undefined {
  if (raw == null) return undefined;
  const n = parseInt(raw, 10);
  if (Number.isNaN(n) || n < 0 || n > nights) return undefined;
  return n;
}
