/**
 * 알림 권한 요청 페이지 (Phase 7 신규).
 *
 * Stitch 시안: #30 Permission Request — 알림 (21c8027a5f0a4fda8bfb9794d58126ac)
 * 용도: Push Notification 요청 전 사용자에게 이유를 설명하는 프리-프롬프트 카드.
 *
 * 거부 시 fallback 안내 (camera 답습) — OS 설정 진입 가이드 명시.
 */

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NotificationPermissionPage() {
  const router = useRouter();
  const [requesting, setRequesting] = useState(false);
  const [denied, setDenied] = useState(false);

  const handleAllow = async () => {
    setRequesting(true);
    setDenied(false);
    try {
      const result = await Notification.requestPermission();
      if (result === "granted") {
        router.back();
      } else if (result === "denied") {
        setRequesting(false);
        setDenied(true);
      } else {
        // "default" — 사용자가 결정 안 함 (브라우저 외부 클릭 등)
        setRequesting(false);
      }
    } catch {
      setRequesting(false);
      setDenied(true);
    }
  };

  const handleSkip = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-surface-soft text-ink flex flex-col">
      <div className="flex-1" />

      <main className="px-td-md max-w-md mx-auto w-full">
        {/* Icon */}
        <div className="flex justify-center mb-td-lg">
          <div className="w-24 h-24 rounded-full bg-accent-soft flex items-center justify-center">
            <span className="material-symbols-outlined text-accent text-5xl">notifications_active</span>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-td-title text-ink text-center mb-td-xs">
          알림을 받으시겠어요?
        </h1>
        <p className="text-td-body text-ink-soft text-center mb-td-lg">
          여행 중 중요한 변경 사항이나 일정 리마인더를 바로 알려드릴게요.
        </p>

        {/* Benefits */}
        <div className="space-y-td-sm mb-td-lg">
          <div className="flex items-start gap-td-sm">
            <div className="w-8 h-8 rounded-full bg-accent-soft flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-accent text-lg">schedule</span>
            </div>
            <div>
              <p className="text-td-body font-medium text-ink">일정 리마인더</p>
              <p className="text-td-caption text-ink-soft">출발 30분 전 알림으로 놓치지 않기</p>
            </div>
          </div>
          <div className="flex items-start gap-td-sm">
            <div className="w-8 h-8 rounded-full bg-accent-soft flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-accent text-lg">sync_alt</span>
            </div>
            <div>
              <p className="text-td-body font-medium text-ink">Live Replan 알림</p>
              <p className="text-td-caption text-ink-soft">일행이 일정을 변경했을 때 즉시 알림</p>
            </div>
          </div>
          <div className="flex items-start gap-td-sm">
            <div className="w-8 h-8 rounded-full bg-accent-soft flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-accent text-lg">flight_takeoff</span>
            </div>
            <div>
              <p className="text-td-body font-medium text-ink">D-Day 카운트다운</p>
              <p className="text-td-caption text-ink-soft">출발 전 체크리스트 리마인더</p>
            </div>
          </div>
        </div>

        {/* Denied Fallback Guide — 사용자가 한 번 거부한 후 보임 (camera 답습) */}
        {denied && (
          <div
            role="alert"
            aria-live="polite"
            className="mb-td-md p-td-sm bg-amber-soft border border-amber/30 rounded-md"
          >
            <p className="text-td-body font-bold text-amber-deep mb-td-xs">
              알림이 차단됐어요
            </p>
            <p className="text-td-caption text-amber-deep/90 mb-td-xs">
              OS 설정에서 다시 허용하거나 나중에 활성화할 수 있어요.
            </p>
            <ul className="text-td-caption text-amber-deep/80 space-y-1 list-disc pl-td-md">
              <li>
                <span className="font-semibold">iOS Safari</span>: 설정 앱 → 알림 → Safari → 허용
              </li>
              <li>
                <span className="font-semibold">Android Chrome</span>: 주소창 자물쇠 → 사이트 설정 → 알림 → 허용
              </li>
            </ul>
          </div>
        )}

        {/* Buttons */}
        <div className="space-y-td-xs">
          <button
            type="button"
            onClick={handleAllow}
            disabled={requesting}
            className="w-full py-td-sm rounded-md bg-accent text-white text-td-body font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {requesting ? "요청 중..." : "알림 허용하기"}
          </button>
          <button
            type="button"
            onClick={handleSkip}
            className="w-full py-td-sm rounded-md border border-divider text-td-body font-semibold text-ink hover:bg-surface-soft transition-colors"
          >
            나중에 할게요
          </button>
        </div>
      </main>

      <div className="flex-1" />
    </div>
  );
}
