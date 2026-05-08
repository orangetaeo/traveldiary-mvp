/**
 * Admin 페이지 dead button 청소 회귀 — 옵션 Y (2026-05-08).
 *
 * /admin (모든 로그 보기) + /admin/funnel (CSV 내보내기) + /admin/affiliate
 * (CSV 내보내기) — 3 dead button 모두 disabled + "(준비 중)" 처리.
 *
 * 정식 활성은 R1 사인오프 + ADR-046 audit log 집계 정책 게이트 후.
 *
 * c4-admin-index.test.ts 답습 (source-grep 패턴).
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ADMIN_INDEX = resolve(__dirname, "../../app/admin/page.tsx");
const ADMIN_FUNNEL = resolve(__dirname, "../../app/admin/funnel/page.tsx");
const ADMIN_AFFILIATE = resolve(__dirname, "../../app/admin/affiliate/page.tsx");

describe("/admin 페이지 dead button 청소 — 옵션 Y", () => {
  it("/admin '모든 로그 보기' button → disabled + '(준비 중)' 라벨", () => {
    const source = readFileSync(ADMIN_INDEX, "utf-8");
    expect(source).toContain("모든 로그 보기 (준비 중)");
    expect(source).toMatch(/disabled\s*\n\s+aria-disabled/);
  });

  it("/admin '모든 로그 보기' aria-describedby — demo 배너 연결", () => {
    const source = readFileSync(ADMIN_INDEX, "utf-8");
    expect(source).toContain('aria-describedby="admin-demo-banner-heading"');
  });

  it("/admin/funnel 'CSV 내보내기' button → disabled + '(준비 중)' 라벨", () => {
    const source = readFileSync(ADMIN_FUNNEL, "utf-8");
    expect(source).toContain("CSV 내보내기 (준비 중)");
    expect(source).toMatch(/disabled\s*\n\s+aria-disabled/);
  });

  it("/admin/funnel — audit.export 기록 표현 'R1 사인오프 후' 게이트 명시", () => {
    const source = readFileSync(ADMIN_FUNNEL, "utf-8");
    expect(source).toContain("R1 사인오프 후 audit.export 기록");
    expect(source).not.toContain(">\n                audit.export 기록됨\n              <");
  });

  it("/admin/affiliate 'CSV 내보내기' button → disabled + '(준비 중)' 라벨", () => {
    const source = readFileSync(ADMIN_AFFILIATE, "utf-8");
    expect(source).toContain("CSV 내보내기 (준비 중)");
    expect(source).toMatch(/disabled\s*\n\s+aria-disabled/);
  });

  it("/admin/affiliate — audit.export 기록 표현 'R1 사인오프 후' 게이트 명시", () => {
    const source = readFileSync(ADMIN_AFFILIATE, "utf-8");
    expect(source).toContain("R1 사인오프 후 audit.export 기록");
  });

  it("회귀 — 3 button 모두 cursor-not-allowed (CSS 인터랙션 시각 가드)", () => {
    const sources = [
      readFileSync(ADMIN_INDEX, "utf-8"),
      readFileSync(ADMIN_FUNNEL, "utf-8"),
      readFileSync(ADMIN_AFFILIATE, "utf-8"),
    ];
    for (const source of sources) {
      expect(source).toContain("cursor-not-allowed");
    }
  });
});
