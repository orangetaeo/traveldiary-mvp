/**
 * Checklist 페이지 — 사이클 9 M6 (ADR-022).
 * 사이클 XX (ADR-044): 시드 trip 자동 부트스트래핑으로 영속화. 데모 분기 제거.
 *
 * 데이터: DB 우선 → 시드 fallback.
 *   - DB 미연결 → 빈 배열 (mutation은 demo:true)
 *   - DB 연결 → listChecklistByTrip (시드 trip은 첫 mutation 시 자동 upsert)
 */

import { notFound } from "next/navigation";
import { ChecklistView } from "@/components/checklist/ChecklistView";
import { fetchTripFromDb } from "@/lib/repositories/trip.repository";
import { listChecklistByTrip } from "@/lib/repositories/checklist.repository";
import { getDemoTrip } from "@/lib/seed";
import { getCityByCode } from "@/lib/seed/cities";
import { BottomNav } from "@/components/ui/BottomNav";

export default async function ChecklistPage({
  params,
  searchParams,
}: {
  params: { tripId: string };
  searchParams: { day?: string };
}) {
  const dbBundle = await fetchTripFromDb(params.tripId);
  const trip = dbBundle?.trip ?? getDemoTrip(params.tripId)?.trip;
  if (!trip) notFound();

  const items = (await listChecklistByTrip(params.tripId)) ?? [];

  const city = getCityByCode(trip.destinationCode);

  return (
    <>
      <ChecklistView
        trip={trip}
        initialItems={items}
        cityName={city?.name}
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
