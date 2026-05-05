/**
 * 온보딩 퍼널 트래커 테스트 — Batch 8.
 *
 * lib/analytics/funnel.ts: trackFunnelStep.
 * sendBeacon / fetch fire-and-forget — throw 하지 않는 것이 핵심 계약.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

describe("analytics — trackFunnelStep", () => {
  let mockSendBeacon: ReturnType<typeof vi.fn>;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetModules();
    mockSendBeacon = vi.fn().mockReturnValue(true);
    mockFetch = vi.fn().mockResolvedValue({ ok: true });

    Object.defineProperty(globalThis, "navigator", {
      value: { sendBeacon: mockSendBeacon },
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, "fetch", {
      value: mockFetch,
      writable: true,
      configurable: true,
    });
  });

  it("sendBeacon 사용 가능 → sendBeacon 호출", async () => {
    const { trackFunnelStep } = await import("@/lib/analytics/funnel");
    trackFunnelStep("step1");
    expect(mockSendBeacon).toHaveBeenCalledTimes(1);
    expect(mockSendBeacon.mock.calls[0][0]).toBe("/api/analytics/funnel");
  });

  it("sendBeacon payload에 step + timestamp 포함", async () => {
    const { trackFunnelStep } = await import("@/lib/analytics/funnel");
    trackFunnelStep("step2", { city: "다낭" });
    const blob = mockSendBeacon.mock.calls[0][1] as Blob;
    expect(blob).toBeInstanceOf(Blob);
    // Blob 내용 확인
    const text = await blob.text();
    const parsed = JSON.parse(text);
    expect(parsed.step).toBe("step2");
    expect(parsed.timestamp).toBeTruthy();
    expect(parsed.city).toBe("다낭");
  });

  it("sendBeacon 미지원 → fetch fallback", async () => {
    Object.defineProperty(globalThis, "navigator", {
      value: {},
      writable: true,
      configurable: true,
    });
    const { trackFunnelStep } = await import("@/lib/analytics/funnel");
    trackFunnelStep("complete");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][0]).toBe("/api/analytics/funnel");
    expect(mockFetch.mock.calls[0][1].method).toBe("POST");
  });

  it("navigator undefined → fetch fallback (throw 안 함)", async () => {
    Object.defineProperty(globalThis, "navigator", {
      value: undefined,
      writable: true,
      configurable: true,
    });
    const { trackFunnelStep } = await import("@/lib/analytics/funnel");
    expect(() => trackFunnelStep("view")).not.toThrow();
  });

  it("sendBeacon 예외 → throw 안 함", async () => {
    mockSendBeacon.mockImplementation(() => { throw new Error("beacon failed"); });
    const { trackFunnelStep } = await import("@/lib/analytics/funnel");
    expect(() => trackFunnelStep("step3")).not.toThrow();
  });

  it("fetch 거절 → throw 안 함", async () => {
    Object.defineProperty(globalThis, "navigator", {
      value: {},
      writable: true,
      configurable: true,
    });
    mockFetch.mockRejectedValue(new Error("network error"));
    const { trackFunnelStep } = await import("@/lib/analytics/funnel");
    expect(() => trackFunnelStep("step4")).not.toThrow();
  });

  it("모든 FunnelStep 타입 호출 가능", async () => {
    const { trackFunnelStep } = await import("@/lib/analytics/funnel");
    const steps = ["view", "step1", "step2", "step3", "step4", "submit", "complete"] as const;
    for (const step of steps) {
      expect(() => trackFunnelStep(step)).not.toThrow();
    }
    expect(mockSendBeacon).toHaveBeenCalledTimes(steps.length);
  });
});
