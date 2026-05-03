/**
 * 사이클 PP — aggregateModeTransitionStats 단위 테스트.
 *
 * 검증:
 *  - applied/skipped 카운트 + successRate 계산
 *  - byReason 합계 == skipped
 *  - byTrigger 합계 == applied + skipped + unknown
 *  - 미상 outcome은 totalAttempts에서 제외 (legacy 행)
 *  - skipReason이 enum 외 값이면 undefined 정규화
 *  - 좌표 leak 키(lat/lng/accuracy)는 raw row에서 무시 (안전장치)
 *  - recentLimit 적용
 */

import { describe, it, expect } from "vitest";
import { aggregateModeTransitionStats } from "@/lib/repositories/mode-transition-stats.repository";

interface RawRow {
  id: string;
  createdAt: Date;
  metadata: unknown;
}

function row(
  id: string,
  metadata: Record<string, unknown>,
  createdAt = new Date("2026-05-03T10:00:00Z"),
): RawRow {
  return { id, createdAt, metadata };
}

describe("사이클 PP — aggregateModeTransitionStats", () => {
  it("빈 입력 → 0 스택 + successRate=0", () => {
    const stats = aggregateModeTransitionStats([]);
    expect(stats.totalAttempts).toBe(0);
    expect(stats.applied).toBe(0);
    expect(stats.skipped).toBe(0);
    expect(stats.successRate).toBe(0);
    expect(stats.byReason).toEqual([]);
    expect(stats.byTrigger).toEqual([]);
    expect(stats.recent).toEqual([]);
  });

  it("applied 3건 + skipped 2건 → successRate=60%", () => {
    const stats = aggregateModeTransitionStats([
      row("a", { trigger: "geolocation", outcome: "applied" }),
      row("b", { trigger: "manual", outcome: "applied" }),
      row("c", { trigger: "geolocation", outcome: "applied" }),
      row("d", {
        trigger: "geolocation",
        outcome: "skipped",
        skipReason: "not_in_destination",
      }),
      row("e", {
        trigger: "geolocation",
        outcome: "skipped",
        skipReason: "geolocation_denied",
      }),
    ]);
    expect(stats.totalAttempts).toBe(5);
    expect(stats.applied).toBe(3);
    expect(stats.skipped).toBe(2);
    expect(stats.successRate).toBe(60);
  });

  it("byReason은 skipped 합계와 일치 + 내림차순", () => {
    const stats = aggregateModeTransitionStats([
      row("a", {
        outcome: "skipped",
        skipReason: "not_in_destination",
      }),
      row("b", {
        outcome: "skipped",
        skipReason: "not_in_destination",
      }),
      row("c", {
        outcome: "skipped",
        skipReason: "geolocation_denied",
      }),
    ]);
    const total = stats.byReason.reduce((s, r) => s + r.count, 0);
    expect(total).toBe(stats.skipped);
    expect(stats.byReason[0].reason).toBe("not_in_destination");
    expect(stats.byReason[0].count).toBe(2);
    expect(stats.byReason[1].reason).toBe("geolocation_denied");
  });

  it("byTrigger 합계 == 모든 행 (unknown 포함)", () => {
    const stats = aggregateModeTransitionStats([
      row("a", { trigger: "geolocation", outcome: "applied" }),
      row("b", { trigger: "manual", outcome: "applied" }),
      row("c", { /* trigger 누락 */ outcome: "applied" }),
    ]);
    const total = stats.byTrigger.reduce((s, r) => s + r.count, 0);
    expect(total).toBe(3);
    const triggerSet = new Set(stats.byTrigger.map((t) => t.trigger));
    expect(triggerSet.has("geolocation")).toBe(true);
    expect(triggerSet.has("manual")).toBe(true);
    expect(triggerSet.has("unknown")).toBe(true);
  });

  it("미상 outcome은 totalAttempts에서 제외 (legacy 행)", () => {
    const stats = aggregateModeTransitionStats([
      row("legacy", { trigger: "manual" /* outcome 누락 */ }),
      row("new", { trigger: "manual", outcome: "applied" }),
    ]);
    expect(stats.totalAttempts).toBe(1);
    expect(stats.applied).toBe(1);
    expect(stats.skipped).toBe(0);
    expect(stats.successRate).toBe(100);
    // byTrigger에는 legacy도 잡힘 (기록 이전 표시 용도)
    expect(stats.byTrigger.reduce((s, r) => s + r.count, 0)).toBe(2);
  });

  it("enum 외 skipReason은 정규화로 무시", () => {
    const stats = aggregateModeTransitionStats([
      row("a", { outcome: "skipped", skipReason: "INVALID_VALUE" }),
    ]);
    expect(stats.byReason).toEqual([]);
    expect(stats.skipped).toBe(1); // skipped 카운트는 유지
  });

  it("좌표 같은 leak 키가 raw row에 있어도 결과에 포함되지 않음", () => {
    const stats = aggregateModeTransitionStats([
      row("a", {
        outcome: "applied",
        trigger: "geolocation",
        lat: 10.123,
        lng: 103.999,
        accuracy: 30,
      }),
    ]);
    const recentJson = JSON.stringify(stats.recent[0]);
    expect(recentJson).not.toContain("lat");
    expect(recentJson).not.toContain("lng");
    expect(recentJson).not.toContain("accuracy");
  });

  it("recent는 입력 정렬 그대로 + recentLimit 적용", () => {
    const rows: RawRow[] = [];
    for (let i = 0; i < 30; i++) {
      rows.push(
        row(`r-${i}`, { outcome: "applied", trigger: "manual" }),
      );
    }
    const stats = aggregateModeTransitionStats(rows, 10);
    expect(stats.recent).toHaveLength(10);
    expect(stats.recent[0].id).toBe("r-0");
    expect(stats.totalAttempts).toBe(30);
  });

  it("dDay/boundaryHit/destinationCode 보존 + 타입 가드", () => {
    const stats = aggregateModeTransitionStats([
      row("a", {
        outcome: "applied",
        trigger: "geolocation",
        dDay: 0,
        boundaryHit: true,
        destinationCode: "PQC",
      }),
      row("b", {
        outcome: "applied",
        trigger: "geolocation",
        dDay: "not-a-number", // 잘못된 타입 → undefined
        boundaryHit: "not-a-bool", // 잘못된 타입 → undefined
      }),
    ]);
    expect(stats.recent[0].dDay).toBe(0);
    expect(stats.recent[0].boundaryHit).toBe(true);
    expect(stats.recent[0].destinationCode).toBe("PQC");
    expect(stats.recent[1].dDay).toBeUndefined();
    expect(stats.recent[1].boundaryHit).toBeUndefined();
  });

  it("trigger enum 외 값은 unknown 정규화", () => {
    const stats = aggregateModeTransitionStats([
      row("a", { outcome: "applied", trigger: "INVALID" }),
    ]);
    expect(stats.byTrigger[0].trigger).toBe("unknown");
  });
});

