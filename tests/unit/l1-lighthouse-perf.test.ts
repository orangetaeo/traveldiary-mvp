/**
 * L1 — Lighthouse 성능·접근성 구조 검증.
 *
 * layout.tsx 뷰포트·preconnect·접근성 최적화 확인.
 */

import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

describe("L1 — Lighthouse 최적화 (layout.tsx)", () => {
  const src = fs.readFileSync(
    path.resolve("app/layout.tsx"),
    "utf-8",
  );

  it("maximumScale ≥ 2 (a11y — 줌 허용)", () => {
    const match = src.match(/maximumScale:\s*(\d+)/);
    expect(match).not.toBeNull();
    expect(Number(match![1])).toBeGreaterThanOrEqual(2);
  });

  it("userScalable: false 미사용 (a11y 페널티 방지)", () => {
    // 프로퍼티 할당만 검사 (주석 내 언급은 허용)
    expect(src).not.toMatch(/userScalable\s*:/);
  });

  it("preconnect — jsdelivr CDN", () => {
    expect(src).toContain('rel="preconnect"');
    expect(src).toContain("cdn.jsdelivr.net");
  });

  it("preconnect — Google Fonts", () => {
    expect(src).toContain("fonts.googleapis.com");
    expect(src).toContain("fonts.gstatic.com");
  });

  it("crossOrigin 속성 존재 (CORS preconnect)", () => {
    expect(src).toContain("crossOrigin");
  });

  it("themeColor 설정", () => {
    expect(src).toContain("themeColor");
  });

  it("lang 속성 존재 (SEO + a11y)", () => {
    expect(src).toContain('lang="ko"');
  });

  it("Pretendard 폰트 로드", () => {
    expect(src).toContain("pretendard");
  });

  it("Material Symbols 로드", () => {
    expect(src).toContain("Material+Symbols");
  });

  it("display=swap (FOUT 방지)", () => {
    expect(src).toContain("display=swap");
  });
});
