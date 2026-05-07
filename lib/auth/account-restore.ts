/**
 * 계정 복구 트랜잭션 — 사이클 10 (ADR-049 §위험 박제 약속).
 *
 * 정책 (anonymize의 역방향):
 *   - User row의 `deletedAt = null` + 운영자 입력 PII(email/kakaoId/name) 복원.
 *   - `preferences`는 사용자 데이터라 운영자가 별도 수동 복구 (이 함수는 건드리지 않음).
 *   - 선택적: 운영자가 reassignTripIds를 전달하면 SYSTEM_OWNER_ID에서 user로 ownerId 역방향
 *     reassign. 안전 가드: ownerId === SYSTEM_OWNER_ID 인 trip만 대상 (다른 사용자에게
 *     이전 reassign된 trip은 절대 건드리지 않음).
 *   - audit log "auth.account_restore" 트랜잭션 내부 atomic 기록 (S-13 강화 박제 답습).
 *
 * 호출자: scripts/restore-user.ts CLI 또는 향후 운영자 콘솔. **server-only + CLI 전용**.
 */

import "server-only";

import { prisma } from "../prisma";
import { SYSTEM_OWNER_ID } from "./session";
import { sanitizeAuditValue } from "../audit-log";

export interface RestoreUserInput {
  userId: string;
  email: string | null;
  kakaoId: string | null;
  name: string | null;
  /**
   * SYSTEM_OWNER_ID로 reassign됐던 trip을 user로 되돌릴 ID 목록.
   * 안전 가드: 현재 ownerId가 SYSTEM_OWNER_ID인 row만 reassign (이중 보호).
   * 빈 배열 또는 undefined면 trip 복구 skip — User PII만 복원.
   */
  reassignTripIds?: string[];
  /** 감사용 — 운영자 식별자 (CLI에서는 OS 사용자명 또는 명시 입력) */
  operator?: string;
}

export interface RestoreUserResult {
  ok: boolean;
  reason?:
    | "db_unavailable"
    | "user_not_found"
    | "user_not_anonymized"
    | "tx_failed";
  /** 실제 user로 reassign된 trip 수 (요청한 ID 중 SYSTEM_OWNER_ID였던 것만) */
  restoredTripCount?: number;
  /** 요청 input 중 안전 가드(다른 사용자 소유 등)로 reassign되지 않은 trip ID */
  skippedTripIds?: string[];
}

const MAX_TRIP_IDS = 50;

export async function restoreUserAccount(
  input: RestoreUserInput,
): Promise<RestoreUserResult> {
  if (!prisma) return { ok: false, reason: "db_unavailable" as const };

  // 입력 가드 — 운영자 실수 방지
  if (!input.userId || typeof input.userId !== "string") {
    return { ok: false, reason: "user_not_found" as const };
  }

  const requestedTripIds = (input.reassignTripIds ?? []).slice(0, MAX_TRIP_IDS);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({
        where: { id: input.userId },
        select: { id: true, deletedAt: true },
      });
      if (!existing) {
        return { ok: false as const, reason: "user_not_found" as const };
      }
      if (!existing.deletedAt) {
        return { ok: false as const, reason: "user_not_anonymized" as const };
      }

      let restoredTripCount = 0;
      let skippedTripIds: string[] = [];

      if (requestedTripIds.length > 0) {
        // 안전 가드: ownerId가 SYSTEM_OWNER_ID인 trip만 대상.
        // 다른 user로 이미 reassign됐다면 (운영자 실수, 다른 user의 ID 입력 등) skip.
        const eligible = await tx.trip.findMany({
          where: {
            id: { in: requestedTripIds },
            ownerId: SYSTEM_OWNER_ID,
          },
          select: { id: true },
        });
        const eligibleIds = new Set(eligible.map((t) => t.id));
        skippedTripIds = requestedTripIds.filter(
          (id) => !eligibleIds.has(id),
        );

        if (eligible.length > 0) {
          const updated = await tx.trip.updateMany({
            where: {
              id: { in: eligible.map((t) => t.id) },
              ownerId: SYSTEM_OWNER_ID,
            },
            data: { ownerId: input.userId },
          });
          restoredTripCount = updated.count;
        }
      }

      await tx.user.update({
        where: { id: input.userId },
        data: {
          deletedAt: null,
          email: input.email,
          kakaoId: input.kakaoId,
          name: input.name,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: input.userId,
          action: "auth.account_restore",
          resource: "User",
          resourceId: input.userId,
          metadata: sanitizeAuditValue({
            operator: input.operator ?? null,
            restoredTripCount,
            requestedTripCount: requestedTripIds.length,
            skippedTripIds: skippedTripIds.slice(0, MAX_TRIP_IDS),
          }) as never,
        },
      });

      return {
        ok: true as const,
        restoredTripCount,
        skippedTripIds,
      };
    });

    return result;
  } catch (err) {
    console.error("[account-restore] failed", err);
    return { ok: false, reason: "tx_failed" as const };
  }
}

export const ACCOUNT_RESTORE_MAX_TRIP_IDS = MAX_TRIP_IDS;
