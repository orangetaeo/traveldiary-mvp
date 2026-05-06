/**
 * lib/utils/geo.ts — Haversine + hasValidCoords 단위 테스트.
 */

import { describe, it, expect } from "vitest";
import { EARTH_RADIUS_KM, haversineKm, hasValidCoords } from "@/lib/utils/geo";

describe("EARTH_RADIUS_KM", () => {
  it("6371km 표준값", () => {
    expect(EARTH_RADIUS_KM).toBe(6371);
  });
});

describe("haversineKm", () => {
  it("동일 좌표 → 0km", () => {
    const p = { lat: 10.22, lng: 103.96 };
    expect(haversineKm(p, p)).toBe(0);
  });

  it("푸꾸옥 → 호치민 ≈ 280~320km", () => {
    const phuQuoc = { lat: 10.22, lng: 103.96 };
    const hcmc = { lat: 10.82, lng: 106.63 };
    const dist = haversineKm(phuQuoc, hcmc);
    expect(dist).toBeGreaterThan(280);
    expect(dist).toBeLessThan(320);
  });

  it("서울 → 부산 ≈ 320~330km", () => {
    const seoul = { lat: 37.5665, lng: 126.978 };
    const busan = { lat: 35.1796, lng: 129.0756 };
    const dist = haversineKm(seoul, busan);
    expect(dist).toBeGreaterThan(320);
    expect(dist).toBeLessThan(330);
  });

  it("짧은 거리 (1km 이내) 정확도", () => {
    const a = { lat: 10.0, lng: 103.0 };
    const b = { lat: 10.001, lng: 103.0 };
    const dist = haversineKm(a, b);
    expect(dist).toBeGreaterThan(0.1);
    expect(dist).toBeLessThan(0.12);
  });

  it("순서 무관 (대칭)", () => {
    const a = { lat: 10.22, lng: 103.96 };
    const b = { lat: 16.06, lng: 108.22 };
    expect(haversineKm(a, b)).toBeCloseTo(haversineKm(b, a), 10);
  });
});

describe("hasValidCoords", () => {
  it("(0, 0) → false (센티널)", () => {
    expect(hasValidCoords({ lat: 0, lng: 0 })).toBe(false);
  });

  it("유효 좌표 → true", () => {
    expect(hasValidCoords({ lat: 10.22, lng: 103.96 })).toBe(true);
  });

  it("lat만 0 → true (적도 근처 유효)", () => {
    expect(hasValidCoords({ lat: 0, lng: 103.96 })).toBe(true);
  });

  it("lng만 0 → true (본초자오선 유효)", () => {
    expect(hasValidCoords({ lat: 51.5, lng: 0 })).toBe(true);
  });

  it("음수 좌표 → true", () => {
    expect(hasValidCoords({ lat: -33.86, lng: 151.21 })).toBe(true);
  });
});
