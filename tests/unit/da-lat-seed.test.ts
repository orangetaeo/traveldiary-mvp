/**
 * 달랏 City + trip 시드 단위 테스트 — 사이클 K (V1, 옵션 α).
 *
 * 패턴: nha-trang-seed / da-nang-seed 답습.
 *  1. City 무결성 + ResolvedCity (country VN merged)
 *  2. Trip 8 일정 / 2박 3일 / DAG 의존성
 *  3. listDemoTrips() → DLI 포함
 *  4. resolveTripsByCityCode("DLI") → 1건
 */

import { describe, it, expect } from "vitest";
import {
  getCityBySlug,
  getCityByCode,
  isVietnamCity,
  resolveCity,
} from "@/lib/seed/cities";
import { listDemoTrips, getDemoTrip } from "@/lib/seed";
import { daLatItinerary, daLatTrip, DA_LAT_TRIP_ID } from "@/lib/seed/da-lat";
import {
  resolveTrip,
  resolveTripsByCityCode,
} from "@/lib/services/resolved-trip";

describe("daLat City — 무결성", () => {
  it("getCityBySlug('da-lat') → 시드 존재", () => {
    const city = getCityBySlug("da-lat");
    expect(city).not.toBeNull();
    expect(city?.code).toBe("DLI");
    expect(city?.name).toBe("달랏");
    expect(city?.country).toBe("베트남");
    expect(city?.countryCode).toBe("VN");
  });

  it("getCityByCode('DLI') → 달랏 매칭", () => {
    expect(getCityByCode("DLI")?.slug).toBe("da-lat");
  });

  it("isVietnamCity → true", () => {
    expect(isVietnamCity(getCityBySlug("da-lat"))).toBe(true);
  });

  it("도시 차별화 — 고원 기후 (12~24°C)", () => {
    const city = getCityBySlug("da-lat")!;
    const avg = city.weather?.avgTempC;
    expect(avg).toBeDefined();
    expect(avg!.min).toBeLessThanOrEqual(15);
    expect(avg!.max).toBeLessThanOrEqual(25);
    expect(city.transport.primary).toBe("walk");
    expect(city.transport.walkability).toBe("high");
  });

  it("ResolvedCity (country VN merge) 무결성", () => {
    const city = resolveCity("da-lat");
    expect(city).not.toBeNull();
    expect(city!.payment.currency).toBe("VND");
    expect(city!.payment.currencySymbol).toBe("₫");
    expect(city!.phrases?.length).toBeGreaterThan(0);
    expect(city!.emergencyContacts.length).toBeGreaterThanOrEqual(3);
  });

  it("시그니처 가이드 — 야시장 + 랑비앙 일출", () => {
    const city = getCityBySlug("da-lat")!;
    const ids = city.curatedGuides.map((g) => g.id);
    expect(ids.some((id) => id.includes("night-market"))).toBe(true);
    expect(ids.some((id) => id.includes("langbiang"))).toBe(true);
  });
});

describe("daLat Trip — 일정 무결성", () => {
  it("trip 메타 — DLI / 2박 3일 / friends", () => {
    expect(daLatTrip.id).toBe(DA_LAT_TRIP_ID);
    expect(daLatTrip.destinationCode).toBe("DLI");
    expect(daLatTrip.destination).toBe("달랏");
    expect(daLatTrip.nights).toBe(2);
    expect(daLatTrip.companion).toBe("friends");
    expect(daLatTrip.currentMode).toBe("pre-travel");
  });

  it("일정 8건 (≥7로 회귀 minimum)", () => {
    expect(daLatItinerary.length).toBeGreaterThanOrEqual(7);
  });

  it("Day 0~2 분포 — 각 일자 최소 1 일정", () => {
    const byDay = new Map<number, number>();
    for (const it of daLatItinerary) {
      byDay.set(it.dayIndex, (byDay.get(it.dayIndex) ?? 0) + 1);
    }
    expect(byDay.get(0)).toBeGreaterThan(0);
    expect(byDay.get(1)).toBeGreaterThan(0);
    expect(byDay.get(2)).toBeGreaterThan(0);
  });

  it("DAG — 같은 day 안에서 직전 슬롯이 dependency", () => {
    for (let i = 1; i < daLatItinerary.length; i++) {
      const cur = daLatItinerary[i];
      const prev = daLatItinerary[i - 1];
      if (prev.dayIndex === cur.dayIndex) {
        expect(cur.dependencies).toContain(prev.id);
      } else {
        expect(cur.dependencies).toEqual([]);
      }
    }
  });

  it("모든 item에 photos ≥ 2장 (사이클 7 ADR-023 답습)", () => {
    for (const it of daLatItinerary) {
      expect(it.photos?.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("랑비앙 + 다탄라 + 야시장 시그니처 포함", () => {
    const ids = daLatItinerary.map((it) => it.name);
    expect(ids.some((n) => n.includes("랑비앙"))).toBe(true);
    expect(ids.some((n) => n.includes("다탄라"))).toBe(true);
    expect(ids.some((n) => n.includes("야시장"))).toBe(true);
  });

  it("evidence.sources 있는 일정 ≥ 4건 (검증된 곳)", () => {
    const verified = daLatItinerary.filter((it) => it.evidence.sources.length > 0);
    expect(verified.length).toBeGreaterThanOrEqual(4);
  });
});

describe("daLat — listDemoTrips 통합 + ResolvedTrip", () => {
  it("listDemoTrips → DLI 포함 (총 ≥6 trip)", () => {
    const trips = listDemoTrips();
    expect(trips.length).toBeGreaterThanOrEqual(6);
    const codes = trips.map((b) => b.trip.destinationCode);
    expect(codes).toContain("DLI");
  });

  it("getDemoTrip(DA_LAT_TRIP_ID) → bundle 반환", () => {
    const bundle = getDemoTrip(DA_LAT_TRIP_ID);
    expect(bundle).not.toBeNull();
    expect(bundle!.trip.destinationCode).toBe("DLI");
    expect(bundle!.items.length).toBe(daLatItinerary.length);
  });

  it("resolveTrip(DA_LAT_TRIP_ID) → ResolvedTrip + city merged", () => {
    const r = resolveTrip(DA_LAT_TRIP_ID);
    expect(r).not.toBeNull();
    expect(r!.city.code).toBe("DLI");
    expect(r!.itemCount).toBe(daLatItinerary.length);
    expect(r!.verifiedCount).toBeGreaterThan(0);
  });

  it("resolveTripsByCityCode('DLI') → 1건 이상", () => {
    const trips = resolveTripsByCityCode("DLI");
    expect(trips.length).toBeGreaterThanOrEqual(1);
    expect(trips[0].city.code).toBe("DLI");
  });
});
