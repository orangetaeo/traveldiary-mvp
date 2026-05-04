/**
 * 온보딩 UX 검증 — 비기능 요소 제거 + 접근성.
 */

import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

const src = fs.readFileSync(
  path.resolve(__dirname, "../../app/onboarding/page.tsx"),
  "utf-8",
);

describe("온보딩 — UX 정리", () => {
  it("비기능 검색 input 제거 (도시 또는 국가 검색)", () => {
    expect(src).not.toContain('placeholder="도시 또는 국가 검색"');
  });

  it("베트남 인기 여행지 라벨", () => {
    expect(src).toContain("베트남 인기 여행지");
  });

  it("한국인이 자주 가는 곳 라벨 제거 (베트남 전용으로 전환)", () => {
    expect(src).not.toContain("한국인이 자주 가는 곳");
  });
});
