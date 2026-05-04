/**
 * 순수 함수 비즈니스 로직 테스트 — Batch 4.
 *
 * 대상: allergens (S-08), mode-transition (S-04), replan (S-01/S-06).
 * 외부 의존성 0 — 시드/DB/API 없이 순수 로직만 검증.
 */

import { describe, it, expect } from "vitest";
import {
  normalizeExclude,
  matchAllergens,
  buildWarning,
  ALLERGEN_CHIPS,
} from "@/lib/allergens";
import {
  calculateDDay,
  calculateTravelDay,
  distanceKm,
  isWithinBoundary,
  detectMode,
  dayProgress,
  buildModeTransitionMetadata,
} from "@/lib/mode-transition";
import {
  calculateAffectedRange,
  generateReplanOptions,
  validateDag,
} from "@/lib/replan";
import type { ItineraryItem, Trip } from "@/lib/types";

/* ────────── allergens ────────── */

describe("allergens — normalizeExclude", () => {
  it("정확 alias 매칭", () => {
    expect(normalizeExclude("새우 알레르기")).toBe("새우");
    expect(normalizeExclude("돼지고기 안 먹음")).toBe("돼지고기");
    expect(normalizeExclude("비건")).toBe("비건");
    expect(normalizeExclude("글루텐 프리")).toBe("글루텐");
  });

  it("카테고리 직접 매칭", () => {
    expect(normalizeExclude("갑각류")).toBe("갑각류");
    expect(normalizeExclude("조개")).toBe("조개");
  });

  it("부분 포함 매칭", () => {
    expect(normalizeExclude("새우")).toBe("새우");
  });

  it("미지 입력은 null", () => {
    expect(normalizeExclude("xyz_unknown")).toBeNull();
  });

  it("빈 문자열은 부분 일치로 매칭됨 (구현 특성)", () => {
    // 빈 문자열은 ALIASES 키에 includes되므로 첫 매칭이 반환됨
    expect(normalizeExclude("")).not.toBeNull();
  });
});

describe("allergens — matchAllergens", () => {
  it("새우 알레르기 — 'tôm' 키워드 감지", () => {
    const matches = matchAllergens("tôm sú nướng muối ớt", ["새우 알레르기"]);
    expect(matches.length).toBe(1);
    expect(matches[0].category).toBe("새우");
    expect(matches[0].severity).toBe("critical");
  });

  it("돼지고기 안 먹음 — 'thịt heo' 감지", () => {
    const matches = matchAllergens("cơm tấm thịt heo nướng", ["돼지고기 안 먹음"]);
    expect(matches.length).toBe(1);
    expect(matches[0].severity).toBe("preference");
  });

  it("매칭 없으면 빈 배열", () => {
    expect(matchAllergens("phở gà", ["새우 알레르기"])).toEqual([]);
  });

  it("중복 카테고리 1회만", () => {
    // "갑각류"도 "새우" 키워드 포함 — 둘 다 지정해도 각각 1회만
    const matches = matchAllergens("tôm nướng", ["새우 알레르기", "갑각류 알레르기"]);
    expect(matches.length).toBe(2);
    const cats = matches.map((m) => m.category);
    expect(cats).toContain("새우");
    expect(cats).toContain("갑각류");
  });
});

describe("allergens — buildWarning", () => {
  it("critical → ⚠️ 알레르기 위험 메시지", () => {
    const w = buildWarning([{ category: "새우", keyword: "tôm", severity: "critical" }]);
    expect(w).toContain("알레르기 위험");
    expect(w).toContain("새우");
  });

  it("preference → 포함 메시지 (위험 아님)", () => {
    const w = buildWarning([{ category: "돼지고기", keyword: "heo", severity: "preference" }]);
    expect(w).toContain("포함");
    expect(w).not.toContain("위험");
  });

  it("빈 배열 → null", () => {
    expect(buildWarning([])).toBeNull();
  });
});

