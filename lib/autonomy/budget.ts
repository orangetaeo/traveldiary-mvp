/**
 * 자율 모드 비용 트래킹 + 임계치 게이트 (사이클 AAAA2, ADR-047 트리거 2/3/6).
 *
 * R1 결정 (사이클 AAAA2):
 *   - 영속화: 메모리 파일 JSON `memory/usage_quota_YYYY-MM-DD.json` (cycle-counter.ts 답습)
 *   - DB 영속화 미룸 (AAAA3 트리거)
 *   - 임계치 3단계: warn (log+audit) / throw (BudgetExceededError) / emergency (AUTONOMY_PAUSED.flag)
 *   - auto-degrade (Opus→Sonnet→Haiku): AAAA3 미룸
 *
 * env override (6+1):
 *   USAGE_BUDGET_HOURLY_WARN ($3)  / USAGE_BUDGET_HOURLY_THROW ($6)
 *   USAGE_BUDGET_DAILY_WARN ($30)  / USAGE_BUDGET_DAILY_THROW ($50)  / USAGE_BUDGET_DAILY_EMERGENCY ($200)
 *   USAGE_BUDGET_DISABLED=1 (테스트/로컬 우회)
 *
 * 진입 경로: `lib/usage-quota.ts` `recordExternalCall(provider, { costUsd, ... })` → `recordSpend()`
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "fs";
import { join, resolve } from "path";
import { writeAuditLog } from "@/lib/audit-log";
import { getTzOffsetMs, getKstDateString, getMemoryDir } from "@/lib/autonomy/kst";
import { PAUSED_FLAG_REASONS } from "@/lib/autonomy/known-reasons";

export { getKstDateString };

export interface SpendRecord {
  provider: string;
  model?: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  now?: number;
}

export interface ProviderBucket {
  count: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  byModel?: Record<
    string,
    { count: number; inputTokens: number; outputTokens: number; costUsd: number }
  >;
}

export interface BudgetState {
  kstDate: string;
  totals: {
    count: number;
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
  };
  byProvider: Record<string, ProviderBucket>;
  /** KST 시간 0~23 버킷. 시간당 임계치 검사용 */
  hourly: Array<{ hour: number; costUsd: number; count: number }>;
  /**
   * 사이클 AAAA7: emergency 트리거 카운터 (운영 가시화).
   *
   * AAAA5b 가드: emergency 도달 시 audit/console.error 매번 + flag write 1회만.
   * 본 카운터는 일일 누적 — 비정상 반복 발생 시 신호 (예: 비용 폭증 후 대량 호출).
   */
  emergency?: {
    triggers: number; // 총 호출 (duplicate 포함)
    duplicates: number; // duplicate=true (이미 flag 존재) 카운트
    firstAt?: string; // ISO timestamp
    lastAt?: string;
  };
}

export interface BudgetThresholds {
  hourlyWarn: number;
  hourlyThrow: number;
  dailyWarn: number;
  dailyThrow: number;
  dailyEmergency: number;
  disabled: boolean;
}

function readEnvNumber(key: string, def: number): number {
  const raw = process.env[key];
  if (raw && /^\d+(\.\d+)?$/.test(raw)) {
    const n = Number.parseFloat(raw);
    if (n >= 0) return n;
  }
  return def;
}

export function getBudgetThresholds(): BudgetThresholds {
  return {
    hourlyWarn: readEnvNumber("USAGE_BUDGET_HOURLY_WARN", 3),
    hourlyThrow: readEnvNumber("USAGE_BUDGET_HOURLY_THROW", 6),
    dailyWarn: readEnvNumber("USAGE_BUDGET_DAILY_WARN", 30),
    dailyThrow: readEnvNumber("USAGE_BUDGET_DAILY_THROW", 50),
    dailyEmergency: readEnvNumber("USAGE_BUDGET_DAILY_EMERGENCY", 200),
    disabled: process.env.USAGE_BUDGET_DISABLED === "1",
  };
}

function getKstHour(now: number): number {
  return new Date(now + getTzOffsetMs()).getUTCHours();
}

export function getBudgetStatePath(
  now: number = Date.now(),
  dir: string = getMemoryDir(),
): string {
  return join(dir, `usage_quota_${getKstDateString(now)}.json`);
}

export function getPausedFlagPath(dir: string = getMemoryDir()): string {
  return join(dir, "AUTONOMY_PAUSED.flag");
}

