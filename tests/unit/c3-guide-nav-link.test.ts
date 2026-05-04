/**
 * C3 — 홈 → /guide 내비게이션 링크 검증.
 */

import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

describe("C3 — 홈 페이지 여행 가이드 CTA", () => {
  const src = fs.readFileSync(path.resolve("app/page.tsx"), "utf-8");

  it("/guide 링크 존재", () => {
    expect(src).toContain('href="/guide"');
  });

  it("여행 가이드 텍스트", () => {
    expect(src).toContain("베트남 여행 가이드");
  });

  it("시그니처 코스 설명", () => {
    expect(src).toContain("시그니처 코스");
  });

  it("menu_book 아이콘 사용", () => {
    expect(src).toContain("menu_book");
  });
});
