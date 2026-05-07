"use client";

/**
 * 카카오 로그인 / 로그아웃 버튼 — 사이클 11b (ADR-026).
 *
 * Props로 currentUserId 받음 (Server Component에서 전달):
 *   null → 로그인 버튼
 *   string → 로그아웃 버튼 (사용자 표시)
 */

import { useState } from "react";
import { useRouter } from "next/navigation";

interface LoginButtonProps {
  currentUserId: string | null;
  currentUserName?: string | null;
  oauthAvailable: boolean;
}

export function LoginButton({
  currentUserId,
  currentUserName,
  oauthAvailable,
}: LoginButtonProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  function handleLogin() {
    window.location.href = "/api/auth/kakao/start";
  }

  async function handleLogout() {
    setIsPending(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  if (!oauthAvailable) {
    return (
      <button
        type="button"
        disabled
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-td-meta font-semibold text-ink-mute border border-divider opacity-60 cursor-not-allowed"
        title="카카오 OAuth 미설정 (KAKAO_CLIENT_ID + JWT_SECRET 필요)"
      >
        <span className="material-symbols-outlined text-[18px]" aria-hidden>
          lock
        </span>
        로그인 (미설정)
      </button>
    );
  }

  if (currentUserId) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-td-meta text-ink-soft">
          {currentUserName ?? `사용자 ${currentUserId.slice(0, 6)}`}
        </span>
        <button
          type="button"
          onClick={handleLogout}
          disabled={isPending}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-td-caption text-ink-soft border border-divider hover:bg-surface-soft disabled:opacity-60"
        >
          {isPending ? "…" : "로그아웃"}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleLogin}
      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-td-meta font-semibold text-ink bg-kakao hover:opacity-90 transition-opacity"
    >
      <span className="material-symbols-outlined text-[18px]" aria-hidden>
        chat_bubble
      </span>
      카카오 로그인
    </button>
  );
}
