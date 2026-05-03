/**
 * Mode Transition AuditLog 집계 — 사이클 PP.
 *
 * AuditLog.action="trip.mode_transition" 행을 outcome × skipReason × trigger로 집계.
 * 좌표·정확도 같은 leak 키는 AAA `buildModeTransitionMetadata` 화이트리스트 단계에서
 * 이미 차단됐으므로 raw row를 신뢰해도 안전.
 */

import "server-only";

import { prisma } from "../prisma";
import type {
  ModeTransitionOutcome,
  ModeTransitionSkipReason,
  ModeTransitionTrigger,
} from "../mode-transition";

interface RawAuditRow {
  id: string;
  createdAt: Date;
  metadata: unknown;
}

export interface ModeTransitionStatRow {
  id: string;
  createdAt: string;
  trigger: ModeTransitionTrigger | "unknown";
  outcome: ModeTransitionOutcome | "unknown";
  skipReason?: ModeTransitionSkipReason;
  destinationCode?: string;
  dDay?: number;
  boundaryHit?: boolean;
}

export interface ModeTransitionStats {
  totalAttempts: number;
  applied: number;
  skipped: number;
  /** 0~100 정수, totalAttempts=0이면 0 */
  successRate: number;
  byReason: Array<{ reason: ModeTransitionSkipReason; count: number }>;
  byTrigger: Array<{ trigger: ModeTransitionTrigger | "unknown"; count: number }>;
  recent: ModeTransitionStatRow[];
}

/** 순수 집계 함수 (DB 미터치) — 테스트 용도 */
export function aggregateModeTransitionStats(
  rows: RawAuditRow[],
  recentLimit = 20,
): ModeTransitionStats {
  const items: ModeTransitionStatRow[] = rows.map((r) => {
    const meta = (r.metadata ?? {}) as {
      trigger?: string;
      outcome?: string;
      skipReason?: string;
      destinationCode?: string;
      dDay?: number;
      boundaryHit?: boolean;
    };
    return {
      id: r.id,
      createdAt: r.createdAt.toISOString(),
      trigger: normalizeTrigger(meta.trigger),
      outcome: normalizeOutcome(meta.outcome),
      skipReason: normalizeSkipReason(meta.skipReason),
      destinationCode: meta.destinationCode,
      dDay: typeof meta.dDay === "number" ? meta.dDay : undefined,
      boundaryHit:
        typeof meta.boundaryHit === "boolean" ? meta.boundaryHit : undefined,
    };
  });

  const applied = items.filter((it) => it.outcome === "applied").length;
  const skipped = items.filter((it) => it.outcome === "skipped").length;
  const totalAttempts = applied + skipped;

  const reasonMap = new Map<ModeTransitionSkipReason, number>();
  for (const it of items) {
    if (it.outcome === "skipped" && it.skipReason) {
      reasonMap.set(it.skipReason, (reasonMap.get(it.skipReason) ?? 0) + 1);
    }
  }
  const byReason = Array.from(reasonMap.entries())
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);

  const triggerMap = new Map<ModeTransitionTrigger | "unknown", number>();
  for (const it of items) {
    triggerMap.set(it.trigger, (triggerMap.get(it.trigger) ?? 0) + 1);
  }
  const byTrigger = Array.from(triggerMap.entries())
    .map(([trigger, count]) => ({ trigger, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalAttempts,
    applied,
    skipped,
    successRate:
      totalAttempts === 0 ? 0 : Math.round((applied / totalAttempts) * 100),
    byReason,
    byTrigger,
    recent: items.slice(0, recentLimit),
  };
}

export async function getModeTransitionStats(
  limit = 20,
): Promise<ModeTransitionStats | null> {
  if (!prisma) return null;
  try {
    const rows = await prisma.auditLog.findMany({
      where: { action: "trip.mode_transition" },
      orderBy: { createdAt: "desc" },
      take: 500,
    });
    return aggregateModeTransitionStats(
      rows.map((r) => ({
        id: r.id,
        createdAt: r.createdAt,
        metadata: r.metadata,
      })),
      limit,
    );
  } catch (err) {
    console.error("[mode-transition-stats] getStats failed", err);
    return null;
  }
}

const VALID_TRIGGERS: ReadonlySet<string> = new Set<ModeTransitionTrigger>([
  "manual",
  "geolocation",
]);
const VALID_OUTCOMES: ReadonlySet<string> = new Set<ModeTransitionOutcome>([
  "applied",
  "skipped",
]);
const VALID_SKIP_REASONS: ReadonlySet<string> = new Set<ModeTransitionSkipReason>([
  "not_in_destination",
  "not_yet_started",
  "already_in_mode",
  "geolocation_unsupported",
  "geolocation_denied",
  "geolocation_unavailable",
]);

function normalizeTrigger(v: unknown): ModeTransitionTrigger | "unknown" {
  return typeof v === "string" && VALID_TRIGGERS.has(v)
    ? (v as ModeTransitionTrigger)
    : "unknown";
}

function normalizeOutcome(v: unknown): ModeTransitionOutcome | "unknown" {
  return typeof v === "string" && VALID_OUTCOMES.has(v)
    ? (v as ModeTransitionOutcome)
    : "unknown";
}

function normalizeSkipReason(v: unknown): ModeTransitionSkipReason | undefined {
  return typeof v === "string" && VALID_SKIP_REASONS.has(v)
    ? (v as ModeTransitionSkipReason)
    : undefined;
}
