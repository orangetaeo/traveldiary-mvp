/**
 * 사이클 7 (G10) — /legal/terms + /legal/privacy placeholder 페이지 정적 렌더 스모크.
 *
 * phase7-pages-smoke.test.tsx 답습 (next/link mock + renderToStaticMarkup).
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

import TermsPage from "@/app/legal/terms/page";
import PrivacyPage from "@/app/legal/privacy/page";
import OssLicensesPage from "@/app/legal/oss/page";

describe("/legal/terms placeholder 페이지", () => {
  it("정적 마크업 + 핵심 카피", () => {
    const html = renderToStaticMarkup(<TermsPage />);
    expect(html).toContain("이용약관");
    expect(html).toContain("자유여행자를 위한 AI 여행 동반자");
    expect(html).toContain("정식 문서 준비 중");
  });

  it("주요 항목 5개 모두 노출", () => {
    const html = renderToStaticMarkup(<TermsPage />);
    expect(html).toContain("AI가 생성한 일정");
    expect(html).toContain("OTA 어필리에이트");
    expect(html).toContain("본인이 소유");
    expect(html).toContain("출시 시점");
    expect(html).toContain("앱 내 알림");
  });

  it("뒤로가기 + 교차 링크 — /settings, /legal/terms, /legal/privacy", () => {
    const html = renderToStaticMarkup(<TermsPage />);
    expect(html).toContain('href="/settings"');
    expect(html).toContain('href="/legal/terms"');
    expect(html).toContain('href="/legal/privacy"');
  });

  it("ARIA — role=note placeholder 안내 + aria-labelledby 주요 항목", () => {
    const html = renderToStaticMarkup(<TermsPage />);
    expect(html).toContain('role="note"');
    expect(html).toContain('aria-labelledby="legal-highlights-heading"');
  });
});

describe("/legal/privacy placeholder 페이지", () => {
  it("정적 마크업 + 핵심 카피", () => {
    const html = renderToStaticMarkup(<PrivacyPage />);
    expect(html).toContain("개인정보 처리방침");
    expect(html).toContain("여러분의 데이터를 어떻게 다루는지");
  });

  it("ADR-017 + ADR-019 인용 (프라이버시 정체성)", () => {
    const html = renderToStaticMarkup(<PrivacyPage />);
    expect(html).toContain("ADR-017");
    expect(html).toContain("ADR-019");
  });

  it("핵심 5+ 항목 — 위치/이미지/익명/감사로그/사용자 권리", () => {
    const html = renderToStaticMarkup(<PrivacyPage />);
    expect(html).toContain("위치 좌표");
    expect(html).toContain("서버에 저장하지 않습니다");
    expect(html).toContain("OCR 결과 7일");
    expect(html).toContain("번역 결과 30일");
    expect(html).toContain("clientUuid");
    expect(html).toContain("자동 마스킹");
    expect(html).toContain("계정 삭제");
  });

  it("ADR-046 인용 (감사 로그 redact)", () => {
    const html = renderToStaticMarkup(<PrivacyPage />);
    expect(html).toContain("ADR-046");
  });
});

describe("LegalPlaceholderShell 공통 — Terms/Privacy", () => {
  it.each([
    ["TermsPage", TermsPage],
    ["PrivacyPage", PrivacyPage],
  ])("%s — gavel 아이콘 + 주요 항목 헤더 + placeholder note 노출", (_name, Page) => {
    const html = renderToStaticMarkup(<Page />);
    expect(html).toContain("gavel");
    expect(html).toContain("주요 항목");
    expect(html).toContain("BLOCKER 7");
    expect(html).toContain("사업자 등록");
  });
});

describe("/legal/oss placeholder 페이지 — 사이클 U-deadlinks", () => {
  it("정적 마크업 + 핵심 카피", () => {
    const html = renderToStaticMarkup(<OssLicensesPage />);
    expect(html).toContain("오픈소스 라이선스");
    expect(html).toContain("도움을 받아 만들어졌습니다");
    expect(html).toContain("정식 문서 준비 중");
  });

  it("핵심 의존성 가시화 — Next/React/TypeScript/Tailwind/Prisma/shadcn", () => {
    const html = renderToStaticMarkup(<OssLicensesPage />);
    expect(html).toContain("Next.js 14");
    expect(html).toContain("React 18");
    expect(html).toContain("TypeScript 5");
    expect(html).toContain("Tailwind CSS 3");
    expect(html).toContain("Prisma 7");
    expect(html).toContain("shadcn/ui");
  });

  it("라이선스 키워드 — MIT / Apache 2.0", () => {
    const html = renderToStaticMarkup(<OssLicensesPage />);
    expect(html).toContain("MIT");
    expect(html).toContain("Apache 2.0");
  });

  it("LegalPlaceholderShell 답습 — iconName=description (gavel 아님)", () => {
    const html = renderToStaticMarkup(<OssLicensesPage />);
    // iconName prop으로 "description" 전달 → Hero 아이콘은 description
    expect(html).toContain("description");
    // shell 자체 구조는 답습 — 주요 항목 헤더 + amber 노트
    expect(html).toContain("주요 항목");
    expect(html).toContain("BLOCKER 7");
  });

  it("/settings 뒤로가기 + 교차 링크", () => {
    const html = renderToStaticMarkup(<OssLicensesPage />);
    expect(html).toContain('href="/settings"');
    expect(html).toContain('href="/legal/terms"');
    expect(html).toContain('href="/legal/privacy"');
  });
});
