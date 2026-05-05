/**
 * Geolocation + Countries 테스트 — Batch 29.
 *
 * 2 모듈:
 *  - lib/services/geolocation.ts: getCurrentLocation
 *  - lib/constants/countries.ts: COUNTRIES, GLOBAL_EMERGENCY_CONTACTS, getCountry, listCountries
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  COUNTRIES,
  GLOBAL_EMERGENCY_CONTACTS,
  getCountry,
  listCountries,
} from "@/lib/constants/countries";

/* ════════════════════════════════════════════
 * Countries — 정적 데이터 + 헬퍼
 * ════════════════════════════════════════════ */

describe("constants/countries — COUNTRIES", () => {
  it("3개국 이상 등록 (VN, TH, JP)", () => {
    expect(Object.keys(COUNTRIES).length).toBeGreaterThanOrEqual(3);
    expect(COUNTRIES.VN).toBeDefined();
    expect(COUNTRIES.TH).toBeDefined();
    expect(COUNTRIES.JP).toBeDefined();
  });

  it("VN — 기본 속성 존재", () => {
    const vn = COUNTRIES.VN;
    expect(vn.code).toBe("VN");
    expect(vn.name).toBe("베트남");
    expect(vn.paymentDefaults.currency).toBe("VND");
    expect(vn.visa.visaFreeDays).toBe(45);
    expect(vn.utilities.voltage).toBe("220V");
  });

  it("모든 country에 defaultPhrases 존재 (5개+)", () => {
    for (const country of Object.values(COUNTRIES)) {
      expect(country.defaultPhrases.length).toBeGreaterThanOrEqual(5);
      // 모든 phrase에 situation + korean + local + pronunciation
      for (const p of country.defaultPhrases) {
        expect(p.situation).toBeTruthy();
        expect(p.korean).toBeTruthy();
        expect(p.local).toBeTruthy();
        expect(p.pronunciation).toBeTruthy();
      }
    }
  });

  it("모든 country에 countryEmergencyContacts 존재", () => {
    for (const country of Object.values(COUNTRIES)) {
      expect(country.countryEmergencyContacts.length).toBeGreaterThanOrEqual(1);
      for (const c of country.countryEmergencyContacts) {
        expect(c.label).toBeTruthy();
        expect(c.phone).toBeTruthy();
        expect(c.category).toBeTruthy();
      }
    }
  });

  it("GLOBAL_EMERGENCY_CONTACTS — 2건 이상 (영사 콜센터 + 카드분실)", () => {
    expect(GLOBAL_EMERGENCY_CONTACTS.length).toBeGreaterThanOrEqual(2);
    expect(GLOBAL_EMERGENCY_CONTACTS[0].label).toContain("영사");
    expect(GLOBAL_EMERGENCY_CONTACTS[0].phone).toContain("0404");
  });
});

describe("constants/countries — getCountry + listCountries", () => {
  it("getCountry('VN') → 베트남", () => {
    const country = getCountry("VN");
    expect(country).not.toBeNull();
    expect(country!.name).toBe("베트남");
  });

  it("getCountry 없는 코드 → null", () => {
    expect(getCountry("XX")).toBeNull();
    expect(getCountry("")).toBeNull();
  });

  it("listCountries → 배열 3개+", () => {
    const list = listCountries();
    expect(list.length).toBeGreaterThanOrEqual(3);
    expect(list[0].code).toBeTruthy();
  });
});

/* ════════════════════════════════════════════
 * Geolocation — getCurrentLocation
 * ════════════════════════════════════════════ */

