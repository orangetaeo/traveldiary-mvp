/**
 * /api/auth/account DELETE rate limit — 사이클 9 (ADR-049 deferred Minor).
 *
 * key: userId (인증된 사용자별).
 * 윈도우: 5분.
 * 한도: 1회.
 *
 * 박제 패턴 lib/share/lookupRateLimit.ts 답습 (Map<string, number[]>). user 기반이므로
 * 별도 파일로 격리. 프로세스 인메모리만 — 다중 인스턴스 환경에서는 같은 user가 다른
 * 인스턴스로 우회할 수 있으나, 계정 삭제는 영구 idempotent(이미 익명화된 사용자는
 * deletedAt 가드로 무결)이므로 abuse 표면이 작음. 영속 store는 사이클 R1 게이트로
 * 분리(JWT refresh revocation과 묶음).
 */

import "server-only";

const buckets = new Map<string, number[]>();
const LIMIT = 1;
const WINDOW_MS = 5 * 60_000;

export function checkAccountDeleteRate(userId: string): boolean {
  const now = Date.now();
  const stamps = (buckets.get(userId) ?? []).filter(
    (t) => now - t < WINDOW_MS,
  );
  if (stamps.length >= LIMIT) return false;
  stamps.push(now);
  buckets.set(userId, stamps);
  return true;
}

export function _resetAccountDeleteRate(): void {
  buckets.clear();
}

export const ACCOUNT_DELETE_RATE_WINDOW_MS = WINDOW_MS;
export const ACCOUNT_DELETE_RATE_LIMIT = LIMIT;