/**
 * 손상된 파일을 격리 디렉토리로 이동 (사이클 AAAA3, T16 보안 권고).
 *
 * - 위치: `<memory_dir>/quarantine/` (`.gitignore`로 git 추적 차단)
 * - 파일명: `<basename>.corrupt-<ISO timestamp>` (충돌 시 ms 포함으로 자연 분리)
 * - 실패 시 console.error만 — 호출자 동작은 멈추지 않음 (디스크 풀 등)
 *
 * 사이클 AAAA4 P0 (R1 결정 — A+B 하이브리드):
 *   - 동일 srcPath 재시도 cap=3. 4차부터 rename 시도 skip.
 *   - cap 초과 시 `<dir>/quarantine/QUARANTINE_DEAD.flag` 영속 sentinel + audit 1회 (운영자 가시).
 *   - rename_failed audit도 path별 1회만 (audit log 폭증 차단 — T16+T12).
 *   - srcPath는 path.resolve()로 정규화 (T12 — 동일 파일이 다른 표기로 cap 우회 차단).
 *   - rename 성공 시 cap 카운터 + dedup 리셋 (디스크 일시 장애 회복 후 재손상 시 정상 cap).
 *
 * 향후 2번째 영역 등장 시 `lib/file-quarantine.ts`로 추출 (T13 권고, P3 백로그).
 */
const MAX_QUARANTINE_ATTEMPTS = 3;
const quarantineAttempts = new Map<string, number>();
const auditedQuarantineFailures = new Set<string>();

function getQuarantineDeadFlagPath(dir: string = getMemoryDir()): string {
  return join(dir, "quarantine", "QUARANTINE_DEAD.flag");
}

function quarantineFile(
  srcPath: string,
  reason: string,
  dir: string = getMemoryDir(),
): string | null {
  if (!existsSync(srcPath)) return null;

  const normalizedPath = resolve(srcPath);
  const attempts = (quarantineAttempts.get(normalizedPath) ?? 0) + 1;
  quarantineAttempts.set(normalizedPath, attempts);

  if (attempts > MAX_QUARANTINE_ATTEMPTS) {
    const dedupKey = `${normalizedPath}:cap_exceeded`;
    if (!auditedQuarantineFailures.has(dedupKey)) {
      auditedQuarantineFailures.add(dedupKey);
      try {
        const quarantineDir = join(dir, "quarantine");
        if (!existsSync(quarantineDir)) mkdirSync(quarantineDir, { recursive: true });
        writeFileSync(
          getQuarantineDeadFlagPath(dir),
          JSON.stringify(
            {
              srcPath: normalizedPath,
              reason,
              attempts,
              cap: MAX_QUARANTINE_ATTEMPTS,
              failedAt: new Date().toISOString(),
            },
            null,
            2,
          ) + "\n",
          "utf-8",
        );
      } catch (err) {
        // sentinel 작성 자체 실패는 silent (R1: 인메모리 cap이 1차 방어선이므로 충분)
        console.error("[budget] failed to write QUARANTINE_DEAD.flag:", err);
      }
      void writeAuditLog({
        action: "quarantine.cap_exceeded",
        resource: "quarantine_file",
        resourceId: normalizedPath,
        metadata: {
          srcPath: normalizedPath,
          reason,
          attempts,
          cap: MAX_QUARANTINE_ATTEMPTS,
          severity: "security",
        },
      });
      console.error(
        `[budget] quarantine cap exceeded (${attempts}/${MAX_QUARANTINE_ATTEMPTS}) for ${normalizedPath} — DEAD flag written`,
      );
    }
    return null;
  }

  try {
    const quarantineDir = join(dir, "quarantine");
    if (!existsSync(quarantineDir)) mkdirSync(quarantineDir, { recursive: true });
    const basename = srcPath.split(/[\\/]/).pop() ?? "unknown";
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const targetPath = join(quarantineDir, `${basename}.corrupt-${stamp}`);
    renameSync(srcPath, targetPath);
    console.error(`[budget] quarantined corrupt file: ${srcPath} → ${targetPath} (${reason})`);
    quarantineAttempts.delete(normalizedPath);
    auditedQuarantineFailures.delete(`${normalizedPath}:rename_failed`);
    auditedQuarantineFailures.delete(`${normalizedPath}:cap_exceeded`);
    return targetPath;
  } catch (err) {
    const dedupKey = `${normalizedPath}:rename_failed`;
    if (!auditedQuarantineFailures.has(dedupKey)) {
      auditedQuarantineFailures.add(dedupKey);
      void writeAuditLog({
        action: "quarantine.rename_failed",
        resource: "quarantine_file",
        resourceId: normalizedPath,
        metadata: {
          srcPath: normalizedPath,
          reason,
          attempts,
          error: err instanceof Error ? err.message : String(err),
          severity: "security",
        },
      });
    }
    console.error(
      `[budget] quarantine rename failed for ${srcPath} (attempt ${attempts}/${MAX_QUARANTINE_ATTEMPTS}):`,
      err,
    );
    return null;
  }
}

