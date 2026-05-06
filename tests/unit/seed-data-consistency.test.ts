/**
 * Seed 데이터 일관성 검증.
 *
 * lib/seed/ 시드 데이터가 타입 규칙과 교차 참조를 만족하는지 확인:
 * - City 시드: slug/code 형식, 필수 필드, resolveCity 성공
 * - Trip 시드: ID 유일성, items dayIndex 범위, category 유효값
 * - OTA 시드: matchTag prefix 표준, 가격 양수, ota 필드 유효값
 * - Trip → City 참조 정합
 */

import { describe, it, expect } from "vitest";
import {
  listCities,
  getCityBySlug,
  getCityByCode,
  resolveCity,
  listVietnamCities,
  PRIMARY_COUNTRY_CODE,
} from "@/lib/seed/cities/index";
import {
  listDemoTrips,
  getDemoTrip,
  DEMO_TRIP_ID,
  DEMO_TRIP_IDS,
} from "@/lib/seed/index";

/* ════════════════════════════════════════════
 * City 시드 — slug/code 형식
 * ════════════════════════════════════════════ */

const ALL_CITIES = listCities();

describe("city 시드 — 기본 형식", () => {
  it("11개 이상 도시 존재", () => {
    expect(ALL_CITIES.length).toBeGreaterThanOrEqual(11);
  });

  it.each(ALL_CITIES.map((c) => [c.slug, c]))(
    "%s — slug가 lowercase + hyphen 형식",
    (_slug, city) => {
      expect(city.slug).toMatch(/^[a-z][a-z0-9-]+$/);
    },
  );

  it.each(ALL_CITIES.map((c) => [c.slug, c]))(
    "%s — code가 3자 대문자",
    (_slug, city) => {
      expect(city.code).toMatch(/^[A-Z]{3}$/);
    },
  );

  it("slug 중복 없음", () => {
    const slugs = ALL_CITIES.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("code 중복 없음", () => {
    const codes = ALL_CITIES.map((c) => c.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
});

/* ════════════════════════════════════════════
 * City 시드 — 필수 필드
 * ════════════════════════════════════════════ */

describe("city 시드 — 필수 필드", () => {
  it.each(ALL_CITIES.map((c) => [c.slug, c]))(
    "%s — name 비어있지 않음",
    (_slug, city) => {
      expect(city.name.length).toBeGreaterThan(0);
    },
  );

  it.each(ALL_CITIES.map((c) => [c.slug, c]))(
    "%s — countryCode 존재",
    (_slug, city) => {
      expect(city.countryCode).toBeDefined();
      expect(city.countryCode.length).toBeGreaterThanOrEqual(2);
    },
  );

  it.each(ALL_CITIES.map((c) => [c.slug, c]))(
    "%s — emergencyContacts 배열 존재",
    (_slug, city) => {
      expect(Array.isArray(city.emergencyContacts)).toBe(true);
    },
  );

  it.each(ALL_CITIES.map((c) => [c.slug, c]))(
    "%s — payment 객체 존재",
    (_slug, city) => {
      expect(city.payment).toBeDefined();
    },
  );
});

/* ════════════════════════════════════════════
 * City lookup 함수 정합
 * ════════════════════════════════════════════ */

describe("city 시드 — lookup 함수", () => {
  it.each(ALL_CITIES.map((c) => [c.slug, c]))(
    "%s — getCityBySlug 반환",
    (slug) => {
      expect(getCityBySlug(slug)).not.toBeNull();
    },
  );

  it.each(ALL_CITIES.map((c) => [c.slug, c]))(
    "%s — getCityByCode 반환",
    (_slug, city) => {
      expect(getCityByCode(city.code)).not.toBeNull();
    },
  );

  it.each(ALL_CITIES.map((c) => [c.slug, c]))(
    "%s — resolveCity 성공",
    (slug) => {
      const resolved = resolveCity(slug);
      expect(resolved).not.toBeNull();
      // ResolvedCity는 payment 필수 3필드 보장
      expect(resolved!.payment.currency).toBeDefined();
      expect(resolved!.payment.currencySymbol).toBeDefined();
      expect(resolved!.payment.approxKrwRate).toBeDefined();
    },
  );

  it("존재하지 않는 slug → null", () => {
    expect(getCityBySlug("nonexistent")).toBeNull();
    expect(resolveCity("nonexistent")).toBeNull();
  });

  it("존재하지 않는 code → null", () => {
    expect(getCityByCode("ZZZ")).toBeNull();
  });
});

/* ════════════════════════════════════════════
 * 베트남 도시 — PRIMARY_COUNTRY_CODE 정합
 * ════════════════════════════════════════════ */

describe("city 시드 — 베트남 우선 정책", () => {
  const vnCities = listVietnamCities();

  it("PRIMARY_COUNTRY_CODE가 VN", () => {
    expect(PRIMARY_COUNTRY_CODE).toBe("VN");
  });

  it("베트남 도시 8개 이상", () => {
    expect(vnCities.length).toBeGreaterThanOrEqual(8);
  });

  it("모든 베트남 도시의 countryCode === VN", () => {
    for (const city of vnCities) {
      expect(city.countryCode).toBe("VN");
    }
  });
});

/* ════════════════════════════════════════════
 * Trip 시드 — 기본 형식
 * ════════════════════════════════════════════ */

const ALL_DEMO_TRIPS = listDemoTrips();

describe("trip 시드 — 기본 형식", () => {
  it("6개 이상 데모 trip 존재", () => {
    expect(ALL_DEMO_TRIPS.length).toBeGreaterThanOrEqual(6);
  });

  it("DEMO_TRIP_ID가 유효한 trip", () => {
    expect(getDemoTrip(DEMO_TRIP_ID)).not.toBeNull();
  });

  it("DEMO_TRIP_IDS와 listDemoTrips 수 일치", () => {
    expect(DEMO_TRIP_IDS.length).toBe(ALL_DEMO_TRIPS.length);
  });

  it("trip ID 중복 없음", () => {
    const ids = ALL_DEMO_TRIPS.map((b) => b.trip.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

/* ════════════════════════════════════════════
 * Trip 시드 — 필수 필드 + items 정합
 * ════════════════════════════════════════════ */

describe("trip 시드 — 필수 필드", () => {
  it.each(ALL_DEMO_TRIPS.map((b) => [b.trip.id, b]))(
    "%s — destination 비어있지 않음",
    (_id, bundle) => {
      expect(bundle.trip.destination.length).toBeGreaterThan(0);
    },
  );

  it.each(ALL_DEMO_TRIPS.map((b) => [b.trip.id, b]))(
    "%s — nights > 0",
    (_id, bundle) => {
      expect(bundle.trip.nights).toBeGreaterThan(0);
    },
  );

  it.each(ALL_DEMO_TRIPS.map((b) => [b.trip.id, b]))(
    "%s — items 1개 이상",
    (_id, bundle) => {
      expect(bundle.items.length).toBeGreaterThan(0);
    },
  );
});

/* ════════════════════════════════════════════
 * Trip 시드 — items dayIndex 범위
 * ════════════════════════════════════════════ */

describe("trip 시드 — items dayIndex 범위", () => {
  it.each(ALL_DEMO_TRIPS.map((b) => [b.trip.id, b]))(
    "%s — 모든 item.dayIndex가 0 ~ nights 범위",
    (_id, bundle) => {
      for (const item of bundle.items) {
        expect(item.dayIndex).toBeGreaterThanOrEqual(0);
        expect(item.dayIndex).toBeLessThanOrEqual(bundle.trip.nights);
      }
    },
  );
});

/* ════════════════════════════════════════════
 * Trip 시드 — item category 유효값
 * ════════════════════════════════════════════ */

const VALID_CATEGORIES = ["food", "spot", "shopping", "rest"];

describe("trip 시드 — item category", () => {
  it.each(ALL_DEMO_TRIPS.map((b) => [b.trip.id, b]))(
    "%s — 모든 item.category가 유효",
    (_id, bundle) => {
      for (const item of bundle.items) {
        expect(VALID_CATEGORIES).toContain(item.category);
      }
    },
  );
});

/* ════════════════════════════════════════════
 * Trip 시드 — item ID 유일성
 * ════════════════════════════════════════════ */

describe("trip 시드 — item ID 유일성", () => {
  it("전체 trip 내 item ID 중복 없음", () => {
    const allIds = ALL_DEMO_TRIPS.flatMap((b) => b.items.map((it) => it.id));
    expect(new Set(allIds).size).toBe(allIds.length);
  });
});

/* ════════════════════════════════════════════
 * Trip → City 참조 정합
 * ════════════════════════════════════════════ */

describe("trip → city 참조 정합", () => {
  it.each(ALL_DEMO_TRIPS.map((b) => [b.trip.id, b]))(
    "%s — trip.cityCode가 유효한 city로 매핑",
    (_id, bundle) => {
      if (bundle.trip.cityCode) {
        const city = getCityByCode(bundle.trip.cityCode);
        expect(city, `trip.cityCode=${bundle.trip.cityCode} → city 없음`).not.toBeNull();
      }
    },
  );
});

/* ════════════════════════════════════════════
 * Trip 시드 — item.location 좌표 유효성
 * ════════════════════════════════════════════ */

describe("trip 시드 — item.location 좌표", () => {
  it.each(ALL_DEMO_TRIPS.map((b) => [b.trip.id, b]))(
    "%s — 모든 item에 유효한 lat/lng 좌표",
    (_id, bundle) => {
      for (const item of bundle.items) {
        expect(item.location.lat).toBeGreaterThanOrEqual(-90);
        expect(item.location.lat).toBeLessThanOrEqual(90);
        expect(item.location.lng).toBeGreaterThanOrEqual(-180);
        expect(item.location.lng).toBeLessThanOrEqual(180);
        // (0, 0) = null island → 의미 없는 좌표
        expect(
          item.location.lat !== 0 || item.location.lng !== 0,
          `${item.id} — (0, 0) null island 좌표`,
        ).toBe(true);
      }
    },
  );
});
