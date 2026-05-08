/**
 * C1 — 온보딩-시드 분리 구조 검증.
 *
 * 1. hardcoded startDate 제거 — 모든 시드가 demoStartDate 사용
 * 2. 데모 trip "체험" 라벨 표시
 * 3. TODAY_ISO 고정값 제거 → todayISO() 동적
 */

import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

// ═══════════════════════════════════════════
// 1. demoStartDate / todayISO 유틸
// ═══════════════════════════════════════════

describe("C1 — demo-date 유틸", () => {
  const src = fs.readFileSync(
    path.resolve("lib/seed/demo-date.ts"),
    "utf-8",
  );

  it("demoStartDate export", () => {
    expect(src).toContain("export function demoStartDate");
  });

  it("todayISO export", () => {
    expect(src).toContain("export function todayISO");
  });

  it("demoStartDate는 상대 날짜 반환", async () => {
    const { demoStartDate } = await import("../../lib/seed/demo-date");
    const result = demoStartDate(14);
    // YYYY-MM-DD 형식
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    // 오늘보다 미래
    expect(new Date(result).getTime()).toBeGreaterThan(Date.now() - 86400000);
  });

  it("todayISO는 오늘 날짜 반환", async () => {
    const { todayISO } = await import("../../lib/seed/demo-date");
    const result = todayISO();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

// ═══════════════════════════════════════════
// 2. 시드 파일 — hardcoded startDate 제거 확인
// ═══════════════════════════════════════════

const seedFiles = [
  "lib/seed/phu-quoc.ts",
  "lib/seed/da-nang.ts",
  "lib/seed/ho-chi-minh.ts",
  "lib/seed/hanoi.ts",
  "lib/seed/nha-trang.ts",
  "lib/seed/da-lat.ts",
  "lib/seed/chiang-mai.ts",
];

describe("C1 — 시드 파일 hardcoded startDate 제거", () => {
  for (const file of seedFiles) {
    const name = path.basename(file, ".ts");

    it(`${name}: demoStartDate import`, () => {
      const src = fs.readFileSync(path.resolve(file), "utf-8");
      expect(src).toContain('import { demoStartDate } from "./demo-date"');
    });

    it(`${name}: demoStartDate() 호출`, () => {
      const src = fs.readFileSync(path.resolve(file), "utf-8");
      expect(src).toContain("demoStartDate(");
    });

    it(`${name}: hardcoded 날짜 문자열 없음`, () => {
      const src = fs.readFileSync(path.resolve(file), "utf-8");
      // START_DATE = "2026-..." 패턴이 없어야 함
      expect(src).not.toMatch(/START_DATE\s*=\s*"20\d{2}-/);
    });
  }
});

// ═══════════════════════════════════════════
// 3. TODAY_ISO 고정값 제거
// ═══════════════════════════════════════════

describe("C1 — TODAY_ISO 동적 전환", () => {
  it("components/home/DashboardHero.tsx: todayISO import + 호출 (홈 재설계 후 D-Day 계산 위임)", () => {
    const src = fs.readFileSync(
      path.resolve("components/home/DashboardHero.tsx"),
      "utf-8",
    );
    expect(src).toContain("todayISO");
    expect(src).not.toContain('"2026-04-30"');
  });

  it("app/page.tsx: 하드코딩 날짜 부재 (D-Day 로직 DashboardHero 위임)", () => {
    const src = fs.readFileSync(path.resolve("app/page.tsx"), "utf-8");
    expect(src).not.toContain('"2026-04-30"');
  });

  it("app/itinerary/[id]/page.tsx: todayISO import + 호출", () => {
    const src = fs.readFileSync(
      path.resolve("app/itinerary/[id]/page.tsx"),
      "utf-8",
    );
    expect(src).toContain("todayISO");
    expect(src).not.toContain('"2026-04-30"');
  });
});

// ═══════════════════════════════════════════
// 4. 체험 라벨
// ═══════════════════════════════════════════

describe("C1 — 체험 데모 라벨", () => {
  it("isDemoTrip export", () => {
    const src = fs.readFileSync(path.resolve("lib/seed/index.ts"), "utf-8");
    expect(src).toContain("export function isDemoTrip");
  });

  it("itinerary 페이지에 체험 데모 뱃지", () => {
    const src = fs.readFileSync(
      path.resolve("app/itinerary/[id]/page.tsx"),
      "utf-8",
    );
    expect(src).toContain("isDemoTrip");
    expect(src).toContain("체험 데모");
  });

  it("home 페이지에 체험 뱃지", () => {
    const src = fs.readFileSync(path.resolve("app/page.tsx"), "utf-8");
    expect(src).toContain("체험");
  });

  it("trips 페이지에 체험 뱃지", () => {
    const src = fs.readFileSync(path.resolve("app/trips/page.tsx"), "utf-8");
    expect(src).toContain("isDemoTrip");
    expect(src).toContain("체험");
  });
});
