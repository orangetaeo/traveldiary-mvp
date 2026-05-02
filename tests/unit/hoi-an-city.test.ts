/**
 * 호이안 City 시드 단위 테스트 — 사이클 G-3 (V1, 옵션 β).
 *
 * 옵션 β 검증 핵심:
 *   1. 호이안 City 시드 무결성 (다낭과 같은 중부 컨텍스트)
 *   2. listVietnamCities → 5개 (PQC/DAD/SGN/HAN/HOI)
 *   3. itinerary 시드 없음 (lib/seed/index.ts 등록 안 함) → demo trip 4개 유지
 *   4. **다낭 trip의 호이안 일정 그대로 동작** (dn-spot-hoianTour OTA 매칭 회귀)
 *      = 사이클 G-3가 사이클 D 산출물을 깨지 않음을 보장
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
import { listDemoTrips, getDemoTrip } from "@/lib/seed";
import { daNangItinerary, DA_NANG_TRIP_ID } from "@/lib/seed/da-nang";
import { findOffersByKeyword } from "@/lib/seed/ota-offers";

// ═══════════════════════════════════════════════════════════════════
// 호이안 City 시드 무결성
// ═══════════════════════════════════════════════════════════════════

describe("hoiAn City — 무결성", () => {
  it("getCityBySlug('hoi-an') → 시드 존재", () => {
    const city = getCityBySlug("hoi-an");
    expect(city).not.toBeNull();
    expect(city?.code).toBe("HOI");
    expect(city?.name).toBe("호이안");
    expect(city?.country).toBe("베트남");
    expect(city?.countryCode).toBe("VN");
  });

  it("getCityByCode('HOI') → 호이안 매칭", () => {
    const city = getCityByCode("HOI");
    expect(city?.slug).toBe("hoi-an");
  });

  it("isVietnamCity → true", () => {
    expect(isVietnamCity(getCityBySlug("hoi-an"))).toBe(true);
  });

  it("MVP 필드 모두 채움 (응급/결제/교통/문장/큐레이션) — resolved 기준", () => {
    // 사이클 H: raw seed에 phrases·payment.currency 등은 비어있고 country에서 채움
    const city = resolveCity("hoi-an");
    expect(city?.emergencyContacts.length).toBeGreaterThanOrEqual(3);
    expect(city?.payment.currency).toBe("VND");
    expect(city?.transport.primary).toBe("walk"); // 호이안 차별화
    expect(city?.phrases.length).toBeGreaterThanOrEqual(5);
    expect(city?.curatedGuides.length).toBeGreaterThanOrEqual(1);
  });

  it("호이안 차별화 — transport.primary='walk' (자전거+도보)", () => {
    const city = getCityBySlug("hoi-an");
    expect(city?.transport.primary).toBe("walk");
    expect(city?.transport.walkability).toBe("high");
    expect(city?.payment.cardAcceptance).toBe("low"); // 노점/야시장 현금 위주
  });

  it("후속 필드 — visa·utilities·weather 채움 (resolved 기준, 사이클 H country merge)", () => {
    const city = resolveCity("hoi-an");
    expect(city?.visa?.visaFreeDays).toBe(45);
    expect(city?.utilities?.voltage).toBe("220V");
    expect(city?.weather).toBeDefined(); // weather는 city에 그대로 유지
  });

  it("시그니처 가이드 2개 — 등불 야간 + 안방비치", () => {
    const city = getCityBySlug("hoi-an");
    const guideIds = city?.curatedGuides.map((g) => g.id) ?? [];
    expect(guideIds).toContain("hoi-an-lantern-night");
    expect(guideIds).toContain("hoi-an-anbang-beach");
  });
});

// ═══════════════════════════════════════════════════════════════════
// 도시 목록 회귀 — 베트남 5개 도시
// ═══════════════════════════════════════════════════════════════════

describe("호이안 추가 후 도시 목록 회귀", () => {
  it("listVietnamCities → 베트남 도시 모두 포함 (HOI 포함, ≥5개)", () => {
    const vn = listVietnamCities();
    expect(vn.length).toBeGreaterThanOrEqual(5);
    const codes = vn.map((c) => c.code);
    expect(codes).toContain("PQC");
    expect(codes).toContain("DAD");
    expect(codes).toContain("HOI");
    expect(codes).toContain("SGN");
    expect(codes).toContain("HAN");
  });

  it("listCities는 비-베트남 도시(BKK/TYO)도 보존", () => {
    const all = listCities();
    const codes = all.map((c) => c.code);
    expect(codes).toContain("BKK");
    expect(codes).toContain("TYO");
    expect(all.length).toBeGreaterThanOrEqual(7); // VN 5개 + TH 1개 + JP 1개 ≥ 7
  });
});

// ═══════════════════════════════════════════════════════════════════
// 옵션 β 핵심 — itinerary 시드 부재 + 다낭 trip 부속 동작
// ═══════════════════════════════════════════════════════════════════

describe("옵션 β — 호이안 itinerary 부재 + 다낭 trip 부속 회귀", () => {
  it("listDemoTrips는 호이안 trip을 노출하지 않음 (옵션 β 핵심)", () => {
    const trips = listDemoTrips();
    const codes = trips.map((b) => b.trip.destinationCode);
    expect(codes).not.toContain("HOI"); // 옵션 β 핵심 — itinerary 없음
    // 베트남 다른 도시 trip(다낭/푸꾸옥/호치민/하노이)은 모두 노출
    expect(codes).toContain("DAD");
    expect(codes).toContain("PQC");
    expect(codes).toContain("SGN");
    expect(codes).toContain("HAN");
  });

  it("'demo-trip-hoi-an' 같은 trip ID는 존재하지 않음", () => {
    expect(getDemoTrip("demo-trip-hoi-an")).toBeNull();
  });

  it("다낭 trip의 호이안 일정(dn-spot-hoianOldtown) 그대로 보존", () => {
    const danang = getDemoTrip(DA_NANG_TRIP_ID);
    expect(danang).not.toBeNull();
    const hoianItem = danang?.items.find(
      (it) => it.id === "dn-item-7", // plan 인덱스 7 = hoianOldtown
    );
    expect(hoianItem?.name).toContain("호이안");
  });

  it("다낭 'hoi an' 키워드 매칭(dn-spot-hoianTour) 회귀 — 사이클 D 산출물 무손상", () => {
    const offers = findOffersByKeyword("호이안 올드타운 + 야경 등불");
    const hoianOffers = offers.filter(
      (o) => o.matchTag === "dn-spot-hoianTour",
    );
    expect(hoianOffers.length).toBeGreaterThanOrEqual(2);
  });

  it("다낭 itinerary의 호이안 관련 일정 카운트 (Day 2)", () => {
    const day2 = daNangItinerary.filter((it) => it.dayIndex === 2);
    const hoianRelated = day2.filter(
      (it) =>
        it.name.includes("호이안") ||
        (it.location.address && it.location.address.includes("Hội An")),
    );
    expect(hoianRelated.length).toBeGreaterThanOrEqual(2); // 반미 프엉 + 올드타운
  });
});
