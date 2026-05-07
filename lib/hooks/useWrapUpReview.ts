"use client";

import { useCallback, useEffect, useState } from "react";
import type { TripReview } from "@/lib/types";

/**
 * Wrap-up 후기 hook — E2 업그레이드.
 *
 * DB initialReview가 있으면 그것을 초기값으로 사용.
 * 없으면 LocalStorage fallback (오프라인/데모 모드).
 * 편집 중에는 LocalStorage에 실시간 임시 저장.
 *
 * 키: `td-wrap-review-${tripId}` → { rating, text }
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
    // QuotaExceeded — silent skip
  }
}

export function useWrapUpReview(
  tripId: string,
  initialReview?: TripReview | null,
) {
  const [review, setReview] = useState<WrapUpReview>(() => {
    if (initialReview && (initialReview.rating > 0 || initialReview.text.length > 0)) {
      return { rating: initialReview.rating, text: initialReview.text };
    }
    return EMPTY;
  });

  useEffect(() => {
    // DB 초기값이 있으면 그것을 우선. 없으면 LocalStorage fallback.
    if (initialReview && (initialReview.rating > 0 || initialReview.text.length > 0)) {
      setReview({ rating: initialReview.rating, text: initialReview.text });
    } else {
      setReview(readWrapUpReviewFromStorage(tripId));
    }
  }, [tripId, initialReview]);

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
