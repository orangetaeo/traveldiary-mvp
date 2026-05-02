"use server";

/**
 * Checklist Server Actions — 사이클 9 M6 (ADR-022).
 *
 * 5b-2 mutation 표준 패턴 답습:
 *   - DB 미연결 또는 DEMO_TRIP_ID → demo:true (클라이언트 상태 시뮬)
 *   - audit log 동시 기록 (S-13)
 *   - discriminated union return
 */

import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit-log";
import {
  bulkCreateChecklistItems,
  createChecklistItem,
  deleteChecklistItem,
  toggleChecklistItem,
  type CreateChecklistInput,
} from "@/lib/repositories/checklist.repository";
import { isDbConnected } from "@/lib/prisma";
import { DEMO_TRIP_ID } from "@/lib/seed";
import { DEFAULT_CHECKLIST_TEMPLATE } from "@/lib/seed/checklist-template";
import { getActorId } from "@/lib/auth/session";
import { canWriteTrip } from "@/lib/auth/authorize";
import type { ChecklistItem } from "@/lib/types";

export type ChecklistActionResult<T = unknown> =
  | { ok: true; demo: true }
  | { ok: true; demo: false; data: T }
  | { ok: false; code: "not_found" | "internal" | "forbidden" };

// ═══════════════════════════════════════════════════════════════════
// addChecklistItem
// ═══════════════════════════════════════════════════════════════════

export async function addChecklistItem(
  input: CreateChecklistInput,
): Promise<ChecklistActionResult<ChecklistItem>> {
  if (!isDbConnected || input.tripId === DEMO_TRIP_ID) {
    return { ok: true, demo: true };
  }
  if (!(await canWriteTrip(input.tripId))) {
    return { ok: false, code: "forbidden" };
  }

  const created = await createChecklistItem(input);
  if (!created) return { ok: false, code: "internal" };

  await writeAuditLog({
    actorId: await getActorId(),
    action: "checklist.add",
    resource: "ChecklistItem",
    resourceId: created.id,
    after: {
      tripId: created.tripId,
      category: created.category,
      text: created.text,
      dDayBucket: created.dDayBucket,
    },
    metadata: { source: "web" },
  });

  revalidatePath(`/checklist/${input.tripId}`);
  return { ok: true, demo: false, data: created };
}

// ═══════════════════════════════════════════════════════════════════
// addFromTemplate — 기본 템플릿 일괄 추가
// ═══════════════════════════════════════════════════════════════════

export async function addFromTemplate(input: {
  tripId: string;
}): Promise<ChecklistActionResult<ChecklistItem[]>> {
  if (!isDbConnected || input.tripId === DEMO_TRIP_ID) {
    return { ok: true, demo: true };
  }
  if (!(await canWriteTrip(input.tripId))) {
    return { ok: false, code: "forbidden" };
  }

  const created = await bulkCreateChecklistItems(
    input.tripId,
    DEFAULT_CHECKLIST_TEMPLATE.map((t, i) => ({
      category: t.category,
      text: t.text,
      dDayBucket: t.dDayBucket,
      cityNote: t.cityNote,
      sortOrder: i,
    })),
  );
  if (!created) return { ok: false, code: "internal" };

  // 일괄 audit log — fresh fetch만 기록 (5b-3 답습)
  for (const item of created) {
    await writeAuditLog({
      actorId: await getActorId(),
      action: "checklist.add",
      resource: "ChecklistItem",
      resourceId: item.id,
      after: {
        tripId: item.tripId,
        category: item.category,
        text: item.text,
        dDayBucket: item.dDayBucket,
      },
      metadata: { source: "web", origin: "template" },
    });
  }

  revalidatePath(`/checklist/${input.tripId}`);
  return { ok: true, demo: false, data: created };
}

// ═══════════════════════════════════════════════════════════════════
// toggleChecklist
// ═══════════════════════════════════════════════════════════════════

export async function toggleChecklist(input: {
  itemId: string;
  tripId: string;
}): Promise<ChecklistActionResult<ChecklistItem>> {
  if (!isDbConnected || input.tripId === DEMO_TRIP_ID) {
    return { ok: true, demo: true };
  }
  if (!(await canWriteTrip(input.tripId))) {
    return { ok: false, code: "forbidden" };
  }

  const result = await toggleChecklistItem(input.itemId);
  if (result === null) return { ok: false, code: "internal" };
  if (result === "not_found") return { ok: false, code: "not_found" };

  await writeAuditLog({
    actorId: await getActorId(),
    action: "checklist.toggle",
    resource: "ChecklistItem",
    resourceId: input.itemId,
    before: { done: result.before.done },
    after: { done: result.after.done },
    metadata: { source: "web" },
  });

  revalidatePath(`/checklist/${input.tripId}`);
  return { ok: true, demo: false, data: result.item };
}

// ═══════════════════════════════════════════════════════════════════
// deleteChecklist
// ═══════════════════════════════════════════════════════════════════

export async function deleteChecklist(input: {
  itemId: string;
  tripId: string;
}): Promise<ChecklistActionResult<{ id: string }>> {
  if (!isDbConnected || input.tripId === DEMO_TRIP_ID) {
    return { ok: true, demo: true };
  }
  if (!(await canWriteTrip(input.tripId))) {
    return { ok: false, code: "forbidden" };
  }

  const result = await deleteChecklistItem(input.itemId);
  if (result === null) return { ok: false, code: "internal" };
  if (result === "not_found") return { ok: false, code: "not_found" };

  await writeAuditLog({
    actorId: await getActorId(),
    action: "checklist.delete",
    resource: "ChecklistItem",
    resourceId: input.itemId,
    before: {
      tripId: result.before.tripId,
      text: result.before.text,
      category: result.before.category,
      dDayBucket: result.before.dDayBucket,
    },
    after: null,
    metadata: { source: "web" },
  });

  revalidatePath(`/checklist/${input.tripId}`);
  return { ok: true, demo: false, data: { id: input.itemId } };
}