describe("allergens — ALLERGEN_CHIPS", () => {
  it("7개 이상 칩 제공", () => {
    expect(ALLERGEN_CHIPS.length).toBeGreaterThanOrEqual(7);
  });

  it("모든 칩 label/raw 비어있지 않음", () => {
    for (const chip of ALLERGEN_CHIPS) {
      expect(chip.label).toBeTruthy();
      expect(chip.raw).toBeTruthy();
    }
  });
});

/* ────────── mode-transition ────────── */

describe("mode-transition — calculateDDay", () => {
  it("출발 전 양수", () => {
    const future = new Date(Date.UTC(2026, 4, 10));
    expect(calculateDDay("2026-05-15", future)).toBe(5);
  });

  it("출발 당일 0", () => {
    const today = new Date(Date.UTC(2026, 4, 15));
    expect(calculateDDay("2026-05-15", today)).toBe(0);
  });

  it("출발 후 음수", () => {
    const after = new Date(Date.UTC(2026, 4, 17));
    expect(calculateDDay("2026-05-15", after)).toBe(-2);
  });

  it("잘못된 날짜 → Infinity", () => {
    expect(calculateDDay("invalid-date")).toBe(Number.POSITIVE_INFINITY);
  });
});

describe("mode-transition — calculateTravelDay", () => {
  it("출발일 = 여행 1일차", () => {
    const today = new Date(Date.UTC(2026, 4, 15));
    expect(calculateTravelDay("2026-05-15", today)).toBe(1);
  });

  it("출발 2일 후 = 3일차", () => {
    const after = new Date(Date.UTC(2026, 4, 17));
    expect(calculateTravelDay("2026-05-15", after)).toBe(3);
  });

  it("출발 전 = 1 (최소값)", () => {
    const before = new Date(Date.UTC(2026, 4, 10));
    expect(calculateTravelDay("2026-05-15", before)).toBe(1);
  });
});

describe("mode-transition — distanceKm + isWithinBoundary", () => {
  it("같은 좌표 거리 = 0", () => {
    expect(distanceKm({ lat: 10, lng: 103 }, { lat: 10, lng: 103 })).toBeCloseTo(0, 1);
  });

  it("서울-부산 ~325km", () => {
    const d = distanceKm({ lat: 37.5665, lng: 126.978 }, { lat: 35.1796, lng: 129.0756 });
    expect(d).toBeGreaterThan(300);
    expect(d).toBeLessThan(350);
  });

  it("푸꾸옥 중심 → boundary 내", () => {
    expect(isWithinBoundary({ lat: 10.225, lng: 103.96 }, "PQC")).toBe(true);
  });

  it("서울 → 푸꾸옥 boundary 밖", () => {
    expect(isWithinBoundary({ lat: 37.5665, lng: 126.978 }, "PQC")).toBe(false);
  });

  it("미지 코드 → false", () => {
    expect(isWithinBoundary({ lat: 10.225, lng: 103.96 }, "XYZ")).toBe(false);
  });
});

describe("mode-transition — detectMode", () => {
  const makeTrip = (startDate: string, nights: number, code: string): Trip =>
    ({
      id: "test-trip",
      destination: "테스트",
      destinationCode: code,
      startDate,
      nights,
      status: "confirmed",
      currentMode: "pre-travel",
      companion: "solo",
      preferences: { vibes: [], pace: "balanced", excludes: [] },
    }) as Trip;

  it("출발 전 위치 없음 → pre-travel", () => {
    const trip = makeTrip("2026-06-01", 3, "PQC");
    const now = new Date(Date.UTC(2026, 4, 15));
    expect(detectMode(trip, now)).toBe("pre-travel");
  });

  it("출발일 + 목적지 내 → in-travel", () => {
    const trip = makeTrip("2026-05-15", 3, "PQC");
    const now = new Date(Date.UTC(2026, 4, 15));
    expect(detectMode(trip, now, { lat: 10.225, lng: 103.96 })).toBe("in-travel");
  });

  it("출발 후 + 목적지 내 + 여행 기간 경과 → post-travel", () => {
    const trip = makeTrip("2026-05-10", 3, "PQC");
    const now = new Date(Date.UTC(2026, 4, 20)); // D-10 (여행 3일 넘게 지남)
    expect(detectMode(trip, now, { lat: 10.225, lng: 103.96 })).toBe("post-travel");
  });

  it("위치 없이 여행 종료 + 24h 경과 → post-travel", () => {
    const trip = makeTrip("2026-05-10", 3, "PQC");
    const now = new Date(Date.UTC(2026, 4, 15)); // D-5, 3+1+1일 경과
    expect(detectMode(trip, now)).toBe("post-travel");
  });
});