describe("services — getCurrentLocation", () => {
  let origWindow: typeof globalThis.window;

  beforeEach(() => {
    origWindow = globalThis.window;
  });

  afterEach(() => {
    // @ts-expect-error restore
    globalThis.window = origWindow;
  });

  it("SSR (window undefined) → unsupported", async () => {
    // @ts-expect-error SSR simulation
    globalThis.window = undefined;
    const { getCurrentLocation } = await import("@/lib/services/geolocation");
    const result = await getCurrentLocation();
    expect(result.mode).toBe("unsupported");
  });

  it("navigator.geolocation 없음 → unsupported", async () => {
    // @ts-expect-error mock window without geolocation
    globalThis.window = { navigator: {} };
    const { getCurrentLocation } = await import("@/lib/services/geolocation");
    const result = await getCurrentLocation();
    expect(result.mode).toBe("unsupported");
  });

  it("성공 → ok + 좌표", async () => {
    const mockGetCurrentPosition = (
      success: (pos: { coords: { latitude: number; longitude: number; accuracy: number } }) => void,
    ) => {
      success({ coords: { latitude: 16.05, longitude: 108.24, accuracy: 50 } });
    };
    // @ts-expect-error mock window
    globalThis.window = { navigator: { geolocation: { getCurrentPosition: mockGetCurrentPosition } } };
    const { getCurrentLocation } = await import("@/lib/services/geolocation");
    const result = await getCurrentLocation();
    expect(result.mode).toBe("ok");
    if (result.mode === "ok") {
      expect(result.lat).toBe(16.05);
      expect(result.lng).toBe(108.24);
      expect(result.accuracy).toBe(50);
    }
  });

  it("PERMISSION_DENIED → denied", async () => {
    const mockGetCurrentPosition = (
      _success: unknown,
      error: (err: { code: number; PERMISSION_DENIED: number; POSITION_UNAVAILABLE: number; TIMEOUT: number }) => void,
    ) => {
      const err = { code: 1, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 };
      error(err);
    };
    // @ts-expect-error mock window
    globalThis.window = { navigator: { geolocation: { getCurrentPosition: mockGetCurrentPosition } } };
    const { getCurrentLocation } = await import("@/lib/services/geolocation");
    const result = await getCurrentLocation();
    expect(result.mode).toBe("denied");
  });

  it("POSITION_UNAVAILABLE → unavailable", async () => {
    const mockGetCurrentPosition = (
      _success: unknown,
      error: (err: { code: number; PERMISSION_DENIED: number; POSITION_UNAVAILABLE: number; TIMEOUT: number }) => void,
    ) => {
      const err = { code: 2, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 };
      error(err);
    };
    // @ts-expect-error mock window
    globalThis.window = { navigator: { geolocation: { getCurrentPosition: mockGetCurrentPosition } } };
    const { getCurrentLocation } = await import("@/lib/services/geolocation");
    const result = await getCurrentLocation();
    expect(result.mode).toBe("unavailable");
  });

  it("TIMEOUT → timeout", async () => {
    const mockGetCurrentPosition = (
      _success: unknown,
      error: (err: { code: number; PERMISSION_DENIED: number; POSITION_UNAVAILABLE: number; TIMEOUT: number }) => void,
    ) => {
      const err = { code: 3, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 };
      error(err);
    };
    // @ts-expect-error mock window
    globalThis.window = { navigator: { geolocation: { getCurrentPosition: mockGetCurrentPosition } } };
    const { getCurrentLocation } = await import("@/lib/services/geolocation");
    const result = await getCurrentLocation();
    expect(result.mode).toBe("timeout");
  });

  it("알 수 없는 에러 코드 → unavailable", async () => {
    const mockGetCurrentPosition = (
      _success: unknown,
      error: (err: { code: number; PERMISSION_DENIED: number; POSITION_UNAVAILABLE: number; TIMEOUT: number }) => void,
    ) => {
      const err = { code: 99, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 };
      error(err);
    };
    // @ts-expect-error mock window
    globalThis.window = { navigator: { geolocation: { getCurrentPosition: mockGetCurrentPosition } } };
    const { getCurrentLocation } = await import("@/lib/services/geolocation");
    const result = await getCurrentLocation();
    expect(result.mode).toBe("unavailable");
  });
});
