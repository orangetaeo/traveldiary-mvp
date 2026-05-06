/**
 * 엣지 케이스 테스트 — 기존 테스트에서 누락된 경계 조건.
 *
 * 대상:
 *  - settlement: 가중치 분할 반올림 오차
 *  - replan/validateDag: 자기 참조 사이클 + 3노드 사이클
 *  - geo: 대척점(antipodal) + 경도 ±180 랩어라운드
 *  - mode-transition/detectMode: nights=0 당일여행 + 경계 일자
 */

import { describe, it, expect } from "vitest";
import {
  computeSettlement,
  normalizeSplitWith,
} from "@/lib/services/settlement";
import type { CostEntry } from "@/lib/types";
import { validateDag } from "@/lib/replan";
import type { ItineraryItem, Trip } from "@/lib/types";
import { haversineKm } from "@/lib/utils/geo";
import { detectMode, calculateDDay } from "@/lib/mode-transition";

/* ════════════════════════════════════════════
 * Fixtures
 * ════════════════════════════════════════════ */

function makeCostEntry(
  id: string,
  amountKrw: number,
  splitWith?: CostEntry["splitWith"],
): CostEntry {
  return {
    id,
    tripId: "t1",
    date: "2026-05-10",
    label: id,
    amountKrw,
    status: "paid",
    splitWith,
    createdAt: "2026-05-10T00:00:00.000Z",
    updatedAt: "2026-05-10T00:00:00.000Z",
  };
}

function makeDagItem(
  id: string,
  deps: string[] = [],
): ItineraryItem {
  return {
    id,
    tripId: "trip-1",
    dayIndex: 0,
    scheduledAt: "2026-05-10T09:00:00Z",
    durationMinutes: 60,
    flexibility: "flexible",
    priority: 3,
    flexMinutes: 30,
    name: id,
    category: "spot",
    location: { lat: 10, lng: 103, address: "test" },
    evidence: { reasons: [], sources: [], verifiedAt: "" },
    dependencies: deps,
  } as ItineraryItem;
}

function makeTrip(
  startDate: string,
  nights: number,
  code: string,
): Trip {
  return {
    id: "test-trip",
    destination: "테스트",
    destinationCode: code,
    startDate,
    nights,
    status: "confirmed",
    currentMode: "pre-travel",
    companion: "solo",
    preferences: { vibes: [], pace: "balanced", excludes: [] },
  } as Trip;
}

/* ════════════════════════════════════════════
 * settlement — 반올림 엣지 케이스
 * ════════════════════════════════════════════ */

describe("settlement — 반올림 엣지 케이스", () => {
  it("3등분 반올림 — 10,000원 / 3명 → 각 3,333원 (합계 9,999)", () => {
    // Math.round(10000 / 3) = 3333, 합계 9999. 1원 오차.
    // 결제자 net = 10000 - 3333 = 6667, 나머지 2명 각 -3333.
    // transfers: B→A 3333, C→A 3333 → 합계 6666 (결제자 net 6667과 1원 차이)
    const result = computeSettlement([
      makeCostEntry("a", 10000, ["A", "B", "C"]),
    ]);
    expect(result.splitEntryCount).toBe(1);
    expect(result.totalSplitKrw).toBe(10000);

    // net 합계가 0이 아닐 수 있음 (반올림 특성)
    const netSum = result.netByMember.reduce((s, m) => s + m.netKrw, 0);
    // 반올림 오차 ±멤버수 이내
    expect(Math.abs(netSum)).toBeLessThanOrEqual(result.netByMember.length);

    // transfers가 정상 생성되는지 확인
    expect(result.transfers.length).toBeGreaterThanOrEqual(1);
    expect(result.transfers.every((t) => t.amountKrw > 0)).toBe(true);
  });

  it("7등분 반올림 — 100,000원 / 7명 → 각 14,286원 (합계 100,002)", () => {
    // Math.round(100000 / 7) = 14286, 합계 14286×7 = 100002. 2원 초과.
    const members = ["A", "B", "C", "D", "E", "F", "G"];
    const result = computeSettlement([
      makeCostEntry("a", 100000, members),
    ]);
    expect(result.splitEntryCount).toBe(1);

    // 반올림 오차가 있어도 transfers 생성은 정상
    expect(result.transfers.length).toBeGreaterThanOrEqual(1);
    // 모든 transfer.to는 결제자 A
    expect(result.transfers.every((t) => t.to === "A")).toBe(true);
  });

  it("가중치 반올림 — 10,000원을 1:1:1 가중치 = string[] 3등분과 동일", () => {
    const stringResult = computeSettlement([
      makeCostEntry("a", 10000, ["A", "B", "C"]),
    ]);
    const weightedResult = computeSettlement([
      makeCostEntry("b", 10000, [
        { name: "A", weight: 1 },
        { name: "B", weight: 1 },
        { name: "C", weight: 1 },
      ]),
    ]);
    // 동일한 net 분포
    for (const member of ["A", "B", "C"]) {
      const sNet = stringResult.netByMember.find((m) => m.name === member)?.netKrw ?? 0;
      const wNet = weightedResult.netByMember.find((m) => m.name === member)?.netKrw ?? 0;
      expect(sNet).toBe(wNet);
    }
  });

  it("가중치 2:1 — 30,000원 → A(결제자,w=2) 20,000 부담, B(w=1) 10,000 부담", () => {
    // A pays 30000, weights 2:1 → totalWeight=3
    // A share = round(30000×2/3) = 20000, B share = round(30000×1/3) = 10000
    // A net = 30000 - 20000 = 10000, B net = -10000
    const result = computeSettlement([
      makeCostEntry("a", 30000, [
        { name: "A", weight: 2 },
        { name: "B", weight: 1 },
      ]),
    ]);
    expect(result.transfers).toHaveLength(1);
    expect(result.transfers[0]).toEqual({ from: "B", to: "A", amountKrw: 10000 });
  });

  it("1원 결제 2명 → 각 1원 반올림 (Math.round(0.5)=1)", () => {
    // 1원을 2등분: Math.round(1/2) = Math.round(0.5) = 1
    // A net = 1 - 1 = 0, B net = -1
    // 이 경우 반올림으로 인해 B가 A에게 1원 주는 transfer 발생 가능
    const result = computeSettlement([
      makeCostEntry("a", 1, ["A", "B"]),
    ]);
    // 정상 실행만 확인 (크래시 없음)
    expect(result.splitEntryCount).toBe(1);
  });

  it("0원 결제 — 에지 케이스 (의미 없지만 크래시 안 됨)", () => {
    const result = computeSettlement([
      makeCostEntry("a", 0, ["A", "B"]),
    ]);
    expect(result.splitEntryCount).toBe(1);
    expect(result.totalSplitKrw).toBe(0);
    expect(result.transfers).toEqual([]);
  });
});

