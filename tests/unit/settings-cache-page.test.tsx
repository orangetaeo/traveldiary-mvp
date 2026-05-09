/**
 * /settings/cache placeholder 페이지 정적 렌더 스모크 — 사이클 U-deadlinks (2026-05-07).
 *
 * legal-pages-smoke.test.tsx 답습 (next/link mock + renderToStaticMarkup).
 */

import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => <a href={href} {...rest}>{children}</a>,
}));

import SettingsCachePage from "@/app/settings/cache/page";

describe("/settings/cache placeholder 페이지", () => {
  it("정적 마크업 + 핵심 카피 (사이클 U-shell-dry: PlaceholderShell 단일 타이틀)", () => {
    const html = renderToStaticMarkup(<SettingsCachePage />);
    expect(html).toContain("캐시 삭제");
    expect(html).toContain("저장된 외부 API 응답");
    expect(html).toContain("참고");
  });

  it("삭제되는 항목 3건 — Google/Naver/Vision/Claude 외부 응답 + 이미지 + Evidence", () => {
    const html = renderToStaticMarkup(<SettingsCachePage />);
    expect(html).toContain("Google Places");
    expect(html).toContain("Naver");
    expect(html).toContain("Vision OCR");
    expect(html).toContain("Claude API");
    expect(html).toContain("이미지 미리보기");
    expect(html).toContain("Evidence panel");
  });

  it("유지 데이터 가시화 — trip / 협업 / 감사 로그", () => {
    const html = renderToStaticMarkup(<SettingsCachePage />);
    expect(html).toContain("내 trip / 일정 / 비용 / 체크리스트");
    expect(html).toContain("동기화 키");
    expect(html).toContain("감사 로그");
  });

  it("CacheClearButton 컴포넌트 포함 (실행 가능)", () => {
    const html = renderToStaticMarkup(<SettingsCachePage />);
    // CacheClearButton은 client component — SSR 초기 렌더에 "캐시 삭제" 버튼 포함
    expect(html).toContain("캐시 삭제");
  });

  it("/settings 뒤로가기", () => {
    const html = renderToStaticMarkup(<SettingsCachePage />);
    expect(html).toContain('href="/settings"');
  });

  it("ARIA — role=note + aria-labelledby 두 섹션", () => {
    const html = renderToStaticMarkup(<SettingsCachePage />);
    expect(html).toContain('role="note"');
    expect(html).toContain('aria-labelledby="cache-target-heading"');
    expect(html).toContain('aria-labelledby="cache-kept-heading"');
  });

  it("안내 노트 — 데이터 안전 보관 설명", () => {
    const html = renderToStaticMarkup(<SettingsCachePage />);
    expect(html).toContain("참고");
    expect(html).toContain("서버에 안전하게 보관");
  });
});
