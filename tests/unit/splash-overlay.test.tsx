/**
 * SplashOverlay 인트로 — 회귀 가드.
 *
 * 첫 진입 시 1.5초 베트남 일몰 그라디언트 인트로 노출. sessionStorage로 같은 탭 재방문 스킵.
 */

import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import path from "node:path";
import { SplashOverlay } from "@/components/ui/SplashOverlay";

describe("SplashOverlay — SSR 동작", () => {
  it("초기 렌더 visible=false → null 반환 (hydration 일관)", () => {
    const html = renderToStaticMarkup(<SplashOverlay />);
    expect(html).toBe("");
  });
});

describe("SplashOverlay — source-grep 회귀 가드", () => {
  const source = readFileSync(
    path.resolve(process.cwd(), "components/ui/SplashOverlay.tsx"),
    "utf8",
  );

  it("'use client' directive 존재 — Client Component 강제", () => {
    expect(source).toMatch(/^"use client";/);
  });

  it("sessionStorage 키 'td-splash-shown' 사용 — 같은 탭 재방문 스킵", () => {
    expect(source).toContain('"td-splash-shown"');
  });

  it("노출 시간 1500ms + fade 300ms 사전 시작", () => {
    expect(source).toContain("SPLASH_TOTAL_MS = 1500");
    expect(source).toContain("SPLASH_FADE_BEFORE_MS = 300");
  });

  it("베트남 일몰 그라디언트 — purple-deep → accent → amber", () => {
    expect(source).toContain("from-purple-deep");
    expect(source).toContain("via-accent");
    expect(source).toContain("to-amber");
  });

  it("SSR 안전 — useState(false) 초기값으로 서버/클라이언트 동일", () => {
    expect(source).toContain("useState(false)");
  });

  it("스크린리더 무관 — aria-hidden + role=\"presentation\"", () => {
    expect(source).toContain("aria-hidden");
    expect(source).toContain('role="presentation"');
  });

  it("private mode 대응 — try/catch로 sessionStorage 차단 시 fallback", () => {
    expect(source).toMatch(/try\s*\{[\s\S]*?sessionStorage[\s\S]*?\}\s*catch/);
  });

  it("setTimeout cleanup 보장 — useEffect return clearTimeout", () => {
    expect(source).toContain("clearTimeout(fadeTimer)");
    expect(source).toContain("clearTimeout(hideTimer)");
  });

  it("브랜드 정체성 — TravelDiary 로고 + 태그라인", () => {
    expect(source).toContain("TravelDiary");
    expect(source).toContain("AI와 함께, 살아 움직이는 여행");
  });
});

describe("HomePage — SplashOverlay 통합", () => {
  const home = readFileSync(
    path.resolve(process.cwd(), "app/page.tsx"),
    "utf8",
  );

  it("SplashOverlay import 존재", () => {
    expect(home).toMatch(/from\s+"@\/components\/ui\/SplashOverlay"/);
  });

  it("<SplashOverlay /> 렌더 호출 존재", () => {
    expect(home).toMatch(/<SplashOverlay\s*\/>/);
  });
});
