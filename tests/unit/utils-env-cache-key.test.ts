/**
 * lib/utils/env + cache-key 유틸리티 테스트.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getEnvKey } from "@/lib/utils/env";
import { hashCacheKey } from "@/lib/utils/cache-key";

describe("getEnvKey", () => {
  const original = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...original };
  });

  afterEach(() => {
    process.env = original;
  });

  it("값이 있으면 문자열 반환", () => {
    process.env.TEST_KEY = "abc123";
    expect(getEnvKey("TEST_KEY")).toBe("abc123");
  });

  it("빈 문자열이면 null", () => {
    process.env.TEST_KEY = "";
    expect(getEnvKey("TEST_KEY")).toBeNull();
  });

  it("미설정이면 null", () => {
    delete process.env.TEST_KEY;
    expect(getEnvKey("TEST_KEY")).toBeNull();
  });
});

describe("hashCacheKey", () => {
  it("32자 hex 반환", () => {
    const key = hashCacheKey("test-seed");
    expect(key).toHaveLength(32);
    expect(key).toMatch(/^[0-9a-f]{32}$/);
  });

  it("동일 입력 → 동일 출력 (결정적)", () => {
    expect(hashCacheKey("hello")).toBe(hashCacheKey("hello"));
  });

  it("다른 입력 → 다른 출력", () => {
    expect(hashCacheKey("a")).not.toBe(hashCacheKey("b"));
  });
});
