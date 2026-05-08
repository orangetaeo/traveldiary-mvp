/**
 * /settings/account-link placeholder 페이지 정적 렌더 스모크 — 옵션 X (2026-05-08).
 *
 * settings-cache-page.test.tsx 답습 (next/link mock + renderToStaticMarkup +
 * PlaceholderShell 단일 타이틀).
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

import SettingsAccountLinkPage from "@/app/settings/account-link/page";

describe("/settings/account-link placeholder 페이지", () => {
  it("정적 마크업 + 핵심 카피 (PlaceholderShell 단일 타이틀)", () => {
    const html = renderToStaticMarkup(<SettingsAccountLinkPage />);
    expect(html).toContain("계정 연결 관리");
    expect(html).toContain("여러 소셜 계정을 한 프로필에 연결");
    expect(html).toContain("준비 중");
  });

  it("4-OAuth 제공자 모두 노출 (Kakao/Naver/Google/Apple) — OAuth 명시", () => {
    const html = renderToStaticMarkup(<SettingsAccountLinkPage />);
    expect(html).toContain("카카오");
    expect(html).toContain("Kakao OAuth");
    expect(html).toContain("네이버");
    expect(html).toContain("Naver OAuth");
    expect(html).toContain("Google");
    expect(html).toContain("Google OAuth");
    expect(html).toContain("Apple");
    expect(html).toContain("Apple OAuth");
  });

  it("4건 모두 '준비 중' 배지 — 데드 토글 회귀 가드", () => {
    const html = renderToStaticMarkup(<SettingsAccountLinkPage />);
    const matches = html.match(/준비 중/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(4);
  });

  it("4-OAuth + R1 사인오프 + ADR 정식 활성 조건 명시", () => {
    const html = renderToStaticMarkup(<SettingsAccountLinkPage />);
    expect(html).toContain("4-OAuth");
    expect(html).toContain("R1");
    expect(html).toContain("ADR");
  });

  it("연결 후 가능한 일 — 데이터 통합 / 복구 / 소유권 보존 3가지", () => {
    const html = renderToStaticMarkup(<SettingsAccountLinkPage />);
    expect(html).toContain("어느 소셜 계정으로 로그인해도 같은 내 여행 데이터");
    expect(html).toContain("한 계정 분실 시 다른 계정으로 안전하게 복구");
    expect(html).toContain("연결 해제 시점에 어느 계정도 데이터 소유권을 잃지 않음");
  });

  it("뒤로가기 — /settings로 이동 (PlaceholderShell default)", () => {
    const html = renderToStaticMarkup(<SettingsAccountLinkPage />);
    expect(html).toContain('href="/settings"');
  });

  it("실행 버튼 disabled (R1 사인오프 + 4-OAuth 콘솔 등록 전)", () => {
    const html = renderToStaticMarkup(<SettingsAccountLinkPage />);
    expect(html).toMatch(/disabled/i);
    expect(html).toContain("계정 연결 (준비 중)");
  });

  it("ARIA — role=note + aria-labelledby 두 섹션 + aria-label 4건", () => {
    const html = renderToStaticMarkup(<SettingsAccountLinkPage />);
    expect(html).toContain('role="note"');
    expect(html).toContain('aria-labelledby="account-providers-heading"');
    expect(html).toContain('aria-labelledby="account-link-policy-heading"');
    expect(html).toContain('aria-label="카카오 연결 — 준비 중"');
    expect(html).toContain('aria-label="네이버 연결 — 준비 중"');
    expect(html).toContain('aria-label="Google 연결 — 준비 중"');
    expect(html).toContain('aria-label="Apple 연결 — 준비 중"');
  });
});
