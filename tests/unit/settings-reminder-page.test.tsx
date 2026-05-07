/**
 * /settings/reminder placeholder 페이지 정적 렌더 스모크 — 사이클 U-deadlinks (2026-05-07).
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

import SettingsReminderPage from "@/app/settings/reminder/page";

describe("/settings/reminder placeholder 페이지", () => {
  it("정적 마크업 + 핵심 카피", () => {
    const html = renderToStaticMarkup(<SettingsReminderPage />);
    expect(html).toContain("리마인더 시간");
    expect(html).toContain("언제 알려드릴까요?");
    expect(html).toContain("준비 중");
  });

  it("프리셋 4건 노출 — 30분 / 1시간 / 2시간 / 모닝 브리핑", () => {
    const html = renderToStaticMarkup(<SettingsReminderPage />);
    expect(html).toContain("출발 30분 전");
    expect(html).toContain("출발 1시간 전");
    expect(html).toContain("출발 2시간 전");
    expect(html).toContain("당일 아침 8시");
  });

  it("프리셋 설명 — 공항/기차 + 모닝 브리핑 키워드", () => {
    const html = renderToStaticMarkup(<SettingsReminderPage />);
    expect(html).toContain("공항");
    expect(html).toContain("모닝 브리핑");
  });

  it("알림 권한 link → /permission/notification", () => {
    const html = renderToStaticMarkup(<SettingsReminderPage />);
    expect(html).toContain('href="/permission/notification"');
    expect(html).toContain("알림 권한 먼저 허용하기");
  });

  it("/settings 뒤로가기", () => {
    const html = renderToStaticMarkup(<SettingsReminderPage />);
    expect(html).toContain('href="/settings"');
  });

  it("ARIA — role=note + aria-labelledby 프리셋", () => {
    const html = renderToStaticMarkup(<SettingsReminderPage />);
    expect(html).toContain('role="note"');
    expect(html).toContain('aria-labelledby="reminder-presets-heading"');
  });

  it("Web Push / Service Worker / R1 사인오프 정책 인용", () => {
    const html = renderToStaticMarkup(<SettingsReminderPage />);
    expect(html).toContain("Web Push");
    expect(html).toContain("Service Worker");
    expect(html).toContain("R1 사인오프");
  });
});
