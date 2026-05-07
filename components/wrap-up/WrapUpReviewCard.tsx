"use client";

import { useState } from "react";
import { useWrapUpReview } from "@/lib/hooks/useWrapUpReview";

interface WrapUpReviewCardProps {
  tripId: string;
}

/**
 * 여행 후기 카드 — 별점(0~5 클릭) + 텍스트 후기(2000자 cap) + 건너뛰기/저장 버튼.
 *
 * useWrapUpReview hook으로 LocalStorage 임시 저장. 정식 출시 시 TripReview DB
 * 영속화 + writeAuditLog. 본 사이클은 placeholder 정체성 amber 노트로 명시.
 */
export function WrapUpReviewCard({ tripId }: WrapUpReviewCardProps) {
  const { review, setRating, setText, clear } = useWrapUpReview(tripId);
  const [hover, setHover] = useState(0);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const display = hover > 0 ? hover : review.rating;
  const charCount = review.text.length;

  const handleSave = () => {
    setSavedAt(Date.now());
    window.setTimeout(() => setSavedAt(null), 2500);
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
            {savedAt ? "✓ 임시 저장됨" : "자동 임시 저장"}
          </span>
          <span>{charCount} / 2000</span>
        </div>

        <div className="flex gap-td-xs">
          <button
            type="button"
            onClick={clear}
            disabled={review.rating === 0 && review.text.length === 0}
            className="flex-1 py-td-xs rounded-md border border-divider text-td-body font-semibold text-ink transition-colors hover:bg-surface-soft disabled:opacity-40 disabled:cursor-not-allowed"
          >
            초기화
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={review.rating === 0 && review.text.length === 0}
            className="flex-1 py-td-xs rounded-md bg-purple text-white text-td-body font-semibold transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            저장 확인
          </button>
        </div>

        {/* placeholder 정체성 — 정식 DB 영속화 전이라는 사실 명시 */}
        <p
          role="note"
          className="mt-td-sm text-td-caption text-amber-deep bg-amber-soft border border-amber/30 rounded-md px-td-sm py-td-xxs"
        >
          이 후기는 임시로 이 기기에만 저장됩니다. 정식 출시 시 계정에 안전하게 보관됩니다.
        </p>
      </div>
    </section>
  );
}
