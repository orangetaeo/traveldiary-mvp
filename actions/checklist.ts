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
  bulkDeleteChecklistItems,
  createChecklistItem,
  deleteChecklistItem,
  moveChecklistItem,
  setChecklistItemsDone,
  toggleChecklistItem,
  type CreateChecklistInput,
  type MoveDirection,
} from "@/lib/repositories/checklist.repository";
import { isDbConnected } from "@/lib/prisma";
import { ensureDemoTripInDb } from "@/lib/repositories/trip.repository";
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
  if (!isDbConnected) {
    return { ok: true, demo: true };
  }
  if (!(await canWriteTrip(input.tripId))) {
    return { ok: false, code: "forbidden" };
  }

  await ensureDemoTripInDb(input.tripId);
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
  if (!isDbConnected) {
    return { ok: true, demo: true };
  }
  if (!(await canWriteTrip(input.tripId))) {
    return { ok: false, code: "forbidden" };
  }

  await ensureDemoTripInDb(input.tripId);
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
  if (!isDbConnected) {
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
// moveChecklist — 사이클 BBB (위/아래 화살표 정렬)
// ═══════════════════════════════════════════════════════════════════

export async function moveChecklist(input: {
  itemId: string;
  tripId: string;
  direction: MoveDirection;
}): Promise<ChecklistActionResult<ChecklistItem> | { ok: true; demo: false; data: ChecklistItem; noOp: true }> {
  if (!isDbConnected) {
    return { ok: true, demo: true };
  }
  if (!(await canWriteTrip(input.tripId))) {
    return { ok: false, code: "forbidden" };
  }

  const result = await moveChecklistItem(input.itemId, input.direction);
  if (result === null) return { ok: false, code: "internal" };
  if (result === "not_found") return { ok: false, code: "not_found" };
  if (result === "no_op") {
    // 버킷 끝 도달 — UI는 화살표 비활성화로 호출 자체를 막지만 안전 분기.
    return { ok: false, code: "not_found" };
  }

  await writeAuditLog({
    actorId: await getActorId(),
    action: "checklist.reorder",
    resource: "ChecklistItem",
    resourceId: input.itemId,
    before: { sortOrder: result.before.sortOrder },
    after: { sortOrder: result.after.sortOrder },
    metadata: {
      source: "web",
      direction: input.direction,
      swappedWithId: result.swappedWithId,
    },
  });

  revalidatePath(`/checklist/${input.tripId}`);
  return { ok: true, demo: false, data: result.item };
}

// ═══════════════════════════════════════════════════════════════════
// 사이클 II — bulkToggleChecklist (멀티 선택 일괄 완료/미완료)
//
// audit log: 단일 "checklist.bulk_toggle" row + metadata.itemIds (R1 결정 — N row 폭주 회피).
// AuditAction enum 추가만 (마이그 X — schema.prisma의 action은 String 컬럼).
// ═══════════════════════════════════════════════════════════════════

export async function bulkToggleChecklist(input: {
  tripId: string;
  itemIds: string[];
  done: boolean;
}): Promise<ChecklistActionResult<{ updatedCount: number; done: boolean }>> {
  if (!isDbConnected) {
    return { ok: true, demo: true };
  }
  if (!(await canWriteTrip(input.tripId))) {
    return { ok: false, code: "forbidden" };
  }
  if (input.itemIds.length === 0) {
    return { ok: false, code: "not_found" };
  }

  const result = await setChecklistItemsDone({
    tripId: input.tripId,
    itemIds: input.itemIds,
    done: input.done,
  });
  if (result === null) return { ok: false, code: "internal" };
  if (result === "empty") return { ok: false, code: "not_found" };
  if (result === "count_mismatch") return { ok: false, code: "forbidden" };

  await writeAuditLog({
    actorId: await getActorId(),
    action: "checklist.bulk_toggle",
    resource: "ChecklistItem",
    resourceId: input.tripId,
    metadata: {
      source: "web",
      itemIds: result.itemIds,
      itemCount: result.updatedCount,
      done: result.done,
    },
  });

  revalidatePath(`/checklist/${input.tripId}`);
  return {
    ok: true,
    demo: false,
    data: { updatedCount: result.updatedCount, done: result.done },
  };
}

// ═══════════════════════════════════════════════════════════════════
// 사이클 JJ — bulkDeleteChecklist (멀티 선택 일괄 삭제)
//
// audit log 단일 row + metadata.beforeSnapshot (50개 제한, R1 결정).
// strict count → forbidden (cross-trip 시도 권한 거부 표시, II 답습).
// ═══════════════════════════════════════════════════════════════════

export async function bulkDeleteChecklist(input: {
  tripId: string;
  itemIds: string[];
}): Promise<ChecklistActionResult<{ deletedCount: number }>> {
  if (!isDbConnected) {
    return { ok: true, demo: true };
  }
  if (!(await canWriteTrip(input.tripId))) {
    return { ok: false, code: "forbidden" };
  }
  if (input.itemIds.length === 0) {
    return { ok: false, code: "not_found" };
  }

  const result = await bulkDeleteChecklistItems({
    tripId: input.tripId,
    itemIds: input.itemIds,
  });
  if (result === null) return { ok: false, code: "internal" };
  if (result === "empty") return { ok: false, code: "not_found" };
  if (result === "count_mismatch") return { ok: false, code: "forbidden" };

  await writeAuditLog({
    actorId: await getActorId(),
    action: "checklist.bulk_delete",
    resource: "ChecklistItem",
    resourceId: input.tripId,
    before: result.beforeSnapshot.map((it) => ({
      id: it.id,
      text: it.text,
      category: it.category,
      dDayBucket: it.dDayBucket,
    })),
    metadata: {
      source: "web",
      itemIds: result.itemIds,
      itemCount: result.deletedCount,
      omittedSnapshotCount: result.omittedSnapshotCount,
    },
  });

  revalidatePath(`/checklist/${input.tripId}`);
  return {
    ok: true,
    demo: false,
    data: { deletedCount: result.deletedCount },
  };
}

// ═══════════════════════════════════════════════════════════════════
// deleteChecklist
// ═══════════════════════════════════════════════════════════════════

export async function deleteChecklist(input: {
  itemId: string;
  tripId: string;
}): Promise<ChecklistActionResult<{ id: string }>> {
  if (!isDbConnected) {
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
