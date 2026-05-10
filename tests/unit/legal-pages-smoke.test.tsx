/**
 * /legal/terms + /legal/privacy + /legal/oss 정적 렌더 스모크 테스트.
 *
 * terms·privacy는 LegalDocumentShell 사용 (정식 문서).
 * oss는 LegalPlaceholderShell 사용 (placeholder).
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

describe("/legal/terms 정식 이용약관", () => {
  it("정적 마크업 + 핵심 카피", () => {
    const html = renderToStaticMarkup(<TermsPage />);
    expect(html).toContain("이용약관");
    expect(html).toContain("자유여행자를 위한 AI 여행 동반자");
  });

  it("15개 조항 제목 포함", () => {
    const html = renderToStaticMarkup(<TermsPage />);
    expect(html).toContain("제1조 (목적)");
    expect(html).toContain("제5조 (서비스의 내용)");
    expect(html).toContain("제6조 (AI 콘텐츠 면책)");
    expect(html).toContain("제10조 (금지 행위)");
    expect(html).toContain("제15조 (문의)");
  });

  it("AI 콘텐츠 면책 — 참고용·이용자 책임 명시", () => {
    const html = renderToStaticMarkup(<TermsPage />);
    expect(html).toContain("AI가 생성한 일정");
    expect(html).toContain("참고용");
    expect(html).toContain("이용자의 판단과 책임");
  });

  it("OTA 어필리에이트 — 외부 사이트 약관 별도 적용", () => {
    const html = renderToStaticMarkup(<TermsPage />);
    expect(html).toContain("OTA");
    expect(html).toContain("어필리에이트");
    expect(html).toContain("해당 사이트의 이용약관");
  });

  it("사용자 데이터 소유권 — 본인 소유 + JSON 내보내기", () => {
    const html = renderToStaticMarkup(<TermsPage />);
    expect(html).toContain("본인이 소유");
    expect(html).toContain("JSON 형식");
  });

  it("약관 변경 공지 — 7일·30일 사전 공지", () => {
    const html = renderToStaticMarkup(<TermsPage />);
    expect(html).toContain("7일 전");
    expect(html).toContain("30일 전");
  });

  it("뒤로가기 + 교차 링크 — /settings, /legal/terms, /legal/privacy", () => {
    const html = renderToStaticMarkup(<TermsPage />);
    expect(html).toContain('href="/settings"');
    expect(html).toContain('href="/legal/terms"');
    expect(html).toContain('href="/legal/privacy"');
  });
});

describe("/legal/privacy 정식 개인정보 처리방침", () => {
  it("정적 마크업 + 핵심 카피", () => {
    const html = renderToStaticMarkup(<PrivacyPage />);
    expect(html).toContain("개인정보 처리방침");
    expect(html).toContain("개인정보를 어떻게 수집");
  });

  it("14개 섹션 제목 포함", () => {
    const html = renderToStaticMarkup(<PrivacyPage />);
    expect(html).toContain("1. 개요");
    expect(html).toContain("2. 수집하는 개인정보 항목");
    expect(html).toContain("6. 위치 정보 처리");
    expect(html).toContain("10. 이용자의 권리");
    expect(html).toContain("14. 처리방침 변경");
  });

  it("위치 정보 — 기기 전용 처리, 서버 미전송", () => {
    const html = renderToStaticMarkup(<PrivacyPage />);
    expect(html).toContain("위치 좌표");
    expect(html).toContain("기기에서만 처리");
    expect(html).toContain("서버에 전송");
  });

  it("캐시 보관 기간 — OCR 7일, 번역 30일", () => {
    const html = renderToStaticMarkup(<PrivacyPage />);
    expect(html).toContain("7일");
    expect(html).toContain("30일");
  });

  it("감사 로그 마스킹 — 자동 마스킹 명시", () => {
    const html = renderToStaticMarkup(<PrivacyPage />);
    expect(html).toContain("자동 마스킹");
  });

  it("이용자 권리 — 열람·정정·삭제·이동", () => {
    const html = renderToStaticMarkup(<PrivacyPage />);
    expect(html).toContain("열람권");
    expect(html).toContain("정정권");
    expect(html).toContain("삭제권");
    expect(html).toContain("이동권");
  });

  it("계정 삭제 시 익명화", () => {
    const html = renderToStaticMarkup(<PrivacyPage />);
    expect(html).toContain("계정 삭제");
    expect(html).toContain("익명화");
  });

  it("제3자 제공 표 — 카카오·Google·Anthropic·Naver·Railway", () => {
    const html = renderToStaticMarkup(<PrivacyPage />);
    expect(html).toContain("카카오");
    expect(html).toContain("Google Places");
    expect(html).toContain("Anthropic Claude");
    expect(html).toContain("Naver");
    expect(html).toContain("Railway");
  });

  it("뒤로가기 + 교차 링크", () => {
    const html = renderToStaticMarkup(<PrivacyPage />);
    expect(html).toContain('href="/settings"');
    expect(html).toContain('href="/legal/terms"');
    expect(html).toContain('href="/legal/privacy"');
  });
});

describe("LegalDocumentShell 공통 — Terms/Privacy", () => {
  it.each([
    ["TermsPage", TermsPage],
    ["PrivacyPage", PrivacyPage],
  ])("%s — 최종 갱신일 표시 + /settings 복귀 링크", (_name, Page) => {
    const html = renderToStaticMarkup(<Page />);
    expect(html).toContain("최종 갱신");
    expect(html).toContain("2026-05-09");
    expect(html).toContain('href="/settings"');
  });
});

describe("/legal/oss placeholder 페이지 — 사이클 U-deadlinks", () => {
  it("정적 마크업 + 핵심 카피", () => {
    const html = renderToStaticMarkup(<OssLicensesPage />);
    expect(html).toContain("오픈소스 라이선스");
    expect(html).toContain("도움을 받아 만들어졌습니다");
    expect(html).toContain("정식 문서 준비 중");
  });

  it("핵심 의존성 가시화 — Next/React/TypeScript/Tailwind/Prisma/jose/pg", () => {
    const html = renderToStaticMarkup(<OssLicensesPage />);
    expect(html).toContain("Next.js 14");
    expect(html).toContain("React 18");
    expect(html).toContain("TypeScript 5");
    expect(html).toContain("Tailwind CSS 3");
    expect(html).toContain("Prisma 7");
    expect(html).toContain("jose");
    expect(html).toContain("pg");
  });

  it("라이선스 키워드 — MIT / Apache 2.0", () => {
    const html = renderToStaticMarkup(<OssLicensesPage />);
    expect(html).toContain("MIT");
    expect(html).toContain("Apache 2.0");
  });

  it("LegalPlaceholderShell 답습 — iconName=description (gavel 아님)", () => {
    const html = renderToStaticMarkup(<OssLicensesPage />);
    expect(html).toContain("description");
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
