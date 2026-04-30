/**
 * Cost 페이지 — 사이클 9 M6 (ADR-022).
 */

import { notFound } from "next/navigation";
import { CostView } from "@/components/cost/CostView";
import { fetchTripFromDb } from "@/lib/repositories/trip.repository";
import { listCostByTrip } from "@/lib/repositories/cost.repository";
import { getDemoTrip, DEMO_TRIP_ID } from "@/lib/seed";
import { getCityByCode } from "@/lib/seed/cities";

export default async function CostPage({
  params,
}: {
  params: { tripId: string };
}) {
  const dbBundle = await fetchTripFromDb(params.tripId);
  const trip = dbBundle?.trip ?? getDemoTrip(params.tripId)?.trip;
  if (!trip) notFound();

  const entries =
    params.tripId === DEMO_TRIP_ID
      ? []
      : (await listCostByTrip(params.tripId)) ?? [];

  const city = getCityByCode(trip.destinationCode);

  return (
    <CostView
      trip={trip}
      initialEntries={entries}
      currency={city?.payment.currency ?? "USD"}
      currencySymbol={city?.payment.currencySymbol ?? "$"}
      approxKrwRate={city?.payment.approxKrwRate ?? 1}
    />
  );
}