function defaultState(now: number): BudgetState {
  return {
    kstDate: getKstDateString(now),
    totals: { count: 0, inputTokens: 0, outputTokens: 0, costUsd: 0 },
    byProvider: {},
    hourly: [],
  };
}

export function readBudgetState(
  now: number = Date.now(),
  dir: string = getMemoryDir(),
): BudgetState {
  const path = getBudgetStatePath(now, dir);
  if (!existsSync(path)) return defaultState(now);
  try {
    const raw = readFileSync(path, "utf-8");
    const parsed = JSON.parse(raw) as Partial<BudgetState>;
    const expectedDate = getKstDateString(now);
    if (parsed.kstDate !== expectedDate) return defaultState(now);
    return {
      kstDate: parsed.kstDate,
      totals: parsed.totals ?? defaultState(now).totals,
      byProvider: parsed.byProvider ?? {},
      hourly: parsed.hourly ?? [],
      emergency: parsed.emergency,
    };
  } catch (err) {
    // 사이클 AAAA3: 손상 파일 quarantine + audit (이전: silent default)
    const quarantinedPath = quarantineFile(path, "state.parse_failed", dir);
    void writeAuditLog({
      action: "usage.budget.state_corrupt",
      resource: "usage_budget",
      resourceId: "state_file",
      metadata: {
        path,
        quarantinedPath,
        error: err instanceof Error ? err.message : String(err),
        severity: "security",
      },
    });
    return defaultState(now);
  }
}

function writeBudgetState(state: BudgetState, dir: string): void {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const path = join(dir, `usage_quota_${state.kstDate}.json`);
  writeFileSync(path, JSON.stringify(state, null, 2) + "\n", "utf-8");
}

export class BudgetExceededError extends Error {
  readonly tier: "hourly" | "daily" | "emergency";
  readonly currentUsd: number;
  readonly thresholdUsd: number;
  constructor(
    tier: "hourly" | "daily" | "emergency",
    currentUsd: number,
    thresholdUsd: number,
  ) {
    super(
      `Budget threshold exceeded (${tier}): $${currentUsd.toFixed(4)} >= $${thresholdUsd}`,
    );
    this.name = "BudgetExceededError";
    this.tier = tier;
    this.currentUsd = currentUsd;
    this.thresholdUsd = thresholdUsd;
  }
}

export class AutonomyPausedError extends Error {
  readonly reason: string;
  readonly pausedAt: string;
  constructor(flag: { pausedAt: string; reason: string }) {
    super(`Autonomy paused: ${flag.reason} at ${flag.pausedAt}`);
    this.name = "AutonomyPausedError";
    this.reason = flag.reason;
    this.pausedAt = flag.pausedAt;
  }
}

export function getHourlySpend(
  state: BudgetState,
  now: number = Date.now(),
): number {
  const hour = getKstHour(now);
  return state.hourly.find((h) => h.hour === hour)?.costUsd ?? 0;
}

export function getDailySpend(state: BudgetState): number {
  return state.totals.costUsd;
}

/**
 * 외부 호출 비용 누적 + 사후 audit.
 *
 * 설계 분리 (R1 결정):
 *   - `recordSpend`: 누적 + audit (warn/throw/emergency 모두 audit, throw 안 함)
 *   - `assertBudget`: 외부 호출 전 사전 게이트 (throw 책임). emergency는 flag 생성.
 *
 * 이렇게 분리하면: 외부 호출이 이미 성공한 응답은 버리지 않고, "다음 호출"부터 차단.
 */
