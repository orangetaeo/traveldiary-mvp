"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Wrap-up 후기 LocalStorage hook — useItemCheckins 답습.
 *
 * /wrap-up/[tripId] 별점(0~5) + 텍스트 후기 임시 저장. 정식 출시 시 TripReview 모델
 * + 마이그 + R1 사인오프 + writeAuditLog 후 DB 영속화.
 *
 * 키: `td-wrap-review-${tripId}` → { rating, text }
 *
 * 다중 trip 격리 + LocalStorage 비활성(SSR)에 안전. QuotaExceeded silent skip.
 */

const STORAGE_KEY_PREFIX = "td-wrap-review-";

export interface WrapUpReview {
  rating: number;
  text: string;
}

const EMPTY: WrapUpReview = { rating: 0, text: "" };

export function getWrapUpReviewStorageKey(tripId: string): string {
  return `${STORAGE_KEY_PREFIX}${tripId}`;
}

export function readWrapUpReviewFromStorage(tripId: string): WrapUpReview {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(getWrapUpReviewStorageKey(tripId));
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return EMPTY;
    const rating =
      typeof parsed.rating === "number" &&
      Number.isFinite(parsed.rating) &&
      parsed.rating >= 0 &&
      parsed.rating <= 5
        ? Math.floor(parsed.rating)
        : 0;
    const text = typeof parsed.text === "string" ? parsed.text.slice(0, 2000) : "";
    return { rating, text };
  } catch {
    return EMPTY;
  }
}

export function writeWrapUpReviewToStorage(
  tripId: string,
  review: WrapUpReview,
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      getWrapUpReviewStorageKey(tripId),
      JSON.stringify(review),
    );
  } catch {
    // QuotaExceeded — silent skip (input_guard 답습)
  }
}

export function useWrapUpReview(tripId: string) {
  const [review, setReview] = useState<WrapUpReview>(EMPTY);

  useEffect(() => {
    setReview(readWrapUpReviewFromStorage(tripId));
  }, [tripId]);

  const setRating = useCallback(
    (rating: number) => {
      const safe =
        Number.isFinite(rating) && rating >= 0 && rating <= 5
          ? Math.floor(rating)
          : 0;
      setReview((prev) => {
        const next = { ...prev, rating: safe };
        writeWrapUpReviewToStorage(tripId, next);
        return next;
      });
    },
    [tripId],
  );

  const setText = useCallback(
    (text: string) => {
      const safe = typeof text === "string" ? text.slice(0, 2000) : "";
      setReview((prev) => {
        const next = { ...prev, text: safe };
        writeWrapUpReviewToStorage(tripId, next);
        return next;
      });
    },
    [tripId],
  );

  const clear = useCallback(() => {
    setReview(EMPTY);
    writeWrapUpReviewToStorage(tripId, EMPTY);
  }, [tripId]);

  return { review, setRating, setText, clear };
}
