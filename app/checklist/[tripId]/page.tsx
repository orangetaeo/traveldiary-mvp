/**
 * Checklist 페이지 — 사이클 9 M6 (ADR-022).
 *
 * 데이터: DB 우선 → 시드 fallback.
 *   - DB 연결 + 사용자 trip → DB ChecklistItem 행
 *   - 데모 trip 또는 DB 미연결 → 빈 배열로 시작 (사용자가 "기본 템플릿 추가" 클릭하면 시뮬)
 */

import { notFound } from "next/navigation";
import { ChecklistView } from "@/components/checklist/ChecklistView";
import { fetchTripFromDb } from "@/lib/repositories/trip.repository";
import { listChecklistByTrip } from "@/lib/repositories/checklist.repository";
import { getDemoTrip, DEMO_TRIP_ID } from "@/lib/seed";
import { getCityByCode } from "@/lib/seed/cities";

export default async function ChecklistPage({
  params,
}: {
  params: { tripId: string };
}) {
  const dbBundle = await fetchTripFromDb(params.tripId);
  const trip = dbBundle?.trip ?? getDemoTrip(params.tripId)?.trip;
  if (!trip) notFound();

  const items =
    params.tripId === DEMO_TRIP_ID
      ? [] // 데모 trip은 빈 배열에서 시작 (시뮬레이션 only)
      : (await listChecklistByTrip(params.tripId)) ?? [];

  const city = getCityByCode(trip.destinationCode);

  return (
    <ChecklistView trip={trip} initialItems={items} cityName={city?.name} />
  );
}
