/**
 * ResolvedTrip 뷰 객체 회귀 테스트 — 사이클 J (ADR-034).
 *
 * 답습:
 *  - feedback_resolved_view_pattern: required 필드 보장
 *  - feedback_regression_test_minimums: toBeGreaterThanOrEqual + toContain
 */

import { describe, it, expect } from "vitest";
import {
  resolveTrip,
  resolveTripsByCityCode,
  listResolvedTrips,
} from "@/lib/services/resolved-trip";
import { listDemoTrips } from "@/lib/seed";

describe("사이클 J — resolveTrip", () => {
  it("모든 demo trip이 ResolvedTrip으로 매칭된다", () => {
    const all = listResolvedTrips();
    expect(all.length).toBeGreaterThanOrEqual(5);
    const codes = all.map((r) => r.trip.destinationCode).sort();
    expect(codes).toContain("PQC");
    expect(codes).toContain("DAD");
    expect(codes).toContain("SGN");
    expect(codes).toContain("HAN");
    expect(codes).toContain("NHA");
  });

  it("resolveTrip(unknownId)는 null", () => {
    expect(resolveTrip("nope-xxx")).toBeNull();
  });

  it("ResolvedTrip의 city는 ResolvedCity (country merged)", () => {
    const all = listResolvedTrips();
    for (const r of all) {
      // ResolvedCity required 필드들
      expect(r.city.payment.currency).toBeTruthy();
      expect(r.city.payment.currencySymbol).toBeTruthy();
      expect(r.city.payment.approxKrwRate).toBeGreaterThan(0);
      expect(r.city.phrases?.length ?? 0).toBeGreaterThan(0);
    }
  });

  it("itemCount === items.length, verifiedCount ≤ itemCount", () => {
    for (const r of listResolvedTrips()) {
      expect(r.itemCount).toBe(r.items.length);
      expect(r.verifiedCount).toBeGreaterThanOrEqual(0);
      expect(r.verifiedCount).toBeLessThanOrEqual(r.itemCount);
    }
  });
});

describe("사이클 J — resolveTripsByCityCode", () => {
  it("PQC(푸꾸옥): trip 1건 이상 반환 (현 시드 1건)", () => {
    const trips = resolveTripsByCityCode("PQC");
    expect(trips.length).toBeGreaterThanOrEqual(1);
    expect(trips[0].city.code).toBe("PQC");
  });

  it("DAD/SGN/HAN/NHA 각 도시도 trip 매칭", () => {
    for (const code of ["DAD", "SGN", "HAN", "NHA"]) {
      const trips = resolveTripsByCityCode(code);
      expect(trips.length, `city ${code}`).toBeGreaterThanOrEqual(1);
    }
  });

  it("HOI(호이안 city only): 빈 배열", () => {
    const trips = resolveTripsByCityCode("HOI");
    expect(trips).toEqual([]);
  });

  it("BKK(방콕): trip 없으므로 빈 배열", () => {
    expect(resolveTripsByCityCode("BKK")).toEqual([]);
  });

  it("알 수 없는 city code: 빈 배열", () => {
    expect(resolveTripsByCityCode("ZZZ")).toEqual([]);
  });
});

describe("사이클 J — listResolvedTrips와 listDemoTrips 정합성", () => {
  it("ResolvedTrip 수 ≤ DemoTrip 수 (city 매칭 실패 시 자동 제외)", () => {
    expect(listResolvedTrips().length).toBeLessThanOrEqual(
      listDemoTrips().length,
    );
  });

  it("현 시드: 모든 demo trip이 city 매칭 — Resolved 수 동일", () => {
    expect(listResolvedTrips().length).toBe(listDemoTrips().length);
  });
});
