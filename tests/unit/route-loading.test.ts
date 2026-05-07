/**
 * 라우트별 loading.tsx 존재 + 스켈레톤 구조 검증.
 */

import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

const routes: { name: string; file: string }[] = [
  { name: "전역", file: "app/loading.tsx" },
  { name: "일정", file: "app/itinerary/[id]/loading.tsx" },
  { name: "도시", file: "app/city/[slug]/loading.tsx" },
  { name: "체크리스트", file: "app/checklist/[tripId]/loading.tsx" },
  { name: "비용", file: "app/cost/[tripId]/loading.tsx" },
  { name: "관리자", file: "app/admin/loading.tsx" },
  { name: "가이드", file: "app/guide/loading.tsx" },
  { name: "초대", file: "app/invite/[code]/loading.tsx" },
  { name: "일정 생성", file: "app/itinerary/creating/loading.tsx" },
  { name: "온보딩", file: "app/onboarding/loading.tsx" },
  { name: "프로필", file: "app/profile/loading.tsx" },
  { name: "공유 일정", file: "app/share/[key]/loading.tsx" },
  { name: "받은 일정", file: "app/shared/loading.tsx" },
  { name: "번역", file: "app/translate/loading.tsx" },
  { name: "여행 상세", file: "app/travel/[id]/loading.tsx" },
  { name: "여행 목록", file: "app/trips/loading.tsx" },
  { name: "투표", file: "app/vote/[tripId]/loading.tsx" },
];

describe("라우트별 loading.tsx 스켈레톤", () => {
  routes.forEach(({ name, file }) => {
    describe(name, () => {
      const src = fs.readFileSync(path.resolve(file), "utf-8");

      it("파일 존재", () => {
        expect(src.length).toBeGreaterThan(0);
      });

      it("animate-pulse 스켈레톤 포함", () => {
        expect(src).toContain("animate-pulse");
      });
    });
  });

  it("일정 — BottomNav active='itinerary'", () => {
    const src = fs.readFileSync(path.resolve("app/itinerary/[id]/loading.tsx"), "utf-8");
    expect(src).toContain('active="itinerary"');
  });

  it("도시 — BottomNav active='trips'", () => {
    const src = fs.readFileSync(path.resolve("app/city/[slug]/loading.tsx"), "utf-8");
    expect(src).toContain('active="trips"');
  });

  it("체크리스트 — BottomNav active='itinerary'", () => {
    const src = fs.readFileSync(path.resolve("app/checklist/[tripId]/loading.tsx"), "utf-8");
    expect(src).toContain('active="itinerary"');
  });

  it("비용 — BottomNav active='itinerary'", () => {
    const src = fs.readFileSync(path.resolve("app/cost/[tripId]/loading.tsx"), "utf-8");
    expect(src).toContain('active="itinerary"');
  });

  it("프로필 — BottomNav active='profile'", () => {
    const src = fs.readFileSync(path.resolve("app/profile/loading.tsx"), "utf-8");
    expect(src).toContain('active="profile"');
  });

  it("여행 목록 — BottomNav active='trips'", () => {
    const src = fs.readFileSync(path.resolve("app/trips/loading.tsx"), "utf-8");
    expect(src).toContain('active="trips"');
  });

  it("여행 상세 — BottomNav active='trips'", () => {
    const src = fs.readFileSync(path.resolve("app/travel/[id]/loading.tsx"), "utf-8");
    expect(src).toContain('active="trips"');
  });

  it("가이드 — BottomNav active='trips'", () => {
    const src = fs.readFileSync(path.resolve("app/guide/loading.tsx"), "utf-8");
    expect(src).toContain('active="trips"');
  });

  it("받은 일정 — BottomNav active='trips'", () => {
    const src = fs.readFileSync(path.resolve("app/shared/loading.tsx"), "utf-8");
    expect(src).toContain('active="trips"');
  });

  it("번역 — BottomNav active='itinerary'", () => {
    const src = fs.readFileSync(path.resolve("app/translate/loading.tsx"), "utf-8");
    expect(src).toContain('active="itinerary"');
  });
});

describe("page ↔ loading.tsx BottomNav active 일치 (UX 깜빡임 회귀 방지)", () => {
  const pairs: { name: string; page: string; loading: string; active: string }[] = [
    {
      name: "번역",
      page: "app/translate/page.tsx",
      loading: "app/translate/loading.tsx",
      active: "itinerary",
    },
    {
      name: "가이드",
      page: "app/guide/page.tsx",
      loading: "app/guide/loading.tsx",
      active: "trips",
    },
    {
      name: "받은 일정",
      page: "app/shared/page.tsx",
      loading: "app/shared/loading.tsx",
      active: "trips",
    },
  ];

  pairs.forEach(({ name, page, loading, active }) => {
    it(`${name} — page.tsx + loading.tsx 모두 active='${active}'`, () => {
      const pageSrc = fs.readFileSync(path.resolve(page), "utf-8");
      const loadingSrc = fs.readFileSync(path.resolve(loading), "utf-8");
      expect(pageSrc).toContain(`active="${active}"`);
      expect(loadingSrc).toContain(`active="${active}"`);
    });
  });
});
