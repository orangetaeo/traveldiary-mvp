/**
 * 일일 동선 지도 페이지 — /itinerary/[id]/map?day=N
 *
 * Day N 일정의 동선을 지도에 표시.
 * Stitch 디자인: screenId 5360b40d (Day 2 동선 지도).
 * A1: DB/시드 실 데이터 → RouteStop 변환 + Haversine 거리 계산.
 */

import { DayRouteMapView } from "@/components/itinerary/DayRouteMapView";
import { resolveTripBundle } from "@/lib/repositories/trip.repository";
import { buildRouteStops } from "@/lib/utils/route-stops";
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
  const bundle = await resolveTripBundle(params.id);

  // 실 데이터가 있으면 RouteStop 변환, 없으면 데모 시드 fallback
  if (bundle && bundle.items.length > 0) {
    const dayItems = bundle.items.filter((it) => it.dayIndex === dayIndex);
    const { stops, walkingKm, drivingKm } = buildRouteStops(dayItems);

    if (stops.length > 0) {
      return (
        <DayRouteMapView
          tripId={params.id}
          dayIndex={dayIndex}
          stops={stops}
          walkingKm={walkingKm}
          drivingKm={drivingKm}
        />
      );
    }
  }

  // Fallback: 데모 시드
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
