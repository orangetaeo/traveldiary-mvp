/**
 * ValidationResult 캐시 복원 순수 함수 테스트.
 *
 * deriveCachedOpStatus, derivePriceFromCache,
 * deriveDistanceFromCache, deriveGoogleFromCache.
 */

import { describe, it, expect } from "vitest";
import {
  deriveCachedOpStatus,
  derivePriceFromCache,
  deriveDistanceFromCache,
  deriveGoogleFromCache,
} from "@/actions/place-cache-utils";
import type { ValidationResultRow } from "@/lib/repositories/validation.repository";

/* ════════════════════════════════════════════
 * Fixture
 * ════════════════════════════════════════════ */

function makeRow(overrides: Partial<ValidationResultRow> = {}): ValidationResultRow {
  return {
    id: "vr-1",
    itemId: "item-1",
    placeExists: true,
    operatingStatus: "open",
    bookingRequired: false,
    distanceVerified: true,
    priceVerified: true,
    priceStatus: null,
    distanceStatus: null,
    validatedAt: new Date("2026-05-01T00:00:00Z"),
    ...overrides,
  };
}

/* ════════════════════════════════════════════
 * deriveCachedOpStatus
 * ════════════════════════════════════════════ */

describe("deriveCachedOpStatus", () => {
  it('"open" → "open"', () => {
    expect(deriveCachedOpStatus("open")).toBe("open");
  });

  it('"closed" → "closed"', () => {
    expect(deriveCachedOpStatus("closed")).toBe("closed");
  });

  it('"demo" → "demo"', () => {
    expect(deriveCachedOpStatus("demo")).toBe("demo");
  });

  it('알 수 없는 값 → "demo" fallback', () => {
    expect(deriveCachedOpStatus("unknown")).toBe("demo");
  });

  it('빈 문자열 → "demo" fallback', () => {
    expect(deriveCachedOpStatus("")).toBe("demo");
  });

  it('대소문자 구분 — "Open" → "demo"', () => {
    expect(deriveCachedOpStatus("Open")).toBe("demo");
  });
});

/* ════════════════════════════════════════════
 * derivePriceFromCache
 * ════════════════════════════════════════════ */

describe("derivePriceFromCache", () => {
  it("priceStatus 존재 → 정확 복원", () => {
    const row = makeRow({ priceStatus: "verified", priceVerified: true });
    const result = derivePriceFromCache(row);
    expect(result.status).toBe("verified");
    expect(result.verified).toBe(true);
    expect(result.reason).toBe("24h 캐시 hit");
  });

  it("priceStatus = 'warn' → warn 복원", () => {
    const row = makeRow({ priceStatus: "warn", priceVerified: false });
    const result = derivePriceFromCache(row);
    expect(result.status).toBe("warn");
    expect(result.verified).toBe(false);
  });

  it("priceStatus = 'no_offers' → no_offers 복원", () => {
    const row = makeRow({ priceStatus: "no_offers", priceVerified: false });
    expect(derivePriceFromCache(row).status).toBe("no_offers");
  });

  it("priceStatus = null + priceVerified: true → 'verified' fallback", () => {
    const row = makeRow({ priceStatus: null, priceVerified: true });
    const result = derivePriceFromCache(row);
    expect(result.status).toBe("verified");
    expect(result.verified).toBe(true);
  });

  it("priceStatus = null + priceVerified: false → 'warn' fallback", () => {
    const row = makeRow({ priceStatus: null, priceVerified: false });
    const result = derivePriceFromCache(row);
    expect(result.status).toBe("warn");
    expect(result.verified).toBe(false);
  });

  it("공통 필드: deltaPct=null, medianOtaPriceKrw=null, otaSourceCount=0", () => {
    const result = derivePriceFromCache(makeRow());
    expect(result.deltaPct).toBeNull();
    expect(result.medianOtaPriceKrw).toBeNull();
    expect(result.otaSourceCount).toBe(0);
  });
});

/* ════════════════════════════════════════════
 * deriveDistanceFromCache
 * ════════════════════════════════════════════ */

