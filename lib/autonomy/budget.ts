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
  renameSync,
  unlinkSync,
  writeFileSync,
} from "fs";
import { join } from "path";
import { writeAuditLog } from "@/lib/audit-log";

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

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

function getMemoryDir(): string {
  return process.env.AUTONOMY_MEMORY_DIR ?? join(process.cwd(), "memory");
}

export function getKstDateString(now: number = Date.now()): string {
  const kst = new Date(now + KST_OFFSET_MS);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const d = String(kst.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getKstHour(now: number): number {
  return new Date(now + KST_OFFSET_MS).getUTCHours();
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
 * 향후 2번째 영역 등장 시 `lib/file-quarantine.ts`로 추출 (T13 권고).
 */
function quarantineFile(
  srcPath: string,
  reason: string,
  dir: string = getMemoryDir(),
): string | null {
  if (!existsSync(srcPath)) return null;
  try {
    const quarantineDir = join(dir, "quarantine");
    if (!existsSync(quarantineDir)) mkdirSync(quarantineDir, { recursive: true });
    const basename = srcPath.split(/[\\/]/).pop() ?? "unknown";
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const targetPath = join(quarantineDir, `${basename}.corrupt-${stamp}`);
    renameSync(srcPath, targetPath);
    console.error(`[budget] quarantined corrupt file: ${srcPath} → ${targetPath} (${reason})`);
    return targetPath;
  } catch (err) {
    console.error(`[budget] quarantine rename failed for ${srcPath}:`, err);
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
    triggerEmergency(daily, t.dailyEmergency, dir);
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
): void {
  console.error(
    `[budget] EMERGENCY: $${current.toFixed(4)} >= $${threshold} — autonomy paused`,
  );
  void writeAuditLog({
    action: "usage.budget.emergency",
    resource: "usage_budget",
    resourceId: "emergency",
    metadata: { current, threshold },
  });
  try {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(
      getPausedFlagPath(dir),
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
    // 정상 reason 화이트리스트 (T12 권고)
    const KNOWN_REASONS = ["budget.emergency", "manual", "flag.corrupt"];
    if (!parsed.reason || !KNOWN_REASONS.includes(parsed.reason)) {
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
  const path = getBudgetStatePath(Date.now(), targetDir);
  if (existsSync(path)) unlinkSync(path);
  const flagPath = getPausedFlagPath(targetDir);
  if (existsSync(flagPath)) unlinkSync(flagPath);
}
