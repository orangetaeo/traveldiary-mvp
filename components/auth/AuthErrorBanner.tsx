"use client";

/**
 * AuthErrorBanner — OAuth 콜백 에러 표시 배너.
 * ?auth_error= 쿼리 파라미터를 사용자 친화적 메시지로 변환.
 * 닫기 버튼으로 dismiss + URL에서 파라미터 제거.
 */

import { useState, useCallback } from "react";

const ERROR_MESSAGES: Record<string, string> = {
  not_configured: "카카오 로그인이 아직 설정되지 않았습니다",
  no_code: "로그인 인증 코드를 받지 못했습니다",
  state_mismatch: "보안 검증에 실패했습니다. 다시 시도해 주세요",
  exchange_failed: "카카오 인증 처리 중 오류가 발생했습니다",
  exchange_network: "카카오 서버 연결에 실패했습니다",
  exchange_invalid_grant: "인증이 만료되었습니다. 다시 로그인해 주세요",
  user_upsert_failed: "계정 정보 저장에 실패했습니다",
  jwt_unavailable: "인증 토큰 생성에 실패했습니다",
};

function getErrorMessage(code: string): string {
  if (ERROR_MESSAGES[code]) return ERROR_MESSAGES[code];
  if (code.startsWith("exchange_")) return "카카오 인증 처리 중 오류가 발생했습니다";
  return "로그인 중 알 수 없는 오류가 발생했습니다";
}

interface AuthErrorBannerProps {
  errorCode: string;
}

export function AuthErrorBanner({ errorCode }: AuthErrorBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    // URL에서 auth_error 파라미터 제거
    const url = new URL(window.location.href);
    url.searchParams.delete("auth_error");
    window.history.replaceState({}, "", url.pathname + url.search);
  }, []);

  if (dismissed) return null;

  const message = getErrorMessage(errorCode);

  return (
    <div
      className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3"
      role="alert"
      aria-live="polite"
    >
      <span className="material-symbols-outlined text-red-500 shrink-0 mt-0.5" aria-hidden>
        error
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-td-meta font-medium text-red-800">로그인 실패</p>
        <p className="text-td-caption text-red-600 mt-0.5">{message}</p>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-100 transition-colors"
        aria-label="알림 닫기"
      >
        <span className="material-symbols-outlined text-red-400 text-[20px]" aria-hidden>
          close
        </span>
      </button>
    </div>
  );
}
