/**
 * C1 — 데모 trip 날짜 유틸.
 *
 * 시드 데이터의 startDate를 고정 문자열 대신 상대 날짜로 생성.
 * 모듈 로드 시점에 한 번 계산되므로 SSR 안정성 유지.
 */

/** 오늘 기준 daysFromNow일 후의 ISO date (YYYY-MM-DD). */
export function demoStartDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}

/** 오늘의 ISO date (YYYY-MM-DD). D-Day 계산용. */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
