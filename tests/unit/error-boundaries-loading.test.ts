/**
 * error.tsx + loading.tsx 커버리지 검증.
 *
 * 모든 async 서버 라우트에 error boundary + loading skeleton이 존재하는지 확인.
 */

import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

/* ═══════ error.tsx 존재 검증 ═══════ */

const ERROR_ROUTES = [
  { label: "일정 목록", path: "app/itinerary/[id]/error.tsx" },
  { label: "일정 상세", path: "app/itinerary/[id]/item/[itemId]/error.tsx" },
  { label: "추천 장소", path: "app/itinerary/[id]/discover/error.tsx" },
  { label: "지도", path: "app/itinerary/[id]/map/error.tsx" },
  { label: "여행 대시보드", path: "app/trips/[tripId]/error.tsx" },
  { label: "wrap-up", path: "app/wrap-up/[tripId]/error.tsx" },
  { label: "앨범", path: "app/wrap-up/[tripId]/album/error.tsx" },
  { label: "모닝 브리핑", path: "app/morning/[tripId]/error.tsx" },
  // 기존 error.tsx (회귀 방지)
  { label: "체크리스트", path: "app/checklist/[tripId]/error.tsx" },
  { label: "비용", path: "app/cost/[tripId]/error.tsx" },
  { label: "투표", path: "app/vote/[tripId]/error.tsx" },
  { label: "공유", path: "app/share/[key]/error.tsx" },
];

describe("error.tsx — async 라우트 에러 바운더리", () => {
  for (const route of ERROR_ROUTES) {
    it(`${route.label} — error.tsx 존재`, () => {
      expect(fs.existsSync(path.resolve(route.path))).toBe(true);
    });
  }

  it("모든 error.tsx가 'use client' 디렉티브 포함", () => {
    for (const route of ERROR_ROUTES) {
      const src = fs.readFileSync(path.resolve(route.path), "utf-8");
      expect(src).toContain('"use client"');
    }
  });

  it("모든 error.tsx가 reset 버튼 포함", () => {
    for (const route of ERROR_ROUTES) {
      const src = fs.readFileSync(path.resolve(route.path), "utf-8");
      expect(src).toContain("reset");
      expect(src).toContain("다시 시도");
    }
  });

  it("모든 error.tsx가 네비게이션 링크 포함 (/trips 또는 /)", () => {
    for (const route of ERROR_ROUTES) {
      const src = fs.readFileSync(path.resolve(route.path), "utf-8");
      expect(src.includes("/trips") || src.includes('href="/"')).toBe(true);
    }
  });
});

/* ═══════ loading.tsx 존재 검증 ═══════ */

const LOADING_ROUTES = [
  { label: "일정 상세", path: "app/itinerary/[id]/item/[itemId]/loading.tsx" },
  { label: "추천 장소", path: "app/itinerary/[id]/discover/loading.tsx" },
  { label: "지도", path: "app/itinerary/[id]/map/loading.tsx" },
  { label: "여행 대시보드", path: "app/trips/[tripId]/loading.tsx" },
  { label: "wrap-up", path: "app/wrap-up/[tripId]/loading.tsx" },
  { label: "앨범", path: "app/wrap-up/[tripId]/album/loading.tsx" },
  { label: "모닝 브리핑", path: "app/morning/[tripId]/loading.tsx" },
  // 기존 loading.tsx (회귀 방지)
  { label: "일정 목록", path: "app/itinerary/[id]/loading.tsx" },
  { label: "체크리스트", path: "app/checklist/[tripId]/loading.tsx" },
  { label: "비용", path: "app/cost/[tripId]/loading.tsx" },
];

describe("loading.tsx — async 라우트 스켈레톤", () => {
  for (const route of LOADING_ROUTES) {
    it(`${route.label} — loading.tsx 존재`, () => {
      expect(fs.existsSync(path.resolve(route.path))).toBe(true);
    });
  }

  it("모든 loading.tsx가 animate-pulse 포함", () => {
    for (const route of LOADING_ROUTES) {
      const src = fs.readFileSync(path.resolve(route.path), "utf-8");
      expect(src).toContain("animate-pulse");
    }
  });
});

/* ═══════ error.tsx 콘텐츠 품질 ═══════ */

describe("error.tsx — 콘텐츠 차별화", () => {
  const newErrorFiles = ERROR_ROUTES.slice(0, 8);
  const emojis = new Set<string>();

  it("각 error.tsx가 고유한 이모지 사용", () => {
    for (const route of newErrorFiles) {
      const src = fs.readFileSync(path.resolve(route.path), "utf-8");
      const match = src.match(/<span className="text-6xl mb-td-md">(.+?)<\/span>/);
      expect(match).not.toBeNull();
      if (match) {
        emojis.add(match[1]);
      }
    }
    // 최소 6개 고유 이모지 (일부 중복 허용)
    expect(emojis.size).toBeGreaterThanOrEqual(6);
  });

  it("각 error.tsx가 맥락에 맞는 제목 사용", () => {
    const titles = new Set<string>();
    for (const route of newErrorFiles) {
      const src = fs.readFileSync(path.resolve(route.path), "utf-8");
      const match = src.match(/<h1[^>]*>\s*(.+?)\s*<\/h1>/s);
      if (match) titles.add(match[1].trim());
    }
    // 모두 다른 제목
    expect(titles.size).toBe(newErrorFiles.length);
  });
});
