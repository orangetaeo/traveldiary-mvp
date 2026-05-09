"use client";

/**
 * OTA Compare Section — 사이클 12a M8 (ADR-025) + #35 Interstitial wiring (D 카테고리).
 *
 * Item Detail 페이지에 인라인. 매칭 OtaOffer 있을 때만 노출.
 * 클릭 → trackAffiliateClick(audit log) → OtaInterstitialModal 표시
 * → "예약하기" 클릭 시 setOtaOutgoing + window.open. "돌아가기" 시 외부 이동 X.
 */

import { useState, useTransition } from "react";
import type { OtaOffer } from "@/lib/types";
import { trackAffiliateClick } from "@/actions/affiliate";
import { OTA_LABEL, OTA_TONE } from "@/lib/constants/ota-constants";
import { setOtaOutgoing } from "@/lib/ota/outgoing";
import { OtaReentryConfirmBar } from "./OtaReentryConfirmBar";
import { OtaInterstitialModal } from "@/components/modals";

interface OtaCompareSectionProps {
  itemId: string;
  offers: OtaOffer[];
}

interface PendingInterstitial {
  offer: OtaOffer;
  redirectUrl: string;
}

export function OtaCompareSection({ itemId, offers }: OtaCompareSectionProps) {
  const [isPending, startTransition] = useTransition();
  const [interstitial, setInterstitial] = useState<PendingInterstitial | null>(null);

  if (offers.length === 0) return null;

  // 가장 저렴한 가격 강조용
  const minPrice = Math.min(...offers.map((o) => o.priceKrw));

  function handleClick(offer: OtaOffer) {
    startTransition(async () => {
      const result = await trackAffiliateClick({
        offerId: offer.id,
        itemId,
        ota: offer.ota,
        priceKrw: offer.priceKrw,
        baseUrl: offer.url,
      });
      // 클릭 자체는 audit log에 기록됨 (trackAffiliateClick).
      // 외부 이동 + outgoing 마킹은 사용자가 interstitial에서 "예약하기"를 누른 시점에만.
      setInterstitial({ offer, redirectUrl: result.redirectUrl });
    });
  }

  function handleProceed() {
    if (!interstitial) return;
    const { offer, redirectUrl } = interstitial;
    // 사이클 5 (G8) — 외부 이동 직전 outgoing 마킹 (reentry confirm bar 트리거)
    setOtaOutgoing({
      itemId,
      offerId: offer.id,
      ota: offer.ota,
      priceKrw: offer.priceKrw,
    });
    window.open(redirectUrl, "_blank", "noopener,noreferrer");
  }

  function buildInterstitialProps() {
    if (!interstitial) return null;
    const { offer, redirectUrl } = interstitial;
    const discount =
      offer.originalPriceKrw && offer.originalPriceKrw > offer.priceKrw
        ? Math.round((1 - offer.priceKrw / offer.originalPriceKrw) * 100)
        : null;
    return {
      provider: OTA_LABEL[offer.ota],
      productName: offer.title,
      price: `${offer.priceKrw.toLocaleString()}원`,
      discountLabel: discount ? `-${discount}%` : undefined,
      affiliateUrl: redirectUrl,
    };
  }

  const interstitialProps = buildInterstitialProps();

  return (
    <>
    <section className="px-td-md py-td-sm">
      <div className="flex items-center justify-between mb-td-sm">
        <h3 className="text-td-card-title text-ink">예약 가격 비교 (M8)</h3>
        <span className="text-td-caption text-ink-mute">
          어필리에이트 링크
        </span>
      </div>

      {/* 사이클 5 (G8) — 외부 OTA reentry 시 self-report 카드 (sessionStorage 마킹 시에만 노출) */}
      <OtaReentryConfirmBar itemId={itemId} />
      <div className="space-y-td-xs">
        {offers
          .slice()
          .sort((a, b) => a.priceKrw - b.priceKrw)
          .map((offer) => {
            const isCheapest = offer.priceKrw === minPrice;
            const discount =
              offer.originalPriceKrw && offer.originalPriceKrw > offer.priceKrw
                ? Math.round(
                    (1 - offer.priceKrw / offer.originalPriceKrw) * 100,
                  )
                : null;

            return (
              <button
                key={offer.id}
                type="button"
                onClick={() => handleClick(offer)}
                disabled={isPending}
                className={`w-full text-left bg-surface-card border rounded-md p-td-sm transition-colors disabled:opacity-60 ${
                  isCheapest
                    ? "border-purple/60 shadow-md"
                    : "border-divider hover:border-purple/40"
                }`}
              >
                <div className="flex items-start justify-between gap-td-sm mb-td-xxs">
                  <div className="flex items-center gap-td-xs flex-wrap">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-td-caption font-bold ${
                        OTA_TONE[offer.ota]
                      }`}
                    >
                      {OTA_LABEL[offer.ota]}
                    </span>
                    {/* F6 — 개별 제휴 라벨 */}
                    <span className="inline-block px-1.5 py-0.5 rounded text-td-micro text-ink-mute bg-surface-soft">
                      제휴
                    </span>
                    {isCheapest && (
                      <span className="inline-block px-2 py-0.5 rounded-full text-td-caption font-bold bg-success text-white">
                        최저가
                      </span>
                    )}
                    {discount && (
                      <span className="inline-block px-2 py-0.5 rounded-full text-td-caption font-bold bg-danger-soft text-danger-deep">
                        -{discount}%
                      </span>
                    )}
                  </div>
                  <span className="material-symbols-outlined text-ink-mute text-td-icon" aria-hidden>
                    open_in_new
                  </span>
                </div>
                <p className="text-td-body text-ink mb-td-xxs">
                  {offer.title}
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-td-card-title text-ink tabular-nums">
                    {offer.priceKrw.toLocaleString()}원
                    {offer.originalPriceKrw && (
                      <span className="text-td-caption text-ink-mute line-through ml-td-xs">
                        {offer.originalPriceKrw.toLocaleString()}원
                      </span>
                    )}
                  </p>
                  {offer.rating && (
                    <p className="text-td-caption text-ink-soft tabular-nums">
                      ★ {offer.rating}
                      {offer.reviewCount && (
                        <span className="text-ink-mute ml-1">
                          ({offer.reviewCount.toLocaleString()})
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
      </div>

      {/* F6 — 제휴 링크 공시 문구 */}
      <p className="text-td-micro text-ink-mute mt-td-xs leading-relaxed">
        <span className="material-symbols-outlined text-[12px] align-middle mr-0.5" aria-hidden>info</span>
        이 링크를 통해 예약하면 TravelDiary가 소정의 수수료를 받습니다. 사용자 부담 추가 비용은 없습니다.
      </p>
    </section>

    {/* #35 OTA Affiliate Interstitial — 외부 redirect 직전 안내 모달 (Stitch 904155d4...) */}
    {interstitialProps && (
      <OtaInterstitialModal
        open={interstitial !== null}
        onClose={() => setInterstitial(null)}
        provider={interstitialProps.provider}
        productName={interstitialProps.productName}
        price={interstitialProps.price}
        discountLabel={interstitialProps.discountLabel}
        affiliateUrl={interstitialProps.affiliateUrl}
        onProceed={handleProceed}
      />
    )}
    </>
  );
}
