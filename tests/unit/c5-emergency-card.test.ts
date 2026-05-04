/**
 * C5 — 응급 페이지 진입 카드 구조 검증.
 *
 * 도시 페이지 본문에 응급 카드 명시 노출.
 */

import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

describe("C5 — 도시 페이지 응급 카드 명시 노출", () => {
  const src = fs.readFileSync(
    path.resolve("app/city/[slug]/page.tsx"),
    "utf-8",
  );

  it("응급 진입 카드 존재", () => {
    expect(src).toContain("긴급 상황 시 필요한 정보");
  });

  it("emergency 링크", () => {
    expect(src).toContain("/emergency");
  });

  it("danger 스타일링", () => {
    expect(src).toContain("bg-danger-soft");
    expect(src).toContain("text-danger-deep");
  });

  it("emergency 아이콘", () => {
    expect(src).toContain("emergency");
  });

  it("분실 가이드 안내 텍스트", () => {
    expect(src).toContain("병원 · 경찰 · 대사관 · 분실 가이드");
  });
});
