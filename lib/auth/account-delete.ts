/**
 * 계정 삭제 익명화 트랜잭션 — 사이클 8 (G3, ADR-049).
 *
 * 정책:
 *   - Trip.ownerId가 user인 row → SYSTEM_OWNER_ID로 reassign (소유권 이전).
 *   - TripMember 멤버십은 삭제 (협업 명단에서 제거).
 *   - User row 자체는 soft delete (deletedAt = now()) + PII NULL.
 *   - 다른 *.actorId는 그대로 user.id를 가리킴 (audit trail 추적성 유지, UI 측 익명 표시).
 *   - audit log "auth.account_delete" 동시 기록.
 *
 * Trip이 cascade로 ItineraryItem/Cost/Checklist/Share를 가져가지 않도록
 * 단일 트랜잭션 안에서 reassign 후 user soft delete 순서.
 */

import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { SYSTEM_OWNER_ID } from "./session";
import { sanitizeAuditValue } from "../audit-log";

// 외부 호환 re-export — client 모달이 직접 shared로 import하도록 사이클 8 hotfix에서 분리.
// 기존 호출처(테스트/route.ts)는 경로 무변경.
export {
  ACCOUNT_DELETE_CONFIRM_PHRASE,
  isValidAccountDeleteConfirm,
} from "./account-delete-shared";

export interface AnonymizeAccountResult {
  ok: boolean;
  /** 익명화 실패 시 원인 코드 ("db_unavailable" | "user_not_found" | "tx_failed") */
  reason?: string;
  /** reassign된 trip 수 (감사용) */
  reassignedTripCount?: number;
  /** 삭제된 멤버십 수 */
  removedMemberships?: number;
}

/**
 * 사용자 계정을 익명화한다. user.id는 보존, PII만 NULL화.
 * 호출자는 인증된 사용자의 id를 전달해야 한다 (DELETE 라우트가 verify).
 */
export async function anonymizeUserAccount(
  userId: string,
): Promise<AnonymizeAccountResult> {
  if (!prisma) return { ok: false, reason: "db_unavailable" };

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, deletedAt: true },
      });
      if (!existing) {
        return { ok: false as const, reason: "user_not_found" };
      }
      if (existing.deletedAt) {
        return { ok: true as const, reassignedTripCount: 0, removedMemberships: 0 };
      }

      // 사이클 10 — 운영자 수동 복구를 위해 reassign 대상 trip ID를 audit metadata에
      // 50개까지 보존. 50 cap은 박제 [feedback_bulk_mutation_pattern] 답습.
      const trips = await tx.trip.findMany({
        where: { ownerId: userId },
        select: { id: true },
        take: 50,
        orderBy: { createdAt: "asc" },
      });

      const reassigned = await tx.trip.updateMany({
        where: { ownerId: userId },
        data: { ownerId: SYSTEM_OWNER_ID },
      });

      const removed = await tx.tripMember.deleteMany({
        where: { userId },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          deletedAt: new Date(),
          email: null,
          kakaoId: null,
          name: null,
          preferences: Prisma.JsonNull,
        },
      });

      // T13 Major fix — audit row를 트랜잭션 내부에 atomic 기록 (S-13 + GDPR 추적성).
      await tx.auditLog.create({
        data: {
          actorId: userId,
          action: "auth.account_delete",
          resource: "User",
          resourceId: userId,
          metadata: sanitizeAuditValue({
            reassignedTripCount: reassigned.count,
            removedMemberships: removed.count,
            // 사이클 10 — 운영자 복구 SQL/CLI 입력에 사용 (50 cap)
            reassignedTripIds: trips.map((t) => t.id),
          }) as never,
        },
      });

      return {
        ok: true as const,
        reassignedTripCount: reassigned.count,
        removedMemberships: removed.count,
      };
    });

    return result;
  } catch (err) {
    console.error("[account-delete] anonymize failed", err);
    return { ok: false, reason: "tx_failed" };
  }
}

// PHRASE/validator는 client에서도 사용되므로 ./account-delete-shared.ts로 분리됨.
// 위 re-export로 기존 호출처 호환 유지.
