import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TravelHome } from "@/components/travel/TravelHome";
import { resolveCityByCode } from "@/lib/seed/cities";
import { resolveTripBundle } from "@/lib/repositories/trip.repository";
import { calculateTravelDay } from "@/lib/mode-transition";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const bundle = await resolveTripBundle(params.id);
  if (!bundle) return { title: "여행 중" };
  return {
    title: `${bundle.trip.destination} 여행 중`,
    description: `${bundle.trip.destination} 자유여행 — 오늘의 일정, 동선, 실시간 가이드.`,
  };
}

/**
 * 여행 중 홈 (M2 매직 모먼트 LEVEL 1) — `/travel/[id]`
 *
 * 데이터: DB 우선(ADR-013), 시드 fallback(ADR-009).
 * 모드 전환 정책: ADR-014 — 데모 토글 진입.
 * 사이클 8 M5: trip.destinationCode로 City 시드 조회 → CityContextStrip.
 * 사이클 H (ADR-032): resolveCityByCode로 country 정규화 데이터 merge.
 */
export default async function TravelPage({ params }: { params: { id: string } }) {
  const bundle = await resolveTripBundle(params.id);
  if (!bundle) notFound();

  const city = resolveCityByCode(bundle.trip.destinationCode);
  // 갭 #3 (2026-05-08) — TravelHome travelDay = 1 하드코딩 → SSR 계산 prop 전달.
  // 데모 시드(startDate=todayISO)에서는 1 동일, 실제 사용자 trip은 정확 D-Day 반영.
  const travelDay = calculateTravelDay(bundle.trip.startDate);

  return (
    <TravelHome
      trip={bundle.trip}
      items={bundle.items}
      city={city}
      travelDay={travelDay}
    />
  );
}
