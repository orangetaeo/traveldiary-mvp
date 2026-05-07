/**
 * lib/admin/window-filter.ts 단위 테스트.
 *
 * parseWindow, buildWindowCutoffFilter, ALLOWED_WINDOWS.
 */

import { describe, it, expect } from "vitest";
import {
  parseWindow,
  buildWindowCutoffFilter,
  ALLOWED_WINDOWS,
} from "@/lib/admin/window-filter";

describe("ALLOWED_WINDOWS", () => {
  it("7, 30 두 값", () => {
    expect(ALLOWED_WINDOWS).toEqual([7, 30]);
  });
});

describe("parseWindow", () => {
  it("undefined → undefined", () => {
    expect(parseWindow(undefined)).toBeUndefined();
  });

  it("빈 문자열 → undefined", () => {
    expect(parseWindow("")).toBeUndefined();
  });

  it("7 → 7", () => {
    expect(parseWindow("7")).toBe(7);
  });

  it("30 → 30", () => {
    expect(parseWindow("30")).toBe(30);
  });

  it("14 (미지원) → undefined", () => {
    expect(parseWindow("14")).toBeUndefined();
  });

  it("abc → undefined", () => {
    expect(parseWindow("abc")).toBeUndefined();
  });
});

describe("buildWindowCutoffFilter", () => {
  it("undefined → 빈 객체", () => {
    expect(buildWindowCutoffFilter(undefined)).toEqual({});
  });

  it("7 → createdAt gte 약 7일 전", () => {
    const before = Date.now();
    const filter = buildWindowCutoffFilter(7);
    expect(filter.createdAt).toBeDefined();
    const cutoff = filter.createdAt!.gte.getTime();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    // cutoff should be roughly now - 7 days (within 1 second tolerance)
    expect(Math.abs(cutoff - (before - sevenDaysMs))).toBeLessThan(1000);
  });

  it("30 → createdAt gte 약 30일 전", () => {
    const filter = buildWindowCutoffFilter(30);
    expect(filter.createdAt).toBeDefined();
    const cutoff = filter.createdAt!.gte.getTime();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    expect(Math.abs(cutoff - (Date.now() - thirtyDaysMs))).toBeLessThan(1000);
  });
});
