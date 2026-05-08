/**
 * 갭 #3 — TravelHome travelDay = 1 하드코딩 → SSR calculateTravelDay 회귀 가드.
 *
 * 검증:
 *   1. TravelHome props에 travelDay?: number optional 추가 (BC 100%)
 *   2. props.travelDay ?? 1 폴백 (미지정 시 기존 동작 유지)
 *   3. /travel/[id] page.tsx에서 calculateTravelDay(startDate) 호출
 *   4. travelDay prop을 TravelHome에 전달
 *   5. calculateTravelDay 함수 시그니처 보존 (1-base + Math.max(1, 1-dDay))
 *
 * source-grep으로 검증.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { calculateTravelDay, calculateDDay } from "@/lib/mode-transition";

const TRAVEL_HOME_SRC = readFileSync(
  resolve(process.cwd(), "components/travel/TravelHome.tsx"),
  "utf-8",
);
const PAGE_SRC = readFileSync(
  resolve(process.cwd(), "app/travel/[id]/page.tsx"),
  "utf-8",
);

describe("갭 #3 — travelDay 하드코딩 해소", () => {
  it("TravelHome props에 travelDay?: number optional", () => {
    expect(TRAVEL_HOME_SRC).toMatch(/travelDay\?:\s*number/);
  });

  it("travelDayProp ?? 1 폴백 (BC — 미지정 시 기존 동작)", () => {
    expect(TRAVEL_HOME_SRC).toContain("travelDayProp ?? 1");
  });

  it("기존 'const travelDay = 1' 하드코딩 제거", () => {
    expect(TRAVEL_HOME_SRC).not.toMatch(/^\s*const\s+travelDay\s*=\s*1\s*;/m);
  });

  it("dayIndex = travelDay - 1 파생 보존", () => {
    expect(TRAVEL_HOME_SRC).toContain("const dayIndex = travelDay - 1");
  });

  it("page.tsx에서 calculateTravelDay import + 호출", () => {
    expect(PAGE_SRC).toContain('import { calculateTravelDay } from "@/lib/mode-transition"');
    expect(PAGE_SRC).toMatch(/calculateTravelDay\(bundle\.trip\.startDate\)/);
  });

  it("page.tsx에서 travelDay prop을 TravelHome에 전달", () => {
    expect(PAGE_SRC).toMatch(/travelDay=\{travelDay\}/);
  });
});

describe("calculateTravelDay 함수 동작 보존", () => {
  // UTC 기준 고정 날짜 사용 (서버/클라이언트 mismatch 회피)
  const FIXED_NOW = new Date("2026-05-08T00:00:00Z");

  it("출발 전 (D-3) → travelDay 1 (clamp)", () => {
    const startDate = "2026-05-11";
    expect(calculateTravelDay(startDate, FIXED_NOW)).toBe(1);
  });

  it("출발 당일 (D-0) → travelDay 1", () => {
    const startDate = "2026-05-08";
    expect(calculateTravelDay(startDate, FIXED_NOW)).toBe(1);
  });

  it("여행 2일차 (D+1) → travelDay 2", () => {
    const startDate = "2026-05-07";
    expect(calculateTravelDay(startDate, FIXED_NOW)).toBe(2);
  });

  it("여행 5일차 (D+4) → travelDay 5", () => {
    const startDate = "2026-05-04";
    expect(calculateTravelDay(startDate, FIXED_NOW)).toBe(5);
  });

  it("calculateDDay와 일관 (1-base + clamp)", () => {
    const startDate = "2026-05-04";
    const dDay = calculateDDay(startDate, FIXED_NOW);
    expect(calculateTravelDay(startDate, FIXED_NOW)).toBe(Math.max(1, 1 - dDay));
  });
});
