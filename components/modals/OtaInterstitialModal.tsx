/**
 * OTA 제휴 이동 인터스티셜 모달 (Phase 7 신규).
 *
 * Stitch 시안: #35 OTA Affiliate Interstitial (904155d409d0425680539808c160df06)
 * 용도: 사용자가 OTA 예약 링크 클릭 시 외부 이동 안내 + 제휴 고지.
 * 디자인: 바텀시트 스타일 모달 — provider 로고 + 상품명 + 할인/혜택 + CTA.
 */

"use client";

import { useCallback } from "react";

interface OtaInterstitialModalProps {
  open: boolean;
  onClose: () => void;
  provider: string;
  productName: string;
  price: string;
  discountLabel?: string;
  affiliateUrl: string;
}

export default function OtaInterstitialModal({
  open,
  onClose,
  provider,
  productName,
  price,
  discountLabel,
  affiliateUrl,
}: OtaInterstitialModalProps) {
  const handleProceed = useCallback(() => {
    window.open(affiliateUrl, "_blank", "noopener,noreferrer");
    onClose();
  }, [affiliateUrl, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ota-interstitial-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom Sheet */}
      <div className="relative w-full max-w-md bg-surface-card rounded-t-2xl p-td-lg pb-8 animate-slide-up">
        {/* Drag Handle */}
        <div className="w-10 h-1 bg-divider rounded-full mx-auto mb-td-md" />

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

        {/* CTAs */}
        <div className="space-y-td-xs">
          <button
            onClick={handleProceed}
            className="w-full py-td-sm rounded-md bg-purple text-white text-td-body font-bold transition-opacity hover:opacity-90 flex items-center justify-center gap-td-xxs"
          >
            {provider}에서 예약하기
            <span className="material-symbols-outlined text-lg">open_in_new</span>
          </button>
          <button
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
