/**
 * 사이클 8 (G3, ADR-049) — 로그아웃·계정 삭제 4 모달 + /account/deleted 정적 렌더 스모크.
 *
 * Orchestrator는 useRouter/fetch 의존 → 본 스모크에서는 Overlay 4개만 검증.
 * Orchestrator state machine은 별도 (api-auth-account-route.test.ts에서 백엔드 검증).
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

import { LogoutConfirmModal } from "@/components/auth/LogoutConfirmModal";
import { AccountDeleteWarningModal } from "@/components/auth/AccountDeleteWarningModal";
import { AccountDeleteConfirmModal } from "@/components/auth/AccountDeleteConfirmModal";
import AccountDeletedPage from "@/app/account/deleted/page";

const NOOP = () => undefined;

describe("LogoutConfirmModal", () => {
  it("open=false → 미렌더링", () => {
    const html = renderToStaticMarkup(
      <LogoutConfirmModal open={false} pending={false} onConfirm={NOOP} onCancel={NOOP} />,
    );
    expect(html).toBe("");
  });

  it("open=true → 핵심 카피 + 버튼 2개", () => {
    const html = renderToStaticMarkup(
      <LogoutConfirmModal open={true} pending={false} onConfirm={NOOP} onCancel={NOOP} />,
    );
    expect(html).toContain("로그아웃하시겠어요");
    expect(html).toContain("자동 동기화가 멈춥니다");
    expect(html).toContain("동기화 키는 그대로");
    expect(html).toContain("취소");
    expect(html).toContain(">로그아웃<");
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
  });

  it("pending=true → 처리 중 카피 + 버튼 disabled", () => {
    const html = renderToStaticMarkup(
      <LogoutConfirmModal open={true} pending={true} onConfirm={NOOP} onCancel={NOOP} />,
    );
    expect(html).toContain("처리 중");
    expect(html).toContain("disabled");
  });

  it("errorMessage 노출 → role=alert", () => {
    const html = renderToStaticMarkup(
      <LogoutConfirmModal
        open={true}
        pending={false}
        errorMessage="네트워크 오류"
        onConfirm={NOOP}
        onCancel={NOOP}
      />,
    );
    expect(html).toContain('role="alert"');
    expect(html).toContain("네트워크 오류");
  });
});

describe("AccountDeleteWarningModal — 1단계", () => {
  it("open=false → 미렌더링", () => {
    const html = renderToStaticMarkup(
      <AccountDeleteWarningModal open={false} onNext={NOOP} onCancel={NOOP} />,
    );
    expect(html).toBe("");
  });

  it("open=true → 3 bullet + 다음 버튼", () => {
    const html = renderToStaticMarkup(
      <AccountDeleteWarningModal open={true} onNext={NOOP} onCancel={NOOP} />,
    );
    expect(html).toContain("정말 삭제하시겠어요");
    // 3 bullet 핵심 카피
    expect(html).toContain("동행자에게 그대로 보입니다");
    expect(html).toContain("즉시 익명 처리");
    expect(html).toContain("되돌릴 수 없습니다");
    expect(html).toContain("운영팀 문의");
    // 버튼
    expect(html).toContain("취소");
    expect(html).toContain(">다음<");
  });

  it("R1 결정 D2 — 30일 grace 카피 부재 (즉시 익명화)", () => {
    const html = renderToStaticMarkup(
      <AccountDeleteWarningModal open={true} onNext={NOOP} onCancel={NOOP} />,
    );
    expect(html).not.toContain("30일");
    expect(html).not.toContain("자동 복구");
  });
});

describe("AccountDeleteConfirmModal — 2단계", () => {
  it("open=false → 미렌더링", () => {
    const html = renderToStaticMarkup(
      <AccountDeleteConfirmModal open={false} pending={false} onConfirm={NOOP} onCancel={NOOP} />,
    );
    expect(html).toBe("");
  });

  it("open=true → 입력 안내 + 비활성 영구 삭제 버튼", () => {
    const html = renderToStaticMarkup(
      <AccountDeleteConfirmModal open={true} pending={false} onConfirm={NOOP} onCancel={NOOP} />,
    );
    expect(html).toContain("최종 확인");
    expect(html).toContain("계정 삭제");
    expect(html).toContain("이라고 입력");
    expect(html).toContain("영구 삭제");
    // input 초기 빈 상태 → 버튼 disabled (matches=false)
    expect(html).toContain("disabled");
    // input 자체
    expect(html).toContain('aria-label="확인 문구"');
  });

  it("pending=true → 삭제 중 카피 + disabled", () => {
    const html = renderToStaticMarkup(
      <AccountDeleteConfirmModal open={true} pending={true} onConfirm={NOOP} onCancel={NOOP} />,
    );
    expect(html).toContain("삭제 중");
  });

  it("errorMessage → role=alert + 메시지 노출", () => {
    const html = renderToStaticMarkup(
      <AccountDeleteConfirmModal
        open={true}
        pending={false}
        errorMessage="입력한 문구가 일치하지 않습니다."
        onConfirm={NOOP}
        onCancel={NOOP}
      />,
    );
    expect(html).toContain('role="alert"');
    expect(html).toContain("일치하지 않습니다");
  });
});

describe("/account/deleted 페이지 (R1 결정 D2 — 즉시 익명화)", () => {
  it("정적 마크업 + 핵심 카피", () => {
    const html = renderToStaticMarkup(<AccountDeletedPage />);
    expect(html).toContain("계정이 삭제되었습니다");
    expect(html).toContain("즉시 익명 처리");
    expect(html).toContain("동행자에게 그대로 보입니다");
  });

  it("R1 결정 — 30일 grace 카피 부재", () => {
    const html = renderToStaticMarkup(<AccountDeletedPage />);
    expect(html).not.toContain("30일");
    expect(html).not.toContain("자동 복구");
  });

  it("CTA — 홈으로 + 개인정보 처리방침", () => {
    const html = renderToStaticMarkup(<AccountDeletedPage />);
    expect(html).toContain('href="/"');
    expect(html).toContain('href="/legal/privacy"');
    expect(html).toContain("홈으로");
  });

  it("운영팀 문의 안내 (실수 복구 가능성)", () => {
    const html = renderToStaticMarkup(<AccountDeletedPage />);
    expect(html).toContain("운영팀 문의");
  });
});
