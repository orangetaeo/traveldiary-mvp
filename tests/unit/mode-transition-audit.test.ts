/**
 * 사이클 AAA — buildModeTransitionMetadata 회귀.
 *
 * 검증:
 *  1. manual trigger — context 없을 때 trigger/source/previousMode 3 필드만
 *  2. geolocation trigger — 4 필드(dDay/boundaryHit/destinationCode + previousMode) 모두
 *  3. 좌표 leak 방어 — context에 lat/lng 들어와도 metadata 미포함 (ADR-017 §C)
 *  4. metadata 키 화이트리스트 — location/coordinates/lat/lng 부재
 *  5. 부분 채움 — destinationCode만 통과, 나머지 undefined
 *  6. previousMode in-travel → post-travel 케이스
 *  7. dDay 음수(출발 후) 정확 통과
 *  8. dDay = 0 (Falsy) 정확 통과 — Number.isFinite 검증
 *  9. boundaryHit=false 정확 통과 — Boolean 타입 검증
 */

import { describe, it, expect } from "vitest";
import { buildModeTransitionMetadata } from "@/lib/mode-transition";

describe("사이클 AAA — buildModeTransitionMetadata", () => {
  it("manual trigger + context 없음 — 3 필드만", () => {
    const meta = buildModeTransitionMetadata({
      trigger: "manual",
      previousMode: "pre-travel",
    });
    expect(meta).toEqual({
      trigger: "manual",
      source: "web",
      previousMode: "pre-travel",
    });
  });

  it("geolocation trigger + 풀 context — 6 필드 모두", () => {
    const meta = buildModeTransitionMetadata({
      trigger: "geolocation",
      previousMode: "pre-travel",
      context: { dDay: 0, boundaryHit: true, destinationCode: "DAD" },
    });
    expect(meta).toEqual({
      trigger: "geolocation",
      source: "web",
      previousMode: "pre-travel",
      dDay: 0,
      boundaryHit: true,
      destinationCode: "DAD",
    });
  });

  it("좌표 leak 방어 — context에 lat/lng 들어와도 metadata에 미포함", () => {
    const meta = buildModeTransitionMetadata({
      trigger: "geolocation",
      previousMode: "pre-travel",
      // 의도적으로 위험 키 주입 (런타임)
      context: {
        dDay: 0,
        boundaryHit: true,
        destinationCode: "DAD",
        lat: 16.0544,
        lng: 108.2022,
      } as never,
    });
    const json = JSON.stringify(meta);
    expect(json).not.toContain("lat");
    expect(json).not.toContain("lng");
    expect(json).not.toContain("16.05");
    expect(json).not.toContain("108.20");
  });

  it("ADR-017 §C 회귀 — 위험 키 화이트리스트 검증", () => {
    const meta = buildModeTransitionMetadata({
      trigger: "geolocation",
      previousMode: "pre-travel",
      context: { dDay: 0, boundaryHit: true, destinationCode: "PQC" },
    });
    const keys = Object.keys(meta);
    expect(keys).not.toContain("lat");
    expect(keys).not.toContain("lng");
    expect(keys).not.toContain("location");
    expect(keys).not.toContain("coordinates");
  });

  it("manual trigger + 부분 context — 채워진 필드만 통과", () => {
    const meta = buildModeTransitionMetadata({
      trigger: "manual",
      previousMode: "pre-travel",
      context: { destinationCode: "PQC" },
    });
    expect(meta.destinationCode).toBe("PQC");
    expect(meta.boundaryHit).toBeUndefined();
    expect(meta.dDay).toBeUndefined();
  });

  it("post-travel 전환 — previousMode=in-travel 기록", () => {
    const meta = buildModeTransitionMetadata({
      trigger: "manual",
      previousMode: "in-travel",
    });
    expect(meta.previousMode).toBe("in-travel");
  });

  it("dDay 음수 (출발 후) 정확 통과", () => {
    const meta = buildModeTransitionMetadata({
      trigger: "geolocation",
      previousMode: "in-travel",
      context: { dDay: -2, boundaryHit: true, destinationCode: "DAD" },
    });
    expect(meta.dDay).toBe(-2);
  });

  it("dDay = 0 (falsy) 정확 통과 — Number.isFinite 보장", () => {
    const meta = buildModeTransitionMetadata({
      trigger: "geolocation",
      previousMode: "pre-travel",
      context: { dDay: 0, boundaryHit: true, destinationCode: "DAD" },
    });
    expect(meta.dDay).toBe(0);
  });

  it("boundaryHit=false 정확 통과 — Boolean 타입 검증 (도시 밖)", () => {
    const meta = buildModeTransitionMetadata({
      trigger: "geolocation",
      previousMode: "pre-travel",
      context: { dDay: 0, boundaryHit: false, destinationCode: "DAD" },
    });
    expect(meta.boundaryHit).toBe(false);
  });

  it("destinationCode 빈 문자열 — 누락 처리", () => {
    const meta = buildModeTransitionMetadata({
      trigger: "manual",
      previousMode: "pre-travel",
      context: { destinationCode: "" },
    });
    expect(meta.destinationCode).toBeUndefined();
  });

  it("dDay = NaN — Number.isFinite 차단", () => {
    const meta = buildModeTransitionMetadata({
      trigger: "geolocation",
      previousMode: "pre-travel",
      context: { dDay: Number.NaN, boundaryHit: true, destinationCode: "DAD" },
    });
    expect(meta.dDay).toBeUndefined();
  });

  it("dDay = Infinity — Number.isFinite 차단", () => {
    const meta = buildModeTransitionMetadata({
      trigger: "manual",
      previousMode: "pre-travel",
      context: { dDay: Number.POSITIVE_INFINITY },
    });
    expect(meta.dDay).toBeUndefined();
  });
});

