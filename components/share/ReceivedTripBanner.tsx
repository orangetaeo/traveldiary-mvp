"use client";

/**
 * 받은 trip 가시화 배너 — 사이클 2 (G7, 2026-05-06).
 *
 * /share/[key] 페이지에서 ReceivedKeyTracker가 LocalStorage에 자동 추가한 후
 * 사용자에게 1회 표시 (isNew=true일 때만).
 *
 * 갭 해소: 기존엔 silent로 자동 추가되어 사용자가 "받은 사실"을 인지하지 못함.
 *         /shared 진입 CTA로 받은 여행 다시 보기 경로 제공.
 */

import Link from "next/link";

interface Props {
  destination?: string;
  onDismiss: () => void;
}

export function ReceivedTripBanner({ destination, onDismiss }: Props) {
  const label = destination ? `${destination} 여행을` : "이 여행을";
  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-amber-soft border-b border-amber-deep/20 px-td-md py-td-sm flex items-start gap-td-sm"
    >
      <span
        className="material-symbols-outlined text-amber-deep flex-shrink-0 mt-0.5"
        style={{ fontVariationSettings: "'FILL' 1" }}
        aria-hidden
      >
        check_circle
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-td-meta text-amber-deep font-medium">
          내 목록에 추가됐어요
        </p>
        <p className="text-td-caption text-amber-deep/80 mt-0.5">
          {label} 받은 여행 목록에서 다시 볼 수 있어요.
        </p>
      </div>
      <Link
        href="/shared"
        className="text-td-caption font-bold text-purple-deep hover:underline whitespace-nowrap shrink-0 self-center px-td-xs"
      >
        받은 여행 →
      </Link>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="배너 닫기"
        className="text-amber-deep/60 hover:text-amber-deep p-1 -m-1 shrink-0"
      >
        <span className="material-symbols-outlined text-td-icon" aria-hidden>
          close
        </span>
      </button>
    </div>
  );
}
