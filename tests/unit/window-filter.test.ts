/**
 * 사이클 XXX — lib/admin/window-filter 회귀.
 *
 * RR(M2 dashboard) 인라인 → XXX(affiliate dashboard) 2번째 사용처 추출.
 * parseWindow + buildWindowCutoffFilter + ALLOWED_WINDOWS contract.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  ALLOWED_WINDOWS,
  parseWindow,
  buildWindowCutoffFilter,
} from "@/lib/admin/window-filter";

describe("ALLOWED_WINDOWS", () => {
  it("7일과 30일 두 옵션", () => {
    expect(ALLOWED_WINDOWS).toEqual([7, 30]);
  });
});

describe("parseWindow", () => {
  it("'7' → 7", () => {
    expect(parseWindow("7")).toBe(7);
  });

  it("'30' → 30", () => {
    expect(parseWindow("30")).toBe(30);
  });

  it("undefined → undefined (전체)", () => {
    expect(parseWindow(undefined)).toBeUndefined();
  });

  it("빈 문자열 → undefined", () => {
    expect(parseWindow("")).toBeUndefined();
  });

  it("미지원 값('14') → undefined (안전 fallback)", () => {
    expect(parseWindow("14")).toBeUndefined();
  });

  it("비숫자('abc') → undefined", () => {
    expect(parseWindow("abc")).toBeUndefined();
  });

  it("숫자 외 prefix('7days') → 7로 parse하지만 ALLOWED 검사로 통과", () => {
    // parseInt가 "7"로 파싱하므로 통과 — 의도된 lenient 동작
    expect(parseWindow("7days")).toBe(7);
  });
});

describe("buildWindowCutoffFilter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-03T12:00:00Z"));
  });

  it("undefined → 빈 객체 (where에 안전 spread)", () => {
    expect(buildWindowCutoffFilter(undefined)).toEqual({});
  });

  it("7 → createdAt.gte = 7일 전", () => {
    const result = buildWindowCutoffFilter(7);
    expect(result.createdAt?.gte).toBeDefined();
    expect(result.createdAt?.gte.toISOString()).toBe(
      "2026-04-26T12:00:00.000Z",
    );
  });

  it("30 → createdAt.gte = 30일 전", () => {
    const result = buildWindowCutoffFilter(30);
    expect(result.createdAt?.gte).toBeDefined();
    expect(result.createdAt?.gte.toISOString()).toBe(
      "2026-04-03T12:00:00.000Z",
    );
  });

  it("빈 객체일 때 spread해도 createdAt 키 부재", () => {
    const filter = buildWindowCutoffFilter(undefined);
    const where = { action: "test", ...filter };
    expect("createdAt" in where).toBe(false);
  });
});
