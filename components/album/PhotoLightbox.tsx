"use client";

/**
 * PhotoLightbox — 앨범 사진 확대 보기 모달.
 *
 * 사진 클릭 → 전체화면 라이트박스. 좌우 nav (키보드 + 스와이프),
 * ESC/배경 클릭으로 닫기, body scroll lock.
 */

import { useEffect, useRef, useState } from "react";
import type { TripPhoto } from "@/lib/types";

interface Props {
  photos: TripPhoto[];
  initialIndex: number;
  onClose: () => void;
}

const SWIPE_THRESHOLD_PX = 50;

export function PhotoLightbox({ photos, initialIndex, onClose }: Props) {
  const [index, setIndex] = useState(() =>
    Math.max(0, Math.min(initialIndex, photos.length - 1)),
  );
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        setIndex((i) => Math.max(0, i - 1));
      } else if (e.key === "ArrowRight") {
        setIndex((i) => Math.min(photos.length - 1, i + 1));
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, photos.length]);

  // body scroll lock
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const photo = photos[index];
  if (!photo) return null;

  const hasPrev = index > 0;
  const hasNext = index < photos.length - 1;

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const dx = endX - touchStartX.current;
    if (Math.abs(dx) > SWIPE_THRESHOLD_PX) {
      if (dx < 0 && hasNext) setIndex(index + 1);
      else if (dx > 0 && hasPrev) setIndex(index - 1);
    }
    touchStartX.current = null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="사진 확대 보기"
      className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Counter */}
      <div className="absolute top-4 left-4 z-10 text-white text-td-caption bg-black/60 px-3 py-1 rounded-full pointer-events-none">
        {index + 1} / {photos.length}
      </div>

      {/* Close */}
      <button
        type="button"
        onClick={onClose}
        aria-label="확대 보기 닫기"
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
      >
        <span className="material-symbols-outlined" aria-hidden>
          close
        </span>
      </button>

      {/* Prev */}
      {hasPrev && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIndex(index - 1);
          }}
          aria-label="이전 사진"
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
        >
          <span className="material-symbols-outlined" aria-hidden>
            chevron_left
          </span>
        </button>
      )}

      {/* Next */}
      {hasNext && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIndex(index + 1);
          }}
          aria-label="다음 사진"
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
        >
          <span className="material-symbols-outlined" aria-hidden>
            chevron_right
          </span>
        </button>
      )}

      {/* Image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.url}
        alt={photo.caption ?? "여행 사진"}
        className="max-w-full max-h-[90vh] object-contain select-none"
        draggable={false}
        loading="lazy"
      />

      {/* Caption */}
      {photo.caption && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-td-md pb-td-lg pointer-events-none">
          <p className="text-white text-td-body text-center">{photo.caption}</p>
        </div>
      )}
    </div>
  );
}
