/**
 * EmergencyHeader + A/B experiment 동작 테스트 — Batch 13.
 *
 * 2 모듈:
 *  - components/city/EmergencyHeader.tsx: 링크 href + 접근성 + emphasized 스타일
 *  - lib/ab/experiment.ts: getVariant 할당/고정 + trackAbEvent 에러 무시 계약
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { EmergencyHeaderButton } from "@/components/city/EmergencyHeader";

/* ────────── EmergencyHeader ────────── */

describe("EmergencyHeaderButton", () => {
  it("citySlug → /city/{slug}/emergency 링크", () => {
    const html = renderToStaticMarkup(<EmergencyHeaderButton citySlug="da-nang" />);
    expect(html).toContain('href="/city/da-nang/emergency"');
  });

  it("'응급' 텍스트 표시", () => {
    const html = renderToStaticMarkup(<EmergencyHeaderButton citySlug="phu-quoc" />);
    expect(html).toContain("응급");
  });

  it("aria-label 존재", () => {
    const html = renderToStaticMarkup(<EmergencyHeaderButton citySlug="hanoi" />);
    expect(html).toContain("aria-label");
    expect(html).toContain("응급 정보");
  });

  it("emphasized=false → bg-danger-soft", () => {
    const html = renderToStaticMarkup(<EmergencyHeaderButton citySlug="x" />);
    expect(html).toContain("bg-danger-soft");
    expect(html).not.toContain("bg-danger text-white");
  });

  it("emphasized=true → bg-danger + text-white", () => {
    const html = renderToStaticMarkup(
      <EmergencyHeaderButton citySlug="x" emphasized />,
    );
    expect(html).toContain("bg-danger");
    expect(html).toContain("text-white");
  });

  it("emergency 아이콘 aria-hidden", () => {
    const html = renderToStaticMarkup(<EmergencyHeaderButton citySlug="x" />);
    expect(html).toContain("aria-hidden");
    expect(html).toContain("emergency");
  });
});

/* ────────── A/B experiment (동작 테스트) ────────── */

describe("ab — getVariant 동작", () => {
  let mockStorage: Map<string, string>;
  const origWindow = globalThis.window;
  const origLocalStorage = globalThis.localStorage;

  beforeEach(() => {
    vi.resetModules();
    mockStorage = new Map();
    const ls = {
      getItem: (k: string) => mockStorage.get(k) ?? null,
      setItem: (k: string, v: string) => { mockStorage.set(k, v); },
      removeItem: (k: string) => { mockStorage.delete(k); },
      clear: () => { mockStorage.clear(); },
      get length() { return mockStorage.size; },
      key: () => null,
    };
    Object.defineProperty(globalThis, "window", {
      value: { localStorage: ls },
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, "localStorage", {
      value: ls,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(globalThis, "window", {
      value: origWindow,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, "localStorage", {
      value: origLocalStorage,
      writable: true,
      configurable: true,
    });
  });

  it("유효한 실험 → variants 중 하나 반환", async () => {
    const { getVariant, EXPERIMENTS } = await import("@/lib/ab/experiment");
    const variant = getVariant("ota_cta_text");
    const exp = EXPERIMENTS.find((e) => e.id === "ota_cta_text")!;
    expect(exp.variants).toContain(variant);
  });

  it("두 번째 호출 → 같은 variant (localStorage 고정)", async () => {
    const { getVariant } = await import("@/lib/ab/experiment");
    const first = getVariant("ota_cta_text");
    const second = getVariant("ota_cta_text");
    expect(second).toBe(first);
  });

  it("존재하지 않는 실험 → 'control'", async () => {
    const { getVariant } = await import("@/lib/ab/experiment");
    expect(getVariant("nonexistent_exp")).toBe("control");
  });

  it("SSR (window undefined) → 첫 번째 variant", async () => {
    Object.defineProperty(globalThis, "window", { value: undefined, configurable: true });
    const { getVariant, EXPERIMENTS } = await import("@/lib/ab/experiment");
    const variant = getVariant("ota_cta_text");
    const exp = EXPERIMENTS.find((e) => e.id === "ota_cta_text")!;
    expect(variant).toBe(exp.variants[0]);
  });

  it("localStorage에 잘못된 variant 저장됨 → 재할당", async () => {
    mockStorage.set("td_ab_ota_cta_text", "invalid_old_variant");
    const { getVariant, EXPERIMENTS } = await import("@/lib/ab/experiment");
    const variant = getVariant("ota_cta_text");
    const exp = EXPERIMENTS.find((e) => e.id === "ota_cta_text")!;
    expect(exp.variants).toContain(variant);
    expect(variant).not.toBe("invalid_old_variant");
  });
});

describe("ab — trackAbEvent", () => {
  let mockSendBeacon: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetModules();
    mockSendBeacon = vi.fn().mockReturnValue(true);
    Object.defineProperty(globalThis, "navigator", {
      value: { sendBeacon: mockSendBeacon },
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, "window", {
      value: { localStorage: { getItem: () => null, setItem: () => {} } },
      writable: true,
      configurable: true,
    });
  });

  it("impression 이벤트 → sendBeacon 호출", async () => {
    const { trackAbEvent } = await import("@/lib/ab/experiment");
    trackAbEvent("ota_cta_text", "최저가 보기", "impression");
    expect(mockSendBeacon).toHaveBeenCalledTimes(1);
    expect(mockSendBeacon.mock.calls[0][0]).toBe("/api/analytics/ab");
  });

  it("conversion 이벤트 → payload에 event='conversion' 포함", async () => {
    const { trackAbEvent } = await import("@/lib/ab/experiment");
    trackAbEvent("ota_position", "below_evidence", "conversion", { city: "da-nang" });
    const blob = mockSendBeacon.mock.calls[0][1] as Blob;
    const text = await blob.text();
    const parsed = JSON.parse(text);
    expect(parsed.event).toBe("conversion");
    expect(parsed.experimentId).toBe("ota_position");
    expect(parsed.city).toBe("da-nang");
  });

  it("sendBeacon 예외 → throw 안 함", async () => {
    mockSendBeacon.mockImplementation(() => { throw new Error("fail"); });
    const { trackAbEvent } = await import("@/lib/ab/experiment");
    expect(() => trackAbEvent("x", "y", "impression")).not.toThrow();
  });
});
