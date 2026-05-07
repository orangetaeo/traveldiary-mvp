/**
 * 사이클 9 (ADR-049 deferred Minor) — accountDeleteRateLimit 단위 테스트.
 *
 * lookup-rate-limit.test 패턴 답습.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  checkAccountDeleteRate,
  _resetAccountDeleteRate,
  ACCOUNT_DELETE_RATE_LIMIT,
  ACCOUNT_DELETE_RATE_WINDOW_MS,
} from "@/lib/auth/accountDeleteRateLimit";

describe("checkAccountDeleteRate", () => {
  beforeEach(() => {
    _resetAccountDeleteRate();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("첫 호출 → true", () => {
    expect(checkAccountDeleteRate("u1")).toBe(true);
  });

  it("같은 user 두 번째 호출 → false (LIMIT=1)", () => {
    expect(checkAccountDeleteRate("u1")).toBe(true);
    expect(checkAccountDeleteRate("u1")).toBe(false);
  });

  it("다른 user는 영향 없음 (key 격리)", () => {
    expect(checkAccountDeleteRate("u1")).toBe(true);
    expect(checkAccountDeleteRate("u2")).toBe(true);
    expect(checkAccountDeleteRate("u3")).toBe(true);
  });

  it("WINDOW_MS 경과 후 다시 허용", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-07T00:00:00Z"));
    expect(checkAccountDeleteRate("u1")).toBe(true);
    expect(checkAccountDeleteRate("u1")).toBe(false);

    // 5분 + 1ms 경과
    vi.setSystemTime(new Date("2026-05-07T00:05:00.001Z"));
    expect(checkAccountDeleteRate("u1")).toBe(true);
  });

  it("WINDOW_MS 직전(4분 59초)은 여전히 차단", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-07T00:00:00Z"));
    expect(checkAccountDeleteRate("u1")).toBe(true);

    vi.setSystemTime(new Date("2026-05-07T00:04:59Z"));
    expect(checkAccountDeleteRate("u1")).toBe(false);
  });

  it("export 상수 — LIMIT=1, WINDOW=5분", () => {
    expect(ACCOUNT_DELETE_RATE_LIMIT).toBe(1);
    expect(ACCOUNT_DELETE_RATE_WINDOW_MS).toBe(5 * 60_000);
  });

  it("_resetAccountDeleteRate로 모든 user 초기화", () => {
    expect(checkAccountDeleteRate("u1")).toBe(true);
    expect(checkAccountDeleteRate("u1")).toBe(false);
    _resetAccountDeleteRate();
    expect(checkAccountDeleteRate("u1")).toBe(true);
  });
});
