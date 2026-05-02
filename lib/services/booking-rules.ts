/**
 * Booking Rules — 사이클 L (ADR-029, 5단계 검증 3단계).
 *
 * 순수 함수. 외부 API·DB 의존 없음 → 단위 테스트 100%.
 * 입력만 받아 bookingRequired 판정 + 근거(reason) 반환.
 *
 * 우선순위:
 *   1. Google Places `types` 있음 → types + 평점 기반 룰
 *   2. types 없음 (데모 모드 / 미검증) → category + name 키워드 fallback
 *
 * R1 조건: 매직 넘버는 모듈 상수로 분리 (인라인 ❌).
 */

import type { ItemCategory } from "@/lib/types";

// ═══════════════════════════════════════════════════════════════════
// 룰 임계값 (R1 조건 — 매직 넘버 모듈 상수)
// ═══════════════════════════════════════════════════════════════════

/** 식당 예약 권장 임계값 — 평점 + 후기 수 모두 충족 시 true */
export const RESTAURANT_BOOKING_THRESHOLD = {
  rating: 4.5,
  userRatingsTotal: 100,
} as const;

/** 일반(spot/shopping) 예약 권장 임계값 */
export const GENERAL_BOOKING_THRESHOLD = {
  rating: 4.0,
  userRatingsTotal: 50,
} as const;

/** Google Places types — 항상 예약 필요 (숙소·예약제) */
const ALWAYS_BOOKING_TYPES = new Set([
  "lodging",
  "hotel",
  "resort",
  "rv_park",
  "campground",
]);

/** Google Places types — 항상 예약 불필요 (교통·인프라) */
const NEVER_BOOKING_TYPES = new Set([
  "airport",
  "train_station",
  "transit_station",
  "subway_station",
  "bus_station",
  "taxi_stand",
]);

/** Google Places types — 식당 카테고리 */
const RESTAURANT_TYPES = new Set([
  "restaurant",
  "cafe",
  "bar",
  "meal_takeaway",
  "meal_delivery",
  "food",
]);

// ═══════════════════════════════════════════════════════════════════
// 데모 fallback 키워드 (한·영 매칭)
// ═══════════════════════════════════════════════════════════════════

/** spot 카테고리에서 예약/티켓 필요 키워드 (사이클 B 보강) */
const SPOT_BOOKING_KEYWORDS = [
  "케이블카",
  "투어",
  "티켓",
  "스노클",
  "입장권",
  "크루즈",
  "패스",
  "투어권",
  // 사이클 B (T12 fix): 시드 데이터의 데이투어/사파리 일정에 booking 정확 매칭
  "사파리",
  "사오비치",
  "데이투어",
  "tour",
  "ticket",
  "snorkel",
  "cable car",
  "cruise",
  "pass",
  "vinwonders",
  "vinpearl",
  "safari",
  "day tour",
  "sao beach",
];

/** food 카테고리에서 예약 권장 키워드 (프리미엄 식당) */
const FOOD_BOOKING_KEYWORDS = [
  "미슐랭",
  "파인다이닝",
  "오마카세",
  "예약",
  "레스토랑",
  "michelin",
  "fine dining",
  "omakase",
  "reservation",
  "cavern",
  "pepper",
];

// ═══════════════════════════════════════════════════════════════════
// 공개 타입
// ═══════════════════════════════════════════════════════════════════

export interface BookingRuleInput {
  category: ItemCategory;
  name: string;
  /** Google Places types (검증된 경우만, 없으면 데모 fallback) */
  types?: string[];
  /** Google rating (있으면 룰 보강) */
  rating?: number;
  /** Google userRatingsTotal (있으면 룰 보강) */
  userRatingsTotal?: number;
}

export interface BookingRuleOutput {
  required: boolean;
  reason: string;
  /** "types" = 실 API 룰 / "fallback" = 데모 휴리스틱 */
  source: "types" | "fallback";
}

