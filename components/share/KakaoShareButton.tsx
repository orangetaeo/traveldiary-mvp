"use client";

/**
 * 카카오톡 공유 버튼 — 사이클 R (ADR-036).
 *
 * Web Share API 우선 (모바일 native 시트 — 카톡·메시지·메일 통합).
 * 미지원 시 카카오 share URL scheme 폴백 (PC 또는 desktop 브라우저).
 *
 * 신규 의존성 0 — Kakao SDK 불요.
 */

import { useState } from "react";

interface KakaoShareButtonProps {
  url: string;
  text: string;
}

export function KakaoShareButton({ url, text }: KakaoShareButtonProps) {
  const [busy, setBusy] = useState(false);

  async function handleShare() {
    setBusy(true);
    try {
      // 1. Web Share API 우선
      if (typeof navigator !== "undefined" && navigator.share) {
        try {
          await navigator.share({ url, text });
          return;
        } catch (err) {
          // 사용자 취소 (AbortError)는 fallback 안 함
          if ((err as DOMException)?.name === "AbortError") return;
        }
      }
      // 2. 카카오 share URL scheme 폴백
      const sharerUrl = `https://sharer.kakao.com/talk/friends/picker/link?url=${encodeURIComponent(
        url,
      )}&text=${encodeURIComponent(text)}`;
      window.open(sharerUrl, "_blank", "noopener,noreferrer");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={busy}
      aria-label="카카오톡으로 공유"
      className="inline-flex items-center gap-1 px-td-sm py-td-xs rounded-full bg-amber text-amber-deep font-medium text-td-meta hover:bg-amber/80 transition-colors disabled:opacity-50"
    >
      <span className="material-symbols-outlined text-td-icon-md" aria-hidden>
        chat_bubble
      </span>
      {busy ? "공유 중..." : "카카오톡 공유"}
    </button>
  );
}
