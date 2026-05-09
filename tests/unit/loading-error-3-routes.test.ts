/**
 * loading.tsx + error.tsx 3 라우트 회귀 가드 (2026-05-08).
 *
 * 갭: /morning, /itinerary/[id]/discover, /booking 3 라우트가 loading/error 부재.
 * Prisma + AI/OTA 처리 시 빈 화면 flicker + 500 에러 노출.
 *
 * PR #369 (loading.tsx 3건 — itinerary item / wrap-up / trips dashboard) 답습.
 */

import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROUTES = [
  "morning/[tripId]",
  "itinerary/[id]/discover",
  "booking/[bookingId]",
];

describe("loading.tsx — 3 라우트 스켈레톤", () => {
  it.each(ROUTES)("%s — loading.tsx 존재", (route) => {
    expect(existsSync(resolve(`app/${route}/loading.tsx`))).toBe(true);
  });

  it.each(ROUTES)("%s — animate-pulse 스켈레톤 패턴", (route) => {
    const src = readFileSync(resolve(`app/${route}/loading.tsx`), "utf-8");
    expect(src).toContain("animate-pulse");
    expect(src).toContain("min-h-screen");
    expect(src).toMatch(/export\s+default\s+function/);
  });
});

describe("error.tsx — 3 라우트 에러 바운더리", () => {
  it.each(ROUTES)("%s — error.tsx 존재", (route) => {
    expect(existsSync(resolve(`app/${route}/error.tsx`))).toBe(true);
  });

  it.each(ROUTES)("%s — \"use client\" + reset 함수 + ErrorPageProps 타입", (route) => {
    const src = readFileSync(resolve(`app/${route}/error.tsx`), "utf-8");
    expect(src).toMatch(/^["']use client["']/);
    expect(src).toContain("ErrorPageProps");
    expect(src).toMatch(/error:\s*Error/);
    expect(src).toMatch(/reset:\s*\(\)\s*=>\s*void/);
    expect(src).toContain("onClick={reset}");
  });

  it.each(ROUTES)("%s — \"다시 시도\" 버튼 + 홈/여행 fallback 링크", (route) => {
    const src = readFileSync(resolve(`app/${route}/error.tsx`), "utf-8");
    expect(src).toContain("다시 시도");
    // 홈으로 돌아가기 (booking은 /trips로) — 둘 중 하나
    expect(src).toMatch(/홈으로 돌아가기|여행 목록으로/);
  });
});
