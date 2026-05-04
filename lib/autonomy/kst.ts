/**
 * 자율 모드 시간대 offset + 디렉토리 공유 헬퍼.
 *
 * **명명 주의** (사이클 AAAA9): 모듈 이름은 `kst.ts`이지만 default offset만 KST(+9). env
 * `AUTONOMY_TZ_OFFSET_HOURS`로 다른 시간대 override 가능. 변수/함수명에 KST가 포함된 것은
 * BC 유지 + 추출 트리거(AAAA5a 사용처 답습) 보존을 위함. 의미적으로는 "자율 모드 자는 시간대".
 *
 * **추출 이력**:
 * - AAAA5a: KST_OFFSET_MS + getKstDateString + getMemoryDir이 3 영역에서 답습됨
 *   (lib/autonomy/budget.ts, lib/autonomy/cycle-counter.ts, lib/usage-quota.ts) → 본 모듈로 추출
 * - AAAA9: KST_OFFSET_MS const → getTzOffsetMs() 함수로 진화. env 인지 시간대 도입.
 *
 * **보안 invariant 격리** (T16): 시간대 offset은 자정 리셋 + 자율 시간대 게이트의 보안 invariant.
 * 비-시간대 함수는 본 모듈에 추가하지 말 것 (감사 표면 축소).
 *
 * **입력 가드** (T16): env 값 검증 — `Number.isFinite + -12 <= n <= 14` 표준 시간대 범위.
 * 위반 시 console.warn + default fallback (silent skip 답습 — `feedback_input_guard_silent_skip`).
 */

import { join } from "path";

const DEFAULT_TZ_OFFSET_HOURS = 9; // KST default (사이클 AAAA5a 도입 시 하드코딩, AAAA9 env override 추가)
const MIN_TZ_OFFSET_HOURS = -12;
const MAX_TZ_OFFSET_HOURS = 14;

/**
 * env `AUTONOMY_TZ_OFFSET_HOURS` 읽기. 위반 시 default 9 (KST) fallback.
 *
 * 매 호출 시 process.env 재읽기 — 테스트에서 env 변경 후 다음 호출에 즉시 반영.
 */
function readTzOffsetHours(): number {
  const raw = process.env.AUTONOMY_TZ_OFFSET_HOURS;
  if (raw !== undefined && raw !== "") {
    const n = Number.parseFloat(raw);
    if (
      Number.isFinite(n) &&
      n >= MIN_TZ_OFFSET_HOURS &&
      n <= MAX_TZ_OFFSET_HOURS
    ) {
      return n;
    }
    console.warn(
      `[kst] invalid AUTONOMY_TZ_OFFSET_HOURS="${raw}" (must be -12..14). Falling back to ${DEFAULT_TZ_OFFSET_HOURS}.`,
    );
  }
  return DEFAULT_TZ_OFFSET_HOURS;
}

/**
 * 자율 모드 시간대 offset (밀리초). default KST(+9), env override 가능.
 *
 * 사용처는 `now + getTzOffsetMs()` 패턴으로 UTC 기준 시각을 자율 시간대 기준으로 변환.
 */
export function getTzOffsetMs(): number {
  return readTzOffsetHours() * 60 * 60 * 1000;
}

/**
 * 자율 모드 시간대 ISO offset 문자열 ("+09:00", "+07:00" 등).
 *
 * `Date.toISOString().replace("Z", getTzOffsetIsoString())` 패턴으로 자율 시간대 ISO 표기.
 */
export function getTzOffsetIsoString(): string {
  const h = readTzOffsetHours();
  const sign = h >= 0 ? "+" : "-";
  const abs = Math.abs(h);
  const hh = Math.floor(abs).toString().padStart(2, "0");
  const mm = Math.round((abs - Math.floor(abs)) * 60)
    .toString()
    .padStart(2, "0");
  return `${sign}${hh}:${mm}`;
}

export function getKstDateString(now: number = Date.now()): string {
  const kst = new Date(now + getTzOffsetMs());
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const d = String(kst.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getMemoryDir(): string {
  return process.env.AUTONOMY_MEMORY_DIR ?? join(process.cwd(), "memory");
}
