/**
 * /settings 데드 링크 최종 청소 회귀 — 옵션 X (2026-05-08).
 *
 * settings-deadlinks-cleanup.test.ts (사이클 U) 답습. 본 사이클 활성:
 *  - 카카오 연결 관리 (계정 섹션 별도 JSX, SETTING_SECTIONS 외부) → /settings/account-link
 *  - 버전 (앱 정보 섹션) → info: true 분기 (href 부재, 비-Link)
 *
 * 이로써 settings/page.tsx 내 `href="#"` 데드 링크 0건 도달.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const SETTINGS_PAGE = resolve(__dirname, "../../app/settings/page.tsx");

describe("/settings 데드 링크 최종 청소 — 옵션 X", () => {
  it("계정 연결 관리 → /settings/account-link 활성 (이전 href=\"#\" + aria-disabled)", () => {
    const source = readFileSync(SETTINGS_PAGE, "utf-8");
    expect(source).toContain('href="/settings/account-link"');
    expect(source).toContain("계정 연결 관리");
  });

  it("버전 row → info: true 분기 (href 부재, 비-Link 정보 표시)", () => {
    const source = readFileSync(SETTINGS_PAGE, "utf-8");
    expect(source).toMatch(/label:\s*"버전",\s*info:\s*true/);
  });

  it("회귀 — settings/page.tsx 내 실코드 href=\"#\" 데드 링크 0건 (댓글 제외)", () => {
    const source = readFileSync(SETTINGS_PAGE, "utf-8");
    // 객체 리터럴 데드 링크 (`href: "#"`)
    expect(source).not.toMatch(/href:\s*"#"/);
    // JSX Link 데드 링크 (`<Link href="#"`)
    expect(source).not.toMatch(/<Link\s+href="#"/);
  });

  it("회귀 — 카카오 연결 관리 라벨이 \"계정 연결 관리\"로 갱신 (4-OAuth 표현 일관)", () => {
    const source = readFileSync(SETTINGS_PAGE, "utf-8");
    expect(source).not.toContain("카카오 연결 관리");
  });

  it("회귀 — info 분기 핸들러: href 보유 시 Link, 부재 시 div 정보 row", () => {
    const source = readFileSync(SETTINGS_PAGE, "utf-8");
    expect(source).toMatch(/if\s*\(\s*"href"\s+in\s+item\s*\)/);
  });
});
