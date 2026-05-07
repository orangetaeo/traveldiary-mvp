"use server";

/**
 * Review Server Actions — E2 여행 후기 DB 영속화.
 * cost.ts 패턴 답습. 감사 로그 절대 규칙 준수.
 */

import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit-log";
import {
  upsertReview,
  findReview,
  type UpsertReviewInput,
} from "@/lib/repositories/review.repository";
import { isDbConnected } from "@/lib/prisma";
import { getActorId } from "@/lib/auth/session";
import { canWriteTripOrViaShareLink } from "@/lib/auth/authorize";
import { resolveActorIdForTrip } from "@/lib/auth/actor-resolution";
import type { TripReview } from "@/lib/types";

export type ReviewActionResult<T = unknown> =
  | { ok: true; demo: true }
  | { ok: true; demo: false; data: T }
  | { ok: false; code: "forbidden" | "internal" | "invalid" };

// ═══════════════════════════════════════════════════════════════════
// saveReview — upsert (별점 + 텍스트)
// ═══════════════════════════════════════════════════════════════════

export async function saveReview(input: {
  tripId: string;
  rating: number;
  text: string;
  shareKey?: string;
}): Promise<ReviewActionResult<TripReview>> {
  // 입력 검증
  const rating = Math.floor(Number(input.rating));
  if (!Number.isFinite(rating) || rating < 0 || rating > 5) {
    return { ok: false, code: "invalid" };
  }
  const text =
    typeof input.text === "string" ? input.text.slice(0, 2000) : "";

  if (!isDbConnected) {
    return { ok: true, demo: true };
  }

  if (!(await canWriteTripOrViaShareLink(input.tripId, input.shareKey))) {
    return { ok: false, code: "forbidden" };
  }

  const sessionActorId = await getActorId();
  const actorId = resolveActorIdForTrip(input.tripId, sessionActorId);

  const upsertInput: UpsertReviewInput = {
    tripId: input.tripId,
    actorId,
    rating,
    text,
  };

  const review = await upsertReview(upsertInput);
  if (!review) return { ok: false, code: "internal" };

  await writeAuditLog({
    actorId: sessionActorId,
    action: "review.save",
    resource: "TripReview",
    resourceId: review.id,
    after: { tripId: review.tripId, rating: review.rating, textLength: review.text.length },
    metadata: { source: "web" },
  });

  revalidatePath(`/wrap-up/${input.tripId}`);
  return { ok: true, demo: false, data: review };
}

// ═══════════════════════════════════════════════════════════════════
// loadReview — 현재 사용자의 후기 조회
// ═══════════════════════════════════════════════════════════════════

export async function loadReview(tripId: string): Promise<TripReview | null> {
  if (!isDbConnected) return null;
  const sessionActorId = await getActorId();
  const actorId = resolveActorIdForTrip(tripId, sessionActorId);
  return findReview(tripId, actorId);
}