// ═══════════════════════════════════════════════════════════════════
// 핵심 룰
// ═══════════════════════════════════════════════════════════════════

export function determineBookingRequired(
  input: BookingRuleInput,
): BookingRuleOutput {
  // ── 우선순위 1: Google Places types (실 API 데이터)
  if (input.types && input.types.length > 0) {
    return determineByTypes(input);
  }

  // ── 우선순위 2: 데모 fallback (category + name 키워드)
  return determineByFallback(input);
}

function determineByTypes(input: BookingRuleInput): BookingRuleOutput {
  const types = input.types!;

  // 숙소·캠핑장 — 항상 예약 필요
  for (const t of types) {
    if (ALWAYS_BOOKING_TYPES.has(t)) {
      return {
        required: true,
        reason: `숙박 시설 (${t})`,
        source: "types",
      };
    }
  }

  // 교통 인프라 — 항상 예약 불필요
  for (const t of types) {
    if (NEVER_BOOKING_TYPES.has(t)) {
      return {
        required: false,
        reason: `교통 시설 (${t})`,
        source: "types",
      };
    }
  }

  // 식당 — 평점 + 후기 수 임계값
  const isRestaurant = types.some((t) => RESTAURANT_TYPES.has(t));
  if (isRestaurant) {
    const rating = input.rating ?? 0;
    const reviews = input.userRatingsTotal ?? 0;
    if (
      rating >= RESTAURANT_BOOKING_THRESHOLD.rating &&
      reviews >= RESTAURANT_BOOKING_THRESHOLD.userRatingsTotal
    ) {
      return {
        required: true,
        reason: `인기 식당 (★${rating.toFixed(1)}, ${reviews}건)`,
        source: "types",
      };
    }
    return {
      required: false,
      reason: rating > 0
        ? `일반 식당 (★${rating.toFixed(1)}, ${reviews}건)`
        : "일반 식당",
      source: "types",
    };
  }

  // 그 외 — 일반 임계값
  const rating = input.rating ?? 0;
  const reviews = input.userRatingsTotal ?? 0;
  if (
    rating >= GENERAL_BOOKING_THRESHOLD.rating &&
    reviews >= GENERAL_BOOKING_THRESHOLD.userRatingsTotal
  ) {
    return {
      required: true,
      reason: `인기 명소 (★${rating.toFixed(1)}, ${reviews}건)`,
      source: "types",
    };
  }
  return {
    required: false,
    reason: "일반 명소",
    source: "types",
  };
}

function determineByFallback(input: BookingRuleInput): BookingRuleOutput {
  const { category, name } = input;
  const lowerName = name.toLowerCase();

  // rest 카테고리 — 휴식/숙소 가정
  if (category === "rest") {
    return {
      required: true,
      reason: "휴식·숙소 카테고리",
      source: "fallback",
    };
  }

  // spot 카테고리 — 키워드 기반
  if (category === "spot") {
    const matched = SPOT_BOOKING_KEYWORDS.find((kw) =>
      lowerName.includes(kw.toLowerCase()),
    );
    if (matched) {
      return {
        required: true,
        reason: `티켓·투어 키워드 (${matched})`,
        source: "fallback",
      };
    }
    return {
      required: false,
      reason: "일반 명소 (키워드 미매칭)",
      source: "fallback",
    };
  }

  // food 카테고리 — 프리미엄 키워드만 예약 권장
  if (category === "food") {
    const matched = FOOD_BOOKING_KEYWORDS.find((kw) =>
      lowerName.includes(kw.toLowerCase()),
    );
    if (matched) {
      return {
        required: true,
        reason: `프리미엄 식당 키워드 (${matched})`,
        source: "fallback",
      };
    }
    return {
      required: false,
      reason: "일반 식당 (키워드 미매칭)",
      source: "fallback",
    };
  }

  // shopping 등 — 기본 false
  return {
    required: false,
    reason: `${category} 카테고리는 기본 예약 불필요`,
    source: "fallback",
  };
}
