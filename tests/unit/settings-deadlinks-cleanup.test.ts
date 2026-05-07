/**
 * /settings 페이지 데드 링크 청소 회귀 — 사이클 U-deadlinks (2026-05-07).
 *
 * settings/page.tsx는 "use client" + useRouter()라 정적 렌더 비용이 큼 →
 * source grep 분리 검증 (박제 답습).
 *
 * 본 사이클 활성: 리마인더/캐시/오픈소스/버그 신고 (4건).
 * 머지 대기 PR #250 영역(내 데이터 내보내기)은 본 PR에서 건드리지 않음
 * → 충돌 회피.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const SETTINGS_PAGE = resolve(__dirname, "../../app/settings/page.tsx");

describe("/settings 데드 링크 청소 — 사이클 U-deadlinks", () => {
  it("리마인더 시간 → /settings/reminder 활성", () => {
    const source = readFileSync(SETTINGS_PAGE, "utf-8");
    expect(source).toMatch(/label:\s*"리마인더 시간",\s*href:\s*"\/settings\/reminder"/);
  });

  it("캐시 삭제 → /settings/cache 활성", () => {
    const source = readFileSync(SETTINGS_PAGE, "utf-8");
    expect(source).toMatch(/label:\s*"캐시 삭제",\s*href:\s*"\/settings\/cache"/);
  });

  it("오픈소스 라이선스 → /legal/oss 활성", () => {
    const source = readFileSync(SETTINGS_PAGE, "utf-8");
    expect(source).toMatch(/label:\s*"오픈소스 라이선스",\s*href:\s*"\/legal\/oss"/);
  });

  it("버그 신고 → mailto: 외부 링크 활성 (subject 파라미터 포함)", () => {
    const source = readFileSync(SETTINGS_PAGE, "utf-8");
    expect(source).toMatch(/label:\s*"버그 신고",\s*href:\s*"mailto:[^"]+\?subject=/);
  });

  it("회귀 — 본 사이클 4건 라벨 옆에 href: \"#\" 데드 링크 잔여 없음", () => {
    const source = readFileSync(SETTINGS_PAGE, "utf-8");
    // 라벨과 같은 줄/근처에서 href: "#"가 있으면 회귀
    expect(source).not.toMatch(/label:\s*"리마인더 시간"[^}]*href:\s*"#"/);
    expect(source).not.toMatch(/label:\s*"캐시 삭제"[^}]*href:\s*"#"/);
    expect(source).not.toMatch(/label:\s*"오픈소스 라이선스"[^}]*href:\s*"#"/);
    expect(source).not.toMatch(/label:\s*"버그 신고"[^}]*href:\s*"#"/);
  });

  it("PR #250 영역(내 데이터 내보내기) — 본 PR에서 건드리지 않음 (충돌 회피)", () => {
    const source = readFileSync(SETTINGS_PAGE, "utf-8");
    // 본 PR 시점 main 기준: "내 데이터 내보내기"는 PR #250이 활성. 본 PR은
    // 그 영역을 건드리지 않으므로 두 가지 상태 모두 허용:
    // (a) PR #250 미머지 → 여전히 href="#"
    // (b) PR #250 머지됨 → href="/settings/data-export"
    const matchA = /label:\s*"내 데이터 내보내기",\s*href:\s*"#"/.test(source);
    const matchB = /label:\s*"내 데이터 내보내기",\s*href:\s*"\/settings\/data-export"/.test(source);
    expect(matchA || matchB).toBe(true);
  });
});
