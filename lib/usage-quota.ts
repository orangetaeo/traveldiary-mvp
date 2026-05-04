/**
 * 외부 API 일일 cap 헬퍼 (사이클 ZZZ 안전 킬스위치).
 *
 * 24시간 자율 모드에서 외부 API 폭주 방지 — provider별 일일 호출 cap.
 * KST 자정 기준 자동 리셋. env override 가능 (`QUOTA_DAILY_CAP_<PROVIDER>`).
 *
 * 사용:
 *   import { assertQuota, recordExternalCall, QuotaExceededError } from "@/lib/usage-quota";
 *
 *   try { assertQuota("anthropic"); } catch (e) { if (e instanceof QuotaExceededError) ... }
 *   const r = await fetch(...);
 *   recordExternalCall("anthropic");
 */

export type ExternalProvider =
  | "anthropic"
  | "google-vision"
  | "google-places"
  | "google-directions"
  | "naver-search"
  | "ota";

interface QuotaState {
  count: number;
  resetAt: number;
}

const DEFAULT_DAILY_CAP: Record<ExternalProvider, number> = {
  anthropic: 1000,
  "google-vision": 500,
  "google-places": 5000,
  "google-directions": 5000,
  "naver-search": 5000,
  ota: 1000,
};

const STATE = new Map<ExternalProvider, QuotaState>();

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const ONE_DAY_MS = 86_400_000;

export function getKstMidnightMs(now: number = Date.now()): number {
  const nowKst = now + KST_OFFSET_MS;
  const nextMidnightKst = (Math.floor(nowKst / ONE_DAY_MS) + 1) * ONE_DAY_MS;
  return nextMidnightKst - KST_OFFSET_MS;
}

function envCapKey(provider: ExternalProvider): string {
  return `QUOTA_DAILY_CAP_${provider.toUpperCase().replace(/-/g, "_")}`;
}

function getDailyCap(provider: ExternalProvider): number {
  const raw = process.env[envCapKey(provider)];
  if (raw && /^\d+$/.test(raw)) {
    const n = Number.parseInt(raw, 10);
    if (n >= 0) return n;
  }
  return DEFAULT_DAILY_CAP[provider];
}

export interface DailyUsage {
  provider: ExternalProvider;
  count: number;
  cap: number;
  remaining: number;
  resetAt: number;
}

export function getDailyUsage(
  provider: ExternalProvider,
  now: number = Date.now(),
): DailyUsage {
  const cap = getDailyCap(provider);
  const state = STATE.get(provider);
  if (!state || state.resetAt <= now) {
    return { provider, count: 0, cap, remaining: cap, resetAt: getKstMidnightMs(now) };
  }
  return {
    provider,
    count: state.count,
    cap,
    remaining: Math.max(0, cap - state.count),
    resetAt: state.resetAt,
  };
}

export class QuotaExceededError extends Error {
  readonly provider: ExternalProvider;
  readonly cap: number;
  readonly resetAt: number;
  constructor(provider: ExternalProvider, cap: number, resetAt: number) {
    super(`Daily quota exceeded for ${provider} (cap=${cap})`);
    this.name = "QuotaExceededError";
    this.provider = provider;
    this.cap = cap;
    this.resetAt = resetAt;
  }
}

export function assertQuota(
  provider: ExternalProvider,
  now: number = Date.now(),
): void {
  const usage = getDailyUsage(provider, now);
  if (usage.cap === 0 || usage.remaining <= 0) {
    throw new QuotaExceededError(provider, usage.cap, usage.resetAt);
  }
}

export function recordExternalCall(
  provider: ExternalProvider,
  now: number = Date.now(),
): void {
  const state = STATE.get(provider);
  if (!state || state.resetAt <= now) {
    STATE.set(provider, { count: 1, resetAt: getKstMidnightMs(now) });
    return;
  }
  state.count += 1;
}

export function __resetUsageQuotaForTests(): void {
  if (process.env.NODE_ENV !== "test" && process.env.VITEST !== "true") {
    throw new Error(
      "__resetUsageQuotaForTests is only callable from test environment",
    );
  }
  STATE.clear();
}
