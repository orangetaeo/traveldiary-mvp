"use server";

/**
 * TripReview Repository — E2 여행 후기 DB 영속화.
 * cost.repository.ts 패턴 답습.
 */

import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import type { TripReview } from "../types";

type DbRow = Prisma.TripReviewGetPayload<Record<string, never>>;

function rowToReview(row: DbRow): TripReview {
  return {
    id: row.id,
    tripId: row.tripId,
    actorId: row.actorId,
    rating: row.rating,
    text: row.text,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** tripId + actorId 조합으로 단일 후기 조회. */
export async function findReview(
  tripId: string,
  actorId: string | null,
): Promise<TripReview | null> {
  if (!prisma) return null;
  try {
    const row = await prisma.tripReview.findUnique({
      where: { tripId_actorId: { tripId, actorId: actorId ?? "" } },
    });
    return row ? rowToReview(row) : null;
  } catch (err) {
    console.error("[review.repository] findReview failed", err);
    return null;
  }
}

/** tripId로 모든 후기 조회 (멤버 전원). */
export async function listReviewsByTrip(
  tripId: string,
): Promise<TripReview[] | null> {
  if (!prisma) return null;
  try {
    const rows = await prisma.tripReview.findMany({
      where: { tripId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(rowToReview);
  } catch (err) {
    console.error("[review.repository] listReviewsByTrip failed", err);
    return null;
  }
}

export interface UpsertReviewInput {
  tripId: string;
  actorId: string | null;
  rating: number;
  text: string;
}

/** upsert — tripId+actorId 유니크 키 기준. */
export async function upsertReview(
  input: UpsertReviewInput,
): Promise<TripReview | null> {
  if (!prisma) return null;
  const safeActorId = input.actorId ?? "";
  try {
    const row = await prisma.tripReview.upsert({
      where: {
        tripId_actorId: { tripId: input.tripId, actorId: safeActorId },
      },
      create: {
        tripId: input.tripId,
        actorId: safeActorId || null,
        rating: input.rating,
        text: input.text,
      },
      update: {
        rating: input.rating,
        text: input.text,
      },
    });
    return rowToReview(row);
  } catch (err) {
    console.error("[review.repository] upsertReview failed", err);
    return null;
  }
}
