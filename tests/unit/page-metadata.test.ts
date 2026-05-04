/**
 * 페이지 metadata 존재 검증 — SEO/OG 카드 누락 방지.
 */

import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

const pages: { name: string; file: string; pattern: RegExp }[] = [
  { name: "checklist", file: "app/checklist/[tripId]/page.tsx", pattern: /metadata.*Metadata/ },
  { name: "cost", file: "app/cost/[tripId]/page.tsx", pattern: /metadata.*Metadata/ },
  { name: "vote", file: "app/vote/[tripId]/page.tsx", pattern: /metadata.*Metadata/ },
  { name: "onboarding (layout)", file: "app/onboarding/layout.tsx", pattern: /metadata.*Metadata/ },
  { name: "shared (layout)", file: "app/shared/layout.tsx", pattern: /metadata.*Metadata/ },
  { name: "guide", file: "app/guide/page.tsx", pattern: /metadata.*Metadata/ },
  { name: "trips", file: "app/trips/page.tsx", pattern: /metadata.*Metadata/ },
  { name: "translate", file: "app/translate/page.tsx", pattern: /metadata.*Metadata/ },
  { name: "home", file: "app/page.tsx", pattern: /metadata.*Metadata/ },
];

describe("페이지 metadata 존재 검증", () => {
  pages.forEach(({ name, file, pattern }) => {
    it(`${name} — metadata export 존재`, () => {
      const src = fs.readFileSync(path.resolve(file), "utf-8");
      expect(src).toMatch(pattern);
    });
  });

  it("checklist — 한국어 title", () => {
    const src = fs.readFileSync(path.resolve("app/checklist/[tripId]/page.tsx"), "utf-8");
    expect(src).toContain("체크리스트");
  });

  it("cost — 한국어 title", () => {
    const src = fs.readFileSync(path.resolve("app/cost/[tripId]/page.tsx"), "utf-8");
    expect(src).toContain("비용 관리");
  });

  it("vote — 한국어 title", () => {
    const src = fs.readFileSync(path.resolve("app/vote/[tripId]/page.tsx"), "utf-8");
    expect(src).toContain("일행 투표");
  });

  it("onboarding — 한국어 title", () => {
    const src = fs.readFileSync(path.resolve("app/onboarding/layout.tsx"), "utf-8");
    expect(src).toContain("새 여행 만들기");
  });
});
