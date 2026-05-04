/**
 * 외부 API 일일 cap 헬퍼 (사이클 ZZZ 안전 킬스위치, AAAA2 옵션 진화).
 *
 * 24시간 자율 모드에서 외부 API 폭주 방지 — provider별 일일 호출 cap.
 * KST 자정 기준 자동 리셋. env override 가능 (`QUOTA_DAILY_CAP_<PROVIDER>`).
 *
 * 사이클 AAAA2: `recordExternalCall` 옵션 객체 진화 (헬퍼 진화 #7 답습).
 *   - 토큰/$ 옵션 전달 시 `lib/autonomy/budget.ts`로 forward (영속 + 임계치).
 *   - scalar `number` fallback 유지 (기존 9 호출처 swap 0).
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

/**
 * 옵션 객체 진화 (사이클 AAAA2, 헬퍼 진화 #7).
 *
 * - scalar `number`: 기존 호출 패턴 (`now` 타임스탬프). 9 호출처 swap 0.
 * - 옵션 객체: `model`/`inputTokens`/`outputTokens`/`costUsd` 추가 시 `budget.ts`로 forward.
 */
export interface RecordCallOptions {
  now?: number;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  costUsd?: number;
}

export function recordExternalCall(
  provider: ExternalProvider,
  optsOrNow: number | RecordCallOptions = {},
): void {
  const opts: RecordCallOptions =
    typeof optsOrNow === "number" ? { now: optsOrNow } : optsOrNow;
  const now = opts.now ?? Date.now();

  const state = STATE.get(provider);
  if (!state || state.resetAt <= now) {
    STATE.set(provider, { count: 1, resetAt: getKstMidnightMs(now) });
  } else {
    state.count += 1;
  }

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
