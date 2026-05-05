/**
 * Distance Rules + Deeplinks + Booking Rules 순수 함수 테스트 — Batch 22.
 *
 * 3 모듈 (외부 의존 0):
 *  - lib/services/distance-rules.ts: haversineKm, pickTravelMode, estimateTravelMinutes, compareDistanceVerification
 *  - lib/utils/deeplinks.ts: googleMapsUrl, uberUrl, grabUrl, kakaoMapUrl
 *  - lib/services/booking-rules.ts: determineBookingRequired
 */

import { describe, it, expect } from "vitest";
import {
  haversineKm,
  pickTravelMode,
  estimateTravelMinutes,
  compareDistanceVerification,
  EARTH_RADIUS_KM,
  WALKING_DISTANCE_THRESHOLD_KM,
  WALKING_SPEED_KMH,
  DRIVING_SPEED_KMH,
  DRIVE_DETOUR_FACTOR,
} from "@/lib/services/distance-rules";
import {
  googleMapsUrl,
  uberUrl,
  grabUrl,
  kakaoMapUrl,
} from "@/lib/utils/deeplinks";
import {
  determineBookingRequired,
  RESTAURANT_BOOKING_THRESHOLD,
  GENERAL_BOOKING_THRESHOLD,
} from "@/lib/services/booking-rules";

/* ════════════════════════════════════════════
 * distance-rules — haversineKm
 * ════════════════════════════════════════════ */

describe("distance-rules — haversineKm", () => {
  it("동일 좌표 → 0", () => {
    expect(haversineKm({ lat: 16.05, lng: 108.2 }, { lat: 16.05, lng: 108.2 })).toBe(0);
  });

  it("다낭 미케비치 → 한시장 약 2.5km", () => {
    const dist = haversineKm(
      { lat: 16.0544, lng: 108.2452 }, // 미케비치
      { lat: 16.0678, lng: 108.2208 }, // 한시장
    );
    expect(dist).toBeGreaterThan(2);
    expect(dist).toBeLessThan(3.5);
  });

  it("다낭 → 호이안 약 25~30km", () => {
    const dist = haversineKm(
      { lat: 16.054, lng: 108.245 }, // 다낭
      { lat: 15.880, lng: 108.338 }, // 호이안
    );
    expect(dist).toBeGreaterThan(20);
    expect(dist).toBeLessThan(35);
  });

  it("적도 경도 1도 ≈ 111km", () => {
    const dist = haversineKm({ lat: 0, lng: 0 }, { lat: 0, lng: 1 });
    expect(dist).toBeGreaterThan(110);
    expect(dist).toBeLessThan(112);
  });

  it("EARTH_RADIUS_KM 상수 = 6371", () => {
    expect(EARTH_RADIUS_KM).toBe(6371);
  });
});

/* ════════════════════════════════════════════
 * distance-rules — pickTravelMode
 * ════════════════════════════════════════════ */

describe("distance-rules — pickTravelMode", () => {
  it("0.5km → walking", () => {
    expect(pickTravelMode(0.5)).toBe("walking");
  });

  it("0.99km → walking", () => {
    expect(pickTravelMode(0.99)).toBe("walking");
  });

  it("1.0km → driving (threshold 이상)", () => {
    expect(pickTravelMode(1.0)).toBe("driving");
  });

  it("5km → driving", () => {
    expect(pickTravelMode(5)).toBe("driving");
  });

  it("threshold 상수 = 1.0km", () => {
    expect(WALKING_DISTANCE_THRESHOLD_KM).toBe(1.0);
  });
});

/* ════════════════════════════════════════════
 * distance-rules — estimateTravelMinutes
 * ════════════════════════════════════════════ */

describe("distance-rules — estimateTravelMinutes", () => {
  it("walking 1km → ceil(1 * 1.4 * 60 / 4) = 21분", () => {
    expect(estimateTravelMinutes(1, "walking")).toBe(21);
  });

  it("driving 10km → ceil(10 * 1.4 * 60 / 60) = 14분", () => {
    expect(estimateTravelMinutes(10, "driving")).toBe(14);
  });

  it("driving 0km → 0분", () => {
    expect(estimateTravelMinutes(0, "driving")).toBe(0);
  });

  it("walking 속도 상수 = 4km/h", () => {
    expect(WALKING_SPEED_KMH).toBe(4);
  });

  it("driving 속도 상수 = 60km/h", () => {
    expect(DRIVING_SPEED_KMH).toBe(60);
  });

  it("우회 보정계수 = 1.4", () => {
    expect(DRIVE_DETOUR_FACTOR).toBe(1.4);
  });
});

