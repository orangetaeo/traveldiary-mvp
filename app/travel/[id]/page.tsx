import { notFound } from "next/navigation";
import { TravelHome } from "@/components/travel/TravelHome";
import { getDemoTrip } from "@/lib/seed";
import { resolveCityByCode } from "@/lib/seed/cities";
import { fetchTripFromDb } from "@/lib/repositories/trip.repository";

/**
 * 여행 중 홈 (M2 매직 모먼트 LEVEL 1) — `/travel/[id]`
 *
 * 데이터: DB 우선(ADR-013), 시드 fallback(ADR-009).
 * 모드 전환 정책: ADR-014 — 데모 토글 진입.
 * 사이클 8 M5: trip.destinationCode로 City 시드 조회 → CityContextStrip.
 * 사이클 H (ADR-032): resolveCityByCode로 country 정규화 데이터 merge.
 */
export default async function TravelPage({ params }: { params: { id: string } }) {
  const bundle = (await fetchTripFromDb(params.id)) ?? getDemoTrip(params.id);
  if (!bundle) notFound();

  const city = resolveCityByCode(bundle.trip.destinationCode);

  return <TravelHome trip={bundle.trip} items={bundle.items} city={city} />;
}
