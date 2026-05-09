/**
 * 위치 권한 요청 페이지 (Phase 7 신규).
 *
 * Stitch 시안: #29 Location Permission Request (be02d344ea0d41e1a62295980785b548)
 * 용도: Geolocation API 호출 전 사용자에게 이유를 설명하는 프리-프롬프트 카드.
 * M2 D-Day 모드 전환 시 진입 (위치 권한 미부여 상태).
 *
 * 거부 시 fallback 안내 (camera·notification 답습) — OS 설정 진입 가이드 명시.
 * Geolocation 에러 코드(PERMISSION_DENIED=1)로 정밀 분기 — 타임아웃/위치불가는 retry, 차단만 안내.
 */

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LocationPermissionPage() {
  const router = useRouter();
  const [requesting, setRequesting] = useState(false);
  const [denied, setDenied] = useState(false);

  const handleAllow = async () => {
    setRequesting(true);
    setDenied(false);

    const onSuccess = () => router.back();
    const onError = (err: GeolocationPositionError) => {
      if (err.code === err.PERMISSION_DENIED) {
        setRequesting(false);
        setDenied(true);
      } else {
        // POSITION_UNAVAILABLE / TIMEOUT — 일시 오류, 재시도 가능
        setRequesting(false);
      }
    };

    try {
      const result = await navigator.permissions.query({ name: "geolocation" });
      if (result.state === "granted") {
        router.back();
        return;
      }
      if (result.state === "denied") {
        setRequesting(false);
        setDenied(true);
        return;
      }
      // "prompt" — 브라우저 네이티브 프롬프트 트리거
      navigator.geolocation.getCurrentPosition(onSuccess, onError, { timeout: 10000 });
    } catch {
      // permissions API 미지원 (iOS Safari < 16 등) — 직접 요청
      navigator.geolocation.getCurrentPosition(onSuccess, onError, { timeout: 10000 });
    }
  };

  const handleSkip = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-surface-soft text-ink flex flex-col">
      {/* Spacer for vertical centering */}
      <div className="flex-1" />

      <main className="px-td-md max-w-md mx-auto w-full">
        {/* Icon */}
        <div className="flex justify-center mb-td-lg">
          <div className="w-24 h-24 rounded-full bg-purple-soft flex items-center justify-center">
            <span className="material-symbols-outlined text-purple text-5xl">location_on</span>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-td-title text-ink text-center mb-td-xs">
          위치 정보가 필요해요
        </h1>
        <p className="text-td-body text-ink-soft text-center mb-td-lg">
          여행지에 도착하면 자동으로 여행 모드로 전환해 드릴게요.
          위치는 서버에 저장되지 않아요.
        </p>

        {/* Benefits */}
        <div className="space-y-td-sm mb-td-lg">
          <div className="flex items-start gap-td-sm">
            <div className="w-8 h-8 rounded-full bg-success-soft flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-success text-lg">check</span>
            </div>
            <div>
              <p className="text-td-body font-medium text-ink">D-Day 자동 모드 전환</p>
              <p className="text-td-caption text-ink-soft">여행지 경계 진입 시 여행 모드 활성화</p>
            </div>
          </div>
          <div className="flex items-start gap-td-sm">
            <div className="w-8 h-8 rounded-full bg-success-soft flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-success text-lg">check</span>
            </div>
            <div>
              <p className="text-td-body font-medium text-ink">실시간 주변 정보</p>
              <p className="text-td-caption text-ink-soft">가까운 맛집·관광지 추천</p>
            </div>
          </div>
          <div className="flex items-start gap-td-sm">
            <div className="w-8 h-8 rounded-full bg-success-soft flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-success text-lg">check</span>
            </div>
            <div>
              <p className="text-td-body font-medium text-ink">프라이버시 보호</p>
              <p className="text-td-caption text-ink-soft">좌표는 기기에서만 사용, 서버 전송 없음 (ADR-017)</p>
            </div>
          </div>
        </div>

        {/* Denied Fallback Guide — 사용자가 한 번 거부한 후 보임 (camera·notification 답습) */}
        {denied && (
          <div
            role="alert"
            aria-live="polite"
            className="mb-td-md p-td-sm bg-amber-soft border border-amber/30 rounded-md"
          >
            <p className="text-td-body font-bold text-amber-deep mb-td-xs">
              위치 정보가 차단됐어요
            </p>
            <p className="text-td-caption text-amber-deep/90 mb-td-xs">
              OS 설정에서 다시 허용하거나 나중에 활성화할 수 있어요.
            </p>
            <ul className="text-td-caption text-amber-deep/80 space-y-1 list-disc pl-td-md">
              <li>
                <span className="font-semibold">iOS Safari</span>: 설정 앱 → Safari → 위치 → 허용
              </li>
              <li>
                <span className="font-semibold">Android Chrome</span>: 주소창 자물쇠 → 사이트 설정 → 위치 → 허용
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
            className="w-full py-td-sm rounded-md bg-purple text-white text-td-body font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {requesting ? "요청 중..." : "위치 허용하기"}
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

      {/* Spacer */}
      <div className="flex-1" />
    </div>
  );
}
