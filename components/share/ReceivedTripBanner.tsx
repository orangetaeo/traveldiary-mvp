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

export function ReceivedTripBanner({ onDismiss }: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-purple-soft border-b border-purple/20 px-td-md py-td-sm flex items-start gap-td-sm"
    >
      <span
        className="material-symbols-outlined text-purple-deep flex-shrink-0 mt-0.5"
        style={{ fontVariationSettings: "'FILL' 1" }}
        aria-hidden
      >
        check_circle
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-td-meta text-purple-deep font-bold">
          공유 받은 여행이 추가됐어요
        </p>
        <p className="text-td-caption text-purple-deep/80 mt-0.5">
          다음에 다시 보고 싶다면 공유 받은 여행 목록에서 찾을 수 있어요.
        </p>
        <Link
          href="/shared"
          className="inline-block mt-td-xs px-td-md py-1.5 rounded-full bg-purple text-white text-td-caption font-bold"
        >
          받은 여행 보기
        </Link>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="배너 닫기"
        className="text-purple-deep/60 hover:text-purple-deep p-1 -m-1 shrink-0"
      >
        <span className="material-symbols-outlined text-td-icon" aria-hidden>
          close
        </span>
      </button>
    </div>
  );
}
