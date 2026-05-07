/**
 * 옵션 W (자율 발견 — Session AB cap 6) — app/page.tsx 헤더 메뉴 dead button 활성화 회귀.
 *
 * 검증:
 *   1. 메뉴 button → Link href="/settings" 진화
 *   2. aria-label "메뉴" 키워드 보존 + "— 설정" 명확화 추가
 *   3. material-symbols menu 아이콘 보존
 *   4. 헤더 className 변경 0 (시각 BC)
 *
 * source-grep으로 검증 (Session N 박제 답습).
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const SRC = readFileSync(
  resolve(process.cwd(), "app/page.tsx"),
  "utf-8",
);

describe("옵션 W — 홈 헤더 메뉴 Link 활성화", () => {
  it("'메뉴' button → Link href=\"/settings\" 진화", () => {
    expect(SRC).toContain('href="/settings"');
    // aria-label에 "메뉴" 키워드 보존 + 명확화
    expect(SRC).toContain('aria-label="메뉴 — 설정"');
  });

  it("button + aria-label=\"메뉴\" 패턴 부재 (dead button 제거)", () => {
    expect(SRC).not.toMatch(
      /<button[\s\S]{0,200}aria-label="메뉴"[\s\S]{0,200}<\/button>/,
    );
  });

  it("기존 menu material symbol 아이콘 보존", () => {
    expect(SRC).toMatch(
      /href="\/settings"[\s\S]{0,200}material-symbols-outlined[^>]*>menu</,
    );
  });

  it("헤더 좌측 그룹 className 변경 0 (시각 BC)", () => {
    expect(SRC).toContain("hover:bg-surface-soft transition-colors p-2 rounded-full");
  });
});
