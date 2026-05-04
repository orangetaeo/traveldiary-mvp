/**
 * 외부 API 일일 cap 헬퍼 (사이클 ZZZ 안전 킬스위치, AAAA2 옵션 진화).
 *
 * 24시간 자율 모드에서 외부 API 폭주 방지 — provider별 일일 호출 cap.
 * KST 자정 기준 자동 리셋. env override 가능 (`QUOTA_DAILY_CAP_<PROVIDER>`).
 *
 * 사이클 AAAA2: `recordExternalCall` 옵션 객체 진화 (헬퍼 진화 #7 답습).
 *   - 토큰/$ 옵션 전달 시 `lib/autonomy/budget.ts`로 forward (영속 + 임계치).
 *   - scalar `number` fallback 유지 (기존 9 호출처 swap 0).
 *
 * 사이클 AAAA5a: KST_OFFSET_MS는 lib/autonomy/kst.ts로 추출 (DRY).
 */

import { KST_OFFSET_MS } from "@/lib/autonomy/kst";

export type ExternalProvider =
  | "anthropic"
  | "google-vision"
  | "google-places"
  | "google-directions"
  | "naver-search"
  | "ota";

// 사이클 AAAA5b: attempted/succeeded/blocked 분리 카운터 (R1 옵션 B, T16 보안 가시성).
// `count`는 기존 호환을 위해 succeeded count 의미 유지. assertQuota cap 비교도 succeeded 기준 유지(회귀 X).
// `attempted` + `blocked.*`는 관측용 (DoS/공격자 시도 추적).
interface QuotaState {
  count: number; // succeeded
  attempted: number;
  blocked: {
    quota: number;
    budget: number;
    emergency: number;
    total: number;
  };
  resetAt: number;
}

function emptyBlockedCounter(): QuotaState["blocked"] {
  return { quota: 0, budget: 0, emergency: 0, total: 0 };
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
  count: number; // succeeded (기존 호환)
  attempted: number; // AAAA5b
  blocked: { quota: number; budget: number; emergency: number; total: number }; // AAAA5b
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
    return {
      provider,
      count: 0,
      attempted: 0,
      blocked: emptyBlockedCounter(),
      cap,
      remaining: cap,
      resetAt: getKstMidnightMs(now),
    };
  }
  return {
    provider,
    count: state.count,
    attempted: state.attempted,
    blocked: { ...state.blocked },
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

/**
 * 옵션 객체 진화 (사이클 AAAA2 #7, AAAA5b #8).
 *
 * #7 (AAAA2): scalar `number` fallback + `model`/`inputTokens`/`outputTokens`/`costUsd` 옵션. 9 호출처 swap 0.
 * #8 (AAAA5b): `attempted`/`succeeded`/`blockedBy` 분리 카운터 (R1 옵션 B + T16 가시성).
 *   - `blockedBy` 명시 시: attempted++, blocked[blockedBy]++, count(succeeded) 변화 X, budget forward X.
 *   - 그 외 (default 또는 succeeded:true): attempted++, count++ (기존 동작 유지).
 *   - 9 호출처 scalar/no-op 호출은 영향 0 (기존 의미 = succeeded).
 */
export interface RecordCallOptions {
  now?: number;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  costUsd?: number;
  // AAAA5b
  succeeded?: boolean; // default true (외부 응답 정상 수신)
  blockedBy?: "quota" | "budget" | "emergency"; // 명시 시 차단된 시도로 기록
}

export function recordExternalCall(
  provider: ExternalProvider,
  optsOrNow: number | RecordCallOptions = {},
): void {
  const opts: RecordCallOptions =
    typeof optsOrNow === "number" ? { now: optsOrNow } : optsOrNow;
  const now = opts.now ?? Date.now();

  const isBlocked = opts.blockedBy !== undefined;
  const isSucceeded = !isBlocked && (opts.succeeded ?? true);

  const state = STATE.get(provider);
  if (!state || state.resetAt <= now) {
    const blocked = emptyBlockedCounter();
    if (isBlocked) {
      blocked[opts.blockedBy!] = 1;
      blocked.total = 1;
    }
    STATE.set(provider, {
      count: isSucceeded ? 1 : 0,
      attempted: 1,
      blocked,
      resetAt: getKstMidnightMs(now),
    });
  } else {
    state.attempted += 1;
    if (isSucceeded) state.count += 1;
    if (isBlocked) {
      state.blocked[opts.blockedBy!] += 1;
      state.blocked.total += 1;
    }
  }

  // 차단된 시도는 토큰/$ forward 안 함 (외부 응답 미수신)
  if (!isSucceeded) return;

  // 토큰/$ 정보가 있으면 budget.ts로 forward (fire-and-forget)
  const hasSpend =
    opts.inputTokens !== undefined ||
    opts.outputTokens !== undefined ||
    opts.costUsd !== undefined;
  if (hasSpend) {
    // 동적 import로 순환 의존 회피 + 테스트 격리
    void import("./autonomy/budget")
      .then(({ recordSpend }) =>
        recordSpend({
          provider,
          model: opts.model,
          inputTokens: opts.inputTokens ?? 0,
          outputTokens: opts.outputTokens ?? 0,
          costUsd: opts.costUsd ?? 0,
          now,
        }),
      )
      .catch((err) => {
        console.warn("[usage-quota] budget forward failed:", err);
      });
  }
}

export function __resetUsageQuotaForTests(): void {
  if (process.env.NODE_ENV !== "test" && process.env.VITEST !== "true") {
    throw new Error(
      "__resetUsageQuotaForTests is only callable from test environment",
    );
  }
  STATE.clear();
}