/* ════════════════════════════════════════════
 * distance-rules — compareDistanceVerification
 * ════════════════════════════════════════════ */

describe("distance-rules — compareDistanceVerification", () => {
  const makeItem = (scheduledAt: string, durationMinutes: number, flexMinutes = 0) => ({
    id: "item-1",
    scheduledAt,
    durationMinutes,
    flexMinutes,
    location: { lat: 16.054, lng: 108.245 },
  });

  const makeNext = (scheduledAt: string, lat = 16.067, lng = 108.22) => ({
    scheduledAt,
    location: { lat, lng },
  });

  it("nextItem null → status 'no_next'", () => {
    const result = compareDistanceVerification({
      item: makeItem("2026-05-10T09:00:00+07:00", 60),
      nextItem: null,
    });
    expect(result.status).toBe("no_next");
    expect(result.verified).toBe(false);
    expect(result.source).toBe("none");
  });

  it("origin (0,0) → 'missing_location'", () => {
    const result = compareDistanceVerification({
      item: { ...makeItem("2026-05-10T09:00:00+07:00", 60), location: { lat: 0, lng: 0 } },
      nextItem: makeNext("2026-05-10T11:00:00+07:00"),
    });
    expect(result.status).toBe("missing_location");
  });

  it("destination (0,0) → 'missing_location'", () => {
    const result = compareDistanceVerification({
      item: makeItem("2026-05-10T09:00:00+07:00", 60),
      nextItem: makeNext("2026-05-10T11:00:00+07:00", 0, 0),
    });
    expect(result.status).toBe("missing_location");
  });

  it("여유 시간 충분 → 'verified'", () => {
    // 갭: (11:00 - 09:00) - 60분 duration = 60분
    // 거리: ~2.7km → driving mode → 추정 ~4분
    const result = compareDistanceVerification({
      item: makeItem("2026-05-10T09:00:00+07:00", 60),
      nextItem: makeNext("2026-05-10T11:00:00+07:00"),
    });
    expect(result.status).toBe("verified");
    expect(result.verified).toBe(true);
    expect(result.travelMinutes).toBeGreaterThan(0);
    expect(result.gapMinutes).toBe(60);
  });

  it("actualTravelMinutes 제공 시 → source 'directions'", () => {
    const result = compareDistanceVerification({
      item: makeItem("2026-05-10T09:00:00+07:00", 60),
      nextItem: makeNext("2026-05-10T11:00:00+07:00"),
      actualTravelMinutes: 10,
    });
    expect(result.source).toBe("directions");
    expect(result.travelMinutes).toBe(10);
  });

  it("actualTravelMinutes 미제공 → source 'fallback'", () => {
    const result = compareDistanceVerification({
      item: makeItem("2026-05-10T09:00:00+07:00", 60),
      nextItem: makeNext("2026-05-10T11:00:00+07:00"),
    });
    expect(result.source).toBe("fallback");
  });

  it("travel > gap but ≤ gap+flex → 'warn'", () => {
    // 갭: 10분, flex: 30분, actualTravel: 20분
    // 20 > 10 (gap) but 20 ≤ 10+30 (gapWithFlex) → warn
    const result = compareDistanceVerification({
      item: makeItem("2026-05-10T09:00:00+07:00", 50, 30),
      nextItem: makeNext("2026-05-10T10:00:00+07:00"),
      actualTravelMinutes: 20,
    });
    expect(result.status).toBe("warn");
    expect(result.verified).toBe(false);
  });

  it("travel > gap + flex → 'mismatch'", () => {
    // 갭: 10분, flex: 5분, actualTravel: 30분
    // 30 > 10+5 → mismatch
    const result = compareDistanceVerification({
      item: makeItem("2026-05-10T09:00:00+07:00", 50, 5),
      nextItem: makeNext("2026-05-10T10:00:00+07:00"),
      actualTravelMinutes: 30,
    });
    expect(result.status).toBe("mismatch");
    expect(result.verified).toBe(false);
  });

  it("forceMode → 모드 강제 지정", () => {
    const result = compareDistanceVerification({
      item: makeItem("2026-05-10T09:00:00+07:00", 60),
      nextItem: makeNext("2026-05-10T11:00:00+07:00"),
      forceMode: "walking",
    });
    expect(result.mode).toBe("walking");
  });

  it("distanceKm 반환 (소수 3자리)", () => {
    const result = compareDistanceVerification({
      item: makeItem("2026-05-10T09:00:00+07:00", 60),
      nextItem: makeNext("2026-05-10T11:00:00+07:00"),
    });
    expect(result.distanceKm).not.toBeNull();
    // 소수 3자리 반올림 확인
    const str = String(result.distanceKm!);
    const decimals = str.split(".")[1]?.length ?? 0;
    expect(decimals).toBeLessThanOrEqual(3);
  });
});