export function recordSpend(
  input: SpendRecord,
  dir: string = getMemoryDir(),
): void {
  const t = getBudgetThresholds();
  if (t.disabled) return;

  // 사이클 AAAA3: 입력 가드 (T16 보안 권고). 음수/NaN/Infinity는 audit + silent skip.
  // 외부 응답은 이미 받았으므로 호출자 영향 0, 누적만 0 처리.
  if (
    !Number.isFinite(input.costUsd) ||
    input.costUsd < 0 ||
    !Number.isFinite(input.inputTokens) ||
    input.inputTokens < 0 ||
    !Number.isFinite(input.outputTokens) ||
    input.outputTokens < 0
  ) {
    void writeAuditLog({
      action: "usage.budget.invalid_input",
      resource: "usage_budget",
      resourceId: input.provider,
      metadata: {
        provider: input.provider,
        model: input.model,
        costUsd: Number.isFinite(input.costUsd) ? input.costUsd : String(input.costUsd),
        inputTokens: Number.isFinite(input.inputTokens) ? input.inputTokens : String(input.inputTokens),
        outputTokens: Number.isFinite(input.outputTokens) ? input.outputTokens : String(input.outputTokens),
        severity: "security",
      },
    });
    return;
  }

  const now = input.now ?? Date.now();
  const state = readBudgetState(now, dir);

  // 누적
  state.totals.count += 1;
  state.totals.inputTokens += input.inputTokens;
  state.totals.outputTokens += input.outputTokens;
  state.totals.costUsd += input.costUsd;

  let provBucket = state.byProvider[input.provider];
  if (!provBucket) {
    provBucket = {
      count: 0,
      inputTokens: 0,
      outputTokens: 0,
      costUsd: 0,
      byModel: {},
    };
    state.byProvider[input.provider] = provBucket;
  }
  provBucket.count += 1;
  provBucket.inputTokens += input.inputTokens;
  provBucket.outputTokens += input.outputTokens;
  provBucket.costUsd += input.costUsd;
  if (input.model) {
    provBucket.byModel ??= {};
    let modelBucket = provBucket.byModel[input.model];
    if (!modelBucket) {
      modelBucket = { count: 0, inputTokens: 0, outputTokens: 0, costUsd: 0 };
      provBucket.byModel[input.model] = modelBucket;
    }
    modelBucket.count += 1;
    modelBucket.inputTokens += input.inputTokens;
    modelBucket.outputTokens += input.outputTokens;
    modelBucket.costUsd += input.costUsd;
  }

  const hour = getKstHour(now);
  let hourBucket = state.hourly.find((h) => h.hour === hour);
  if (!hourBucket) {
    hourBucket = { hour, costUsd: 0, count: 0 };
    state.hourly.push(hourBucket);
  }
  hourBucket.costUsd += input.costUsd;
  hourBucket.count += 1;

  writeBudgetState(state, dir);

  // 누적 후 임계치 도달 시 audit + emergency flag (throw 안 함, assertBudget 책임)
  const hourly = hourBucket.costUsd;
  const daily = state.totals.costUsd;

  if (t.dailyEmergency > 0 && daily >= t.dailyEmergency) {
    triggerEmergency(daily, t.dailyEmergency, dir, now);
    return;
  }
  if (t.dailyThrow > 0 && daily >= t.dailyThrow) {
    triggerThrow("daily", daily, t.dailyThrow);
    return;
  }
  if (t.hourlyThrow > 0 && hourly >= t.hourlyThrow) {
    triggerThrow("hourly", hourly, t.hourlyThrow);
    return;
  }
  if (t.dailyWarn > 0 && daily >= t.dailyWarn) {
    triggerWarn("daily", daily, t.dailyWarn);
    return;
  }
  if (t.hourlyWarn > 0 && hourly >= t.hourlyWarn) {
    triggerWarn("hourly", hourly, t.hourlyWarn);
  }
}

/**
 * 외부 API 호출 전 사전 게이트 (R1 결정 — `assertQuota`와 같은 위치).
 *
 * - emergency 도달: AutonomyPausedError (자율 모드 정지)
 * - daily/hourly throw 도달: BudgetExceededError (호출자가 demo fallback)
 * - warn 단계는 통과 (정상 진행)
 */
