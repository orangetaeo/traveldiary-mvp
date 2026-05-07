/**
 * lib/analytics/funnel.ts 단위 테스트.
 *
 * trackFunnelStep — sendBeacon / fetch fire-and-forget.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

const mockSendBeacon = vi.fn();
const mockFetch = vi.fn().mockResolvedValue({});

describe("trackFunnelStep", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("navigator", { sendBeacon: mockSendBeacon });
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("sendBeacon 가용 → beacon 호출", async () => {
    const { trackFunnelStep } = await import("@/lib/analytics/funnel");
    trackFunnelStep("step1");

    expect(mockSendBeacon).toHaveBeenCalledWith(
      "/api/analytics/funnel",
      expect.any(Blob),
    );
  });

  it("payload에 step + timestamp 포함", async () => {
    const { trackFunnelStep } = await import("@/lib/analytics/funnel");
    trackFunnelStep("submit", { source: "button" });

    const blob = mockSendBeacon.mock.calls[0][1] as Blob;
    const text = await blob.text();
    const parsed = JSON.parse(text);
    expect(parsed.step).toBe("submit");
    expect(parsed.source).toBe("button");
    expect(parsed.timestamp).toBeDefined();
  });

  it("sendBeacon 없음 → fetch fallback", async () => {
    vi.stubGlobal("navigator", {});
    vi.resetModules();
    const { trackFunnelStep } = await import("@/lib/analytics/funnel");
    trackFunnelStep("complete");

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/analytics/funnel",
      expect.objectContaining({
        method: "POST",
        keepalive: true,
      }),
    );
  });

  it("에러 발생 → throw 안 함 (UX 보호)", async () => {
    mockSendBeacon.mockImplementation(() => {
      throw new Error("beacon blocked");
    });
    vi.resetModules();
    const { trackFunnelStep } = await import("@/lib/analytics/funnel");
    expect(() => trackFunnelStep("view")).not.toThrow();
  });
});
