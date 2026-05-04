/**
 * 시드 데이터 무결성 테스트 — Batch 3 (A3).
 *
 * 시드 간 교차 참조 정합성 + 필수 필드 검증 + ID 유일성.
 * 시드 변경(도시/trip/OTA 추가) 시 자동 회귀 방지.
 */

import { describe, it, expect } from "vitest";
import {
  listDemoTrips,
  DEMO_TRIP_ID,
  DEMO_TRIP_IDS,
  getDemoTrip,
  isDemoTrip,
} from "@/lib/seed";
import {
  listCities,
  getCityBySlug,
  getCityByCode,
  listVietnamCities,
} from "@/lib/seed/cities";
import {
  allOtaOffers,
  findOffersForItem,
} from "@/lib/seed/ota-offers";

/* ────────── Trip 무결성 ────────── */

describe("seed — Trip 무결성", () => {
  const trips = listDemoTrips();

  it("데모 trip 6개 이상 (베트남 우선)", () => {
    expect(trips.length).toBeGreaterThanOrEqual(6);
  });

  it("DEMO_TRIP_IDS와 listDemoTrips 개수 일치", () => {
    expect(DEMO_TRIP_IDS.length).toBe(trips.length);
  });

  it("DEMO_TRIP_ID는 첫 번째 trip", () => {
    expect(DEMO_TRIP_ID).toBe(trips[0].trip.id);
  });

  it("모든 trip ID 유일", () => {
    const ids = trips.map((b) => b.trip.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("isDemoTrip — 모든 데모 trip true, 임의 ID false", () => {
    for (const b of trips) {
      expect(isDemoTrip(b.trip.id)).toBe(true);
    }
    expect(isDemoTrip("nonexistent-trip-id")).toBe(false);
  });

  it("getDemoTrip — 유효 ID는 bundle 반환, 무효 ID는 null", () => {
    expect(getDemoTrip(DEMO_TRIP_ID)).not.toBeNull();
    expect(getDemoTrip("no-such-trip")).toBeNull();
  });

  it.each(trips.map((b) => [b.trip.destination, b.trip.id]))(
    "%s — 필수 필드 존재",
    (_dest, tripId) => {
      const bundle = getDemoTrip(tripId)!;
      const t = bundle.trip;
      expect(t.id).toBeTruthy();
      expect(t.destination).toBeTruthy();
      expect(t.destinationCode).toBeTruthy();
      expect(t.startDate).toBeTruthy();
      expect(t.nights).toBeGreaterThanOrEqual(1);
      expect(t.status).toBeTruthy();
      expect(t.currentMode).toBeTruthy();
    },
  );

  it("모든 itinerary item ID 전체 유일 (trip 간 중복 방지)", () => {
    const allIds = trips.flatMap((b) => b.items.map((it) => it.id));
    expect(new Set(allIds).size).toBe(allIds.length);
  });

  it("모든 itinerary item의 tripId가 소속 trip과 일치", () => {
    for (const bundle of trips) {
      for (const item of bundle.items) {
        expect(item.tripId).toBe(bundle.trip.id);
      }
    }
  });

  it("모든 itinerary item dayIndex가 0..nights 범위 내", () => {
    for (const bundle of trips) {
      for (const item of bundle.items) {
        expect(item.dayIndex).toBeGreaterThanOrEqual(0);
        expect(item.dayIndex).toBeLessThanOrEqual(bundle.trip.nights);
      }
    }
  });

  it("모든 itinerary item에 location.lat/lng 존재", () => {
    for (const bundle of trips) {
      for (const item of bundle.items) {
        expect(item.location.lat).toBeDefined();
        expect(item.location.lng).toBeDefined();
        expect(typeof item.location.lat).toBe("number");
        expect(typeof item.location.lng).toBe("number");
      }
    }
  });

  it("모든 itinerary item에 evidence.reasons 1개 이상", () => {
    for (const bundle of trips) {
      for (const item of bundle.items) {
        expect(item.evidence.reasons.length).toBeGreaterThanOrEqual(1);
      }
    }
  });
});

/* ────────── City 무결성 ────────── */

describe("seed — City 무결성", () => {
  const cities = listCities();

  it("city 11개 이상 등록", () => {
    expect(cities.length).toBeGreaterThanOrEqual(11);
  });

  it("모든 city slug 유일", () => {
    const slugs = cities.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("모든 city code 유일", () => {
    const codes = cities.map((c) => c.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("getCityBySlug / getCityByCode 양방향 조회 일치", () => {
    for (const city of cities) {
      expect(getCityBySlug(city.slug)?.code).toBe(city.code);
      expect(getCityByCode(city.code)?.slug).toBe(city.slug);
    }
  });

  it("베트남 city 8개 이상", () => {
    const vn = listVietnamCities();
    expect(vn.length).toBeGreaterThanOrEqual(8);
    for (const c of vn) {
      expect(c.countryCode).toBe("VN");
    }
  });

  it.each(cities.map((c) => [c.slug, c]))(
    "%s — 필수 필드 존재",
    (_slug, city) => {
      const c = city as typeof cities[0];
      expect(c.name).toBeTruthy();
      expect(c.country).toBeTruthy();
      expect(c.countryCode).toBeTruthy();
      expect(c.emergencyContacts.length).toBeGreaterThanOrEqual(1);
    },
  );
});

/* ────────── Trip ↔ City 교차 참조 ────────── */

describe("seed — Trip ↔ City 교차 참조", () => {
  const trips = listDemoTrips();

  it("모든 데모 trip의 destinationCode가 city에 매핑됨", () => {
    for (const bundle of trips) {
      const city = getCityByCode(bundle.trip.destinationCode);
      expect(city).not.toBeNull();
    }
  });
});

/* ────────── OTA Offer 무결성 ────────── */

describe("seed — OTA Offer 무결성", () => {
  it("전체 OTA offer 90개 이상", () => {
    expect(allOtaOffers.length).toBeGreaterThanOrEqual(90);
  });

  it("모든 offer ID 유일", () => {
    const ids = allOtaOffers.map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("모든 offer에 필수 필드 존재", () => {
    for (const offer of allOtaOffers) {
      expect(offer.id).toBeTruthy();
      expect(offer.matchTag).toBeTruthy();
      expect(offer.ota).toBeTruthy();
      expect(offer.title).toBeTruthy();
      expect(offer.priceKrw).toBeGreaterThan(0);
      expect(offer.url).toBeTruthy();
    }
  });

  it("findOffersForItem — 알려진 matchTag에 결과 있음", () => {
    // 푸꾸옥 케이블카 — 3 OTA 확인
    const cablecar = findOffersForItem("pq-spot-cablecar");
    expect(cablecar.length).toBeGreaterThanOrEqual(2);
  });

  it("findOffersForItem — 미존재 태그에 빈 배열", () => {
    expect(findOffersForItem("nonexistent-item")).toEqual([]);
  });
});

/* ────────── OTA matchTag 일관성 ────────── */

describe("seed — OTA matchTag 일관성", () => {
  it("모든 matchTag에 도시 prefix 존재", () => {
    const validPrefixes = ["pq-", "dn-", "bk-", "ty-", "hcm-", "han-", "nh-", "dl-", "cm-"];
    for (const offer of allOtaOffers) {
      const hasPrefix = validPrefixes.some((p) => offer.matchTag.startsWith(p));
      expect(hasPrefix).toBe(true);
    }
  });

  it("동일 matchTag에 2+ OTA 경쟁 offer 존재 (가격 비교 가능)", () => {
    const tagCount = new Map<string, number>();
    for (const offer of allOtaOffers) {
      tagCount.set(offer.matchTag, (tagCount.get(offer.matchTag) ?? 0) + 1);
    }
    const multiOfferTags = [...tagCount.values()].filter((c) => c >= 2);
    expect(multiOfferTags.length).toBeGreaterThan(0);
  });
});
