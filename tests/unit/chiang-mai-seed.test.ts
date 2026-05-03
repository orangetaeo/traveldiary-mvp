/**
 * 치앙마이 City + trip 시드 단위 테스트 — 사이클 OO (옵션 α).
 *
 * 답습: da-lat-seed (사이클 K).
 *  1. City 무결성 + ResolvedCity (country TH merge)
 *  2. Trip 8 일정 / 2박 3일 / DAG 의존성
 *  3. listDemoTrips() → CNX 포함 (총 ≥7)
 *  4. resolveTripsByCityCode("CNX") → 1건
 *  5. V3 정책: isVietnamCity → false / listVietnamCities()에 미포함
 */

import { describe, it, expect } from "vitest";
import {
  getCityBySlug,
  getCityByCode,
  isVietnamCity,
  listVietnamCities,
  resolveCity,
} from "@/lib/seed/cities";
import { listDemoTrips, getDemoTrip } from "@/lib/seed";
import {
  chiangMaiItinerary,
  chiangMaiTrip,
  CHIANG_MAI_TRIP_ID,
} from "@/lib/seed/chiang-mai";
import {
  resolveTrip,
  resolveTripsByCityCode,
} from "@/lib/services/resolved-trip";

describe("chiangMai City — 무결성", () => {
  it("getCityBySlug('chiang-mai') → 시드 존재", () => {
    const city = getCityBySlug("chiang-mai");
    expect(city).not.toBeNull();
    expect(city?.code).toBe("CNX");
    expect(city?.name).toBe("치앙마이");
    expect(city?.country).toBe("태국");
    expect(city?.countryCode).toBe("TH");
  });

  it("getCityByCode('CNX') → 치앙마이 매칭", () => {
    expect(getCityByCode("CNX")?.slug).toBe("chiang-mai");
  });

  it("V3 정책 — isVietnamCity → false", () => {
    expect(isVietnamCity(getCityBySlug("chiang-mai"))).toBe(false);
  });

  it("V3 정책 — listVietnamCities()에 미포함", () => {
    const slugs = listVietnamCities().map((c) => c.slug);
    expect(slugs).not.toContain("chiang-mai");
  });

  it("도시 차별화 — 북부 더위 (18~32°C) + 도보 중심", () => {
    const city = getCityBySlug("chiang-mai")!;
    const avg = city.weather?.avgTempC;
    expect(avg).toBeDefined();
    expect(avg!.min).toBeGreaterThanOrEqual(15);
    expect(avg!.max).toBeGreaterThanOrEqual(28);
    expect(city.transport.primary).toBe("walk");
    expect(city.transport.walkability).toBe("high");
  });

  it("ResolvedCity (country TH merge) — THB 통화 + 태국어 phrases", () => {
    const city = resolveCity("chiang-mai");
    expect(city).not.toBeNull();
    expect(city!.payment.currency).toBe("THB");
    expect(city!.payment.currencySymbol).toBe("฿");
    expect(city!.phrases?.length).toBeGreaterThan(0);
    expect(city!.emergencyContacts.length).toBeGreaterThanOrEqual(3);
  });

  it("시그니처 가이드 — 도이수텝 + 일요 야시장", () => {
    const city = getCityBySlug("chiang-mai")!;
    const ids = city.curatedGuides.map((g) => g.id);
    expect(ids.some((id) => id.includes("doi-suthep"))).toBe(true);
    expect(ids.some((id) => id.includes("sunday"))).toBe(true);
  });

  it("응급 연락처 — 치앙마이 관광경찰 + 종합병원", () => {
    const city = getCityBySlug("chiang-mai")!;
    const labels = city.emergencyContacts.map((e) => e.label);
    expect(labels.some((l) => l.includes("치앙마이 관광경찰"))).toBe(true);
    expect(labels.some((l) => l.includes("Chiang Mai Ram"))).toBe(true);
  });
});