/* ════════════════════════════════════════════
 * deeplinks — googleMapsUrl
 * ════════════════════════════════════════════ */

describe("deeplinks — googleMapsUrl", () => {
  it("좌표만 → query 파라미터에 lat,lng", () => {
    const url = googleMapsUrl({ lat: 16.05, lng: 108.24 });
    expect(url).toContain("google.com/maps/search");
    expect(url).toContain("16.05,108.24");
  });

  it("이름 포함 → encodeURIComponent", () => {
    const url = googleMapsUrl({ lat: 16.05, lng: 108.24 }, "미케비치");
    expect(url).toContain(encodeURIComponent("미케비치"));
    expect(url).toContain("16.05");
  });
});

/* ════════════════════════════════════════════
 * deeplinks — uberUrl
 * ════════════════════════════════════════════ */

describe("deeplinks — uberUrl", () => {
  it("기본 URL 구조", () => {
    const url = uberUrl({ lat: 16.05, lng: 108.24 });
    expect(url).toContain("m.uber.com/ul");
    expect(url).toContain("action=setPickup");
    expect(url).toContain("pickup=my_location");
    expect(url).toContain("dropoff%5Blatitude%5D=16.05");
    expect(url).toContain("dropoff%5Blongitude%5D=108.24");
  });

  it("dropoffName → nickname 파라미터", () => {
    const url = uberUrl({ lat: 16.05, lng: 108.24 }, "바나힐");
    expect(url).toContain("dropoff%5Bnickname%5D=");
    expect(url).toContain(encodeURIComponent("바나힐"));
  });
});

/* ════════════════════════════════════════════
 * deeplinks — grabUrl
 * ════════════════════════════════════════════ */

describe("deeplinks — grabUrl", () => {
  it("기본 URL 구조", () => {
    const url = grabUrl({ lat: 16.05, lng: 108.24 });
    expect(url).toContain("grab.onelink.me");
    expect(url).toContain("dropOffLatitude=16.05");
    expect(url).toContain("dropOffLongitude=108.24");
    expect(url).toContain("sourceLatitude=0");
  });

  it("dropoffName → dropOffAddress 파라미터", () => {
    const url = grabUrl({ lat: 16.05, lng: 108.24 }, "한시장");
    expect(url).toContain("dropOffAddress=");
  });
});

/* ════════════════════════════════════════════
 * deeplinks — kakaoMapUrl
 * ════════════════════════════════════════════ */

describe("deeplinks — kakaoMapUrl", () => {
  it("기본 URL 구조 — 이름 없으면 '장소'", () => {
    const url = kakaoMapUrl({ lat: 16.05, lng: 108.24 });
    expect(url).toContain("map.kakao.com/link/map/");
    expect(url).toContain("16.05,108.24");
    expect(url).toContain("장소");
  });

  it("이름 포함 → 콤마 제거 + encodeURIComponent", () => {
    const url = kakaoMapUrl({ lat: 16.05, lng: 108.24 }, "바나힐,다낭");
    expect(url).not.toContain(",다낭");
    expect(url).toContain("16.05,108.24");
  });

  it("한국어 이름 인코딩", () => {
    const url = kakaoMapUrl({ lat: 15.88, lng: 108.33 }, "호이안 올드타운");
    expect(url).toContain(encodeURIComponent("호이안 올드타운"));
  });
});

/* ════════════════════════════════════════════
 * booking-rules — determineBookingRequired (types path)
 * ════════════════════════════════════════════ */

