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
  /** 사이클 1 (G6) — user_other 자유 입력. UI 200자 제한. */
  userNote?: string;
}

export interface ModeTransitionDestinationStat {
  /** IATA-like 도시 코드 (시드 destinationCode) 또는 "unknown" */
  code: string;
  total: number;
  applied: number;
  skipped: number;
}

export interface ModeTransitionStats {
  totalAttempts: number;
  applied: number;
  skipped: number;
  /** 0~100 정수, totalAttempts=0이면 0 */
  successRate: number;
  byReason: Array<{ reason: ModeTransitionSkipReason; count: number }>;
  byTrigger: Array<{ trigger: ModeTransitionTrigger | "unknown"; count: number }>;
  /** 사이클 RR — 도시별 시도 분포 (count 내림차순) */
  byDestinationCode: ModeTransitionDestinationStat[];
  recent: ModeTransitionStatRow[];
  /** 사이클 RR — 적용된 시간 윈도우 (일 단위). undefined = 전체 */
  windowDays?: number;
}

export interface AggregateOptions {
  recentLimit?: number;
  /** 사이클 RR — 메타로 결과에 포함될 windowDays (집계 자체는 호출자가 사전 필터링) */
  windowDays?: number;
}

/** 순수 집계 함수 (DB 미터치) — 테스트 용도 */
export function aggregateModeTransitionStats(
  rows: RawAuditRow[],
  optionsOrLimit: AggregateOptions | number = {},
): ModeTransitionStats {
  const options: AggregateOptions =
    typeof optionsOrLimit === "number"
      ? { recentLimit: optionsOrLimit }
      : optionsOrLimit;
  const recentLimit = options.recentLimit ?? 20;
  const items: ModeTransitionStatRow[] = rows.map((r) => {
    const meta = (r.metadata ?? {}) as {
      trigger?: string;
      outcome?: string;
      skipReason?: string;
      destinationCode?: string;
      dDay?: number;
      boundaryHit?: boolean;
      userNote?: string;
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
      userNote:
        typeof meta.userNote === "string" && meta.userNote.length > 0
          ? meta.userNote.slice(0, 200)
          : undefined,
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

  // 사이클 RR — 도시별 분포. destinationCode 누락은 "unknown" 그룹.
  // outcome=applied/skipped 행만 카운트 (legacy unknown outcome 제외 — totalAttempts 정의와 정합).
  const destMap = new Map<string, { applied: number; skipped: number }>();
  for (const it of items) {
    if (it.outcome !== "applied" && it.outcome !== "skipped") continue;
    const code = it.destinationCode ?? "unknown";
    const cur = destMap.get(code) ?? { applied: 0, skipped: 0 };
    if (it.outcome === "applied") cur.applied += 1;
    else cur.skipped += 1;
    destMap.set(code, cur);
  }
  const byDestinationCode: ModeTransitionDestinationStat[] = Array.from(
    destMap.entries(),
  )
    .map(([code, v]) => ({
      code,
      total: v.applied + v.skipped,
      applied: v.applied,
      skipped: v.skipped,
    }))
    .sort((a, b) => b.total - a.total);

  return {
    totalAttempts,
    applied,
    skipped,
    successRate:
      totalAttempts === 0 ? 0 : Math.round((applied / totalAttempts) * 100),
    byReason,
    byTrigger,
    byDestinationCode,
    recent: items.slice(0, recentLimit),
    windowDays: options.windowDays,
  };
}

export interface ModeTransitionStatsOptions {
  /** 최근 N건 표시 (default 20) */
  limit?: number;
  /** 사이클 RR — 시간 윈도우 일 수. undefined = 전체 */
  windowDays?: number;
}

export async function getModeTransitionStats(
  options: ModeTransitionStatsOptions | number = {},
): Promise<ModeTransitionStats | null> {
  // 호환: 기존 number 시그니처 fallback
  const opts: ModeTransitionStatsOptions =
    typeof options === "number" ? { limit: options } : options;
  const { limit = 20, windowDays } = opts;

  if (!prisma) return null;
  try {
    const where: { action: string; createdAt?: { gte: Date } } = {
      action: "trip.mode_transition",
    };
    if (typeof windowDays === "number" && windowDays > 0) {
      const cutoffMs = Date.now() - windowDays * 24 * 60 * 60 * 1000;
      where.createdAt = { gte: new Date(cutoffMs) };
    }
    const rows = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 500,
    });
    return aggregateModeTransitionStats(
      rows.map((r) => ({
        id: r.id,
        createdAt: r.createdAt,
        metadata: r.metadata,
      })),
      { recentLimit: limit, windowDays },
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
  // 사이클 1 (G6, 2026-05-06) — 사용자 명시 거부. lib/mode-transition.ts와 동기.
  "user_postponed_for_now",
  "user_confused_ui",
  "user_other",
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
