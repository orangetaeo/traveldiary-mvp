"use server";

/**
 * TripPhoto Repository — E3 여행 사진 앨범.
 * cost.repository.ts 패턴 답습.
 */

import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import type { TripPhoto } from "../types";

type DbRow = Prisma.TripPhotoGetPayload<Record<string, never>>;

function rowToPhoto(row: DbRow): TripPhoto {
  return {
    id: row.id,
    tripId: row.tripId,
    actorId: row.actorId,
    url: row.url,
    caption: row.caption ?? undefined,
    dayIndex: row.dayIndex ?? undefined,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
  };
}

/** tripId로 사진 목록 조회 — dayIndex + sortOrder 순. */
export async function listPhotosByTrip(
  tripId: string,
): Promise<TripPhoto[] | null> {
  if (!prisma) return null;
  try {
    const rows = await prisma.tripPhoto.findMany({
      where: { tripId },
      orderBy: [{ dayIndex: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return rows.map(rowToPhoto);
  } catch (err) {
    console.error("[photo.repository] listPhotosByTrip failed", err);
    return null;
  }
}

export interface CreatePhotoInput {
  tripId: string;
  actorId: string | null;
  url: string;
  caption?: string;
  dayIndex?: number;
  sortOrder?: number;
}

export async function createPhoto(
  input: CreatePhotoInput,
): Promise<TripPhoto | null> {
  if (!prisma) return null;
  try {
    const row = await prisma.tripPhoto.create({
      data: {
        tripId: input.tripId,
        actorId: input.actorId,
        url: input.url,
        caption: input.caption,
        dayIndex: input.dayIndex,
        sortOrder: input.sortOrder ?? 0,
      },
    });
    return rowToPhoto(row);
  } catch (err) {
    console.error("[photo.repository] createPhoto failed", err);
    return null;
  }
}

export async function deletePhoto(
  id: string,
): Promise<{ before: TripPhoto } | "not_found" | null> {
  if (!prisma) return null;
  try {
    const existing = await prisma.tripPhoto.findUnique({ where: { id } });
    if (!existing) return "not_found";
    await prisma.tripPhoto.delete({ where: { id } });
    return { before: rowToPhoto(existing) };
  } catch (err) {
    console.error("[photo.repository] deletePhoto failed", err);
    return null;
  }
}
