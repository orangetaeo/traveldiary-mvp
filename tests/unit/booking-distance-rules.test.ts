/**
 * booking-rules.ts + distance-rules.ts 순수 함수 단위 테스트.
 *
 * 두 모듈 모두 외부 API·DB 의존 없는 순수 함수.
 */

import { describe, it, expect } from "vitest";

// ─── booking-rules ────────────────────────────────────────

import {
  determineBookingRequired,
  RESTAURANT_BOOKING_THRESHOLD,
  GENERAL_BOOKING_THRESHOLD,
} from "@/lib/services/booking-rules";

// ─── distance-rules ───────────────────────────────────────

import {
  pickTravelMode,
  estimateTravelMinutes,
  compareDistanceVerification,
  WALKING_DISTANCE_THRESHOLD_KM,
  WALKING_SPEED_KMH,
  DRIVING_SPEED_KMH,
  DRIVE_DETOUR_FACTOR,
} from "@/lib/services/distance-rules";

/* ════════════════════════════════════════════
 * determineBookingRequired — types 기반
 * ════════════════════════════════════════════ */

describe("booking-rules — types 기반", () => {
  it("숙소 type → required=true", () => {
    const result = determineBookingRequired({
      category: "rest",
      name: "호텔",
      types: ["lodging"],
    });
    expect(result.required).toBe(true);
    expect(result.source).toBe("types");
    expect(result.reason).toContain("숙박");
  });

  it("hotel type → required=true", () => {
    const result = determineBookingRequired({
      category: "rest",
      name: "리조트",
      types: ["resort", "hotel"],
    });
    expect(result.required).toBe(true);
  });

  it("교통 type → required=false", () => {
    const result = determineBookingRequired({
      category: "spot",
      name: "공항",
      types: ["airport"],
    });
    expect(result.required).toBe(false);
    expect(result.reason).toContain("교통");
  });

  it("subway_station → required=false", () => {
    const result = determineBookingRequired({
      category: "spot",
      name: "역",
      types: ["subway_station"],
    });
    expect(result.required).toBe(false);
  });

  it("인기 식당 (★4.5+, 100건+) → required=true", () => {
    const result = determineBookingRequired({
      category: "food",
      name: "맛집",
      types: ["restaurant"],
      rating: 4.6,
      userRatingsTotal: 200,
    });
    expect(result.required).toBe(true);
    expect(result.reason).toContain("인기 식당");
    expect(result.reason).toContain("4.6");
  });

  it("일반 식당 (★4.0, 50건) → required=false", () => {
    const result = determineBookingRequired({
      category: "food",
      name: "국수집",
      types: ["restaurant"],
      rating: 4.0,
      userRatingsTotal: 50,
    });
    expect(result.required).toBe(false);
    expect(result.reason).toContain("일반 식당");
  });

  it("식당 경계값 — 정확히 threshold → required=true", () => {
    const result = determineBookingRequired({
      category: "food",
      name: "경계 맛집",
      types: ["cafe"],
      rating: RESTAURANT_BOOKING_THRESHOLD.rating,
      userRatingsTotal: RESTAURANT_BOOKING_THRESHOLD.userRatingsTotal,
    });
    expect(result.required).toBe(true);
  });

  it("인기 명소 (★4.0+, 50건+) → required=true", () => {
    const result = determineBookingRequired({
      category: "spot",
      name: "랜드마크",
      types: ["tourist_attraction"],
      rating: 4.2,
      userRatingsTotal: 80,
    });
    expect(result.required).toBe(true);
    expect(result.reason).toContain("인기 명소");
  });

  it("일반 명소 (낮은 평점) → required=false", () => {
    const result = determineBookingRequired({
      category: "spot",
      name: "공원",
      types: ["park"],
      rating: 3.5,
      userRatingsTotal: 20,
    });
    expect(result.required).toBe(false);
    expect(result.reason).toBe("일반 명소");
  });

  it("명소 경계값 — 정확히 threshold → required=true", () => {
    const result = determineBookingRequired({
      category: "spot",
      name: "경계 명소",
      types: ["point_of_interest"],
      rating: GENERAL_BOOKING_THRESHOLD.rating,
      userRatingsTotal: GENERAL_BOOKING_THRESHOLD.userRatingsTotal,
    });
    expect(result.required).toBe(true);
  });

  it("rating/userRatingsTotal 미제공 → 0으로 fallback → false", () => {
    const result = determineBookingRequired({
      category: "food",
      name: "노점",
      types: ["restaurant"],
    });
    expect(result.required).toBe(false);
    expect(result.reason).toBe("일반 식당");
  });
});

