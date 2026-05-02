/**
 * 베트남 우선 노출 단위 테스트 — 사이클 F (V3, 2026-05-02).
 *
 * 정책: 사용자 동선에서는 베트남 도시만 노출. 비-베트남 시드는 보존하되
 * 게이트 함수로 차단.
 *  - listVietnamCities() 결과 모두 countryCode === "VN"
 *  - listCities() 호환성 유지 (전체 4개 도시)
 *  - isVietnamCity(): 푸꾸옥/다낭=true, 방콕/도쿄=false
 *  - 데모 trip destinationCode → city → isVietnamCity 체인 무결성
 */

import { describe, it, expect } from "vitest";
import {
  listCities,
  listVietnamCities,
  isVietnamCity,
  getCityBySlug,
  getCityByCode,
  PRIMARY_COUNTRY_CODE,
} from "@/lib/seed/cities";
import { listDemoTrips } from "@/lib/seed";

describe("사이클 F (V3) — 베트남 우선 노출", () => {
  it("PRIMARY_COUNTRY_CODE는 VN", () => {
    expect(PRIMARY_COUNTRY_CODE).toBe("VN");
  });

  it("listCities()는 전체 도시(호환성) — 4개 이상", () => {
    const all = listCities();
    expect(all.length).toBeGreaterThanOrEqual(4);
    const codes = all.map((c) => c.code).sort();
    expect(codes).toContain("PQC");
    expect(codes).toContain("DAD");
    expect(codes).toContain("BKK");
    expect(codes).toContain("TYO");
  });

  it("listVietnamCities()는 베트남만", () => {
    const vn = listVietnamCities();
    expect(vn.length).toBeGreaterThanOrEqual(2);
    for (const city of vn) {
      expect(city.countryCode).toBe("VN");
    }
    // 사이클 G-1~G-4: 호치민·하노이·호이안·나트랑
    // 사이클 K: 껀터·달랏 추가 → minimum + contain
    const codes = vn.map((c) => c.code);
    expect(codes).toContain("PQC");
    expect(codes).toContain("DAD");
    expect(codes).toContain("SGN");
    expect(codes).toContain("HAN");
    expect(codes).toContain("HOI");
    expect(codes).toContain("NHA");
    expect(codes).toContain("CTH");
    expect(codes).toContain("DLI");
  });

  it("isVietnamCity — 푸꾸옥/다낭 true", () => {
    expect(isVietnamCity(getCityBySlug("phu-quoc"))).toBe(true);
    expect(isVietnamCity(getCityBySlug("da-nang"))).toBe(true);
  });

  it("isVietnamCity — 방콕/도쿄 false (격리 보존)", () => {
    expect(isVietnamCity(getCityBySlug("bangkok"))).toBe(false);
    expect(isVietnamCity(getCityBySlug("tokyo"))).toBe(false);
  });

  it("isVietnamCity — null/undefined 안전", () => {
    expect(isVietnamCity(null)).toBe(false);
    expect(isVietnamCity(undefined)).toBe(false);
    expect(isVietnamCity(getCityBySlug("nope"))).toBe(false);
  });

  it("방콕/도쿄 시드는 여전히 직접 조회 가능 (보존 정책)", () => {
    expect(getCityBySlug("bangkok")).not.toBeNull();
    expect(getCityBySlug("tokyo")).not.toBeNull();
    expect(getCityByCode("BKK")?.name).toBe("방콕");
    expect(getCityByCode("TYO")?.name).toBe("도쿄");
  });

  it("모든 데모 trip은 destinationCode가 베트남 도시와 매칭", () => {
    const trips = listDemoTrips();
    expect(trips.length).toBeGreaterThan(0);
    for (const bundle of trips) {
      const city = getCityByCode(bundle.trip.destinationCode);
      expect(city, `trip ${bundle.trip.id} → city ${bundle.trip.destinationCode}`).not.toBeNull();
      expect(isVietnamCity(city)).toBe(true);
    }
  });
});
