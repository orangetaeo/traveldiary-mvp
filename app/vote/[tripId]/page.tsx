/**
 * Vote 페이지 — C4 일행 투표 (사이클 E).
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "일행 투표",
  description: "여행 일정 투표 — 일행과 함께 장소 선택",
};
import { resolveTripBundle } from "@/lib/repositories/trip.repository";
import { listVotesByTrip } from "@/lib/repositories/vote.repository";
import { DEMO_TRIP_ID } from "@/lib/seed";
import { getCurrentUserId } from "@/lib/auth/session";
import { VoteListView } from "@/components/vote/VoteListView";
import { BottomNav } from "@/components/ui/BottomNav";

export default async function VotePage({
  params,
}: {
  params: { tripId: string };
}) {
  const bundle = await resolveTripBundle(params.tripId);
  if (!bundle) notFound();
  const { trip } = bundle;

  const votes =
    params.tripId === DEMO_TRIP_ID
      ? []
      : (await listVotesByTrip(params.tripId)) ?? [];

  const currentUserId = await getCurrentUserId();

  return (
    <>
      <VoteListView
        trip={trip}
        initialVotes={votes}
        currentUserId={currentUserId}
      />
      <BottomNav active="itinerary" itineraryTripId={trip.id} />
    </>
  );
}
