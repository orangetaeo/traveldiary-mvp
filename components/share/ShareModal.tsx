"use client";

/**
 * Share Modal — 사이클 11a (ADR-024).
 * Trip 공유 링크 생성 + URL 복사.
 */

import { useEffect, useState, useTransition } from "react";
import { createShareLinkAction } from "@/actions/share";

interface ShareModalProps {
  open: boolean;
  tripId: string;
  onClose: () => void;
}

export function ShareModal({ open, tripId, onClose }: ShareModalProps) {
  const [isPending, startTransition] = useTransition();
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [demo, setDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  // 사이클 11c — permission 토글 (view 기본 / edit는 OAuth 전제)
  const [permission, setPermission] = useState<"view" | "edit">("view");

  useEffect(() => {
    if (!open) return;
    setShareUrl(null);
    setDemo(false);
    setError(null);
    setCopied(false);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  function regenerate(perm: "view" | "edit") {
    setShareUrl(null);
    setDemo(false);
    setError(null);
    setCopied(false);
    setPermission(perm);
    startTransition(async () => {
      const result = await createShareLinkAction({ tripId, permission: perm });
      if (!result.ok) {
        setError(`링크 생성 실패: ${result.code}`);
        return;
      }
      const key = result.demo ? result.syncKey : result.data.syncKey;
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      setShareUrl(`${origin}/share/${key}`);
      setDemo(result.demo);
    });
  }

  useEffect(() => {
    if (!open || shareUrl) return;
    regenerate(permission);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  function handleCopy() {
    if (!shareUrl) return;
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      })
      .catch(() => setError("복사 실패 — 직접 선택해 복사해주세요."));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-title"
    >
      <div
        className="relative w-full max-w-[420px] bg-surface-card rounded-t-[24px] shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-divider" aria-hidden />
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="absolute top-3 right-3 text-ink-soft hover:text-ink p-1 rounded-full hover:bg-surface-soft"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <header className="px-td-lg pt-td-xs pb-td-sm">
          <h2
            id="share-title"
            className="text-td-card-title text-ink font-semibold"
          >
            여행 공유 링크
          </h2>
          <p className="text-td-caption text-ink-soft mt-td-xxs">
            보기 전용. 링크를 아는 사람이면 누구든 열람 가능 (편집 X).
            기본 30일 후 자동 만료.
          </p>
        </header>

        <div className="px-td-md pb-td-md space-y-td-sm">
          {/* 11c: permission 토글 */}
          <div className="flex gap-td-xs" role="radiogroup" aria-label="권한">
            <button
              type="button"
              role="radio"
              aria-checked={permission === "view" ? "true" : "false"}
              onClick={() => permission !== "view" && regenerate("view")}
              className={`flex-1 px-td-sm py-2 rounded-lg text-td-meta font-semibold border transition-colors ${
                permission === "view"
                  ? "bg-purple-soft border-purple text-purple-deep"
                  : "border-divider text-ink-soft hover:border-purple/40"
              }`}
            >
              보기 전용
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={permission === "edit" ? "true" : "false"}
              onClick={() => permission !== "edit" && regenerate("edit")}
              className={`flex-1 px-td-sm py-2 rounded-lg text-td-meta font-semibold border transition-colors ${
                permission === "edit"
                  ? "bg-amber-soft border-amber text-amber-deep"
                  : "border-divider text-ink-soft hover:border-amber/40"
              }`}
            >
              편집 가능
            </button>
          </div>

          {isPending && !shareUrl && (
            <div className="text-td-body text-ink-soft text-center py-td-lg">
              링크 생성 중…
            </div>
          )}

          {error && (
            <div className="bg-danger-soft text-danger-deep p-td-sm rounded-lg text-td-meta">
              {error}
            </div>
          )}

          {shareUrl && (
            <>
              {demo && (
                <p className="text-td-caption text-amber-deep bg-amber-soft px-td-sm py-td-xs rounded-lg">
                  💡 데모 모드 — 실제 DB에 저장되지 않은 시뮬 URL입니다.
                  실 trip 생성 후 다시 공유하세요.
                </p>
              )}
              <div className="bg-surface-soft border border-divider rounded-lg p-td-sm break-all text-td-meta text-ink tabular-nums">
                {shareUrl}
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className="w-full py-2 bg-purple text-white rounded-lg text-td-body font-semibold hover:opacity-90 transition-opacity"
              >
                {copied ? "✅ 복사됨" : "URL 복사"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
