import { notFound } from "next/navigation";
import { TravelHome } from "@/components/travel/TravelHome";
import { getDemoTrip } from "@/lib/seed";

/**
 * 여행 중 홈 (M2 매직 모먼트 LEVEL 1) — `/travel/[id]`
 *
 * 데이터: 서버에서 시드 import → TravelHome client wrapper.
 * 모드 전환 정책: ADR-014 — 데모 토글 진입.
 */
export default function TravelPage({ params }: { params: { id: string } }) {
  const bundle = getDemoTrip(params.id);
  if (!bundle) notFound();

  return <TravelHome trip={bundle.trip} items={bundle.items} />;
}
