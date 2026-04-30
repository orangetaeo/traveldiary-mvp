"use server";

/**
 * Cost Server Actions — 사이클 9 M6 (ADR-022).
 * 5b-2 mutation 표준 패턴 답습.
 */

import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit-log";
import {
  createCostEntry,
  deleteCostEntry,
  updateCostEntry,
  type CreateCostInput,
  type UpdateCostInput,
} from "@/lib/repositories/cost.repository";
import { isDbConnected } from "@/lib/prisma";
import { DEMO_TRIP_ID } from "@/lib/seed";
import { getActorId } from "@/lib/auth/session";
import type { CostEntry } from "@/lib/types";

export type CostActionResult<T = unknown> =
  | { ok: true; demo: true }
  | { ok: true; demo: false; data: T }
  | { ok: false; code: "not_found" | "internal" };

// ═══════════════════════════════════════════════════════════════════
// addCost
// ═══════════════════════════════════════════════════════════════════

export async function addCost(
  input: CreateCostInput,
): Promise<CostActionResult<CostEntry>> {
  if (!isDbConnected || input.tripId === DEMO_TRIP_ID) {
    return { ok: true, demo: true };
  }

  const created = await createCostEntry(input);
  if (!created) return { ok: false, code: "internal" };

  await writeAuditLog({
    actorId: await getActorId(),
    action: "cost.add",
    resource: "CostEntry",
    resourceId: created.id,
    after: {
      tripId: created.tripId,
      label: created.label,
      amountKrw: created.amountKrw,
      status: created.status,
    },
    metadata: { source: "web" },
  });

  revalidatePath(`/cost/${input.tripId}`);
  return { ok: true, demo: false, data: created };
}

// ═══════════════════════════════════════════════════════════════════
// updateCost
// ═══════════════════════════════════════════════════════════════════

export async function updateCost(input: {
  data: UpdateCostInput;
  tripId: string;
}): Promise<CostActionResult<CostEntry>> {
  if (!isDbConnected || input.tripId === DEMO_TRIP_ID) {
    return { ok: true, demo: true };
  }

  const result = await updateCostEntry(input.data);
  if (result === null) return { ok: false, code: "internal" };
  if (result === "not_found") return { ok: false, code: "not_found" };

  await writeAuditLog({
    actorId: await getActorId(),
    action: "cost.update",
    resource: "CostEntry",
    resourceId: input.data.id,
    before: {
      label: result.before.label,
      amountKrw: result.before.amountKrw,
      status: result.before.status,
    },
    after: {
      label: result.after.label,
      amountKrw: result.after.amountKrw,
      status: result.after.status,
    },
    metadata: { source: "web" },
  });

  revalidatePath(`/cost/${input.tripId}`);
  return { ok: true, demo: false, data: result.after };
}

// ═══════════════════════════════════════════════════════════════════
// deleteCost
// ═══════════════════════════════════════════════════════════════════

export async function deleteCost(input: {
  id: string;
  tripId: string;
}): Promise<CostActionResult<{ id: string }>> {
  if (!isDbConnected || input.tripId === DEMO_TRIP_ID) {
    return { ok: true, demo: true };
  }

  const result = await deleteCostEntry(input.id);
  if (result === null) return { ok: false, code: "internal" };
  if (result === "not_found") return { ok: false, code: "not_found" };

  await writeAuditLog({
    actorId: await getActorId(),
    action: "cost.delete",
    resource: "CostEntry",
    resourceId: input.id,
    before: {
      tripId: result.before.tripId,
      label: result.before.label,
      amountKrw: result.before.amountKrw,
    },
    after: null,
    metadata: { source: "web" },
  });

  revalidatePath(`/cost/${input.tripId}`);
  return { ok: true, demo: false, data: { id: input.id } };
}