describe("사이클 KK — outcome / skipReason (M2 negative path)", () => {
  it("outcome=applied — metadata에 outcome 포함", () => {
    const meta = buildModeTransitionMetadata({
      trigger: "geolocation",
      previousMode: "pre-travel",
      context: { dDay: 0, boundaryHit: true, destinationCode: "DAD", outcome: "applied" },
    });
    expect(meta.outcome).toBe("applied");
    expect(meta.skipReason).toBeUndefined();
  });

  it("outcome=skipped + skipReason=not_in_destination", () => {
    const meta = buildModeTransitionMetadata({
      trigger: "geolocation",
      previousMode: "pre-travel",
      context: {
        dDay: 0,
        boundaryHit: false,
        destinationCode: "DAD",
        outcome: "skipped",
        skipReason: "not_in_destination",
      },
    });
    expect(meta.outcome).toBe("skipped");
    expect(meta.skipReason).toBe("not_in_destination");
    expect(meta.boundaryHit).toBe(false);
  });

  it("6 skipReason 카테고리 모두 화이트리스트 통과", () => {
    const reasons = [
      "not_in_destination",
      "not_yet_started",
      "already_in_mode",
      "geolocation_unsupported",
      "geolocation_denied",
      "geolocation_unavailable",
    ] as const;

    for (const reason of reasons) {
      const meta = buildModeTransitionMetadata({
        trigger: "geolocation",
        previousMode: "pre-travel",
        context: { outcome: "skipped", skipReason: reason },
      });
      expect(meta.outcome).toBe("skipped");
      expect(meta.skipReason).toBe(reason);
    }
  });

  it("invalid skipReason 값 — 화이트리스트 차단", () => {
    const meta = buildModeTransitionMetadata({
      trigger: "geolocation",
      previousMode: "pre-travel",
      context: {
        outcome: "skipped",
        // 의도적으로 enum 외 문자열 주입 (런타임 위험)
        skipReason: "5km_distance_leaked" as never,
      },
    });
    expect(meta.skipReason).toBeUndefined();
  });

  it("invalid outcome 값 — 화이트리스트 차단", () => {
    const meta = buildModeTransitionMetadata({
      trigger: "geolocation",
      previousMode: "pre-travel",
      // 의도적으로 enum 외 값 주입
      context: { outcome: "partial" as never },
    });
    expect(meta.outcome).toBeUndefined();
  });

  it("좌표 leak 방어 (KK 확장) — outcome/skipReason 추가 후에도 lat/lng 미포함", () => {
    const meta = buildModeTransitionMetadata({
      trigger: "geolocation",
      previousMode: "pre-travel",
      context: {
        dDay: 0,
        boundaryHit: false,
        destinationCode: "DAD",
        outcome: "skipped",
        skipReason: "not_in_destination",
        lat: 37.5,
        lng: 127.0,
        distanceKm: 5.2,
        accuracy: 10,
      } as never,
    });
    const keys = Object.keys(meta);
    expect(keys).not.toContain("lat");
    expect(keys).not.toContain("lng");
    expect(keys).not.toContain("distanceKm");
    expect(keys).not.toContain("accuracy");
    // 정상 필드는 모두 통과
    expect(meta.outcome).toBe("skipped");
    expect(meta.skipReason).toBe("not_in_destination");
    expect(meta.boundaryHit).toBe(false);
  });

  it("outcome=skipped이지만 skipReason 미설정 — outcome만 통과", () => {
    const meta = buildModeTransitionMetadata({
      trigger: "manual",
      previousMode: "pre-travel",
      context: { outcome: "skipped" },
    });
    expect(meta.outcome).toBe("skipped");
    expect(meta.skipReason).toBeUndefined();
  });

  it("AAA 답습 — outcome 미지정 시 metadata에 outcome 키 부재 (호환성)", () => {
    const meta = buildModeTransitionMetadata({
      trigger: "manual",
      previousMode: "pre-travel",
      context: { dDay: 5, destinationCode: "DAD" },
    });
    expect(meta.outcome).toBeUndefined();
    // AAA 시점 호출은 outcome 없이도 정상 동작 (옵셔널)
    expect(meta.dDay).toBe(5);
  });
});

