/**
 * CostEntry Repository — 사이클 9 M6 (ADR-022).
 */

import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import type { CostEntry } from "../types";

type DbRow = Prisma.CostEntryGetPayload<Record<string, never>>;

function rowToEntry(row: DbRow): CostEntry {
  const amountLocalRaw = row.amountLocal as
    | { value: number; currency: string }
    | null;
  return {
    id: row.id,
    tripId: row.tripId,
    date: row.date.toISOString().slice(0, 10),
    label: row.label,
    amountKrw: row.amountKrw,
    amountLocal: amountLocalRaw ?? undefined,
    status: row.status as CostEntry["status"],
    category: row.category ?? undefined,
    splitWith: (row.splitWith as string[] | null) ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listCostByTrip(
  tripId: string,
): Promise<CostEntry[] | null> {
  if (!prisma) return null;
  try {
    const rows = await prisma.costEntry.findMany({
      where: { tripId },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });
    return rows.map(rowToEntry);
  } catch (err) {
    console.error("[cost.repository] list failed", err);
    return null;
  }
}

export interface CreateCostInput {
  tripId: string;
  date: string;        // ISO date (YYYY-MM-DD)
  label: string;
  amountKrw: number;
  amountLocal?: { value: number; currency: string };
  status?: CostEntry["status"];
  category?: string;
}

export async function createCostEntry(
  input: CreateCostInput,
): Promise<CostEntry | null> {
  if (!prisma) return null;
  try {
    const row = await prisma.costEntry.create({
      data: {
        tripId: input.tripId,
        date: new Date(`${input.date}T00:00:00Z`),
        label: input.label,
        amountKrw: input.amountKrw,
        amountLocal: (input.amountLocal ?? null) as never,
        status: input.status ?? "planned",
        category: input.category,
      },
    });
    return rowToEntry(row);
  } catch (err) {
    console.error("[cost.repository] create failed", err);
    return null;
  }
}

export interface UpdateCostInput {
  id: string;
  date?: string;
  label?: string;
  amountKrw?: number;
  amountLocal?: { value: number; currency: string } | null;
  status?: CostEntry["status"];
  category?: string | null;
}

export async function updateCostEntry(
  input: UpdateCostInput,
): Promise<{ before: CostEntry; after: CostEntry } | "not_found" | null> {
  if (!prisma) return null;
  try {
    return await prisma.$transaction(async (tx) => {
      const before = await tx.costEntry.findUnique({ where: { id: input.id } });
      if (!before) return "not_found" as const;
      const after = await tx.costEntry.update({
        where: { id: input.id },
        data: {
          ...(input.date && { date: new Date(`${input.date}T00:00:00Z`) }),
          ...(input.label !== undefined && { label: input.label }),
          ...(input.amountKrw !== undefined && { amountKrw: input.amountKrw }),
          ...(input.amountLocal !== undefined && {
            amountLocal: (input.amountLocal ?? null) as never,
          }),
          ...(input.status && { status: input.status }),
          ...(input.category !== undefined && { category: input.category }),
        },
      });
      return { before: rowToEntry(before), after: rowToEntry(after) };
    });
  } catch (err) {
    console.error("[cost.repository] update failed", err);
    return null;
  }
}

export async function deleteCostEntry(
  id: string,
): Promise<{ before: CostEntry } | "not_found" | null> {
  if (!prisma) return null;
  try {
    return await prisma.$transaction(async (tx) => {
      const before = await tx.costEntry.findUnique({ where: { id } });
      if (!before) return "not_found" as const;
      await tx.costEntry.delete({ where: { id } });
      return { before: rowToEntry(before) };
    });
  } catch (err) {
    console.error("[cost.repository] delete failed", err);
    return null;
  }
}
