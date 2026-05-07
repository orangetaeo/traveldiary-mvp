/**
 * U4 디자인 갭 #1 (2026-05-07) — /cost/[tripId]/scan + /settings/email-sync
 * placeholder 페이지 정적 렌더 스모크.
 *
 * legal-pages-smoke.test.tsx 답습 (next/link mock + renderToStaticMarkup).
 */

import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

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

import CostScanPage from "@/app/cost/[tripId]/scan/page";
import SettingsEmailSyncPage from "@/app/settings/email-sync/page";

describe("/cost/[tripId]/scan 영수증 스캔 placeholder", () => {
  const tripId = "demo-pq-2026-mvp";

  it("정적 마크업 + 핵심 카피", () => {
    const html = renderToStaticMarkup(<CostScanPage params={{ tripId }} />);
    expect(html).toContain("영수증 스캔");
    expect(html).toContain("영수증을 찍으면 자동 입력");
    expect(html).toContain("준비 중");
  });

  it("3대 핵심 기능 노출", () => {
    const html = renderToStaticMarkup(<CostScanPage params={{ tripId }} />);
    expect(html).toContain("베트남 동(VND) → 원(KRW) 자동 환산");
    expect(html).toContain("메뉴/장소 카테고리 자동 분류");
    expect(html).toContain("사진은 기기 안에서만 처리");
  });

  it("뒤로가기 + CTA — /cost/[tripId]로 이동", () => {
    const html = renderToStaticMarkup(<CostScanPage params={{ tripId }} />);
    expect(html).toContain(`href="/cost/${tripId}"`);
    expect(html).toContain("비용 직접 입력하기");
  });

  it("정식 출시 조건 명시 — Vision API + R1 사인오프 + ADR", () => {
    const html = renderToStaticMarkup(<CostScanPage params={{ tripId }} />);
    expect(html).toContain("Vision API");
    expect(html).toContain("R1");
    expect(html).toContain("ADR");
  });

  it("ARIA — role=note + aria-live=polite + aria-labelledby", () => {
    const html = renderToStaticMarkup(<CostScanPage params={{ tripId }} />);
    expect(html).toContain('role="note"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('aria-labelledby="receipt-features-heading"');
  });

  it("tripId 동적 — 시드 외 trip ID도 라우트 매개변수로 전달 가능", () => {
    const html = renderToStaticMarkup(
      <CostScanPage params={{ tripId: "abc-trip-123" }} />,
    );
    expect(html).toContain('href="/cost/abc-trip-123"');
  });
});

describe("/settings/email-sync 이메일 동기화 placeholder", () => {
  it("정적 마크업 + 핵심 카피", () => {
    const html = renderToStaticMarkup(<SettingsEmailSyncPage />);
    expect(html).toContain("이메일 동기화");
    expect(html).toContain("예약 메일을 일정에 자동 추가");
    expect(html).toContain("개인정보 처리 원칙");
  });

  it("3대 메일 제공자 (Gmail / Naver / Daum) + OAuth 명시", () => {
    const html = renderToStaticMarkup(<SettingsEmailSyncPage />);
    expect(html).toContain("Gmail");
    expect(html).toContain("Google OAuth");
    expect(html).toContain("네이버 메일");
    expect(html).toContain("Naver OAuth");
    expect(html).toContain("다음 메일");
    expect(html).toContain("Kakao OAuth");
  });

  it("3개 모두 '준비 중' 배지 — 데드 토글 회귀 가드", () => {
    const html = renderToStaticMarkup(<SettingsEmailSyncPage />);
    const matches = html.match(/준비 중/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(3);
  });

  it("4-OAuth + R1 사인오프 + ADR 출시 조건 명시", () => {
    const html = renderToStaticMarkup(<SettingsEmailSyncPage />);
    expect(html).toContain("4-OAuth");
    expect(html).toContain("R1");
    expect(html).toContain("ADR");
  });

  it("뒤로가기 + CTA — /settings, /trips로 이동", () => {
    const html = renderToStaticMarkup(<SettingsEmailSyncPage />);
    expect(html).toContain('href="/settings"');
    expect(html).toContain('href="/trips"');
    expect(html).toContain("일정 직접 추가하기");
  });

  it("개인정보 원칙 — 본문 1회 파싱 + 즉시 폐기 + 메타만 저장", () => {
    const html = renderToStaticMarkup(<SettingsEmailSyncPage />);
    expect(html).toContain("1회 파싱 후 즉시 폐기");
    expect(html).toContain("일정 메타");
  });

  it("ARIA — role=note + aria-live=polite + aria-label 토글", () => {
    const html = renderToStaticMarkup(<SettingsEmailSyncPage />);
    expect(html).toContain('role="note"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('aria-label="Gmail 동기화 — 준비 중"');
  });
});

describe("/settings 페이지 — 이메일 동기화 항목 등록 (source grep)", () => {
  const SETTINGS_PAGE = resolve(__dirname, "../../app/settings/page.tsx");

  it("이메일 동기화 → /settings/email-sync 활성", () => {
    const source = readFileSync(SETTINGS_PAGE, "utf-8");
    expect(source).toMatch(/label:\s*"이메일 동기화",\s*href:\s*"\/settings\/email-sync"/);
  });

  it("준비 중 sub 노출 — 데드 링크/예상 미스매치 회귀 가드", () => {
    const source = readFileSync(SETTINGS_PAGE, "utf-8");
    expect(source).toMatch(/label:\s*"이메일 동기화"[^}]*sub:\s*"준비 중"/);
  });
});