describe("deriveDistanceFromCache", () => {
  it("distanceStatus 존재 → 정확 복원", () => {
    const row = makeRow({ distanceStatus: "verified", distanceVerified: true });
    const result = deriveDistanceFromCache(row);
    expect(result.status).toBe("verified");
    expect(result.verified).toBe(true);
    expect(result.reason).toBe("24h 캐시 hit");
  });

  it("distanceStatus = 'warn' → warn 복원", () => {
    const row = makeRow({ distanceStatus: "warn", distanceVerified: false });
    expect(deriveDistanceFromCache(row).status).toBe("warn");
  });

  it("distanceStatus = 'no_next' → no_next 복원", () => {
    const row = makeRow({ distanceStatus: "no_next", distanceVerified: false });
    expect(deriveDistanceFromCache(row).status).toBe("no_next");
  });

  it("distanceStatus = null + distanceVerified: true → 'verified' fallback", () => {
    const row = makeRow({ distanceStatus: null, distanceVerified: true });
    const result = deriveDistanceFromCache(row);
    expect(result.status).toBe("verified");
  });

  it("distanceStatus = null + distanceVerified: false → 'warn' fallback", () => {
    const row = makeRow({ distanceStatus: null, distanceVerified: false });
    expect(deriveDistanceFromCache(row).status).toBe("warn");
  });

  it('공통 필드: source = "none"', () => {
    const result = deriveDistanceFromCache(makeRow());
    expect(result.source).toBe("none");
    expect(result.travelMinutes).toBeNull();
    expect(result.gapMinutes).toBeNull();
    expect(result.distanceKm).toBeNull();
    expect(result.mode).toBeNull();
  });
});

/* ════════════════════════════════════════════
 * deriveGoogleFromCache
 * ════════════════════════════════════════════ */

describe("deriveGoogleFromCache", () => {
  it('operatingStatus = "demo" → { mode: "demo" }', () => {
    const row = makeRow({ operatingStatus: "demo" });
    expect(deriveGoogleFromCache(row)).toEqual({ mode: "demo" });
  });

  it("placeExists = false → not_found", () => {
    const row = makeRow({ placeExists: false, operatingStatus: "closed" });
    const result = deriveGoogleFromCache(row);
    expect(result.mode).toBe("not_found");
    if (result.mode === "not_found") {
      expect(result.placeExists).toBe(false);
      expect(result.cached).toBe(true);
      expect(result.fetchDurationMs).toBe(0);
    }
  });

  it('placeExists = true + operatingStatus = "open" → verified + open', () => {
    const row = makeRow({ placeExists: true, operatingStatus: "open" });
    const result = deriveGoogleFromCache(row);
    expect(result.mode).toBe("verified");
    if (result.mode === "verified") {
      expect(result.placeExists).toBe(true);
      expect(result.operatingStatus).toBe("open");
      expect(result.placeId).toBe("");
      expect(result.cached).toBe(true);
    }
  });

  it('placeExists = true + operatingStatus = "closed" → verified + closed', () => {
    const row = makeRow({ placeExists: true, operatingStatus: "closed" });
    const result = deriveGoogleFromCache(row);
    expect(result.mode).toBe("verified");
    if (result.mode === "verified") {
      expect(result.operatingStatus).toBe("closed");
    }
  });

  it('알 수 없는 operatingStatus + placeExists = true → verified + "open" fallback', () => {
    const row = makeRow({ placeExists: true, operatingStatus: "unknown_status" });
    const result = deriveGoogleFromCache(row);
    expect(result.mode).toBe("verified");
    if (result.mode === "verified") {
      expect(result.operatingStatus).toBe("open");
    }
  });

  it("fetchDurationMs = 0 (캐시이므로)", () => {
    const row = makeRow({ placeExists: true, operatingStatus: "open" });
    const result = deriveGoogleFromCache(row);
    if (result.mode === "verified") {
      expect(result.fetchDurationMs).toBe(0);
    }
  });
});
