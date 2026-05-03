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
