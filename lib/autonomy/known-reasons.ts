/**
 * 자율 모드 reason 화이트리스트 상수 (사이클 AAAA8 P3, ADR-046/AAAA3 박제).
 *
 * **목적**: 산재된 reason 문자열을 단일 상수 객체로 박제. 새 reason 추가 시 본 모듈 + 매뉴얼
 * 화이트리스트 동시 갱신으로 fail-closed 게이트 회귀 차단.
 *
 * **포함 범위**:
 * - `PAUSED_FLAG_REASONS` (AAAA3): `AUTONOMY_PAUSED.flag.reason` 화이트리스트.
 *   `readAutonomyPausedFlag`가 모르는 reason을 만나면 quarantine + flag.corrupt sentinel.
 * - `INPUT_GUARD_REASONS` (AAAA3): `recordSpend` 음수/NaN/Infinity 입력 가드 silent skip 사유.
 *   `feedback_input_guard_silent_skip` 박제.
 * - `QUARANTINE_REASONS` (AAAA3+AAAA4): `quarantineFile` 호출 사유 라벨.
 * - `BLOCKED_BY_REASONS` (AAAA5b+AAAA7): `recordExternalCall({ blockedBy })` 차단 사유.
 *
 * **추가 시 의무 절차**:
 * 1. 본 상수 객체에 추가
 * 2. 사용처 (budget.ts/usage-quota.ts/scripts) 추가
 * 3. lib/audit-log.ts `AuditAction` 갱신 (해당 시)
 * 4. AUTONOMY.md §0.5.x 화이트리스트 갱신
 */

/** AUTONOMY_PAUSED.flag의 정상 reason 화이트리스트 (AAAA3 fail-closed). */
export const PAUSED_FLAG_REASONS = ["budget.emergency", "manual", "flag.corrupt"] as const;
export type PausedFlagReason = (typeof PAUSED_FLAG_REASONS)[number];

export function isKnownPausedFlagReason(value: unknown): value is PausedFlagReason {
  return typeof value === "string" && (PAUSED_FLAG_REASONS as readonly string[]).includes(value);
}

/** quarantineFile 호출 라벨 (AAAA3+AAAA4 — audit log resourceId/metadata.reason). */
export const QUARANTINE_REASONS = [
  "flag.parse_failed",
  "flag.unknown_reason",
  "state.parse_failed",
] as const;
export type QuarantineReason = (typeof QUARANTINE_REASONS)[number];

/** recordSpend 입력 가드 사유 (AAAA3, `feedback_input_guard_silent_skip`). */
export const INPUT_GUARD_REASONS = [
  "negative_value",
  "non_finite_value",
  "missing_field",
] as const;
export type InputGuardReason = (typeof INPUT_GUARD_REASONS)[number];

/** recordExternalCall blockedBy 차단 사유 (AAAA5b+AAAA7). */
export const BLOCKED_BY_REASONS = ["quota", "budget", "emergency"] as const;
export type BlockedByReason = (typeof BLOCKED_BY_REASONS)[number];

export function isKnownBlockedByReason(value: unknown): value is BlockedByReason {
  return typeof value === "string" && (BLOCKED_BY_REASONS as readonly string[]).includes(value);
}
