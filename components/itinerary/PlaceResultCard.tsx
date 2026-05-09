"use client";

/**
 * PlaceResultCard — AI 추천 장소 결과 카드.
 *
 * PlaceDiscoveryView에서 분리. 사진 + 뱃지 + 한국 후기 + AI 이유 + 일정 추가 버튼.
 */

import Link from "next/link";
import type { DiscoverPlace, PlaceCategory } from "@/lib/types";

interface Props {
  place: DiscoverPlace;
  tripId: string;
  isFavorite: boolean;
  isAdding: boolean;
  onToggleFavorite: (id: string) => void;
  onAdd: (p: DiscoverPlace) => void;
}

export function categoryLabel(category: PlaceCategory): string {
  return (
    {
      food: "음식",
      spot: "관광",
      shopping: "쇼핑",
      nature: "액티비티",
      cafe: "카페",
      activity: "액티비티",
      nightlife: "야간",
    } as Record<PlaceCategory, string>
  )[category];
}

export function priceLabel(level: number | undefined): string {
  if (!level) return "";
  return "₩".repeat(Math.min(3, Math.max(1, level)));
}

export function PlaceResultCard({
  place,
  tripId,
  isFavorite,
  isAdding,
  onToggleFavorite,
  onAdd,
}: Props) {
  const showAi = place.badge === "ai" || !!place.aiReason;
  const showPopular = !showAi && place.badge === "popular";
  const meta = [categoryLabel(place.category), priceLabel(place.priceLevel), place.distance]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="bg-surface-card border border-divider rounded-md overflow-hidden flex flex-col shadow-sm">
      {/* 사진 영역 */}
      <div className="relative aspect-square bg-surface-soft">
        {place.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={place.imageUrl}
            alt={place.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              const parent = e.currentTarget.parentElement;
              if (parent) {
                const icon = place.category === "food" ? "restaurant"
                  : place.category === "cafe" ? "local_cafe"
                  : "photo_camera";
                parent.innerHTML = `<div class="w-full h-full flex items-center justify-center"><span class="material-symbols-outlined text-3xl text-ink-mute" aria-hidden="true">${icon}</span></div>`;
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span
              className="material-symbols-outlined text-3xl text-ink-mute"
              aria-hidden
            >
              {place.category === "food"
                ? "restaurant"
                : place.category === "cafe"
                  ? "local_cafe"
                  : "photo_camera"}
            </span>
          </div>
        )}
        {/* 카테고리 뱃지 (좌상단) */}
        {showAi ? (
          <span
            className="absolute top-2 left-2 bg-purple/90 text-white text-td-badge px-2 py-0.5 rounded-full font-bold"
            aria-label="AI 추천"
          >
            AI ❤
          </span>
        ) : showPopular ? (
          <span
            className="absolute top-2 left-2 bg-amber/90 text-white text-td-badge px-2 py-0.5 rounded-full font-bold"
            aria-label="한국인 인기"
          >
            🇰🇷 인기
          </span>
        ) : (
          <span className="absolute top-2 left-2 bg-surface-card/80 backdrop-blur-sm text-ink text-td-badge px-2 py-0.5 rounded-full font-bold">
            {categoryLabel(place.category)}
          </span>
        )}
        {place.koreanFoodFriendly && !showAi && !showPopular && (
          <span
            className="absolute top-2 left-2 bg-danger text-white text-td-badge px-2 py-0.5 rounded-full font-bold"
            aria-label="한식 메뉴 가능"
          >
            한식 OK
          </span>
        )}
        {/* 하트(찜) 아이콘 (우상단) */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(place.id); }}
          aria-label={isFavorite ? "찜 해제" : "찜하기"}
          className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-white/70 backdrop-blur-sm transition-colors hover:bg-white"
        >
          <span className={`material-symbols-outlined text-[20px] ${isFavorite ? "text-danger" : "text-ink-mute"}`} aria-hidden>
            {isFavorite ? "favorite" : "favorite_border"}
          </span>
        </button>
      </div>

      {/* 본문 */}
      <div className="p-td-sm flex flex-col flex-1">
        <Link
          href={`/itinerary/${tripId}/item/${place.id}`}
          className="text-td-body text-ink font-bold mb-1 line-clamp-1 hover:text-purple-deep transition-colors"
        >
          {place.name}
        </Link>
        <p className="text-td-meta text-ink-soft mb-1 line-clamp-1">{meta}</p>
        <p className="text-td-caption mb-2">
          <span className="text-amber-deep font-bold">⭐ {place.rating.toFixed(1)}</span>
          <span className="text-ink-mute"> ({place.reviewCount})</span>
          {(place.koreanReviewCount ?? 0) > 0 && (
            <span className="text-ink-mute"> · 🇰🇷 {place.koreanReviewCount}</span>
          )}
        </p>
        {place.koreanReviewQuote && (
          <p className="text-td-caption italic text-ink-soft mb-2 line-clamp-2">
            &quot;{place.koreanReviewQuote.text}&quot; — {place.koreanReviewQuote.author}
          </p>
        )}
        {place.aiReason && (
          <span className="self-start bg-purple-soft/60 text-purple-deep text-td-badge font-bold px-2 py-0.5 rounded border border-purple/15 mb-td-sm">
            {place.aiReason}
          </span>
        )}
        <button
          type="button"
          onClick={() => onAdd(place)}
          disabled={isAdding}
          className="mt-auto w-full py-1.5 text-td-meta font-bold text-purple-deep border border-purple/30 rounded-md hover:bg-purple-soft transition-colors disabled:opacity-50 disabled:cursor-wait"
        >
          {isAdding ? "추가 중…" : "+ 일정에 추가"}
        </button>
      </div>
    </article>
  );
}
