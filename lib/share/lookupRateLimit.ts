/**
 * /api/share/lookup IP rate limit — 사이클 W.
 * 분당 30회 (read-only). server-only.
 */

import "server-only";

const buckets = new Map<string, number[]>();
const LIMIT = 30;
const WINDOW_MS = 60_000;

export function checkIpRate(ip: string): boolean {
  const now = Date.now();
  const stamps = (buckets.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (stamps.length >= LIMIT) return false;
  stamps.push(now);
  buckets.set(ip, stamps);
  return true;
}

export function _resetIpRate(): void {
  buckets.clear();
}

export const RATE_LIMIT_PER_MINUTE = LIMIT;