describe("mode-transition — buildModeTransitionMetadata", () => {
  it("기본 필드 3개 (trigger, source, previousMode)", () => {
    const meta = buildModeTransitionMetadata({
      trigger: "manual",
      previousMode: "pre-travel",
    });
    expect(meta.trigger).toBe("manual");
    expect(meta.source).toBe("web");
    expect(meta.previousMode).toBe("pre-travel");
  });

  it("context 포함 시 화이트리스트 필드만 통과", () => {
    const meta = buildModeTransitionMetadata({
      trigger: "geolocation",
      previousMode: "pre-travel",
      context: {
        dDay: -1,
        boundaryHit: true,
        destinationCode: "PQC",
        outcome: "applied",
      },
    });
    expect(meta.dDay).toBe(-1);
    expect(meta.boundaryHit).toBe(true);
    expect(meta.destinationCode).toBe("PQC");
    expect(meta.outcome).toBe("applied");
    // 금지 필드는 포함 안 됨
    expect(meta).not.toHaveProperty("lat");
    expect(meta).not.toHaveProperty("lng");
  });

  it("skipped outcome + skipReason", () => {
    const meta = buildModeTransitionMetadata({
      trigger: "geolocation",
      previousMode: "pre-travel",
      context: {
        outcome: "skipped",
        skipReason: "not_in_destination",
      },
    });
    expect(meta.outcome).toBe("skipped");
    expect(meta.skipReason).toBe("not_in_destination");
  });
});

/* ────────── replan ────────── */

const makeItem = (
  id: string,
  dayIndex: number,
  scheduledAt: string,
  flexibility: "fixed" | "flexible" | "booked" = "flexible",
  deps: string[] = [],
): ItineraryItem =>
  ({
    id,
    tripId: "trip-1",
    dayIndex,
    scheduledAt,
    durationMinutes: 60,
    flexibility,
    priority: 3,
    flexMinutes: 30,
    name: id,
    category: "spot",
    location: { lat: 10, lng: 103, address: "test" },
    evidence: { reasons: ["test"], sources: [], verifiedAt: "2026-01-01" },
    dependencies: deps,
  }) as ItineraryItem;

describe("replan — calculateAffectedRange", () => {
  const items = [
    makeItem("a", 0, "2026-05-15T09:00:00Z"),
    makeItem("b", 0, "2026-05-15T11:00:00Z"),
    makeItem("c", 0, "2026-05-15T14:00:00Z"),
    makeItem("d", 1, "2026-05-16T10:00:00Z"), // 다른 day
  ];

  it("첫 항목 → 같은 day 후속 2개", () => {
    expect(calculateAffectedRange(items, "a")).toEqual(["b", "c"]);
  });

  it("마지막 항목 → 빈 배열", () => {
    expect(calculateAffectedRange(items, "c")).toEqual([]);
  });

  it("다른 day 항목은 영향 없음", () => {
    expect(calculateAffectedRange(items, "d")).toEqual([]);
  });

  it("미존재 ID → 빈 배열", () => {
    expect(calculateAffectedRange(items, "nonexistent")).toEqual([]);
  });
});

