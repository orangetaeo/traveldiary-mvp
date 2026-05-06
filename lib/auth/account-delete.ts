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

/** 텍스트 confirm 입력값 검증 — 클라이언트 + 서버 공통 사용. */
export const ACCOUNT_DELETE_CONFIRM_PHRASE = "계정 삭제";

export function isValidAccountDeleteConfirm(input: unknown): boolean {
  return typeof input === "string" && input.trim() === ACCOUNT_DELETE_CONFIRM_PHRASE;
}
