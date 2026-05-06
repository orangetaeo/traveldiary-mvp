"use client";

/**
 * OTA Compare Section — 사이클 12a M8 (ADR-025).
 *
 * Item Detail 페이지에 인라인. 매칭 OtaOffer 있을 때만 노출.
 * 클릭 → trackAffiliateClick Server Action → window.open redirect.
 */

import { useTransition } from "react";
import type { OtaOffer } from "@/lib/types";
import { trackAffiliateClick } from "@/actions/affiliate";
import { OTA_LABEL, OTA_TONE } from "@/lib/constants/ota-constants";

interface OtaCompareSectionProps {
  itemId: string;
  offers: OtaOffer[];
}

export function OtaCompareSection({ itemId, offers }: OtaCompareSectionProps) {
  const [isPending, startTransition] = useTransition();

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
      window.open(result.redirectUrl, "_blank", "noopener");
    });
  }

  return (
    <section className="px-td-md py-td-sm">
      <div className="flex items-center justify-between mb-td-sm">
        <h3 className="text-td-card-title text-ink">예약 가격 비교 (M8)</h3>
        <span className="text-td-caption text-ink-mute">
          어필리에이트 링크
        </span>
      </div>
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
                  <span className="material-symbols-outlined text-ink-mute text-[18px]" aria-hidden>
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
    </section>
  );
}
