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

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DEFAULT_CYCLE_CAP = 10;

export interface CycleCounterState {
  kstDate: string; // "YYYY-MM-DD"
  cap: number;
  cycles: number;
  lastCycleAt: string | null; // ISO
  lastCycleId: string | null;
}

export function getKstDateString(now: number = Date.now()): string {
  const kst = new Date(now + KST_OFFSET_MS);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const d = String(kst.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getMemoryDir(): string {
  return process.env.AUTONOMY_MEMORY_DIR ?? join(process.cwd(), "memory");
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

// KST 22:00~09:00 자율 시간대 내인지 확인 (AUTONOMY §0.5)
export function isAutonomyHours(now: number = Date.now()): boolean {
  const kst = new Date(now + KST_OFFSET_MS);
  const hour = kst.getUTCHours();
  return hour >= 22 || hour < 9;
}

export class NotAutonomyHoursError extends Error {
  readonly nowKstIso: string;
  constructor(now: number) {
    const kstIso = new Date(now + KST_OFFSET_MS).toISOString().replace("Z", "+09:00");
    super(`Not in autonomy hours (KST 22:00~09:00). Now KST: ${kstIso}`);
    this.name = "NotAutonomyHoursError";
    this.nowKstIso = kstIso;
  }
}

/**
 * 자율 모드 사이클 진입 통합 게이트 (사이클 BBBB).
 *
 * STEP 1 Triage 진입 시 호출. 다음 모두 통과해야 사이클 시작 허용:
 *   1. 현재 KST가 22:00~09:00 자율 시간대 (NotAutonomyHoursError)
 *   2. 오늘 사이클 수 < cap (CycleCapExceededError)
 *
 * 깨어있는 시간(09:00~22:00)이나 cap 도달 시 throw → STEP 1 정지.
 */
export function assertAutonomyEntry(
  now: number = Date.now(),
  dir: string = getMemoryDir(),
): void {
  if (!isAutonomyHours(now)) {
    throw new NotAutonomyHoursError(now);
  }
  assertCycleCap(now, dir);
}
