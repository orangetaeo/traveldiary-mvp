"use client";

/**
 * PWA 설치 프롬프트 — beforeinstallprompt 이벤트 기반.
 *
 * Android Chrome에서 자동 노출. iOS Safari는 수동 가이드 표시.
 * 한 번 닫으면 7일간 다시 표시하지 않음.
 */

import { useEffect, useState, useCallback } from "react";

const DISMISS_KEY = "pwa-install-dismissed";
const DISMISS_DAYS = 7;

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const diff = Date.now() - Number(dismissedAt);
      if (diff < DISMISS_DAYS * 86400000) return;
    }

    setDismissed(false);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isSafari = /safari/i.test(navigator.userAgent) && !/chrome/i.test(navigator.userAgent);
    if (isIos && isSafari) {
      setShowIosGuide(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setDismissed(true);
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDismissed(true);
  }, []);

  if (dismissed) return null;
  if (!deferredPrompt && !showIosGuide) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 max-w-md mx-auto animate-slide-up">
      <div className="bg-surface-card border border-divider rounded-md shadow-lg p-td-md flex items-start gap-td-sm">
        <div className="w-10 h-10 rounded-md bg-purple flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-white text-td-icon-lg">install_mobile</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-td-body font-semibold text-ink mb-td-xxs">
            홈 화면에 추가
          </p>
          <p className="text-td-caption text-ink-soft">
            {showIosGuide
              ? "공유 버튼 → \"홈 화면에 추가\"를 눌러주세요"
              : "앱처럼 빠르게 여행 일정에 접근하세요"}
          </p>
        </div>
        <div className="flex flex-col gap-1 shrink-0">
          {deferredPrompt && (
            <button
              onClick={handleInstall}
              className="px-3 py-1.5 bg-purple text-white text-td-caption font-semibold rounded-md hover:opacity-90"
            >
              설치
            </button>
          )}
          <button
            onClick={handleDismiss}
            className="px-3 py-1.5 text-td-caption text-ink-mute hover:text-ink"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