/* ════════════════════════════════════════════
 * determineBookingRequired — fallback (데모)
 * ════════════════════════════════════════════ */

describe("booking-rules — fallback", () => {
  it("rest 카테고리 → required=true", () => {
    const result = determineBookingRequired({
      category: "rest",
      name: "호텔",
    });
    expect(result.required).toBe(true);
    expect(result.source).toBe("fallback");
    expect(result.reason).toContain("숙소");
  });

  it("spot + 투어 키워드 → required=true", () => {
    const result = determineBookingRequired({
      category: "spot",
      name: "VinWonders 워터파크",
    });
    expect(result.required).toBe(true);
    expect(result.reason).toContain("키워드");
  });

  it("spot + 케이블카 키워드 → required=true", () => {
    const result = determineBookingRequired({
      category: "spot",
      name: "케이블카 탑승",
    });
    expect(result.required).toBe(true);
  });

  it("spot + 일반 이름 → required=false", () => {
    const result = determineBookingRequired({
      category: "spot",
      name: "해변 산책로",
    });
    expect(result.required).toBe(false);
  });

  it("food + 미슐랭 키워드 → required=true", () => {
    const result = determineBookingRequired({
      category: "food",
      name: "미슐랭 레스토랑",
    });
    expect(result.required).toBe(true);
    expect(result.reason).toContain("프리미엄");
  });

  it("food + 오마카세 키워드 → required=true", () => {
    const result = determineBookingRequired({
      category: "food",
      name: "스시 오마카세",
    });
    expect(result.required).toBe(true);
  });

  it("food + 일반 이름 → required=false", () => {
    const result = determineBookingRequired({
      category: "food",
      name: "쌀국수",
    });
    expect(result.required).toBe(false);
  });

  it("shopping → required=false", () => {
    const result = determineBookingRequired({
      category: "shopping",
      name: "야시장",
    });
    expect(result.required).toBe(false);
    expect(result.source).toBe("fallback");
  });

  it("키워드 대소문자 무시 (VinWonders)", () => {
    const result = determineBookingRequired({
      category: "spot",
      name: "VinWonders Phu Quoc",
    });
    expect(result.required).toBe(true);
  });
});

/* ════════════════════════════════════════════
 * pickTravelMode
 * ════════════════════════════════════════════ */

describe("pickTravelMode", () => {
  it("0.5km → walking", () => {
    expect(pickTravelMode(0.5)).toBe("walking");
  });

  it("2km → driving", () => {
    expect(pickTravelMode(2)).toBe("driving");
  });

  it("정확히 threshold → driving (미만만 walking)", () => {
    expect(pickTravelMode(WALKING_DISTANCE_THRESHOLD_KM)).toBe("driving");
  });

  it("threshold 바로 아래 → walking", () => {
    expect(pickTravelMode(WALKING_DISTANCE_THRESHOLD_KM - 0.001)).toBe("walking");
  });
});

/* ════════════════════════════════════════════
 * estimateTravelMinutes
 * ════════════════════════════════════════════ */

describe("estimateTravelMinutes", () => {
  it("walking 1km → ceil((1 * 1.4 * 60) / 4) = 21분", () => {
    const result = estimateTravelMinutes(1, "walking");
    expect(result).toBe(Math.ceil((1 * DRIVE_DETOUR_FACTOR * 60) / WALKING_SPEED_KMH));
  });

  it("driving 10km → ceil((10 * 1.4 * 60) / 60) = 14분", () => {
    const result = estimateTravelMinutes(10, "driving");
    expect(result).toBe(Math.ceil((10 * DRIVE_DETOUR_FACTOR * 60) / DRIVING_SPEED_KMH));
  });

  it("0km → 0분", () => {
    expect(estimateTravelMinutes(0, "walking")).toBe(0);
    expect(estimateTravelMinutes(0, "driving")).toBe(0);
  });

  it("항상 정수 (ceil)", () => {
    const result = estimateTravelMinutes(0.3, "walking");
    expect(Number.isInteger(result)).toBe(true);
  });
});

