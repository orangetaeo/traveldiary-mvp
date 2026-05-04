/**
 * Vote Repository — 사이클 E (C4 일행 투표).
 */

import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import type { Vote, VoteOption } from "../types";

type DbRow = Prisma.VoteGetPayload<Record<string, never>>;

function rowToVote(row: DbRow): Vote {
  return {
    id: row.id,
    tripId: row.tripId,
    question: row.question,
    options: (row.options as unknown as VoteOption[]) ?? [],
    status: row.status as Vote["status"],
    decidedAt: row.decidedAt?.toISOString(),
    createdBy: row.createdBy ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listVotesByTrip(tripId: string): Promise<Vote[] | null> {
  if (!prisma) return null;
  try {
    const rows = await prisma.vote.findMany({
      where: { tripId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(rowToVote);
  } catch (err) {
    console.error("[vote.repository] list failed", err);
    return null;
  }
}

export interface CreateVoteInput {
  tripId: string;
  question: string;
  optionLabels: string[];
  createdBy?: string | null;
  /** BLOCKER6 (마이그 0014) — 작성자 user.id. NULL = legacy/DEMO/미인증. */
  actorId?: string | null;
}

export async function createVoteRow(
  input: CreateVoteInput,
): Promise<Vote | null> {
  if (!prisma) return null;
  try {
    const options: VoteOption[] = input.optionLabels.map((l) => ({
      label: l,
      voters: [],
    }));
    const row = await prisma.vote.create({
      data: {
        tripId: input.tripId,
        question: input.question,
        options: options as never,
        createdBy: input.createdBy ?? undefined,
        actorId: input.actorId ?? undefined,
      },
    });
    return rowToVote(row);
  } catch (err) {
    console.error("[vote.repository] create failed", err);
    return null;
  }
}

/** 사용자 토글 — 같은 옵션 다시 클릭 시 표 회수, 다른 옵션은 자동 이동 */
export async function castVoteToggle(
  voteId: string,
  optionIndex: number,
  voterId: string,
): Promise<Vote | "not_found" | null> {
  if (!prisma) return null;
  try {
    return await prisma.$transaction(async (tx) => {
      const row = await tx.vote.findUnique({ where: { id: voteId } });
      if (!row) return "not_found" as const;

      const opts = (row.options as unknown as VoteOption[]) ?? [];
      // 모든 옵션에서 voterId 제거
      const cleaned = opts.map((o) => ({
        ...o,
        voters: o.voters.filter((v) => v !== voterId),
      }));
      // 선택한 옵션의 voters에 추가 (이미 있던 경우는 단순 회수)
      const wasInTarget = opts[optionIndex]?.voters.includes(voterId) ?? false;
      if (!wasInTarget && cleaned[optionIndex]) {
        cleaned[optionIndex].voters.push(voterId);
      }

      const updated = await tx.vote.update({
        where: { id: voteId },
        data: { options: cleaned as never },
      });
      return rowToVote(updated);
    });
  } catch (err) {
    console.error("[vote.repository] cast failed", err);
    return null;
  }
}
