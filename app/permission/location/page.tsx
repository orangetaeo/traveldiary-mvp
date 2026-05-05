/**
 * 위치 권한 요청 페이지 (Phase 7 신규).
 *
 * Stitch 시안: #29 Location Permission Request (be02d344ea0d41e1a62295980785b548)
 * 용도: Geolocation API 호출 전 사용자에게 이유를 설명하는 프리-프롬프트 카드.
 * M2 D-Day 모드 전환 시 진입 (위치 권한 미부여 상태).
 */

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LocationPermissionPage() {
  const router = useRouter();
  const [requesting, setRequesting] = useState(false);

  const handleAllow = async () => {
    setRequesting(true);
    try {
      const result = await navigator.permissions.query({ name: "geolocation" });
      if (result.state === "granted") {
        router.back();
        return;
      }
      // 브라우저 네이티브 프롬프트 트리거
      navigator.geolocation.getCurrentPosition(
        () => router.back(),
        () => setRequesting(false),
        { timeout: 10000 },
      );
    } catch {
      // permissions API 미지원 시 직접 요청
      navigator.geolocation.getCurrentPosition(
        () => router.back(),
        () => setRequesting(false),
        { timeout: 10000 },
      );
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

        {/* Buttons */}
        <div className="space-y-td-xs">
          <button
            onClick={handleAllow}
            disabled={requesting}
            className="w-full py-td-sm rounded-md bg-purple text-white text-td-body font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {requesting ? "요청 중..." : "위치 허용하기"}
          </button>
          <button
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