/* ════════════════════════════════════════════
 * compareDistanceVerification
 * ════════════════════════════════════════════ */

describe("compareDistanceVerification", () => {
  const baseItem = {
    id: "item-1",
    scheduledAt: "2026-06-01T09:00:00Z",
    durationMinutes: 60,
    flexMinutes: 10,
    location: { lat: 10.215, lng: 103.957, address: "A" },
  };

  it("nextItem=null → no_next", () => {
    const result = compareDistanceVerification({
      item: baseItem,
      nextItem: null,
    });
    expect(result.status).toBe("no_next");
    expect(result.verified).toBe(false);
    expect(result.source).toBe("none");
  });

  it("좌표 누락 → missing_location", () => {
    const result = compareDistanceVerification({
      item: { ...baseItem, location: { lat: 0, lng: 0, address: "" } },
      nextItem: { scheduledAt: "2026-06-01T11:00:00Z", location: { lat: 10.2, lng: 103.9, address: "B" } },
    });
    expect(result.status).toBe("missing_location");
  });

  it("여유 충분 → verified", () => {
    const result = compareDistanceVerification({
      item: baseItem,
      nextItem: {
        scheduledAt: "2026-06-01T14:00:00Z", // 09:00 + 60분 + 240분 갭
        location: { lat: 10.216, lng: 103.958, address: "B" }, // 매우 가까움
      },
    });
    expect(result.status).toBe("verified");
    expect(result.verified).toBe(true);
  });

  it("갭 빠듯 (flex 범위) → warn", () => {
    // 이동시간이 갭보다 약간 크지만 flex 범위
    const result = compareDistanceVerification({
      item: { ...baseItem, flexMinutes: 30 },
      nextItem: {
        scheduledAt: "2026-06-01T10:05:00Z", // 09:00 + 60분 duration → 10:00 종료, 5분 갭
        location: { lat: 10.220, lng: 103.960, address: "B" }, // ~500m
      },
      actualTravelMinutes: 10, // 10분 > 5분 갭, 하지만 5+30=35 이내
    });
    expect(result.status).toBe("warn");
    expect(result.verified).toBe(false);
  });

  it("부족 → mismatch", () => {
    const result = compareDistanceVerification({
      item: { ...baseItem, flexMinutes: 0 },
      nextItem: {
        scheduledAt: "2026-06-01T10:05:00Z", // 5분 갭
        location: { lat: 10.250, lng: 104.000, address: "C" }, // 수 km
      },
      actualTravelMinutes: 30, // 30분 > 5분
    });
    expect(result.status).toBe("mismatch");
    expect(result.verified).toBe(false);
    expect(result.reason).toContain("부족");
  });

  it("actualTravelMinutes 있으면 source=directions", () => {
    const result = compareDistanceVerification({
      item: baseItem,
      nextItem: {
        scheduledAt: "2026-06-01T14:00:00Z",
        location: { lat: 10.216, lng: 103.958, address: "B" },
      },
      actualTravelMinutes: 5,
    });
    expect(result.source).toBe("directions");
  });

  it("actualTravelMinutes 없으면 source=fallback", () => {
    const result = compareDistanceVerification({
      item: baseItem,
      nextItem: {
        scheduledAt: "2026-06-01T14:00:00Z",
        location: { lat: 10.216, lng: 103.958, address: "B" },
      },
    });
    expect(result.source).toBe("fallback");
  });

  it("distanceKm 반환 (소수 3자리)", () => {
    const result = compareDistanceVerification({
      item: baseItem,
      nextItem: {
        scheduledAt: "2026-06-01T14:00:00Z",
        location: { lat: 10.22, lng: 103.96, address: "B" },
      },
    });
    expect(result.distanceKm).not.toBeNull();
    // 소수 3자리 이하
    const decimals = result.distanceKm!.toString().split(".")[1];
    expect(!decimals || decimals.length <= 3).toBe(true);
  });

  it("forceMode 지정 → 해당 모드 사용", () => {
    const result = compareDistanceVerification({
      item: baseItem,
      nextItem: {
        scheduledAt: "2026-06-01T14:00:00Z",
        location: { lat: 10.216, lng: 103.958, address: "B" },
      },
      forceMode: "driving",
    });
    expect(result.mode).toBe("driving");
  });
});
