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
