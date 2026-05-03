/**
 * admin dashboard 시간 윈도우 필터 — 사이클 XXX (RR 답습 추출).
 *
 * RR(M2 dashboard 시간 윈도우)에서 인라인 도입 → XXX(affiliate dashboard) 2번째 사용처
 * 등장 시 표준 추출 트리거. CITY_LABEL VVV 추출 답습.
 *
 * 정책: 7일/30일 두 옵션 + undefined(전체). count 미표시 (단순성, RR 동형).
 */

export const ALLOWED_WINDOWS = [7, 30] as const;
export type WindowOption = (typeof ALLOWED_WINDOWS)[number];

/**
 * URL searchParams.window 문자열 → WindowOption | undefined
 *
 * 미지원 값(예: "14", "abc")은 undefined로 안전하게 fallback (전체로 동일 처리).
 */
export function parseWindow(raw: string | undefined): WindowOption | undefined {
  if (!raw) return undefined;
  const n = Number.parseInt(raw, 10);
  return ALLOWED_WINDOWS.includes(n as WindowOption)
    ? (n as WindowOption)
    : undefined;
}

/**
 * windowDays → prisma where { createdAt: { gte: cutoff } } 조각.
 *
 * undefined(전체) 시 빈 객체 반환 — spread로 prisma where에 안전 합성.
 */
export function buildWindowCutoffFilter(
  windowDays: WindowOption | undefined,
): { createdAt?: { gte: Date } } {
  if (!windowDays) return {};
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - windowDays);
  return { createdAt: { gte: cutoff } };
}
