"use client";

import { useState, useTransition } from "react";
import { useWrapUpReview } from "@/lib/hooks/useWrapUpReview";
import { saveReview } from "@/actions/review";
import type { TripReview } from "@/lib/types";

interface WrapUpReviewCardProps {
  tripId: string;
  /** DB에서 로드한 기존 후기 — 없으면 LocalStorage fallback */
  initialReview?: TripReview | null;
}

/**
 * 여행 후기 카드 — 별점(0~5 클릭) + 텍스트 후기(2000자 cap) + 초기화/저장 버튼.
 *
 * E2 업그레이드: DB 영속화 + LocalStorage 오프라인 fallback.
 * saveReview 서버 액션으로 TripReview upsert + writeAuditLog.
 */
export function WrapUpReviewCard({ tripId, initialReview }: WrapUpReviewCardProps) {
  const { review, setRating, setText, clear } = useWrapUpReview(tripId, initialReview);
  const [hover, setHover] = useState(0);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [saveError, setSaveError] = useState(false);
  const [isPending, startTransition] = useTransition();

  const display = hover > 0 ? hover : review.rating;
  const charCount = review.text.length;
  const isEmpty = review.rating === 0 && review.text.length === 0;

  const handleSave = () => {
    setSaveError(false);
    startTransition(async () => {
      const result = await saveReview({
        tripId,
        rating: review.rating,
        text: review.text,
      });
      if (result.ok) {
        setSavedAt(Date.now());
        window.setTimeout(() => setSavedAt(null), 2500);
      } else {
        setSaveError(true);
        window.setTimeout(() => setSaveError(false), 3000);
      }
    });
  };

  return (
    <section className="px-td-md py-td-md">
      <div className="bg-surface-soft rounded-md p-td-md border border-divider shadow-sm">
        <h2 className="text-td-card-title text-ink mb-td-sm">여행 후기 남기기</h2>

        {/* 별점 — 0~5 클릭 + hover 미리보기 */}
        <div
          className="flex gap-0.5 mb-td-sm"
          role="radiogroup"
          aria-label="여행 별점"
          onMouseLeave={() => setHover(0)}
        >
          {[1, 2, 3, 4, 5].map((star) => {
            const filled = star <= display;
            return (
              <button
                key={star}
                type="button"
                role="radio"
                aria-checked={review.rating === star}
                aria-label={`${star}점`}
                onClick={() => setRating(review.rating === star ? 0 : star)}
                onMouseEnter={() => setHover(star)}
                onFocus={() => setHover(star)}
                onBlur={() => setHover(0)}
                className="p-0.5 rounded transition-transform active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple"
              >
                <span
                  className={`material-symbols-outlined ${filled ? "text-amber" : "text-ink-mute"}`}
                  style={{ fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0" }}
                  aria-hidden
                >
                  star
                </span>
              </button>
            );
          })}
        </div>

        <textarea
          value={review.text}
          onChange={(e) => setText(e.target.value)}
          maxLength={2000}
          className="w-full bg-surface-card border border-divider rounded-md p-td-sm text-td-body focus:ring-purple focus:border-purple mb-td-xxs h-24 placeholder:text-ink-mute resize-none"
          placeholder="여행의 소중한 순간을 기록하세요."
          aria-label="여행 후기"
        />
        <div className="flex justify-between text-td-caption text-ink-soft mb-td-sm">
          <span aria-live="polite">
            {saveError
              ? "저장 실패 — 다시 시도해주세요"
              : savedAt
                ? "✓ 저장 완료"
                : "자동 임시 저장"}
          </span>
          <span>{charCount} / 2000</span>
        </div>

        <div className="flex gap-td-xs">
          <button
            type="button"
            onClick={clear}
            disabled={isEmpty || isPending}
            className="flex-1 py-td-xs rounded-md border border-divider text-td-body font-semibold text-ink transition-colors hover:bg-surface-soft disabled:opacity-40 disabled:cursor-not-allowed"
          >
            초기화
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isEmpty || isPending}
            className="flex-1 py-td-xs rounded-md bg-purple text-white text-td-body font-semibold transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isPending ? "저장 중..." : "저장 확인"}
          </button>
        </div>
      </div>
    </section>
  );
}
