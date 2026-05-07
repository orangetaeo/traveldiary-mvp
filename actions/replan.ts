"use server";

/**
 * Replan Server Actions — 사이클 5b-2.
 *
 * 정책 (회의록 5b-2 안건 2):
 *   - 클라이언트가 보낸 itemsAfter는 신뢰하지 않는다. 서버가 trigger·optionId로 재계산.
 *   - 낙관적 동시성: expectedTripUpdatedAt 불일치 시 conflict.
 *   - DB 미연결 또는 데모 trip ID → ok:true, demo:true (UI는 클라이언트 상태로만 시뮬).
 *   - DB 영속화 시 audit log "replan.commit" 동시 기록 (S-13).
 */

import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit-log";
import {
  commitReplanInTransaction,
  fetchTripFromDb,
} from "@/lib/repositories/trip.repository";
import { generateReplanOptions, type ReplanTrigger } from "@/lib/replan";
import { isDbConnected } from "@/lib/prisma";
import { DEMO_TRIP_ID } from "@/lib/seed";
import { getActorId } from "@/lib/auth/session";
import { canWriteTripOrViaShareLink } from "@/lib/auth/authorize";

export type ReplanOptionId = "option-recommend" | "option-safe" | "option-force";

export interface CommitReplanInput {
  tripId: string;
  optionId: ReplanOptionId;
  trigger: ReplanTrigger;
  expectedTripUpdatedAt?: string;
  shareKey?: string;
}

export type CommitReplanResult =
  | { ok: true; demo: true }
  | { ok: true; demo: false; tripUpdatedAt: string; changedCount: number }
  | { ok: false; code: "conflict" }
  | { ok: false; code: "not_found" }
  | { ok: false; code: "invalid_option" }
  | { ok: false; code: "forbidden" }
  | { ok: false; code: "internal" };

export async function commitReplan(
  input: CommitReplanInput,
): Promise<CommitReplanResult> {
  // 데모 모드 — DB 미쓰기, 클라이언트 상태로만 시뮬 (ADR-009 fallback 정책)
  if (!isDbConnected || input.tripId === DEMO_TRIP_ID) {
    return { ok: true, demo: true };
  }
  if (!(await canWriteTripOrViaShareLink(input.tripId, input.shareKey))) {
    return { ok: false, code: "forbidden" };
  }

  const bundle = await fetchTripFromDb(input.tripId);
  if (!bundle) return { ok: false, code: "not_found" };

  // 서버가 옵션 재계산 — 클라이언트 신뢰 경계
  const results = generateReplanOptions(bundle.items, input.trigger);
  const chosen = results.find((r) => r.option.id === input.optionId);
  if (!chosen) return { ok: false, code: "invalid_option" };

  // 변경된 항목만 추출 (scheduledAt이 다른 것)
  const beforeMap = new Map(bundle.items.map((it) => [it.id, it.scheduledAt]));
  const changedItems = chosen.itemsAfter.filter((newIt) => {
    const oldAt = beforeMap.get(newIt.id);
    return oldAt !== undefined && oldAt !== newIt.scheduledAt;
  });

  if (changedItems.length === 0) {
    return { ok: true, demo: false, tripUpdatedAt: bundle.trip.updatedAt ?? "", changedCount: 0 };
  }

  const txResult = await commitReplanInTransaction({
    tripId: input.tripId,
    changedItems: changedItems.map((it) => ({
      id: it.id,
      scheduledAt: it.scheduledAt,
    })),
    expectedTripUpdatedAt: input.expectedTripUpdatedAt,
  });

  if (txResult === null) return { ok: false, code: "internal" };
  if (txResult === "conflict") return { ok: false, code: "conflict" };

  await writeAuditLog({
    actorId: await getActorId(),
    action: "replan.commit",
    resource: "Trip",
    resourceId: input.tripId,
    before: {
      items: changedItems.map((newIt) => ({
        id: newIt.id,
        scheduledAt: beforeMap.get(newIt.id),
      })),
    },
    after: {
      items: changedItems.map((it) => ({
        id: it.id,
        scheduledAt: it.scheduledAt,
      })),
    },
    metadata: {
      optionId: input.optionId,
      optionLabel: chosen.option.label,
      triggerType: input.trigger.type,
      triggerItemId: input.trigger.itemId,
      triggerMinutes: input.trigger.minutes,
      changedCount: changedItems.length,
      source: "web",
    },
  });

  revalidatePath(`/itinerary/${input.tripId}`);
  revalidatePath(`/travel/${input.tripId}`);

  return {
    ok: true,
    demo: false,
    tripUpdatedAt: txResult.tripUpdatedAt,
    changedCount: changedItems.length,
  };
}
