"use server";

/**
 * Vote Server Actions — 사이클 E (C4 일행 투표).
 */

import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit-log";
import {
  castVoteToggle,
  createVoteRow,
} from "@/lib/repositories/vote.repository";
import { isDbConnected } from "@/lib/prisma";
import { DEMO_TRIP_ID } from "@/lib/seed";
import { getActorId } from "@/lib/auth/session";
import { canWriteTrip } from "@/lib/auth/authorize";
import type { Vote } from "@/lib/types";

export interface CreateVoteInput {
  tripId: string;
  question: string;
  optionLabels: string[];
}

export type CreateVoteResult =
  | { ok: true; demo: true }
  | { ok: true; demo: false; data: Vote }
  | { ok: false; code: "internal" | "forbidden" | "invalid" };

export async function createVote(
  input: CreateVoteInput,
): Promise<CreateVoteResult> {
  if (!isDbConnected || input.tripId === DEMO_TRIP_ID) {
    return { ok: true, demo: true };
  }
  if (!(await canWriteTrip(input.tripId))) {
    return { ok: false, code: "forbidden" };
  }
  const labels = input.optionLabels
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (input.question.trim().length === 0 || labels.length < 2) {
    return { ok: false, code: "invalid" };
  }

  const created = await createVoteRow({
    tripId: input.tripId,
    question: input.question.trim(),
    optionLabels: labels,
    createdBy: await getActorId(),
  });
  if (!created) return { ok: false, code: "internal" };

  revalidatePath(`/vote/${input.tripId}`);
  return { ok: true, demo: false, data: created };
}

export interface CastVoteInput {
  voteId: string;
  tripId: string;
  optionIndex: number;
}

export type CastVoteResult =
  | { ok: true; demo: true }
  | { ok: true; demo: false; data: Vote }
  | { ok: false; code: "internal" | "forbidden" | "not_found" | "no_actor" };

export async function castVote(input: CastVoteInput): Promise<CastVoteResult> {
  if (!isDbConnected || input.tripId === DEMO_TRIP_ID) {
    return { ok: true, demo: true };
  }
  // 투표는 owner뿐만 아니라 일행도 가능하지만, 11d 단계에선 owner만
  if (!(await canWriteTrip(input.tripId))) {
    return { ok: false, code: "forbidden" };
  }

  const actorId = await getActorId();
  if (!actorId) return { ok: false, code: "no_actor" };

  const result = await castVoteToggle(input.voteId, input.optionIndex, actorId);
  if (result === null) return { ok: false, code: "internal" };
  if (result === "not_found") return { ok: false, code: "not_found" };

  // audit는 mutation 빈도 높을 수 있어 미기록 (5b-3 cached:true 패턴 답습)
  await writeAuditLog({
    actorId,
    action: "share.access", // legacy enum 재사용 — 11e+에서 vote.cast 추가
    resource: "Vote",
    resourceId: input.voteId,
    metadata: { tripId: input.tripId, optionIndex: input.optionIndex },
  });

  revalidatePath(`/vote/${input.tripId}`);
  return { ok: true, demo: false, data: result };
}