describe("booking-rules — determineBookingRequired (types)", () => {
  it("lodging type → required true", () => {
    const result = determineBookingRequired({
      category: "rest",
      name: "호텔",
      types: ["lodging", "point_of_interest"],
    });
    expect(result.required).toBe(true);
    expect(result.source).toBe("types");
    expect(result.reason).toContain("숙박");
  });

  it("airport type → required false", () => {
    const result = determineBookingRequired({
      category: "spot",
      name: "다낭 공항",
      types: ["airport"],
    });
    expect(result.required).toBe(false);
    expect(result.reason).toContain("교통");
  });

  it("restaurant + 고평점/고후기 → required true", () => {
    const result = determineBookingRequired({
      category: "food",
      name: "로컬 맛집",
      types: ["restaurant"],
      rating: 4.7,
      userRatingsTotal: 200,
    });
    expect(result.required).toBe(true);
    expect(result.reason).toContain("인기 식당");
  });

  it("restaurant + 저평점 → required false", () => {
    const result = determineBookingRequired({
      category: "food",
      name: "일반 식당",
      types: ["restaurant"],
      rating: 3.5,
      userRatingsTotal: 30,
    });
    expect(result.required).toBe(false);
    expect(result.reason).toContain("일반 식당");
  });

  it("일반 spot + 고평점/고후기 → required true (general threshold)", () => {
    const result = determineBookingRequired({
      category: "spot",
      name: "바나힐",
      types: ["amusement_park", "tourist_attraction"],
      rating: 4.5,
      userRatingsTotal: 12000,
    });
    expect(result.required).toBe(true);
    expect(result.reason).toContain("인기 명소");
  });

  it("일반 spot + 저평점 → required false", () => {
    const result = determineBookingRequired({
      category: "spot",
      name: "공원",
      types: ["park"],
      rating: 3.0,
      userRatingsTotal: 10,
    });
    expect(result.required).toBe(false);
    expect(result.reason).toBe("일반 명소");
  });

  it("threshold 상수 확인", () => {
    expect(RESTAURANT_BOOKING_THRESHOLD.rating).toBe(4.5);
    expect(RESTAURANT_BOOKING_THRESHOLD.userRatingsTotal).toBe(100);
    expect(GENERAL_BOOKING_THRESHOLD.rating).toBe(4.0);
    expect(GENERAL_BOOKING_THRESHOLD.userRatingsTotal).toBe(50);
  });
});

/* ════════════════════════════════════════════
 * booking-rules — determineBookingRequired (fallback path)
 * ════════════════════════════════════════════ */

describe("booking-rules — determineBookingRequired (fallback)", () => {
  it("rest 카테고리 → required true", () => {
    const result = determineBookingRequired({ category: "rest", name: "호텔" });
    expect(result.required).toBe(true);
    expect(result.source).toBe("fallback");
  });

  it("spot + 투어 키워드 → required true", () => {
    const result = determineBookingRequired({
      category: "spot",
      name: "바나힐 케이블카 투어",
    });
    expect(result.required).toBe(true);
    expect(result.reason).toContain("키워드");
  });

  it("spot + 일반 이름 → required false", () => {
    const result = determineBookingRequired({
      category: "spot",
      name: "미케비치 해변",
    });
    expect(result.required).toBe(false);
    expect(result.source).toBe("fallback");
  });

  it("food + 미슐랭 키워드 → required true", () => {
    const result = determineBookingRequired({
      category: "food",
      name: "미슐랭 레스토랑",
    });
    expect(result.required).toBe(true);
    expect(result.reason).toContain("프리미엄");
  });

  it("food + 일반 → required false", () => {
    const result = determineBookingRequired({
      category: "food",
      name: "반미 노점",
    });
    expect(result.required).toBe(false);
  });

  it("shopping 카테고리 → required false", () => {
    const result = determineBookingRequired({
      category: "shopping",
      name: "한시장",
    });
    expect(result.required).toBe(false);
    expect(result.reason).toContain("기본 예약 불필요");
  });

  it("영어 키워드 매칭 (대소문자 무시)", () => {
    const result = determineBookingRequired({
      category: "spot",
      name: "VinWonders Nha Trang",
    });
    expect(result.required).toBe(true);
  });

  it("spot + snorkel 키워드 → required true", () => {
    const result = determineBookingRequired({
      category: "spot",
      name: "Snorkeling Day Tour",
    });
    expect(result.required).toBe(true);
  });
});