export function assertBudget(
  now: number = Date.now(),
  dir: string = getMemoryDir(),
): void {
  const t = getBudgetThresholds();
  if (t.disabled) return;

  // emergency flag 우선 검사. 사이클 AAAA3: budget.emergency + flag.corrupt + manual 모두 throw.
  // (readAutonomyPausedFlag는 손상 시 sentinel `{reason: "flag.corrupt"}` 반환 → fail-closed)
  const flag = readAutonomyPausedFlag(dir);
  if (flag) {
    throw new AutonomyPausedError(flag);
  }

  const state = readBudgetState(now, dir);
  const daily = state.totals.costUsd;
  const hourly = getHourlySpend(state, now);

  if (t.dailyThrow > 0 && daily >= t.dailyThrow) {
    throw new BudgetExceededError("daily", daily, t.dailyThrow);
  }
  if (t.hourlyThrow > 0 && hourly >= t.hourlyThrow) {
    throw new BudgetExceededError("hourly", hourly, t.hourlyThrow);
  }
}

function triggerWarn(
  tier: "hourly" | "daily",
  current: number,
  threshold: number,
): void {
  console.warn(
    `[budget] ${tier} warn: $${current.toFixed(4)} >= $${threshold}`,
  );
  void writeAuditLog({
    action: "usage.budget.warn",
    resource: "usage_budget",
    resourceId: tier,
    metadata: { tier, current, threshold },
  });
}

function triggerThrow(
  tier: "hourly" | "daily",
  current: number,
  threshold: number,
): void {
  console.error(
    `[budget] ${tier} throw: $${current.toFixed(4)} >= $${threshold}`,
  );
  void writeAuditLog({
    action: "usage.budget.throw",
    resource: "usage_budget",
    resourceId: tier,
    metadata: { tier, current, threshold },
  });
}

function triggerEmergency(
  current: number,
  threshold: number,
  dir: string,
  now: number = Date.now(),
): void {
  // 사이클 AAAA5b: 중복 가드 (T16 옵션 E).
  // - audit + console.error는 매번 (보안 신호 dedup 금지 — 반복 발생은 그 자체로 시그널)
  // - flag write만 skip (이미 존재 시) — 최초 emergency 시각(pausedAt) 보존
  console.error(
    `[budget] EMERGENCY: $${current.toFixed(4)} >= $${threshold} — autonomy paused`,
  );
  const flagPath = getPausedFlagPath(dir);
  const flagAlreadyExists = existsSync(flagPath);
  void writeAuditLog({
    action: "usage.budget.emergency",
    resource: "usage_budget",
    resourceId: "emergency",
    metadata: {
      current,
      threshold,
      duplicate: flagAlreadyExists, // AAAA5b: 운영자 가시화 — 반복 트리거 추적
    },
  });

  // 사이클 AAAA7: emergency 카운터 영속화 (BudgetState.emergency).
  // duplicate 호출도 카운트 증가 — 비정상 반복(비용 폭증 후 다량 호출)을 dashboard에서 가시.
  try {
    const state = readBudgetState(now, dir);
    const nowIso = new Date(now).toISOString();
    const e = state.emergency ?? { triggers: 0, duplicates: 0 };
    e.triggers += 1;
    if (flagAlreadyExists) e.duplicates += 1;
    e.firstAt ??= nowIso;
    e.lastAt = nowIso;
    state.emergency = e;
    writeBudgetState(state, dir);
  } catch (err) {
    console.error("[budget] failed to persist emergency counter:", err);
  }

  if (flagAlreadyExists) return; // write skip — pausedAt 보존
  try {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(
      flagPath,
      JSON.stringify(
        {
          pausedAt: new Date().toISOString(),
          reason: "budget.emergency",
          currentUsd: current,
          thresholdUsd: threshold,
        },
        null,
        2,
      ) + "\n",
      "utf-8",
    );
  } catch (err) {
    console.error("[budget] failed to write AUTONOMY_PAUSED.flag:", err);
  }
}

export interface PausedFlag {
  pausedAt: string;
  reason: string;
  currentUsd?: number;
  thresholdUsd?: number;
}

export function isAutonomyPaused(dir: string = getMemoryDir()): boolean {
  return existsSync(getPausedFlagPath(dir));
}

