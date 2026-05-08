/**
 * Audit Log Repository — 범용 감사 로그 조회.
 *
 * admin /logs 페이지에서 사용. 기존 도메인별 리포지토리(funnel/affiliate 등)와
 * 달리 action/resource 필터 없이 전체 로그를 페이지네이션 조회.
 *
 * 정책:
 *   - prisma 미연결 시 null 반환 → 호출처에서 "DB 미연결" UI.
 *   - before/after/metadata JSON은 그대로 반환 (이미 sanitize 후 저장됨).
 */

import "server-only";

import { prisma } from "../prisma";
import {
  buildWindowCutoffFilter,
  type WindowOption,
} from "../admin/window-filter";

export interface AuditLogRow {
  id: string;
  actorId: string | null;
  action: string;
  resource: string;
  resourceId: string;
  before: unknown;
  after: unknown;
  metadata: unknown;
  createdAt: Date;
}

export interface AuditLogQueryOptions {
  /** action prefix 필터 (예: "trip", "cost" → "trip.%" like) */
  actionPrefix?: string;
  /** 시간 윈도우 (7일/30일/전체) */
  windowDays?: WindowOption;
  /** 페이지네이션 */
  limit?: number;
  offset?: number;
}

export interface AuditLogListResult {
  rows: AuditLogRow[];
  total: number;
}

/**
 * 감사 로그 페이지네이션 조회. createdAt 내림차순.
 */
export async function listAuditLogs(
  options: AuditLogQueryOptions = {},
): Promise<AuditLogListResult | null> {
  if (!prisma) return null;

  const limit = options.limit ?? 50;
  const offset = options.offset ?? 0;

  try {
    const where = {
      ...buildWindowCutoffFilter(options.windowDays),
      ...(options.actionPrefix
        ? { action: { startsWith: options.actionPrefix } }
        : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      rows: rows.map((r) => ({
        id: r.id,
        actorId: r.actorId,
        action: r.action,
        resource: r.resource,
        resourceId: r.resourceId,
        before: r.before,
        after: r.after,
        metadata: r.metadata,
        createdAt: r.createdAt,
      })),
      total,
    };
  } catch (err) {
    console.error("[audit-log.repository] listAuditLogs failed", err);
    return null;
  }
}
