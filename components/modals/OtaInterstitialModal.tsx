/**
 * OTA 제휴 이동 인터스티셜 모달 (Phase 7 신규).
 *
 * Stitch 시안: #35 OTA Affiliate Interstitial (904155d409d0425680539808c160df06)
 * 용도: 사용자가 OTA 예약 링크 클릭 시 외부 이동 안내 + 제휴 고지.
 * 디자인: 바텀시트 스타일 모달 — provider 로고 + 상품명 + 할인/혜택 + CTA.
 */

"use client";

import { useCallback, useEffect, useState, useRef } from "react";

interface OtaInterstitialModalProps {
  open: boolean;
  onClose: () => void;
  provider: string;
  productName: string;
  price: string;
  discountLabel?: string;
  affiliateUrl: string;
  /**
   * 사용자가 "예약하기" 클릭 시 호출. 부재 시 기본 동작(window.open + onClose)으로 fallback —
   * 기존 사용처 BC 유지. 부모에서 outgoing 마킹 등 부가 처리가 필요하면 prop으로 주입.
   */
  onProceed?: () => void;
}

export default function OtaInterstitialModal({
  open,
  onClose,
  provider,
  productName,
  price,
  discountLabel,
  affiliateUrl,
  onProceed,
}: OtaInterstitialModalProps) {
  const handleProceed = useCallback(() => {
    if (onProceed) {
      onProceed();
    } else {
      window.open(affiliateUrl, "_blank", "noopener,noreferrer");
    }
    onClose();
  }, [affiliateUrl, onClose, onProceed]);

  // 드래그 dismiss
  const [dragY, setDragY] = useState(0);
  const dragStartY = useRef(0);
  const isDragging = useRef(false);

  useEffect(() => {
    if (!open) return;
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

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    isDragging.current = true;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const delta = e.touches[0].clientY - dragStartY.current;
    if (delta > 0) setDragY(delta);
  }, []);

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
    if (dragY > 120) {
      onClose();
    }
    setDragY(0);
  }, [dragY, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ota-interstitial-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-md"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom Sheet */}
      <div
        className="relative w-full max-w-md bg-surface-card rounded-t-[24px] p-td-lg pb-8 max-h-[calc(100dvh-2rem)] flex flex-col transition-transform"
        style={{ transform: dragY > 0 ? `translateY(${dragY}px)` : undefined }}
      >
        {/* Drag Handle */}
        <div
          className="flex justify-center mb-td-md cursor-grab active:cursor-grabbing touch-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-10 h-1 bg-divider rounded-full" />
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Provider Badge */}
          <div className="flex items-center gap-td-xs mb-td-sm">
            <span className="bg-purple text-white text-td-caption font-bold px-2 py-0.5 rounded-md">
              {provider}
            </span>
            <span className="text-td-caption text-ink-mute">제휴 파트너</span>
          </div>

          {/* Product Info */}
          <h2
            id="ota-interstitial-title"
            className="text-td-card-title font-bold text-ink mb-td-xxs"
          >
            {productName}
          </h2>

          {/* Price Row */}
          <div className="flex items-baseline gap-td-xs mb-td-md">
            <span className="text-td-title font-bold text-ink">{price}</span>
            {discountLabel && (
              <span className="text-td-caption font-bold text-danger bg-danger-soft px-1.5 py-0.5 rounded-md">
                {discountLabel}
              </span>
            )}
          </div>

          {/* Benefits */}
          <div className="bg-surface-soft rounded-md p-td-sm mb-td-md space-y-td-xxs">
            <div className="flex items-center gap-td-xs">
              <span className="material-symbols-outlined text-success text-lg">check_circle</span>
              <span className="text-td-body text-ink">무료 취소 가능</span>
            </div>
            <div className="flex items-center gap-td-xs">
              <span className="material-symbols-outlined text-success text-lg">check_circle</span>
              <span className="text-td-body text-ink">모바일 바우처 즉시 발급</span>
            </div>
            <div className="flex items-center gap-td-xs">
              <span className="material-symbols-outlined text-success text-lg">check_circle</span>
              <span className="text-td-body text-ink">한국어 고객 지원</span>
            </div>
          </div>

          {/* Affiliate Disclosure */}
          <p className="text-td-caption text-ink-mute mb-td-md text-center">
            이 링크를 통해 예약하면 TravelDiary에 소정의 수수료가 지급됩니다.
            <br />
            사용자에게 추가 비용은 없습니다.
          </p>
        </div>

        {/* CTAs — 항상 보임 */}
        <div className="shrink-0 space-y-td-xs pt-td-sm">
          <button
            type="button"
            onClick={handleProceed}
            className="w-full py-td-sm rounded-md bg-purple text-white text-td-body font-bold transition-opacity hover:opacity-90 flex items-center justify-center gap-td-xxs"
          >
            {provider}에서 예약하기
            <span className="material-symbols-outlined text-lg">open_in_new</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-td-sm rounded-md border border-divider text-td-body font-semibold text-ink hover:bg-surface-soft transition-colors"
          >
            돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}
