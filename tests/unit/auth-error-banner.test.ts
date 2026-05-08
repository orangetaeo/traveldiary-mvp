/**
 * AuthErrorBanner + 홈/로그인 페이지 auth_error 통합 테스트.
 *
 * OAuth 콜백 에러 코드 → 사용자 친화적 메시지 변환 검증.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const BANNER_SRC = readFileSync(
  resolve(__dirname, "../../components/auth/AuthErrorBanner.tsx"),
  "utf-8",
);

const HOME_SRC = readFileSync(
  resolve(__dirname, "../../app/page.tsx"),
  "utf-8",
);

const LOGIN_SRC = readFileSync(
  resolve(__dirname, "../../app/login/page.tsx"),
  "utf-8",
);

const CALLBACK_SRC = readFileSync(
  resolve(__dirname, "../../app/api/auth/kakao/callback/route.ts"),
  "utf-8",
);

/* ════════════════════════════════════════════
 * AuthErrorBanner 컴포넌트
 * ════════════════════════════════════════════ */

describe("AuthErrorBanner 컴포넌트", () => {
  it('"use client" 지시문', () => {
    expect(BANNER_SRC).toContain('"use client"');
  });

  it("role=alert 접근성", () => {
    expect(BANNER_SRC).toContain('role="alert"');
  });

  it("aria-live=polite 접근성", () => {
    expect(BANNER_SRC).toContain('aria-live="polite"');
  });

  it("닫기 버튼 (aria-label)", () => {
    expect(BANNER_SRC).toContain('aria-label="알림 닫기"');
  });

  it("URL에서 auth_error 파라미터 제거", () => {
    expect(BANNER_SRC).toContain('searchParams.delete("auth_error")');
  });
});

/* ════════════════════════════════════════════
 * 에러 코드 → 메시지 매핑
 * ════════════════════════════════════════════ */

describe("에러 코드 메시지 매핑", () => {
  // 콜백 라우트에서 사용하는 모든 에러 코드가 배너에 매핑되어 있는지 검증
  const CALLBACK_ERROR_CODES = [
    "not_configured",
    "no_code",
    "state_mismatch",
    "user_upsert_failed",
    "jwt_unavailable",
  ];

  it.each(CALLBACK_ERROR_CODES)(
    "에러 코드 '%s' 메시지 매핑 존재",
    (code) => {
      expect(BANNER_SRC).toContain(`${code}:`);
    },
  );

  it("exchange_ 접두사 에러 fallback", () => {
    expect(BANNER_SRC).toContain('code.startsWith("exchange_")');
  });

  it("알 수 없는 에러 fallback 메시지", () => {
    expect(BANNER_SRC).toContain("알 수 없는 오류");
  });

  it("로그인 실패 제목 표시", () => {
    expect(BANNER_SRC).toContain("로그인 실패");
  });
});

/* ════════════════════════════════════════════
 * 홈페이지 통합
 * ════════════════════════════════════════════ */

describe("app/page.tsx — auth_error 통합", () => {
  it("searchParams 프로퍼티 수신", () => {
    expect(HOME_SRC).toContain("searchParams");
    expect(HOME_SRC).toContain("auth_error");
  });

  it("AuthErrorBanner import", () => {
    expect(HOME_SRC).toContain("AuthErrorBanner");
  });

  it("auth_error 존재 시 배너 렌더링", () => {
    expect(HOME_SRC).toContain("searchParams.auth_error");
  });
});

/* ════════════════════════════════════════════
 * 로그인 페이지 통합
 * ════════════════════════════════════════════ */

describe("app/login/page.tsx — auth_error 통합", () => {
  it("searchParams 프로퍼티 수신", () => {
    expect(LOGIN_SRC).toContain("searchParams");
    expect(LOGIN_SRC).toContain("auth_error");
  });

  it("AuthErrorBanner import", () => {
    expect(LOGIN_SRC).toContain("AuthErrorBanner");
  });

  it("auth_error 존재 시 배너 렌더링", () => {
    expect(LOGIN_SRC).toContain("searchParams.auth_error");
  });
});

/* ════════════════════════════════════════════
 * 콜백 → 홈 리다이렉트 경로 검증
 * ════════════════════════════════════════════ */

describe("카카오 콜백 → auth_error 리다이렉트", () => {
  it("makeRedirectError 함수 존재", () => {
    expect(CALLBACK_SRC).toContain("makeRedirectError");
  });

  it("auth_error 쿼리 파라미터로 리다이렉트", () => {
    expect(CALLBACK_SRC).toContain("auth_error=");
  });

  it("5가지 이상 에러 분기", () => {
    const redirectCalls = (CALLBACK_SRC.match(/makeRedirectError/g) ?? []).length;
    // 함수 정의 1회 + 호출 최소 5회
    expect(redirectCalls).toBeGreaterThanOrEqual(6);
  });
});
