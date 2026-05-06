/**
 * 카메라 권한 요청 페이지 — 사이클 4 (G9, 2026-05-06).
 *
 * /translate(M4 카메라 번역) 진입 전 권한 안내 + 거부 시 fallback 경로 명시.
 * /permission/location, /permission/notification 답습 (Stitch 시안 시뮬 일관성).
 *
 * 갭 해소: 기존 /translate는 <input type="file" accept="image/*">로 OS에 위임.
 *         권한 거부 시 OS 메시지만 표시 → 앱이 감지 불가, 사용자는 "왜 안 되지?" 모름.
 *         이 페이지는 ① 사전 안내 ② 거부 시 갤러리 fallback CTA ③ 데모 시연 fallback CTA를 제공.
 */

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CameraPermissionPage() {
  const router = useRouter();
  const [requesting, setRequesting] = useState(false);
  const [denied, setDenied] = useState(false);

  const handleAllow = async () => {
    setRequesting(true);
    try {
      // getUserMedia 시도 — granted 시 즉시 stream 정지 (실제 카메라는 /translate에서)
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((track) => track.stop());
      router.back();
    } catch {
      // NotAllowedError / NotFoundError / SecurityError 등 모두 거부로 처리
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
            <span className="material-symbols-outlined text-accent text-5xl">
              photo_camera
            </span>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-td-title text-ink text-center mb-td-xs">
          카메라 접근이 필요해요
        </h1>
        <p className="text-td-body text-ink-soft text-center mb-td-lg">
          베트남어 메뉴를 촬영하면 AI가 즉시 번역해 드릴게요.
          사진은 서버에 저장되지 않아요.
        </p>

        {/* Benefits */}
        <div className="space-y-td-sm mb-td-lg">
          <div className="flex items-start gap-td-sm">
            <div className="w-8 h-8 rounded-full bg-accent-soft flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-accent text-lg">
                document_scanner
              </span>
            </div>
            <div>
              <p className="text-td-body font-medium text-ink">실시간 OCR</p>
              <p className="text-td-caption text-ink-soft">
                Google Vision으로 메뉴 텍스트 추출
              </p>
            </div>
          </div>
          <div className="flex items-start gap-td-sm">
            <div className="w-8 h-8 rounded-full bg-accent-soft flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-accent text-lg">
                translate
              </span>
            </div>
            <div>
              <p className="text-td-body font-medium text-ink">한국어 번역</p>
              <p className="text-td-caption text-ink-soft">
                Claude AI가 음식명·재료·주의사항 안내
              </p>
            </div>
          </div>
          <div className="flex items-start gap-td-sm">
            <div className="w-8 h-8 rounded-full bg-accent-soft flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-accent text-lg">
                shield
              </span>
            </div>
            <div>
              <p className="text-td-body font-medium text-ink">알레르기 검사</p>
              <p className="text-td-caption text-ink-soft">
                설정한 알레르기 항목 자동 표시
              </p>
            </div>
          </div>
        </div>

        {/* Denied Fallback Guide — 사용자가 한 번 거부한 후 보임 */}
        {denied && (
          <div
            role="alert"
            aria-live="polite"
            className="mb-td-md p-td-sm bg-amber-soft border border-amber/30 rounded-md"
          >
            <p className="text-td-body font-bold text-amber-deep mb-td-xs">
              카메라가 차단됐어요
            </p>
            <p className="text-td-caption text-amber-deep/90 mb-td-xs">
              OS 설정에서 다시 허용하거나 갤러리 사진으로 시작할 수 있어요.
            </p>
            <ul className="text-td-caption text-amber-deep/80 space-y-1 list-disc pl-td-md">
              <li>
                <span className="font-semibold">iOS Safari</span>: 설정 앱 → Safari → 카메라 → 허용
              </li>
              <li>
                <span className="font-semibold">Android Chrome</span>: 주소창 자물쇠 → 사이트 설정 → 카메라 → 허용
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
            {requesting ? "요청 중..." : "카메라 허용하기"}
          </button>
          <Link
            href="/translate"
            className="w-full block text-center py-td-sm rounded-md border border-divider text-td-body font-semibold text-ink hover:bg-surface-soft transition-colors"
          >
            갤러리에서 사진 선택
          </Link>
          <button
            type="button"
            onClick={handleSkip}
            className="w-full py-td-sm rounded-md text-td-body font-medium text-ink-soft hover:text-ink transition-colors"
          >
            나중에 할게요
          </button>
        </div>

        {/* Privacy Footer (ADR-019) */}
        <p className="text-td-caption text-ink-mute text-center mt-td-md">
          OCR 결과 7일 · 번역 결과 30일 캐시 후 자동 삭제 (ADR-019)
        </p>
      </main>

      <div className="flex-1" />
    </div>
  );
}