describe("replan — generateReplanOptions", () => {
  const items = [
    makeItem("a", 0, "2026-05-15T09:00:00Z", "flexible"),
    makeItem("b", 0, "2026-05-15T11:00:00Z", "booked"),
    makeItem("c", 0, "2026-05-15T14:00:00Z", "flexible"),
  ];

  it("항상 3옵션 반환 (추천/안전/강행)", () => {
    const results = generateReplanOptions(items, {
      type: "delay",
      itemId: "a",
      minutes: 30,
    });
    expect(results.length).toBe(3);
    expect(results[0].option.id).toBe("option-recommend");
    expect(results[1].option.id).toBe("option-safe");
    expect(results[2].option.id).toBe("option-force");
  });

  it("추천 옵션 — booked는 시간 유지, flexible만 시프트", () => {
    const results = generateReplanOptions(items, {
      type: "delay",
      itemId: "a",
      minutes: 30,
    });
    const recommend = results[0];
    const bookedItem = recommend.itemsAfter.find((it) => it.id === "b")!;
    const flexItem = recommend.itemsAfter.find((it) => it.id === "c")!;
    // booked는 원본 그대로
    expect(bookedItem.scheduledAt).toBe("2026-05-15T11:00:00Z");
    // flexible은 시프트됨
    expect(flexItem.scheduledAt).not.toBe("2026-05-15T14:00:00Z");
  });

  it("강행 옵션 — 모든 후속 동일 시프트", () => {
    const results = generateReplanOptions(items, {
      type: "delay",
      itemId: "a",
      minutes: 30,
    });
    const force = results[2];
    const b = force.itemsAfter.find((it) => it.id === "b")!;
    const c = force.itemsAfter.find((it) => it.id === "c")!;
    expect(b.scheduledAt).toBe("2026-05-15T11:30:00.000Z");
    expect(c.scheduledAt).toBe("2026-05-15T14:30:00.000Z");
  });

  it("미존재 항목 → throw", () => {
    expect(() =>
      generateReplanOptions(items, { type: "delay", itemId: "xyz", minutes: 30 }),
    ).toThrow();
  });
});

describe("replan — validateDag", () => {
  it("정상 DAG → ok: true", () => {
    const items = [
      makeItem("a", 0, "2026-05-15T09:00:00Z", "flexible", []),
      makeItem("b", 0, "2026-05-15T11:00:00Z", "flexible", ["a"]),
      makeItem("c", 0, "2026-05-15T14:00:00Z", "flexible", ["b"]),
    ];
    expect(validateDag(items)).toEqual({ ok: true, errors: [] });
  });

  it("미존재 dependency → error", () => {
    const items = [
      makeItem("a", 0, "2026-05-15T09:00:00Z", "flexible", ["nonexistent"]),
    ];
    const result = validateDag(items);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("unknown"))).toBe(true);
  });

  it("순환 dependency → error", () => {
    const items = [
      makeItem("a", 0, "2026-05-15T09:00:00Z", "flexible", ["b"]),
      makeItem("b", 0, "2026-05-15T11:00:00Z", "flexible", ["a"]),
    ];
    const result = validateDag(items);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("cycle"))).toBe(true);
  });
});

/* ────────── dayProgress ────────── */

describe("mode-transition — dayProgress", () => {
  const items = [
    makeItem("m1", 0, "2026-05-15T09:00:00Z"),
    makeItem("m2", 0, "2026-05-15T11:00:00Z"),
    makeItem("m3", 0, "2026-05-15T14:00:00Z"),
  ];

  it("모든 일정 전 → done=0, current=null", () => {
    const now = new Date("2026-05-15T08:00:00Z");
    const result = dayProgress(items, 0, now);
    expect(result.done).toBe(0);
    expect(result.current).toBeNull();
    expect(result.next?.id).toBe("m1");
  });

  it("첫 일정 진행 중 → done=0, current=m1", () => {
    const now = new Date("2026-05-15T09:30:00Z");
    const result = dayProgress(items, 0, now);
    expect(result.done).toBe(0);
    expect(result.current?.id).toBe("m1");
    expect(result.next?.id).toBe("m2");
  });

  it("모든 일정 종료 → done=3", () => {
    const now = new Date("2026-05-15T16:00:00Z");
    const result = dayProgress(items, 0, now);
    expect(result.done).toBe(3);
    expect(result.total).toBe(3);
  });
});
