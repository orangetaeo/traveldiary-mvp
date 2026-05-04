/**
 * 자율 모드 일일 사이클 카운터 (사이클 AAAA1).
 *
 * AUTONOMY.md §0.5 — 일일 사이클 캡 10건 게이트.
 * 메모리 파일 기반: `memory/autonomy_counter_YYYY-MM-DD.json` (KST 기준 일자).
 * 파일명에 KST 일자가 박혀 있어 자정 = 새 파일 = 카운트 0부터 자동 리셋.
 *
 * 사용:
 *   import { assertCycleCap, incrementCycleCount } from "@/lib/autonomy/cycle-counter";
 *
 *   // 사이클 시작 전 (T19 STEP 1)
 *   assertCycleCap();
 *
 *   // 사이클 종료 후 (T18 STEP 5)
 *   incrementCycleCount("AAAA1");
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { AutonomyPausedError, readAutonomyPausedFlag } from "./budget";
import {
  getTzOffsetMs,
  getTzOffsetIsoString,
  getKstDateString,
  getMemoryDir,
} from "./kst";
import { writeAuditLog } from "@/lib/audit-log";

// 사이클 AAAA5a: KST 헬퍼는 lib/autonomy/kst.ts로 추출. 외부 호출처 호환을 위해 re-export.
export { getKstDateString };

const DEFAULT_CYCLE_CAP = 10;

export interface CycleCounterState {
  kstDate: string; // "YYYY-MM-DD"
  cap: number;
  cycles: number;
  lastCycleAt: string | null; // ISO
  lastCycleId: string | null;
}

function getCycleCap(): number {
  const raw = process.env.AUTONOMY_DAILY_CYCLE_CAP;
  if (raw && /^\d+$/.test(raw)) {
    const n = Number.parseInt(raw, 10);
    if (n >= 0) return n;
  }
  return DEFAULT_CYCLE_CAP;
}

export function getCounterPath(
  now: number = Date.now(),
  dir: string = getMemoryDir(),
): string {
  const kstDate = getKstDateString(now);
  return join(dir, `autonomy_counter_${kstDate}.json`);
}

function defaultState(now: number): CycleCounterState {
  return {
    kstDate: getKstDateString(now),
    cap: getCycleCap(),
    cycles: 0,
    lastCycleAt: null,
    lastCycleId: null,
  };
}

export function readCycleCounter(
  now: number = Date.now(),
  dir: string = getMemoryDir(),
): CycleCounterState {
  const path = getCounterPath(now, dir);
  if (!existsSync(path)) return defaultState(now);
  try {
    const raw = readFileSync(path, "utf-8");
    const parsed = JSON.parse(raw) as Partial<CycleCounterState>;
    const expectedDate = getKstDateString(now);
    if (parsed.kstDate !== expectedDate) {
      // 파일은 있으나 날짜 mismatch (드물지만 수동 편집 등) → reset
      return defaultState(now);
    }
    return {
      kstDate: parsed.kstDate,
      cap: typeof parsed.cap === "number" ? parsed.cap : getCycleCap(),
      cycles: typeof parsed.cycles === "number" ? parsed.cycles : 0,
      lastCycleAt: parsed.lastCycleAt ?? null,
      lastCycleId: parsed.lastCycleId ?? null,
    };
  } catch {
    return defaultState(now);
  }
}

function writeCycleCounter(
  state: CycleCounterState,
  dir: string = getMemoryDir(),
): void {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const path = join(dir, `autonomy_counter_${state.kstDate}.json`);
  writeFileSync(path, JSON.stringify(state, null, 2) + "\n", "utf-8");
}

export class CycleCapExceededError extends Error {
  readonly cap: number;
  readonly cycles: number;
  readonly kstDate: string;
  constructor(state: CycleCounterState) {
    super(
      `Autonomy cycle cap exceeded: ${state.cycles}/${state.cap} on ${state.kstDate}`,
    );
    this.name = "CycleCapExceededError";
    this.cap = state.cap;
    this.cycles = state.cycles;
    this.kstDate = state.kstDate;
  }
}

export function assertCycleCap(
  now: number = Date.now(),
  dir: string = getMemoryDir(),
): void {
  const state = readCycleCounter(now, dir);
  if (state.cap === 0 || state.cycles >= state.cap) {
    throw new CycleCapExceededError(state);
  }
}

export function incrementCycleCount(
  cycleId: string,
  now: number = Date.now(),
  dir: string = getMemoryDir(),
): CycleCounterState {
  const state = readCycleCounter(now, dir);
  const next: CycleCounterState = {
    ...state,
    cycles: state.cycles + 1,
    lastCycleAt: new Date(now).toISOString(),
    lastCycleId: cycleId,
  };
  writeCycleCounter(next, dir);
  return next;
}

// 자율 시간대 22:00~09:00 내인지 확인 (AUTONOMY §0.5).
// default KST(+9), env `AUTONOMY_TZ_OFFSET_HOURS` override (사이클 AAAA9 — 베트남 등 거주자 지원).
//
// 사이클 AAAA10 — 테스트 우회: env `AUTONOMY_BYPASS_HOURS_GATE=1` 명시 시 강제 true.
// **default OFF 보장** — 평소 운영(22:00 자동 시동)에 영향 0. 우회 시 console.warn + audit 추적.
// 사용 시나리오: 낮 시간 자율 모드 검증, 코드 회귀 테스트 시동, 디버깅.
export function isAutonomyHours(now: number = Date.now()): boolean {
  if (process.env.AUTONOMY_BYPASS_HOURS_GATE === "1") {
    console.warn(
      "[autonomy] hours gate bypassed via AUTONOMY_BYPASS_HOURS_GATE=1 (테스트 모드)",
    );
    return true;
  }
  const kst = new Date(now + getTzOffsetMs());
  const hour = kst.getUTCHours();
  return hour >= 22 || hour < 9;
}

export class NotAutonomyHoursError extends Error {
  readonly nowKstIso: string;
  constructor(now: number) {
    const kstIso = new Date(now + getTzOffsetMs())
      .toISOString()
      .replace("Z", getTzOffsetIsoString());
    super(`Not in autonomy hours (22:00~09:00 자율 시간대). Now: ${kstIso}`);
    this.name = "NotAutonomyHoursError";
    this.nowKstIso = kstIso;
  }
}

/**
 * 자율 모드 사이클 진입 통합 게이트 (사이클 BBBB, AAAA2 보강).
 *
 * STEP 1 Triage 진입 시 호출. 다음 모두 통과해야 사이클 시작 허용:
 *   1. AUTONOMY_PAUSED.flag 부재 (사이클 AAAA2, budget.emergency 트리거)
 *   2. 현재 KST가 22:00~09:00 자율 시간대 (NotAutonomyHoursError)
 *   3. 오늘 사이클 수 < cap (CycleCapExceededError)
 *
 * 어느 게이트라도 실패 시 throw → STEP 1 정지.
 */
export function assertAutonomyEntry(
  now: number = Date.now(),
  dir: string = getMemoryDir(),
): void {
  // AAAA2: emergency-stop flag 우선 검사 (시간/카운터보다 강력한 게이트)
  const flag = readAutonomyPausedFlag(dir);
  if (flag) {
    throw new AutonomyPausedError(flag);
  }
  if (!isAutonomyHours(now)) {
    throw new NotAutonomyHoursError(now);
  }
  // AAAA10: bypass 사용 시 audit 기록 (gate 우회는 보안 신호 — 운영자 추적 가능)
  if (process.env.AUTONOMY_BYPASS_HOURS_GATE === "1") {
    void writeAuditLog({
      action: "autonomy.hours_gate_bypassed",
      resource: "autonomy_entry",
      resourceId: "hours_gate",
      metadata: {
        now: new Date(now).toISOString(),
        severity: "security",
      },
    });
  }
  assertCycleCap(now, dir);
}
