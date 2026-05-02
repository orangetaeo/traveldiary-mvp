/**
 * Booking Rules 단위 테스트 — 사이클 L (ADR-029, R1 조건).
 *
 * 순수 함수 — 외부 API·DB 의존 없음.
 * 케이스: types 우선 분기 / 데모 fallback / 임계값 경계.
 */

import { describe, it, expect } from "vitest";
import {
  determineBookingRequired,
  RESTAURANT_BOOKING_THRESHOLD,
  GENERAL_BOOKING_THRESHOLD,
} from "@/lib/services/booking-rules";

describe("determineBookingRequired — types 분기 (실 API 데이터)", () => {
  it("lodging types → required: true", () => {
    const out = determineBookingRequired({
      category: "rest",
      name: "Vinpearl Resort",
      types: ["lodging", "establishment"],
    });
    expect(out.required).toBe(true);
    expect(out.source).toBe("types");
    expect(out.reason).toContain("숙박");
  });

  it("airport types → required: false (교통 인프라)", () => {
    const out = determineBookingRequired({
      category: "spot",
      name: "Phu Quoc Airport",
      types: ["airport", "establishment"],
    });
    expect(out.required).toBe(false);
    expect(out.source).toBe("types");
    expect(out.reason).toContain("교통");
  });

  it("restaurant + 평점·후기 둘 다 임계값 초과 → required: true", () => {
    const out = determineBookingRequired({
      category: "food",
      name: "Cavern Restaurant",
      types: ["restaurant", "food"],
      rating: RESTAURANT_BOOKING_THRESHOLD.rating,
      userRatingsTotal: RESTAURANT_BOOKING_THRESHOLD.userRatingsTotal,
    });
    expect(out.required).toBe(true);
    expect(out.source).toBe("types");
    expect(out.reason).toContain("인기 식당");
  });

  it("restaurant + 평점만 임계값 (후기 부족) → required: false", () => {
    const out = determineBookingRequired({
      category: "food",
      name: "Local Cafe",
      types: ["restaurant"],
      rating: 4.8,
      userRatingsTotal: 50, // 임계값 100 미달
    });
    expect(out.required).toBe(false);
    expect(out.source).toBe("types");
  });

  it("일반 명소 + 임계값 초과 → required: true", () => {
    const out = determineBookingRequired({
      category: "spot",
      name: "Vinwonders",
      types: ["amusement_park", "tourist_attraction"],
      rating: GENERAL_BOOKING_THRESHOLD.rating,
      userRatingsTotal: GENERAL_BOOKING_THRESHOLD.userRatingsTotal,
    });
    expect(out.required).toBe(true);
    expect(out.source).toBe("types");
    expect(out.reason).toContain("인기");
  });

  it("일반 명소 + 평점·후기 모두 미달 → required: false", () => {
    const out = determineBookingRequired({
      category: "spot",
      name: "Quiet Beach",
      types: ["natural_feature"],
      rating: 3.8,
      userRatingsTotal: 20,
    });
    expect(out.required).toBe(false);
    expect(out.source).toBe("types");
  });
});

describe("determineBookingRequired — 데모 fallback (types 없음)", () => {
  it("category=rest → required: true (휴식·숙소 가정)", () => {
    const out = determineBookingRequired({
      category: "rest",
      name: "호텔 휴식 시간",
    });
    expect(out.required).toBe(true);
    expect(out.source).toBe("fallback");
  });

  it("category=spot + '케이블카' 키워드 → required: true", () => {
    const out = determineBookingRequired({
      category: "spot",
      name: "푸꾸옥 케이블카",
    });
    expect(out.required).toBe(true);
    expect(out.source).toBe("fallback");
    expect(out.reason).toContain("케이블카");
  });

  it("category=spot + 'tour' 영문 키워드 → required: true", () => {
    const out = determineBookingRequired({
      category: "spot",
      name: "Sao Beach Day Tour",
    });
    expect(out.required).toBe(true);
    expect(out.source).toBe("fallback");
  });

  it("category=spot + 일반 명소 (키워드 미매칭) → required: false", () => {
    const out = determineBookingRequired({
      category: "spot",
      name: "산책로",
    });
    expect(out.required).toBe(false);
    expect(out.source).toBe("fallback");
  });

  it("category=food + 일반 식당 → required: false", () => {
    const out = determineBookingRequired({
      category: "food",
      name: "분짜 가게",
    });
    expect(out.required).toBe(false);
    expect(out.source).toBe("fallback");
  });

  it("category=food + '오마카세' 키워드 → required: true (프리미엄)", () => {
    const out = determineBookingRequired({
      category: "food",
      name: "오마카세 코스",
    });
    expect(out.required).toBe(true);
    expect(out.source).toBe("fallback");
    expect(out.reason).toContain("프리미엄");
  });

  it("category=shopping → 기본 false", () => {
    const out = determineBookingRequired({
      category: "shopping",
      name: "야시장 쇼핑",
    });
    expect(out.required).toBe(false);
    expect(out.source).toBe("fallback");
  });

  // T12 사이클 B 회귀 검증
  it("category=spot + '사파리' 키워드 → required: true", () => {
    const out = determineBookingRequired({
      category: "spot",
      name: "빈펄 사파리 (Vinpearl Safari)",
    });
    expect(out.required).toBe(true);
    expect(out.source).toBe("fallback");
  });

  it("category=spot + '사오비치' 키워드 → required: true (데이투어 패키지)", () => {
    const out = determineBookingRequired({
      category: "spot",
      name: "사오비치 (Bãi Sao)",
    });
    expect(out.required).toBe(true);
    expect(out.source).toBe("fallback");
  });
});

describe("determineBookingRequired — 우선순위·경계", () => {
  it("types 비어있는 배열 → fallback 진입 (정의대로)", () => {
    const out = determineBookingRequired({
      category: "spot",
      name: "그냥 명소",
      types: [],
    });
    // types 길이 0 → fallback
    expect(out.source).toBe("fallback");
  });

  it("types > 0 일 때는 fallback 키워드 무시 (types 우선)", () => {
    // 키워드는 매칭되지만 types에 airport가 있어 false 우선
    const out = determineBookingRequired({
      category: "spot",
      name: "공항 케이블카 투어",
      types: ["airport"],
    });
    expect(out.required).toBe(false);
    expect(out.source).toBe("types");
  });
});
