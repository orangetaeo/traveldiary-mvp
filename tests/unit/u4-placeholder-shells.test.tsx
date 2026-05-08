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

import SettingsEmailSyncPage from "@/app/settings/email-sync/page";

// /cost/[tripId]/scan — ReceiptScanView 클라이언트 컴포넌트로 전환됨.
// renderToStaticMarkup 불가 → source grep 검증.
describe("/cost/[tripId]/scan 영수증 스캔 (source grep)", () => {
  const pageSrc = readFileSync(
    resolve(__dirname, "../../app/cost/[tripId]/scan/page.tsx"),
    "utf-8",
  );
  // 사이클 JJ: ReceiptScanView → 3파일 분할. 전체 소스를 합쳐서 grep.
  const viewSrc = [
    readFileSync(resolve(__dirname, "../../components/cost/ReceiptScanView.tsx"), "utf-8"),
    readFileSync(resolve(__dirname, "../../components/cost/ReceiptCaptureStep.tsx"), "utf-8"),
    readFileSync(resolve(__dirname, "../../components/cost/ReceiptResultStep.tsx"), "utf-8"),
    readFileSync(resolve(__dirname, "../../lib/utils/currency.ts"), "utf-8"),
  ].join("\n");

  it("페이지가 ReceiptScanView 클라이언트 컴포넌트를 사용한다", () => {
    expect(pageSrc).toContain("ReceiptScanView");
    expect(pageSrc).toContain("tripId");
  });

  it("ReceiptScanView에 'use client' 지시문이 있다", () => {
    expect(viewSrc).toContain('"use client"');
  });

  it("scanReceiptAction 서버 액션을 호출한다", () => {
    expect(viewSrc).toContain("scanReceiptAction");
  });

  it("addCost 서버 액션으로 비용을 등록한다", () => {
    expect(viewSrc).toContain("addCost");
  });

  it("카메라 촬영 + 갤러리 입력 지원 (file input)", () => {
    expect(viewSrc).toContain('accept="image/*"');
    expect(viewSrc).toContain('capture="environment"');
  });

  it("VND → KRW 환율 변환이 포함된다", () => {
    expect(viewSrc).toContain("CURRENCY_TO_KRW");
    expect(viewSrc).toContain("VND");
  });

  it("카테고리 선택이 가능하다 (COST_CATEGORY_OPTIONS)", () => {
    expect(viewSrc).toContain("COST_CATEGORY_OPTIONS");
  });

  it("영수증 사각형 가이드 + 추출 항목 카피가 포함된다", () => {
    expect(viewSrc).toContain("영수증을 사각형 안에 맞춰주세요");
    expect(viewSrc).toContain("가게명/금액/날짜/카테고리를 자동으로 추출해요");
  });

  it("에러 상태 + 로딩 상태 UI가 포함된다", () => {
    expect(viewSrc).toContain("영수증 인식 중");
    expect(viewSrc).toContain("인식 실패");
  });

  it("결과 확인 화면에서 편집 가능 필드가 있다 (vendor, total, currency, date, category)", () => {
    expect(viewSrc).toContain("setVendor");
    expect(viewSrc).toContain("setTotal");
    expect(viewSrc).toContain("setCurrency");
    expect(viewSrc).toContain("setDate");
    expect(viewSrc).toContain("setCategory");
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