describe("사이클 1 (G6) — 사용자 명시 거부 + userNote (2026-05-06)", () => {
  it("3 user_* enum 화이트리스트 통과", () => {
    const reasons = [
      "user_postponed_for_now",
      "user_confused_ui",
      "user_other",
    ] as const;
    for (const reason of reasons) {
      const meta = buildModeTransitionMetadata({
        trigger: "manual",
        previousMode: "in-travel",
        context: { outcome: "skipped", skipReason: reason },
      });
      expect(meta.outcome).toBe("skipped");
      expect(meta.skipReason).toBe(reason);
    }
  });

  it("userNote 200자 슬라이스 (UI 한도와 일치)", () => {
    const longNote = "ㄱ".repeat(250);
    const meta = buildModeTransitionMetadata({
      trigger: "manual",
      previousMode: "in-travel",
      context: {
        outcome: "skipped",
        skipReason: "user_other",
        destinationCode: "DAD",
        userNote: longNote,
      },
    });
    expect(typeof meta.userNote).toBe("string");
    expect((meta.userNote as string).length).toBe(200);
  });

  it("userNote 빈 문자열은 metadata 미포함", () => {
    const meta = buildModeTransitionMetadata({
      trigger: "manual",
      previousMode: "in-travel",
      context: {
        outcome: "skipped",
        skipReason: "user_other",
        userNote: "",
      },
    });
    expect(meta).not.toHaveProperty("userNote");
  });

  it("userNote 정상 통과 + 좌표 leak 방어 동시 (ADR-017 §C 답습)", () => {
    const meta = buildModeTransitionMetadata({
      trigger: "manual",
      previousMode: "in-travel",
      context: {
        outcome: "skipped",
        skipReason: "user_other",
        destinationCode: "PQC",
        userNote: "다른 번역 앱 쓸게요",
        lat: 10.225,
        lng: 103.96,
      } as never,
    });
    expect(meta.userNote).toBe("다른 번역 앱 쓸게요");
    const keys = Object.keys(meta);
    expect(keys).not.toContain("lat");
    expect(keys).not.toContain("lng");
  });

  it("user_other 외 enum + userNote 동시 — metadata 함수는 enum-note 정합 게이트 X (UI 책임)", () => {
    // buildModeTransitionMetadata는 화이트리스트만; user_other ↔ userNote 정합은
    // ModeTransitionSkipSheet가 'user_other 선택 시에만' textarea 노출로 보장.
    const meta = buildModeTransitionMetadata({
      trigger: "manual",
      previousMode: "in-travel",
      context: {
        outcome: "skipped",
        skipReason: "user_confused_ui",
        userNote: "임의 메모",
      },
    });
    expect(meta.skipReason).toBe("user_confused_ui");
    expect(meta.userNote).toBe("임의 메모");
  });
});
