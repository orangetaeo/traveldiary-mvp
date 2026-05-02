/**
 * 껀터 City 시드 단위 테스트 — 사이클 K (옵션 β, city only).
 *
 * 패턴: hoi-an-city.test.ts 답습 (옵션 β 검증).
 *  1. City 시드 무결성
 *  2. listVietnamCities → CTH 포함
 *  3. itinerary 시드 없음 (lib/seed/index.ts 등록 X) → demo trip 수 무영향
 *  4. resolveCity → ResolvedCity (country VN merged)
 */

import { describe, it, expect } from "vitest";
import {
  getCityBySlug,
  getCityByCode,
  isVietnamCity,
  listCities,
  listVietnamCities,
  resolveCity,
} from "@/lib/seed/cities";
import { listDemoTrips } from "@/lib/seed";

describe("canTho City — 무결성", () => {
  it("getCityBySlug('can-tho') → 시드 존재", () => {
    const city = getCityBySlug("can-tho");
    expect(city).not.toBeNull();
    expect(city?.code).toBe("CTH");
    expect(city?.name).toBe("껀터");
    expect(city?.country).toBe("베트남");
    expect(city?.countryCode).toBe("VN");
  });

  it("getCityByCode('CTH') → 껀터 매칭", () => {
    const city = getCityByCode("CTH");
    expect(city?.slug).toBe("can-tho");
  });

  it("isVietnamCity → true", () => {
    expect(isVietnamCity(getCityBySlug("can-tho"))).toBe(true);
  });

  it("MVP 필드 채움 — resolved 기준 (country merge)", () => {
    const city = resolveCity("can-tho");
    expect(city).not.toBeNull();
    expect(city!.emergencyContacts.length).toBeGreaterThanOrEqual(3);
    expect(city!.payment.currency).toBe("VND");
    expect(city!.payment.currencySymbol).toBe("₫");
    // 사이클 K: TransportInfo.primary는 "boat" 미지원 → walk + primaryNotes에 보트 강조
    expect(city!.transport.primary).toBe("walk");
    expect(city!.transport.primaryNotes).toMatch(/보트|메콩|부유시장/);
    expect(city!.phrases?.length).toBeGreaterThan(0);
    expect(city!.curatedGuides.length).toBeGreaterThan(0);
  });

  it("시그니처 가이드 — 까이랑 부유시장", () => {
    const city = getCityBySlug("can-tho")!;
    const guide = city.curatedGuides.find((g) =>
      g.id.includes("floating-market"),
    );
    expect(guide).toBeDefined();
    expect(guide?.title).toContain("까이랑");
    expect(guide?.sections.length).toBeGreaterThanOrEqual(3);
  });
});

describe("canTho — 옵션 β (city only)", () => {
  it("listVietnamCities() → CTH 포함 (≥7개)", () => {
    const vn = listVietnamCities();
    expect(vn.length).toBeGreaterThanOrEqual(7); // PQC/DAD/SGN/HAN/HOI/NHA + CTH
    const codes = vn.map((c) => c.code);
    expect(codes).toContain("CTH");
  });

  it("listCities() → 전체에 CTH 포함", () => {
    const all = listCities().map((c) => c.code);
    expect(all).toContain("CTH");
  });

  it("itinerary 미등록 — demo trip에 CTH 없음", () => {
    const trips = listDemoTrips();
    const codes = trips.map((b) => b.trip.destinationCode);
    expect(codes).not.toContain("CTH");
  });

  it("호치민 trip 무영향 — SGN trip은 그대로 (회귀)", () => {
    const trips = listDemoTrips();
    const sgn = trips.find((b) => b.trip.destinationCode === "SGN");
    expect(sgn).toBeDefined();
    expect(sgn!.items.length).toBeGreaterThan(0);
  });
});
