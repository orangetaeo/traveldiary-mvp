/**
 * lib/auth/accountDeleteRateLimit.ts 단위 테스트.
 *
 * 인메모리 rate limiter — 5분 윈도우, 1회 한도.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  checkAccountDeleteRate,
  _resetAccountDeleteRate,
  ACCOUNT_DELETE_RATE_WINDOW_MS,
  ACCOUNT_DELETE_RATE_LIMIT,
} from "@/lib/auth/accountDeleteRateLimit";

describe("accountDeleteRateLimit", () => {
  beforeEach(() => {
    _resetAccountDeleteRate();
  });

  it("상수 검증 (5분 윈도우, 1회 한도)", () => {
    expect(ACCOUNT_DELETE_RATE_WINDOW_MS).toBe(5 * 60_000);
    expect(ACCOUNT_DELETE_RATE_LIMIT).toBe(1);
  });

  it("첫 호출 → true", () => {
    expect(checkAccountDeleteRate("user-1")).toBe(true);
  });

  it("같은 userId 2번째 → false (1회 한도 초과)", () => {
    checkAccountDeleteRate("user-1");
    expect(checkAccountDeleteRate("user-1")).toBe(false);
  });

  it("다른 userId → 독립적으로 허용", () => {
    checkAccountDeleteRate("user-1");
    expect(checkAccountDeleteRate("user-2")).toBe(true);
  });

  it("윈도우 만료 후 → 재허용", () => {
    const realDateNow = Date.now;
    let fakeNow = 1000000;
    Date.now = () => fakeNow;

    try {
      expect(checkAccountDeleteRate("user-1")).toBe(true);
      expect(checkAccountDeleteRate("user-1")).toBe(false);

      // 5분 후로 이동
      fakeNow += ACCOUNT_DELETE_RATE_WINDOW_MS + 1;
      expect(checkAccountDeleteRate("user-1")).toBe(true);
    } finally {
      Date.now = realDateNow;
    }
  });

  it("_resetAccountDeleteRate → 모든 버킷 초기화", () => {
    checkAccountDeleteRate("user-1");
    _resetAccountDeleteRate();
    expect(checkAccountDeleteRate("user-1")).toBe(true);
  });
});
