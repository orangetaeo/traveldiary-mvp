/**
 * WindowFilter + Funnel + DemoDate + KoreanLossContacts 테스트 — Batch 32.
 *
 * 4 모듈:
 *  - lib/admin/window-filter.ts: parseWindow, buildWindowCutoffFilter
 *  - lib/analytics/funnel.ts: trackFunnelStep
 *  - lib/seed/demo-date.ts: demoStartDate, todayISO
 *  - lib/constants/koreanLossContacts.ts: KOREAN_LOSS_GUIDES, getLossGuide
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  parseWindow,
  buildWindowCutoffFilter,
  ALLOWED_WINDOWS,
} from "@/lib/admin/window-filter";
import { demoStartDate, todayISO } from "@/lib/seed/demo-date";
import {
  KOREAN_LOSS_GUIDES,
  getLossGuide,
} from "@/lib/constants/koreanLossContacts";

/* ════════════════════════════════════════════
 * admin/window-filter — parseWindow
 * ════════════════════════════════════════════ */

describe("admin/window-filter — parseWindow", () => {
  it("'7' → 7", () => {
    expect(parseWindow("7")).toBe(7);
  });

  it("'30' → 30", () => {
    expect(parseWindow("30")).toBe(30);
  });

  it("undefined → undefined", () => {
    expect(parseWindow(undefined)).toBeUndefined();
  });

  it("미지원 값 → undefined", () => {
    expect(parseWindow("14")).toBeUndefined();
    expect(parseWindow("abc")).toBeUndefined();
    expect(parseWindow("0")).toBeUndefined();
    expect(parseWindow("")).toBeUndefined();
  });

  it("ALLOWED_WINDOWS 2종", () => {
    expect(ALLOWED_WINDOWS.length).toBe(2);
  });
});

/* ════════════════════════════════════════════
 * admin/window-filter — buildWindowCutoffFilter
 * ════════════════════════════════════════════ */

describe("admin/window-filter — buildWindowCutoffFilter", () => {
  it("undefined → 빈 객체", () => {
    expect(buildWindowCutoffFilter(undefined)).toEqual({});
  });

  it("7 → createdAt.gte 7일 전", () => {
    const filter = buildWindowCutoffFilter(7);
    expect(filter.createdAt).toBeDefined();
    const diff = Date.now() - filter.createdAt!.gte.getTime();
    // 7일 = ~604800000ms ± 1초 허용
    expect(diff).toBeGreaterThan(604800000 - 2000);
    expect(diff).toBeLessThan(604800000 + 2000);
  });

  it("30 → createdAt.gte 30일 전", () => {
    const filter = buildWindowCutoffFilter(30);
    expect(filter.createdAt).toBeDefined();
    const diff = Date.now() - filter.createdAt!.gte.getTime();
    expect(diff).toBeGreaterThan(30 * 86400000 - 2000);
    expect(diff).toBeLessThan(30 * 86400000 + 2000);
  });
});

/* ════════════════════════════════════════════
 * analytics/funnel — trackFunnelStep
 * ════════════════════════════════════════════ */

describe("analytics/funnel — trackFunnelStep", () => {
  let origNavigator: typeof globalThis.navigator;

  beforeEach(() => {
    origNavigator = globalThis.navigator;
  });

  afterEach(() => {
    Object.defineProperty(globalThis, "navigator", {
      value: origNavigator,
      writable: true,
      configurable: true,
    });
  });

  it("sendBeacon 있으면 호출 (에러 없음)", async () => {
    const mockBeacon = vi.fn();
    Object.defineProperty(globalThis, "navigator", {
      value: { sendBeacon: mockBeacon },
      writable: true,
      configurable: true,
    });
    const { trackFunnelStep } = await import("@/lib/analytics/funnel");
    trackFunnelStep("view");
    expect(mockBeacon).toHaveBeenCalledWith(
      "/api/analytics/funnel",
      expect.any(Blob),
    );
  });

  it("sendBeacon 없으면 fetch 호출 (에러 없음)", async () => {
    Object.defineProperty(globalThis, "navigator", {
      value: {},
      writable: true,
      configurable: true,
    });
    const mockFetch = vi.fn().mockResolvedValue({});
    // @ts-expect-error mock fetch
    globalThis.fetch = mockFetch;
    const { trackFunnelStep } = await import("@/lib/analytics/funnel");
    trackFunnelStep("step1", { source: "test" });
    expect(mockFetch).toHaveBeenCalled();
  });

  it("navigator undefined → 에러 throw 안 함", async () => {
    Object.defineProperty(globalThis, "navigator", {
      value: undefined,
      writable: true,
      configurable: true,
    });
    // @ts-expect-error mock fetch
    globalThis.fetch = vi.fn().mockResolvedValue({});
    const { trackFunnelStep } = await import("@/lib/analytics/funnel");
    expect(() => trackFunnelStep("complete")).not.toThrow();
  });
});

/* ════════════════════════════════════════════
 * seed/demo-date — demoStartDate + todayISO
 * ════════════════════════════════════════════ */

describe("seed/demo-date", () => {
  it("todayISO → YYYY-MM-DD 형식", () => {
    const today = todayISO();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("todayISO → 오늘 날짜", () => {
    const expected = new Date().toISOString().slice(0, 10);
    expect(todayISO()).toBe(expected);
  });

  it("demoStartDate(0) → 오늘", () => {
    expect(demoStartDate(0)).toBe(todayISO());
  });

  it("demoStartDate(7) → 7일 후", () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    expect(demoStartDate(7)).toBe(d.toISOString().slice(0, 10));
  });

  it("demoStartDate(-3) → 3일 전", () => {
    const d = new Date();
    d.setDate(d.getDate() - 3);
    expect(demoStartDate(-3)).toBe(d.toISOString().slice(0, 10));
  });
});

/* ════════════════════════════════════════════
 * constants/koreanLossContacts
 * ════════════════════════════════════════════ */

describe("constants/koreanLossContacts", () => {
  it("4개 카테고리 존재 (passport, card, phone, theft)", () => {
    expect(KOREAN_LOSS_GUIDES.length).toBe(4);
    const categories = KOREAN_LOSS_GUIDES.map((g) => g.category);
    expect(categories).toContain("passport");
    expect(categories).toContain("card");
    expect(categories).toContain("phone");
    expect(categories).toContain("theft");
  });

  it("모든 가이드에 steps ≥ 3", () => {
    for (const guide of KOREAN_LOSS_GUIDES) {
      expect(guide.steps.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("모든 가이드에 contacts ≥ 1", () => {
    for (const guide of KOREAN_LOSS_GUIDES) {
      expect(guide.contacts.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("getLossGuide('passport') → 여권 분실", () => {
    const guide = getLossGuide("passport");
    expect(guide).toBeDefined();
    expect(guide!.title).toContain("여권");
  });

  it("getLossGuide 없는 카테고리 → undefined", () => {
    // @ts-expect-error invalid category
    expect(getLossGuide("invalid")).toBeUndefined();
  });

  it("영사 콜센터 번호 포함 확인", () => {
    const passport = getLossGuide("passport")!;
    const hasConsulate = passport.contacts.some((c) => c.phone?.includes("0404"));
    expect(hasConsulate).toBe(true);
  });
});