/**
 * AUTONOMY_PAUSED.flag 읽기 (사이클 AAAA3: fail-closed).
 *
 * - 정상 JSON → PausedFlag 반환
 * - 파일 없음 → null
 * - **JSON 손상**: quarantine + audit + sentinel `{reason: "flag.corrupt", ...}` 반환
 *   (호출자 `assertAutonomyEntry`가 sentinel을 보고 `AutonomyPausedError` throw하여 자율 진입 차단)
 *
 * 이전(AAAA2)은 catch → null 반환 (fail-open). T12 NON-BLOCKING + T16 BLOCKING으로 fail-closed 전환.
 */
export function readAutonomyPausedFlag(
  dir: string = getMemoryDir(),
): PausedFlag | null {
  const path = getPausedFlagPath(dir);
  if (!existsSync(path)) return null;
  try {
    const raw = readFileSync(path, "utf-8");
    const parsed = JSON.parse(raw) as PausedFlag;
    // 정상 reason 화이트리스트 (T12 권고). 사이클 AAAA8: lib/autonomy/known-reasons로 박제.
    if (!parsed.reason || !(PAUSED_FLAG_REASONS as readonly string[]).includes(parsed.reason)) {
      // 알 수 없는 reason도 fail-closed (안전 우선)
      const quarantinedPath = quarantineFile(path, "flag.unknown_reason", dir);
      void writeAuditLog({
        action: "autonomy.flag_corrupt",
        resource: "autonomy_paused_flag",
        resourceId: "unknown_reason",
        metadata: {
          path,
          quarantinedPath,
          parsedReason: parsed.reason,
          severity: "security",
        },
      });
      return {
        pausedAt: new Date().toISOString(),
        reason: "flag.corrupt",
      };
    }
    return parsed;
  } catch (err) {
    // JSON parse 실패 → quarantine + sentinel 반환 (fail-closed)
    const quarantinedPath = quarantineFile(path, "flag.parse_failed", dir);
    void writeAuditLog({
      action: "autonomy.flag_corrupt",
      resource: "autonomy_paused_flag",
      resourceId: "parse_failed",
      metadata: {
        path,
        quarantinedPath,
        error: err instanceof Error ? err.message : String(err),
        severity: "security",
      },
    });
    return {
      pausedAt: new Date().toISOString(),
      reason: "flag.corrupt",
    };
  }
}

export function clearAutonomyPausedFlag(dir: string = getMemoryDir()): void {
  const path = getPausedFlagPath(dir);
  if (existsSync(path)) unlinkSync(path);
}

export function __resetBudgetForTests(dir?: string): void {
  if (process.env.NODE_ENV !== "test" && process.env.VITEST !== "true") {
    throw new Error(
      "__resetBudgetForTests is only callable from test environment",
    );
  }
  const targetDir = dir ?? getMemoryDir();
  // glob 삭제: 테스트가 고정 now로 파일을 생성하면 Date.now() 기준 경로와 불일치할 수 있음
  if (existsSync(targetDir)) {
    for (const f of readdirSync(targetDir)) {
      if (f.startsWith("usage_quota_") && f.endsWith(".json")) {
        unlinkSync(join(targetDir, f));
      }
    }
  }
  const flagPath = getPausedFlagPath(targetDir);
  if (existsSync(flagPath)) unlinkSync(flagPath);
}

// 사이클 AAAA4 P0: 인메모리 quarantine cap/dedup 리셋 (테스트 격리용).
export function __resetQuarantineForTests(): void {
  if (process.env.NODE_ENV !== "test" && process.env.VITEST !== "true") {
    throw new Error(
      "__resetQuarantineForTests is only callable from test environment",
    );
  }
  quarantineAttempts.clear();
  auditedQuarantineFailures.clear();
}

// 사이클 AAAA5a: dedup Set size 단언으로 audit 1회 호출 검증 (T12 NON-BLOCKING #1, R1 옵션 C).
// vi.spyOn(audit-log) ESM 비호환 답습 회피 — readonly snapshot 반환.
export function __getQuarantineDedupSetForTests(): {
  attempts: ReadonlyMap<string, number>;
  dedup: ReadonlySet<string>;
} {
  if (process.env.NODE_ENV !== "test" && process.env.VITEST !== "true") {
    throw new Error(
      "__getQuarantineDedupSetForTests is only callable from test environment",
    );
  }
  return {
    attempts: new Map(quarantineAttempts),
    dedup: new Set(auditedQuarantineFailures),
  };
}

export { MAX_QUARANTINE_ATTEMPTS, getQuarantineDeadFlagPath };
