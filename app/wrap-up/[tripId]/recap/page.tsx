/**
 * 여행 추억 리캡 페이지 — /wrap-up/[tripId]/recap
 *
 * 여행 종료 후 하이라이트·통계·포토를 한눈에 리캡.
 * Stitch 디자인: screenId 174c16914e9c (여행 추억 리캡).
 * DB 미구현 단계: 시드 기반 데모.
 */

import { notFound } from "next/navigation";
import { PostTripRecapView } from "@/components/recap/PostTripRecapView";
import { resolveTrip } from "@/lib/services/resolved-trip";
import {
  DEMO_RECAP_STATS,
  DEMO_RECAP_HIGHLIGHTS,
  DEMO_RECAP_MOMENTS,
} from "@/lib/seed/recap-data";

export const metadata = {
  title: "여행 추억 리캡 — TravelDiary",
  description: "여행의 하이라이트, 통계, 추억 사진을 한눈에 돌아보세요.",
};

export default function RecapPage({
  params,
}: {
  params: { tripId: string };
}) {
  const resolved = resolveTrip(params.tripId);
  if (!resolved) notFound();

  const { trip, city } = resolved;
  const totalDays = trip.nights + 1;
  const tripTitle = `🇻🇳 ${city.name}의 기억`;
  const dateRange = `${trip.nights}박 ${totalDays}일`;

  return (
    <PostTripRecapView
      tripId={params.tripId}
      tripTitle={tripTitle}
      dateRange={dateRange}
      stats={DEMO_RECAP_STATS}
      highlights={DEMO_RECAP_HIGHLIGHTS}
      moments={DEMO_RECAP_MOMENTS}
    />
  );
}
