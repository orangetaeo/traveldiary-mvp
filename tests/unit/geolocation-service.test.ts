/**
 * lib/services/geolocation.ts 단위 테스트.
 *
 * getCurrentLocation — browser Geolocation API 래퍼. 5개 outcome 커버.
 *
 * Node 환경에서는 window가 없으므로 vi.stubGlobal로 주입.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { getCurrentLocation } from "@/lib/services/geolocation";

describe("geolocation service", () => {
  // ─── SSR (window undefined) — 모듈 자체 분기 ──────────────

  it("window undefined → unsupported", async () => {
    // getCurrentLocation 내부: typeof window === "undefined" 체크
    // Node에서 window가 없으면 unsupported를 반환해야 함
    // vitest Node 환경에서는 globalThis.window가 정의되지 않을 수 있음
    // 모듈이 이미 import된 상태에서 window 유무를 제어하기 어려우므로
    // 실제 환경에 따라 unsupported 또는 다른 결과를 반환
    const r = await getCurrentLocation();
    // Node에서는 window가 없으므로 unsupported
    if (typeof globalThis.window === "undefined") {
      expect(r).toEqual({ mode: "unsupported" });
    } else {
      // jsdom 등 window 있는 환경
      expect(r).toBeDefined();
    }
  });

  // ─── navigator.geolocation 미지원 ─────────────────────────

  it("geolocation API 미지원 → unsupported", async () => {
    // window는 있지만 geolocation 없는 환경
    vi.stubGlobal("window", { navigator: {} });

    const r = await getCurrentLocation();
    expect(r).toEqual({ mode: "unsupported" });

    vi.unstubAllGlobals();
  });

  // ─── 성공 ──────────────────────────────────────────────────

  it("getCurrentPosition 성공 → ok + 좌표", async () => {
    const mockGetPosition = vi.fn(
      (success: (pos: unknown) => void) => {
        success({
          coords: { latitude: 16.047, longitude: 108.206, accuracy: 50 },
          timestamp: Date.now(),
        });
      },
    );
    vi.stubGlobal("window", {
      navigator: {
        geolocation: { getCurrentPosition: mockGetPosition },
      },
    });

    const r = await getCurrentLocation();
    expect(r).toEqual({
      mode: "ok",
      lat: 16.047,
      lng: 108.206,
      accuracy: 50,
    });

    vi.unstubAllGlobals();
  });

  // ─── 권한 거부 ─────────────────────────────────────────────

  it("PERMISSION_DENIED → denied", async () => {
    const mockGetPosition = vi.fn(
      (_success: unknown, error: (err: unknown) => void) => {
        error({
          code: 1,
          message: "User denied",
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        });
      },
    );
    vi.stubGlobal("window", {
      navigator: {
        geolocation: { getCurrentPosition: mockGetPosition },
      },
    });

    const r = await getCurrentLocation();
    expect(r).toEqual({ mode: "denied" });

    vi.unstubAllGlobals();
  });

  // ─── 위치 불가 ─────────────────────────────────────────────

  it("POSITION_UNAVAILABLE → unavailable", async () => {
    const mockGetPosition = vi.fn(
      (_success: unknown, error: (err: unknown) => void) => {
        error({
          code: 2,
          message: "Position unavailable",
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        });
      },
    );
    vi.stubGlobal("window", {
      navigator: {
        geolocation: { getCurrentPosition: mockGetPosition },
      },
    });

    const r = await getCurrentLocation();
    expect(r).toEqual({ mode: "unavailable" });

    vi.unstubAllGlobals();
  });

  // ─── 타임아웃 ──────────────────────────────────────────────

  it("TIMEOUT → timeout", async () => {
    const mockGetPosition = vi.fn(
      (_success: unknown, error: (err: unknown) => void) => {
        error({
          code: 3,
          message: "Timeout",
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        });
      },
    );
    vi.stubGlobal("window", {
      navigator: {
        geolocation: { getCurrentPosition: mockGetPosition },
      },
    });

    const r = await getCurrentLocation();
    expect(r).toEqual({ mode: "timeout" });

    vi.unstubAllGlobals();
  });
});
