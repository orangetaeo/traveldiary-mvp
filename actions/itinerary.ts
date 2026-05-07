"use server";

/**
 * Itinerary Server Actions — 사이클 10 (A2 reorder + A5 add).
 *
 * 5b-2 mutation 표준 패턴 답습:
 *   - DB 미연결 또는 DEMO_TRIP_ID → demo:true (클라이언트 시뮬)
 *   - audit log 동시 기록 (action: itinerary.create / itinerary.reorder)
 *   - discriminated union return
 */

import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit-log";
import {
  addItineraryItem as repoAddItineraryItem,
  reorderItineraryItems as repoReorderItineraryItems,
  type AddItineraryItemInput,
} from "@/lib/repositories/trip.repository";
import { isDbConnected } from "@/lib/prisma";
import { DEMO_TRIP_ID } from "@/lib/seed";
import { getActorId } from "@/lib/auth/session";
import { canWriteTripOrViaShareLink } from "@/lib/auth/authorize";
import { resolveActorIdForTrip } from "@/lib/auth/actor-resolution";
import type { ItineraryItem } from "@/lib/types";

// ═══════════════════════════════════════════════════════════════════
// addItineraryItem (A5)
// ═══════════════════════════════════════════════════════════════════

export type AddItineraryItemResult =
  | { ok: true; demo: true }
  | { ok: true; demo: false; data: ItineraryItem }
  | { ok: false; code: "internal" | "forbidden" };

export async function addItineraryItem(
  input: AddItineraryItemInput & { shareKey?: string },
): Promise<AddItineraryItemResult> {
  if (!isDbConnected || input.tripId === DEMO_TRIP_ID) {
    return { ok: true, demo: true };
  }
  if (!(await canWriteTripOrViaShareLink(input.tripId, input.shareKey))) {
    return { ok: false, code: "forbidden" };
  }

  const sessionActorId = await getActorId();
  const actorId = resolveActorIdForTrip(input.tripId, sessionActorId);
  const created = await repoAddItineraryItem({ ...input, actorId });
  if (!created) return { ok: false, code: "internal" };

  await writeAuditLog({
    actorId: await getActorId(),
    action: "itinerary.create",
    resource: "ItineraryItem",
    resourceId: created.id,
    after: {
      tripId: created.tripId,
      dayIndex: created.dayIndex,
      scheduledAt: created.scheduledAt,
      name: created.name,
      category: created.category,
    },
    metadata: { source: "web", origin: "manual" },
  });

  revalidatePath(`/itinerary/${input.tripId}`);
  revalidatePath(`/travel/${input.tripId}`);

  return { ok: true, demo: false, data: created };
}

// ═══════════════════════════════════════════════════════════════════
// reorderItineraryItems (A2)
// ═══════════════════════════════════════════════════════════════════

export interface ReorderItineraryItemsInput {
  tripId: string;
  changes: Array<{ id: string; scheduledAt: string }>;
}

export type ReorderItineraryItemsResult =
  | { ok: true; demo: true }
  | { ok: true; demo: false; tripUpdatedAt: string; changedCount: number }
  | { ok: false; code: "internal" | "not_found" | "forbidden" };

export async function reorderItineraryItems(
  input: ReorderItineraryItemsInput & { shareKey?: string },
): Promise<ReorderItineraryItemsResult> {
  if (!isDbConnected || input.tripId === DEMO_TRIP_ID) {
    return { ok: true, demo: true };
  }
  if (!(await canWriteTripOrViaShareLink(input.tripId, input.shareKey))) {
    return { ok: false, code: "forbidden" };
  }

  if (input.changes.length === 0) {
    return { ok: false, code: "internal" };
  }

  const result = await repoReorderItineraryItems(input);
  if (result === null) return { ok: false, code: "internal" };

  await writeAuditLog({
    actorId: await getActorId(),
    action: "itinerary.reorder",
    resource: "Trip",
    resourceId: input.tripId,
    after: {
      changes: input.changes,
    },
    metadata: {
      source: "web",
      origin: "drag",
      changedCount: input.changes.length,
    },
  });

  revalidatePath(`/itinerary/${input.tripId}`);
  revalidatePath(`/travel/${input.tripId}`);

  return {
    ok: true,
    demo: false,
    tripUpdatedAt: result.tripUpdatedAt,
    changedCount: input.changes.length,
  };
}
