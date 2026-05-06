/**
 * 장소 탐색 페이지 — /itinerary/[id]/discover?day=N
 *
 * 일정에 새 장소를 추가할 때 카테고리별 탐색.
 * Stitch 디자인: screenId 44257c05 (장소 탐색 — 푸꾸옥 Day 2).
 * DB 우선 → 시드 fallback.
 */

import { PlaceDiscoveryView } from "@/components/itinerary/PlaceDiscoveryView";
import { DEMO_DISCOVER_PLACES } from "@/lib/seed/discover-places";
import { resolveTripBundle } from "@/lib/repositories/trip.repository";
import { getDiscoverPlaces } from "@/lib/repositories/place.repository";

export const metadata = {
  title: "장소 탐색 — TravelDiary",
  description: "AI가 검증한 장소를 카테고리별로 탐색하고 일정에 추가하세요.",
};

export default async function DiscoverPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { day?: string };
}) {
  const bundle = await resolveTripBundle(params.id);
  const dayIndex = searchParams.day ? parseInt(searchParams.day, 10) : 0;
  const destination = bundle?.trip.destination ?? "베트남";
  const destinationCode = bundle?.trip.destinationCode;

  // DB 우선, 실패 시 시드 fallback
  const dbPlaces = await getDiscoverPlaces(destinationCode);
  const places =
    dbPlaces.length > 0
      ? dbPlaces
      : DEMO_DISCOVER_PLACES.filter(
          (p) => !p.destination || p.destination === destination,
        );

  return (
    <PlaceDiscoveryView
      tripId={params.id}
      dayIndex={dayIndex}
      destination={destination}
      places={places}
      verifiedCount={places.length}
    />
  );
}
