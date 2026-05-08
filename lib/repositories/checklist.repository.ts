/**
 * ChecklistItem Repository — 사이클 9 M6 (ADR-022).
 *
 * 정책:
 *   - prisma 미연결 시 모든 함수가 null 반환 → 호출처는 시드 fallback.
 *   - 5b-2 mutation 표준 패턴 답습 (낙관적 동시성은 미도입, 단일 사용자).
 */

import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import type { ChecklistItem } from "../types";

type DbRow = Prisma.ChecklistItemGetPayload<Record<string, never>>;

function rowToItem(row: DbRow): ChecklistItem {
  return {
    id: row.id,
    tripId: row.tripId,
    category: row.category as ChecklistItem["category"],
    text: row.text,
    dDayBucket: row.dDayBucket as ChecklistItem["dDayBucket"],
    done: row.done,
    cityNote: row.cityNote ?? undefined,
    sortOrder: row.sortOrder,
    actorId: row.actorId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listChecklistByTrip(
  tripId: string,
): Promise<ChecklistItem[] | null> {
  if (!prisma) return null;
  try {
    const rows = await prisma.checklistItem.findMany({
      where: { tripId },
      orderBy: [{ dDayBucket: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return rows.map(rowToItem);
  } catch (err) {
    console.error("[checklist.repository] list failed", err);
    return null;
  }
}

export interface CreateChecklistInput {
  tripId: string;
  category: ChecklistItem["category"];
  text: string;
  dDayBucket: ChecklistItem["dDayBucket"];
  cityNote?: string;
  sortOrder?: number;
  /** 사이클 TT (ADR-045) — 작성자 user.id. 미인증/DEMO는 null */
  actorId?: string | null;
}

export async function createChecklistItem(
  input: CreateChecklistInput,
): Promise<ChecklistItem | null> {
  if (!prisma) return null;
  try {
    const row = await prisma.checklistItem.create({
      data: {
        tripId: input.tripId,
        category: input.category,
        text: input.text,
        dDayBucket: input.dDayBucket,
        cityNote: input.cityNote,
        sortOrder: input.sortOrder ?? 0,
        actorId: input.actorId ?? null,
      },
    });
    return rowToItem(row);
  } catch (err) {
    console.error("[checklist.repository] create failed", err);
    return null;
  }
}

export async function bulkCreateChecklistItems(
  tripId: string,
  inputs: Omit<CreateChecklistInput, "tripId">[],
  actorId?: string | null,
): Promise<ChecklistItem[] | null> {
  if (!prisma) return null;
  try {
    return await prisma.$transaction(async (tx) => {
      const created: ChecklistItem[] = [];
      for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i];
        const row = await tx.checklistItem.create({
          data: {
            tripId,
            category: input.category,
            text: input.text,
            dDayBucket: input.dDayBucket,
            cityNote: input.cityNote,
            sortOrder: input.sortOrder ?? i,
            actorId: input.actorId ?? actorId ?? null,
          },
        });
        created.push(rowToItem(row));
      }
      return created;
    });
  } catch (err) {
    console.error("[checklist.repository] bulkCreate failed", err);
    return null;
  }
}

export interface ToggleChecklistResult {
  before: { done: boolean };
  after: { done: boolean };
  item: ChecklistItem;
}

export async function toggleChecklistItem(
  itemId: string,
): Promise<ToggleChecklistResult | "not_found" | null> {
  if (!prisma) return null;
  try {
    return await prisma.$transaction(async (tx) => {
      const before = await tx.checklistItem.findUnique({ where: { id: itemId } });
      if (!before) return "not_found" as const;
      const after = await tx.checklistItem.update({
        where: { id: itemId },
        data: { done: !before.done },
      });
      return {
        before: { done: before.done },
        after: { done: after.done },
        item: rowToItem(after),
      };
    });
  } catch (err) {
    console.error("[checklist.repository] toggle failed", err);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════
// 사이클 BBB — moveChecklistItem (위/아래 화살표 swap)
//
// 같은 (tripId, dDayBucket) 안의 인접 행과 sortOrder를 swap한다.
// 버킷 첫 항목 위쪽 / 마지막 항목 아래쪽 호출은 "no_op" 반환.
// ═══════════════════════════════════════════════════════════════════

export type MoveDirection = "up" | "down";

export interface MoveChecklistResult {
  before: { sortOrder: number };
  after: { sortOrder: number };
  swappedWithId: string;
  item: ChecklistItem;
}

export async function moveChecklistItem(
  itemId: string,
  direction: MoveDirection,
): Promise<MoveChecklistResult | "not_found" | "no_op" | null> {
  if (!prisma) return null;
  try {
    return await prisma.$transaction(async (tx) => {
      const target = await tx.checklistItem.findUnique({ where: { id: itemId } });
      if (!target) return "not_found" as const;

      // 같은 버킷 안의 인접 항목 찾기 — sortOrder 기준
      const neighbor = await tx.checklistItem.findFirst({
        where: {
          tripId: target.tripId,
          dDayBucket: target.dDayBucket,
          sortOrder:
            direction === "up"
              ? { lt: target.sortOrder }
              : { gt: target.sortOrder },
        },
        orderBy: { sortOrder: direction === "up" ? "desc" : "asc" },
      });
      if (!neighbor) return "no_op" as const;

      // sortOrder swap — 단순 치환은 unique index 충돌 없음 (sortOrder는 PK 아님)
      const targetOrder = target.sortOrder;
      const neighborOrder = neighbor.sortOrder;

      await tx.checklistItem.update({
        where: { id: target.id },
        data: { sortOrder: neighborOrder },
      });
      await tx.checklistItem.update({
        where: { id: neighbor.id },
        data: { sortOrder: targetOrder },
      });

      const after = await tx.checklistItem.findUniqueOrThrow({
        where: { id: itemId },
      });

      return {
        before: { sortOrder: targetOrder },
        after: { sortOrder: neighborOrder },
        swappedWithId: neighbor.id,
        item: rowToItem(after),
      };
    });
  } catch (err) {
    console.error("[checklist.repository] move failed", err);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════
// 사이클 II — setChecklistItemsDone (멀티 선택 일괄 완료/미완료)
//
// strict count check: where 절에 tripId 포함으로 cross-trip injection 방어 +
// updatedCount !== itemIds.length 시 throw (트랜잭션 롤백). audit log는 단일
// "checklist.bulk_toggle" row + metadata.itemIds (호출처에서).
// ═══════════════════════════════════════════════════════════════════

export interface SetItemsDoneInput {
  tripId: string;
  itemIds: string[];
  done: boolean;
}

export interface SetItemsDoneResult {
  updatedCount: number;
  itemIds: string[];
  done: boolean;
}

export async function setChecklistItemsDone(
  input: SetItemsDoneInput,
): Promise<SetItemsDoneResult | "count_mismatch" | "empty" | null> {
  if (!prisma) return null;
  if (input.itemIds.length === 0) return "empty";

  try {
    return await prisma.$transaction(async (tx) => {
      const updated = await tx.checklistItem.updateMany({
        where: { id: { in: input.itemIds }, tripId: input.tripId },
        data: { done: input.done },
      });
      if (updated.count !== input.itemIds.length) {
        // 부분 매칭 — cross-trip itemId 또는 not_found row 존재. 트랜잭션 throw로 롤백.
        throw new Error("count_mismatch");
      }
      return {
        updatedCount: updated.count,
        itemIds: input.itemIds,
        done: input.done,
      };
    });
  } catch (err) {
    if (err instanceof Error && err.message === "count_mismatch") {
      return "count_mismatch";
    }
    console.error("[checklist.repository] setChecklistItemsDone failed", err);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════
// 사이클 JJ — bulkDeleteChecklistItems (멀티 선택 일괄 삭제)
//
// strict count check (II 답습): where 절에 tripId 포함 + count !== expected throw.
// before snapshot은 audit metadata용으로 첫 50개까지만 보존 (R1 결정 — JSON 비대화 방지).
// ═══════════════════════════════════════════════════════════════════

export const BULK_DELETE_SNAPSHOT_LIMIT = 50;

export interface BulkDeleteChecklistInput {
  tripId: string;
  itemIds: string[];
}

export interface BulkDeleteChecklistResult {
  deletedCount: number;
  itemIds: string[];
  beforeSnapshot: ChecklistItem[];
  omittedSnapshotCount: number;
}

export async function bulkDeleteChecklistItems(
  input: BulkDeleteChecklistInput,
): Promise<BulkDeleteChecklistResult | "count_mismatch" | "empty" | null> {
  if (!prisma) return null;
  if (input.itemIds.length === 0) return "empty";

  try {
    return await prisma.$transaction(async (tx) => {
      // before snapshot — audit metadata용 (첫 50개 제한)
      const snapshotIds = input.itemIds.slice(0, BULK_DELETE_SNAPSHOT_LIMIT);
      const beforeRows = await tx.checklistItem.findMany({
        where: { id: { in: snapshotIds }, tripId: input.tripId },
      });
      const beforeSnapshot = beforeRows.map(rowToItem);

      const deleted = await tx.checklistItem.deleteMany({
        where: { id: { in: input.itemIds }, tripId: input.tripId },
      });
      if (deleted.count !== input.itemIds.length) {
        // cross-trip itemId 또는 not_found row 존재 → 트랜잭션 throw로 롤백.
        throw new Error("count_mismatch");
      }
      return {
        deletedCount: deleted.count,
        itemIds: input.itemIds,
        beforeSnapshot,
        omittedSnapshotCount: Math.max(
          0,
          input.itemIds.length - BULK_DELETE_SNAPSHOT_LIMIT,
        ),
      };
    });
  } catch (err) {
    if (err instanceof Error && err.message === "count_mismatch") {
      return "count_mismatch";
    }
    console.error("[checklist.repository] bulkDeleteChecklistItems failed", err);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════
// updateChecklistItem — 항목 텍스트 수정 (인라인 편집)
// ═══════════════════════════════════════════════════════════════════

export interface UpdateChecklistResult {
  before: { text: string };
  after: { text: string };
  item: ChecklistItem;
}

export async function updateChecklistItem(
  itemId: string,
  text: string,
): Promise<UpdateChecklistResult | "not_found" | null> {
  if (!prisma) return null;
  try {
    return await prisma.$transaction(async (tx) => {
      const before = await tx.checklistItem.findUnique({ where: { id: itemId } });
      if (!before) return "not_found" as const;
      const after = await tx.checklistItem.update({
        where: { id: itemId },
        data: { text },
      });
      return {
        before: { text: before.text },
        after: { text: after.text },
        item: rowToItem(after),
      };
    });
  } catch (err) {
    console.error("[checklist.repository] update failed", err);
    return null;
  }
}

export async function deleteChecklistItem(
  itemId: string,
): Promise<{ before: ChecklistItem } | "not_found" | null> {
  if (!prisma) return null;
  try {
    return await prisma.$transaction(async (tx) => {
      const before = await tx.checklistItem.findUnique({ where: { id: itemId } });
      if (!before) return "not_found" as const;
      await tx.checklistItem.delete({ where: { id: itemId } });
      return { before: rowToItem(before) };
    });
  } catch (err) {
    console.error("[checklist.repository] delete failed", err);
    return null;
  }
}
