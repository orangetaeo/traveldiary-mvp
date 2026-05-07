/**
 * payment-trip-link — city slug → 활성 trip 매칭 (옵션 G).
 *
 * 순수 함수 단위 테스트.
 */

import { describe, it, expect } from "vitest";
import { findActiveTripByCity } from "@/lib/services/payment-trip-link";
import { listDemoTrips } from "@/lib/seed";

describe("findActiveTripByCity — 데모 trip 매칭", () => {
  const trips = listDemoTrips();

  it("phu-quoc → demo-trip-phu-quoc (PQC)", () => {
    const link = findActiveTripByCity("phu-quoc", trips);
    expect(link).not.toBeNull();
    expect(link?.tripId).toBe("demo-trip-phu-quoc");
    expect(link?.destination).toBe("푸꾸옥");
    expect(link?.isDemoTrip).toBe(true);
  });

  it("da-nang → demo-trip-da-nang (DAD)", () => {
    const link = findActiveTripByCity("da-nang", trips);
    expect(link?.tripId).toBe("demo-trip-da-nang");
    expect(link?.destination).toBe("다낭");
  });

  it("ho-chi-minh → demo-trip-ho-chi-minh (SGN)", () => {
    const link = findActiveTripByCity("ho-chi-minh", trips);
    expect(link?.tripId).toBe("demo-trip-ho-chi-minh");
  });

  it("hanoi → demo-trip-hanoi (HAN)", () => {
    const link = findActiveTripByCity("hanoi", trips);
    expect(link?.tripId).toBe("demo-trip-hanoi");
  });

  it("nha-trang → demo-trip-nha-trang (NHA)", () => {
    const link = findActiveTripByCity("nha-trang", trips);
    expect(link?.tripId).toBe("demo-trip-nha-trang");
  });

  it("da-lat → demo-trip-da-lat (DLI)", () => {
    const link = findActiveTripByCity("da-lat", trips);
    expect(link?.tripId).toBe("demo-trip-da-lat");
  });

  it("hoi-an → null (city only, trip 없음)", () => {
    expect(findActiveTripByCity("hoi-an", trips)).toBeNull();
  });

  it("can-tho → null (city only)", () => {
    expect(findActiveTripByCity("can-tho", trips)).toBeNull();
  });

  it("존재하지 않는 slug → null", () => {
    expect(findActiveTripByCity("no-such-city", trips)).toBeNull();
  });

  it("빈 trip 배열 → null", () => {
    expect(findActiveTripByCity("phu-quoc", [])).toBeNull();
  });

  it("베트남 6 도시 모두 매칭 trip 보유 (회귀 단언)", () => {
    const VN_TRIP_SLUGS = [
      "phu-quoc",
      "da-nang",
      "ho-chi-minh",
      "hanoi",
      "nha-trang",
      "da-lat",
    ];
    for (const slug of VN_TRIP_SLUGS) {
      expect(findActiveTripByCity(slug, trips)).not.toBeNull();
    }
  });

  it("destination 한국어 — 모든 매칭 결과 공백 아님", () => {
    const link = findActiveTripByCity("phu-quoc", trips);
    expect(link?.destination.length).toBeGreaterThan(0);
  });
});