/**
 * 사이클 RR — byDestinationCode + windowDays 메타 + options 객체 시그니처.
 */
describe("사이클 RR — byDestinationCode + windowDays + options 객체", () => {
  it("byDestinationCode: 도시별 applied/skipped 정확 카운트 + total 내림차순", () => {
    const stats = aggregateModeTransitionStats([
      row("a", {
        outcome: "applied",
        trigger: "geolocation",
        destinationCode: "PQC",
      }),
      row("b", {
        outcome: "applied",
        trigger: "geolocation",
        destinationCode: "PQC",
      }),
      row("c", {
        outcome: "skipped",
        trigger: "geolocation",
        destinationCode: "PQC",
        skipReason: "not_in_destination",
      }),
      row("d", {
        outcome: "applied",
        trigger: "geolocation",
        destinationCode: "DAD",
      }),
    ]);
    expect(stats.byDestinationCode).toHaveLength(2);
    expect(stats.byDestinationCode[0]).toEqual({
      code: "PQC",
      total: 3,
      applied: 2,
      skipped: 1,
    });
    expect(stats.byDestinationCode[1]).toEqual({
      code: "DAD",
      total: 1,
      applied: 1,
      skipped: 0,
    });
  });

  it("destinationCode 누락 → 'unknown' 그룹", () => {
    const stats = aggregateModeTransitionStats([
      row("a", { outcome: "applied", trigger: "manual" }),
      row("b", {
        outcome: "applied",
        trigger: "manual",
        destinationCode: "HAN",
      }),
    ]);
    const unknown = stats.byDestinationCode.find((d) => d.code === "unknown");
    expect(unknown).toEqual({
      code: "unknown",
      total: 1,
      applied: 1,
      skipped: 0,
    });
  });

  it("legacy outcome (unknown) 행은 byDestinationCode에서 제외 (totalAttempts 정의와 정합)", () => {
    const stats = aggregateModeTransitionStats([
      row("legacy", {
        trigger: "manual",
        destinationCode: "PQC",
        // outcome 누락 → unknown
      }),
      row("new", {
        outcome: "applied",
        trigger: "manual",
        destinationCode: "PQC",
      }),
    ]);
    const pqc = stats.byDestinationCode.find((d) => d.code === "PQC");
    expect(pqc?.total).toBe(1);
    expect(pqc?.applied).toBe(1);
    expect(stats.totalAttempts).toBe(1);
  });

  it("byDestinationCode 합계 == totalAttempts (분포 일치)", () => {
    const stats = aggregateModeTransitionStats([
      row("a", { outcome: "applied", destinationCode: "PQC" }),
      row("b", { outcome: "skipped", destinationCode: "DAD", skipReason: "not_in_destination" }),
      row("c", { outcome: "applied", destinationCode: "HAN" }),
      row("d", { outcome: "applied", destinationCode: "PQC" }),
    ]);
    const sum = stats.byDestinationCode.reduce((s, d) => s + d.total, 0);
    expect(sum).toBe(stats.totalAttempts);
  });

  it("options.windowDays는 메타로 결과에 포함 (집계 자체는 호출자가 사전 필터)", () => {
    const stats = aggregateModeTransitionStats(
      [row("a", { outcome: "applied", trigger: "manual" })],
      { windowDays: 7 },
    );
    expect(stats.windowDays).toBe(7);
  });

  it("options.windowDays 미지정 → undefined", () => {
    const stats = aggregateModeTransitionStats([
      row("a", { outcome: "applied", trigger: "manual" }),
    ]);
    expect(stats.windowDays).toBeUndefined();
  });

  it("options.recentLimit 적용 (객체 시그니처)", () => {
    const rows: RawRow[] = [];
    for (let i = 0; i < 30; i++) {
      rows.push(row(`r-${i}`, { outcome: "applied", trigger: "manual" }));
    }
    const stats = aggregateModeTransitionStats(rows, { recentLimit: 5 });
    expect(stats.recent).toHaveLength(5);
    expect(stats.recent[0].id).toBe("r-0");
  });

  it("number 시그니처 호환 (기존 caller 미파괴)", () => {
    const rows: RawRow[] = [];
    for (let i = 0; i < 10; i++) {
      rows.push(row(`r-${i}`, { outcome: "applied", trigger: "manual" }));
    }
    const stats = aggregateModeTransitionStats(rows, 3);
    expect(stats.recent).toHaveLength(3);
    expect(stats.windowDays).toBeUndefined();
  });

  it("빈 입력에서도 byDestinationCode == [] (안전 기본값)", () => {
    const stats = aggregateModeTransitionStats([]);
    expect(stats.byDestinationCode).toEqual([]);
  });

  it("8 베트남 도시 분포: 전부 인식되고 카운트 내림차순", () => {
    const codes = ["PQC", "DAD", "HAN", "SGN", "HOI", "NHA", "DLI", "CTH"];
    const rows: RawRow[] = [];
    codes.forEach((code, i) => {
      // 인덱스+1 만큼 applied 행 생성 — PQC=1건, DAD=2건, ..., CTH=8건
      for (let j = 0; j <= i; j++) {
        rows.push(
          row(`${code}-${j}`, {
            outcome: "applied",
            trigger: "geolocation",
            destinationCode: code,
          }),
        );
      }
    });
    const stats = aggregateModeTransitionStats(rows);
    expect(stats.byDestinationCode).toHaveLength(8);
    // 첫 항목은 가장 많은 CTH (8건)
    expect(stats.byDestinationCode[0].code).toBe("CTH");
    expect(stats.byDestinationCode[0].total).toBe(8);
    // 마지막 항목은 가장 적은 PQC (1건)
    expect(stats.byDestinationCode[stats.byDestinationCode.length - 1].code).toBe(
      "PQC",
    );
  });
});
