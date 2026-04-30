/**
 * Audit Log 유틸 (S-13 절대 규칙).
 *
 * 모든 변경 API(POST/PUT/PATCH/DELETE)는 writeAuditLog()를 동시 호출한다.
 * 감사 로그 쓰기 실패는 비즈니스 로직을 막지 않는다 — 콘솔/모니터링 채널로 흘려보낸다.
 */

import { prisma } from "./prisma";

export type AuditAction =
  | "trip.create"
  | "trip.update"
  | "trip.delete"
  | "trip.mode_transition"
  | "itinerary.create"
  | "itinerary.update"
  | "itinerary.reorder"
  | "itinerary.delete"
  | "replan.options_generated"
  | "replan.commit"
  | "evidence.gathered"
  | "validation.completed"
  // M6 (사이클 9, ADR-022)
  | "checklist.add"
  | "checklist.update"
  | "checklist.delete"
  | "checklist.toggle"
  | "cost.add"
  | "cost.update"
  | "cost.delete"
  | "auth.login"
  | "auth.logout";

export interface AuditLogInput {
  actorId?: string | null;
  action: AuditAction | string;
  resource: string;
  resourceId: string;
  before?: unknown;
  after?: unknown;
  metadata?: Record<string, unknown>;
}

export async function writeAuditLog(input: AuditLogInput): Promise<void> {
  if (!prisma) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[AuditLog:demo]", input.action, input.resource, input.resourceId);
    }
    return;
  }

  try {
    await prisma.auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        action: input.action,
        resource: input.resource,
        resourceId: input.resourceId,
        before: input.before as never,
        after: input.after as never,
        metadata: input.metadata as never,
      },
    });
  } catch (err) {
    console.error("[AuditLog] write failed", err, {
      action: input.action,
      resource: input.resource,
      resourceId: input.resourceId,
    });
  }
}