describe("settlement — normalizeSplitWith 엣지 케이스", () => {
  it("매우 큰 weight — 정상 처리", () => {
    const { members } = normalizeSplitWith([
      { name: "A", weight: 999999 },
      { name: "B", weight: 1 },
    ]);
    expect(members[0].weight).toBe(999999);
    expect(members[1].weight).toBe(1);
  });

  it("소수점 weight — 정상 처리", () => {
    const { members, isWeighted } = normalizeSplitWith([
      { name: "A", weight: 0.5 },
      { name: "B", weight: 1.5 },
    ]);
    expect(members[0].weight).toBe(0.5);
    expect(members[1].weight).toBe(1.5);
    expect(isWeighted).toBe(true);
  });

  it("Infinity weight → > 0 이므로 통과 (Math.round에서 NaN 가능성 없음)", () => {
    // Infinity는 typeof==="number" && > 0 → 코드가 그대로 수용
    const { members } = normalizeSplitWith([
      { name: "A", weight: Infinity },
    ]);
    expect(members[0].weight).toBe(Infinity);
  });
});

/* ════════════════════════════════════════════
 * replan — validateDag 엣지 케이스
 * ════════════════════════════════════════════ */

describe("replan — validateDag 엣지 케이스", () => {
  it("자기 참조 (self-reference) → cycle 감지", () => {
    const items = [makeDagItem("a", ["a"])];
    const result = validateDag(items);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("cycle"))).toBe(true);
  });

  it("3노드 사이클 (A→B→C→A) → cycle 감지", () => {
    const items = [
      makeDagItem("a", ["c"]),
      makeDagItem("b", ["a"]),
      makeDagItem("c", ["b"]),
    ];
    const result = validateDag(items);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("cycle"))).toBe(true);
  });

  it("다이아몬드 DAG (사이클 아님) → ok", () => {
    // A → B, A → C, B → D, C → D
    const items = [
      makeDagItem("a", []),
      makeDagItem("b", ["a"]),
      makeDagItem("c", ["a"]),
      makeDagItem("d", ["b", "c"]),
    ];
    const result = validateDag(items);
    expect(result.ok).toBe(true);
  });

  it("존재하지 않는 dependency + 사이클 동시 → 두 에러", () => {
    const items = [
      makeDagItem("a", ["b", "ghost"]),
      makeDagItem("b", ["a"]),
    ];
    const result = validateDag(items);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("unknown"))).toBe(true);
    expect(result.errors.some((e) => e.includes("cycle"))).toBe(true);
  });

  it("단일 노드 의존성 없음 → ok", () => {
    const items = [makeDagItem("a")];
    expect(validateDag(items).ok).toBe(true);
  });
});

/* ════════════════════════════════════════════
 * geo — haversineKm 엣지 케이스
 * ════════════════════════════════════════════ */