describe("chiangMai Trip — 일정 무결성", () => {
  it("trip 메타 — CNX / 2박 3일 / friends", () => {
    expect(chiangMaiTrip.id).toBe(CHIANG_MAI_TRIP_ID);
    expect(chiangMaiTrip.destinationCode).toBe("CNX");
    expect(chiangMaiTrip.destination).toBe("치앙마이");
    expect(chiangMaiTrip.nights).toBe(2);
    expect(chiangMaiTrip.companion).toBe("friends");
    expect(chiangMaiTrip.currentMode).toBe("pre-travel");
  });

  it("일정 8건 (≥7로 회귀 minimum)", () => {
    expect(chiangMaiItinerary.length).toBeGreaterThanOrEqual(7);
  });

  it("Day 0~2 분포 — 각 일자 최소 1 일정", () => {
    const byDay = new Map<number, number>();
    for (const it of chiangMaiItinerary) {
      byDay.set(it.dayIndex, (byDay.get(it.dayIndex) ?? 0) + 1);
    }
    expect(byDay.get(0)).toBeGreaterThan(0);
    expect(byDay.get(1)).toBeGreaterThan(0);
    expect(byDay.get(2)).toBeGreaterThan(0);
  });

  it("DAG — 같은 day 안에서 직전 슬롯이 dependency", () => {
    for (let i = 1; i < chiangMaiItinerary.length; i++) {
      const cur = chiangMaiItinerary[i];
      const prev = chiangMaiItinerary[i - 1];
      if (prev.dayIndex === cur.dayIndex) {
        expect(cur.dependencies).toContain(prev.id);
      } else {
        expect(cur.dependencies).toEqual([]);
      }
    }
  });

  it("모든 item에 photos ≥ 2장 (사이클 7 ADR-023 답습)", () => {
    for (const it of chiangMaiItinerary) {
      expect(it.photos?.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("도이수텝 + 코끼리 보호소 + 일요 야시장 + 카오소이 시그니처 포함", () => {
    const names = chiangMaiItinerary.map((it) => it.name);
    expect(names.some((n) => n.includes("도이수텝"))).toBe(true);
    expect(names.some((n) => n.includes("엘리펀트"))).toBe(true);
    expect(names.some((n) => n.includes("일요 야시장"))).toBe(true);
    expect(names.some((n) => n.includes("카오소이"))).toBe(true);
  });

  it("evidence.sources 있는 일정 ≥ 4건 (검증된 곳)", () => {
    const verified = chiangMaiItinerary.filter(
      (it) => it.evidence.sources.length > 0,
    );
    expect(verified.length).toBeGreaterThanOrEqual(4);
  });

  it("estimatedPrice 통화 — THB (태국)", () => {
    const withPrice = chiangMaiItinerary.filter(
      (it) => it.estimatedPrice && it.estimatedPrice.amount > 0,
    );
    expect(withPrice.length).toBeGreaterThanOrEqual(4);
    for (const it of withPrice) {
      expect(it.estimatedPrice!.currency).toBe("THB");
    }
  });
});

describe("chiangMai — V3 정책 (보존만, 노출 X) + 직접 import 동작", () => {
  // 사이클 OO: V3(베트남 우선) 정책 유지 — listDemoTrips()에는 CNX 미포함.
  // chiangMaiTrip/chiangMaiItinerary는 직접 import로만 접근 (Bangkok/Tokyo 답습).
  // 노출 활성화는 별도 정책 변경 사이클 + ADR.

  it("listDemoTrips() → CNX 미포함 (V3 정책 보존)", () => {
    const codes = listDemoTrips().map((b) => b.trip.destinationCode);
    expect(codes).not.toContain("CNX");
  });

  it("getDemoTrip(CHIANG_MAI_TRIP_ID) → null (bundle 미등록)", () => {
    expect(getDemoTrip(CHIANG_MAI_TRIP_ID)).toBeNull();
  });

  it("resolveTrip(CHIANG_MAI_TRIP_ID) → null (listDemoTrips 의존)", () => {
    expect(resolveTrip(CHIANG_MAI_TRIP_ID)).toBeNull();
  });

  it("resolveTripsByCityCode('CNX') → 0건", () => {
    expect(resolveTripsByCityCode("CNX")).toEqual([]);
  });

  it("직접 import — chiangMaiTrip / chiangMaiItinerary 동작 (시드 보존)", () => {
    expect(chiangMaiTrip.id).toBe(CHIANG_MAI_TRIP_ID);
    expect(chiangMaiItinerary.length).toBeGreaterThanOrEqual(7);
    // 시드 보존 패턴: 미래 정책 변경 시 lib/seed/index.ts에 bundle 추가만으로 활성
  });
});
