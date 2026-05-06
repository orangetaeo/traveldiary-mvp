/**
 * Audit Log 유틸 (S-13 절대 규칙).
 *
 * 모든 변경 API(POST/PUT/PATCH/DELETE)는 writeAuditLog()를 동시 호출한다.
 * 감사 로그 쓰기 실패는 비즈니스 로직을 막지 않는다 — 콘솔/모니터링 채널로 흘려보낸다.
 *
 * 사이클 ZZZ: before/after/metadata는 sanitizeAuditValue()로 secret 키 redact 후 저장.
 */

import { prisma } from "./prisma";

const SENSITIVE_KEY_PATTERNS: readonly RegExp[] = [
  /password/i,
  /passwd/i,
  /secret/i,
  /token/i,
  /api[_-]?key/i,
  /authorization/i,
  /bearer/i,
  /cookie/i,
  /session(?:[_-]?id)?/i,
  /credential/i,
  /private[_-]?key/i,
  /access[_-]?key/i,
  /refresh[_-]?token/i,
];

const REDACTED = "[REDACTED]";
const MAX_DEPTH = 6;

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERNS.some((p) => p.test(key));
}

export function sanitizeAuditValue(value: unknown, depth = 0): unknown {
  if (depth > MAX_DEPTH) return "[DEEP]";
  if (value === null || value === undefined) return value;
  if (typeof value !== "object") return value;
  if (Array.isArray(value)) {
    return value.map((v) => sanitizeAuditValue(v, depth + 1));
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = isSensitiveKey(k) ? REDACTED : sanitizeAuditValue(v, depth + 1);
  }
  return out;
}

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
  | "checklist.bulk_toggle"
  | "checklist.bulk_delete"
  | "checklist.reorder"
  | "cost.add"
  | "cost.update"
  | "cost.delete"
  // M7 (사이클 11a, ADR-024)
  | "share.create"
  | "share.revoke"
  | "share.access"
  // M7 사이클 R (ADR-036) — 익명 협업
  | "comment.create"
  | "comment.delete"
  | "reaction.toggle"
  // M8 (사이클 12a, ADR-025)
  | "affiliate.click"
  // 사이클 5 (G8) — OTA 결제 후 reentry self-report (BLOCKER 7 webhook 부재 시 사용자 신호)
  | "affiliate.confirmed"
  | "affiliate.declined"
  | "auth.login"
  | "auth.logout"
  // 자율 모드 비용 거버넌스 (사이클 AAAA2, ADR-047)
  | "usage.budget.warn"
  | "usage.budget.throw"
  | "usage.budget.emergency"
  | "opus.gate.bypass"
  // 자율 모드 안전 회로 (사이클 AAAA3 — fail-closed + quarantine + 입력 가드)
  | "usage.budget.invalid_input"
  | "usage.budget.state_corrupt"
  | "autonomy.flag_corrupt"
  // 사이클 AAAA4 P0 — quarantine 무한 루프 가드
  | "quarantine.rename_failed"
  | "quarantine.cap_exceeded"
  // 사이클 AAAA10 — hours gate 테스트 우회 추적
  | "autonomy.hours_gate_bypassed";

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
        before: sanitizeAuditValue(input.before) as never,
        after: sanitizeAuditValue(input.after) as never,
        metadata: sanitizeAuditValue(input.metadata) as never,
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
