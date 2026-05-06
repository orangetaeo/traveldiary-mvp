/**
 * 일일 동선 지도 페이지 — /itinerary/[id]/map?day=N
 *
 * Day N 일정의 동선을 지도에 표시.
 * Stitch 디자인: screenId 5360b40d (Day 2 동선 지도).
 * DB 미구현 단계: 시드 기반 루트 데모.
 */

import { DayRouteMapView } from "@/components/itinerary/DayRouteMapView";
import { DEMO_ROUTE_STOPS } from "@/lib/seed/route-stops";

export const metadata = {
  title: "동선 지도 — TravelDiary",
  description: "하루 일정의 동선을 지도에서 한눈에 확인하세요.",
};

export default async function MapPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { day?: string };
}) {
  const dayIndex = searchParams.day ? parseInt(searchParams.day, 10) : 0;

  return (
    <DayRouteMapView
      tripId={params.id}
      dayIndex={dayIndex}
      stops={DEMO_ROUTE_STOPS}
      walkingKm={1.2}
      drivingKm={8.5}
    />
  );
}