describe("geo — haversineKm 엣지 케이스", () => {
  it("대척점 (North Pole ↔ South Pole) ≈ 20,015km", () => {
    const northPole = { lat: 90, lng: 0 };
    const southPole = { lat: -90, lng: 0 };
    const dist = haversineKm(northPole, southPole);
    // 반지름 6371km × π ≈ 20,015km
    expect(dist).toBeGreaterThan(20000);
    expect(dist).toBeLessThan(20050);
  });

  it("적도 반 바퀴 (경도 180° 차이) ≈ 20,015km", () => {
    const a = { lat: 0, lng: 0 };
    const b = { lat: 0, lng: 180 };
    const dist = haversineKm(a, b);
    expect(dist).toBeGreaterThan(20000);
    expect(dist).toBeLessThan(20050);
  });

  it("경도 ±180 랩어라운드 — 거리 0", () => {
    // lng 180과 -180은 같은 경선
    const a = { lat: 0, lng: 180 };
    const b = { lat: 0, lng: -180 };
    const dist = haversineKm(a, b);
    expect(dist).toBeCloseTo(0, 5);
  });

  it("음수 좌표 (남반구/서반구) — 시드니 ↔ 상파울루 ≈ 13,000~14,000km", () => {
    const sydney = { lat: -33.8688, lng: 151.2093 };
    const saoPaulo = { lat: -23.5505, lng: -46.6333 };
    const dist = haversineKm(sydney, saoPaulo);
    expect(dist).toBeGreaterThan(13000);
    expect(dist).toBeLessThan(14000);
  });

  it("매우 가까운 좌표 (1m 이내) — 수치 안정성", () => {
    const a = { lat: 16.054400, lng: 108.202200 };
    const b = { lat: 16.054401, lng: 108.202201 };
    const dist = haversineKm(a, b);
    expect(dist).toBeGreaterThanOrEqual(0);
    expect(dist).toBeLessThan(0.001); // 1m 미만
  });
});

/* ════════════════════════════════════════════
 * mode-transition — detectMode 엣지 케이스
 * ════════════════════════════════════════════ */

describe("mode-transition — detectMode 엣지 케이스", () => {
  it("nights=0 (당일여행) + D-Day=0 + 목적지 내 → in-travel", () => {
    const trip = makeTrip("2026-05-15", 0, "PQC");
    const now = new Date(Date.UTC(2026, 4, 15));
    const loc = { lat: 10.225, lng: 103.96 }; // 푸꾸옥 중심
    expect(detectMode(trip, now, loc)).toBe("in-travel");
  });

  it("nights=0 + D-Day=-1 + 목적지 내 → post-travel (당일여행 종료)", () => {
    const trip = makeTrip("2026-05-15", 0, "PQC");
    const now = new Date(Date.UTC(2026, 4, 16)); // 다음 날
    const loc = { lat: 10.225, lng: 103.96 };
    // dDay=-1, dDay < -trip.nights (0) → post-travel
    expect(detectMode(trip, now, loc)).toBe("post-travel");
  });

  it("nights=0 + D-Day=-1 + 위치 없음 → pre-travel (보수적 판단)", () => {
    // 위치 없으면 dDay < -nights-1 = -1, -1 < -1 → false → pre-travel
    const trip = makeTrip("2026-05-15", 0, "PQC");
    const now = new Date(Date.UTC(2026, 4, 16));
    expect(detectMode(trip, now)).toBe("pre-travel");
  });

  it("nights=0 + D-Day=-2 + 위치 없음 → post-travel", () => {
    // dDay=-2, -2 < -0-1 = -1 → true → post-travel
    const trip = makeTrip("2026-05-15", 0, "PQC");
    const now = new Date(Date.UTC(2026, 4, 17));
    expect(detectMode(trip, now)).toBe("post-travel");
  });

  it("정확히 마지막 날 (D-Day = -nights) + 목적지 내 → in-travel", () => {
    // 3박 여행, D-Day=-3 (마지막 날)
    const trip = makeTrip("2026-05-10", 3, "PQC");
    const now = new Date(Date.UTC(2026, 4, 13)); // dDay = -3
    const loc = { lat: 10.225, lng: 103.96 };
    // dDay <= 0 + inDestination, dDay(-3) < -nights(-3) → false → in-travel
    expect(detectMode(trip, now, loc)).toBe("in-travel");
  });

  it("마지막 날 다음 날 (D-Day = -nights-1) + 목적지 내 → post-travel", () => {
    const trip = makeTrip("2026-05-10", 3, "PQC");
    const now = new Date(Date.UTC(2026, 4, 14)); // dDay = -4
    const loc = { lat: 10.225, lng: 103.96 };
    // dDay(-4) < -nights(-3) → true → post-travel
    expect(detectMode(trip, now, loc)).toBe("post-travel");
  });
});

describe("mode-transition — calculateDDay 엣지 케이스", () => {
  it("연말/연초 경계 (12월 31일 → 1월 1일)", () => {
    const now = new Date(Date.UTC(2026, 11, 31)); // 12월 31일
    expect(calculateDDay("2027-01-01", now)).toBe(1);
  });

  it("윤년 2월 29일", () => {
    const now = new Date(Date.UTC(2028, 1, 28)); // 2028-02-28 (윤년)
    expect(calculateDDay("2028-02-29", now)).toBe(1);
  });
});
