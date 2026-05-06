"use client";

/**
 * PlaceDiscoveryView — 장소 탐색 & 검색 (Stitch 디자인 적용).
 *
 * 카테고리 필터 + 2열 카드 그리드 + 검색 + "일정에 추가" CTA.
 * DB 미구현 단계 — 시드 기반 추천 장소 리스트.
 */

import { useState } from "react";
import Link from "next/link";
import { useToast } from "@/lib/hooks/useToast";
import { Toast } from "@/components/ui/Toast";

// ─── Types ─────────────────────────────────────

export type PlaceCategory = "food" | "spot" | "shopping" | "nature" | "cafe";

export interface DiscoverPlace {
  id: string;
  name: string;
  category: PlaceCategory;
  rating: number;
  reviewCount: number;
  distance: string; // "도보 15분" 등
  badge?: "ai" | "popular";
  /** 외부 이미지 URL (시드) — 없으면 placeholder */
  imageUrl?: string;
}

interface Props {
  tripId: string;
  dayIndex: number;
  destination: string;
  places: DiscoverPlace[];
  verifiedCount: number;
}

// ─── Constants ─────────────────────────────────

type FilterKey = "all" | PlaceCategory;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "food", label: "🍽️ 맛집" },
  { key: "spot", label: "📸 관광" },
  { key: "shopping", label: "🛍️ 쇼핑" },
  { key: "nature", label: "🌿 자연" },
  { key: "cafe", label: "☕ 카페" },
];

const CATEGORY_EMOJI: Record<PlaceCategory, string> = {
  food: "🍽️ 맛집",
  spot: "📸 관광",
  shopping: "🛍️ 쇼핑",
  nature: "🌿 자연",
  cafe: "☕ 카페",
};

// ─── Component ─────────────────────────────────

export function PlaceDiscoveryView({
  tripId,
  dayIndex,
  destination,
  places,
  verifiedCount,
}: Props) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [query, setQuery] = useState("");
  const { toast, show: showToast } = useToast();

  const filtered = places.filter((p) => {
    if (filter !== "all" && p.category !== filter) return false;
    if (query.trim() && !p.name.toLowerCase().includes(query.toLowerCase()))
      return false;
    return true;
  });

  function handleAdd(place: DiscoverPlace) {
    // 데모 단계 — toast만
    showToast(`"${place.name}" 일정에 추가됨 (데모)`, { variant: "success" });
  }

  return (
    <div className="min-h-screen bg-surface-soft text-ink pb-24">
      {/* Header */}
      <header className="bg-surface-card/90 backdrop-blur-md border-b border-divider sticky top-0 z-40 flex items-center w-full px-td-md h-14">
        <Link
          href={`/itinerary/${tripId}?day=${dayIndex}`}
          aria-label="뒤로"
          className="p-2 rounded-full hover:bg-surface-soft transition-colors mr-td-sm"
        >
          <span className="material-symbols-outlined text-ink">arrow_back</span>
        </Link>
        <h1 className="text-lg font-bold text-ink tracking-tight">
          장소 추가 · Day {dayIndex + 1}
        </h1>
      </header>

      <main className="max-w-xl mx-auto px-td-md pt-td-md">
        {/* Search Bar */}
        <div className="relative w-full mb-td-md">
          <span className="material-symbols-outlined absolute left-td-sm top-1/2 -translate-y-1/2 text-ink-mute">
            search
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`${destination}에서 검색...`}
            className="w-full bg-surface-card border border-divider rounded-full py-2.5 pl-10 pr-td-md text-td-body text-ink placeholder:text-ink-mute focus:outline-none focus:border-purple focus:ring-1 focus:ring-purple transition-colors"
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-td-xs overflow-x-auto no-scrollbar pb-td-xs mb-td-lg -mx-td-md px-td-md">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`shrink-0 px-td-md py-td-xs rounded-full text-td-body font-medium transition-colors ${
                filter === f.key
                  ? "bg-purple text-white"
                  : "bg-surface-card text-ink-soft border border-divider hover:bg-surface-soft"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Place Grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="material-symbols-outlined text-4xl text-ink-mute mb-td-sm">
              search_off
            </span>
            <p className="text-td-body text-ink-soft">
              검색 결과가 없어요
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-td-sm mb-td-lg">
            {filtered.map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                tripId={tripId}
                onAdd={handleAdd}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-center mb-td-lg">
          <p className="text-td-meta text-purple flex items-center gap-td-xs bg-purple-soft px-td-md py-1 rounded-full">
            <span
              className="material-symbols-outlined text-[16px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              verified
            </span>
            AI가 {verifiedCount}곳 검증 완료
          </p>
        </div>
      </main>

      <Toast toast={toast} />
    </div>
  );
}

// ─── Card ──────────────────────────────────────

function PlaceCard({
  place,
  tripId,
  onAdd,
}: {
  place: DiscoverPlace;
  tripId: string;
  onAdd: (p: DiscoverPlace) => void;
}) {
  const badgeStyle =
    place.badge === "ai"
      ? "bg-purple text-white"
      : place.badge === "popular"
        ? "bg-amber text-white"
        : "";

  const badgeText =
    place.badge === "ai"
      ? "AI 추천"
      : place.badge === "popular"
        ? "한국인 인기"
        : "";

  return (
    <div
      className={`flex flex-col bg-surface-card rounded-md overflow-hidden border ${
        place.badge === "ai" ? "border-purple/30" : "border-divider"
      }`}
    >
      {/* Image area */}
      <div className="h-[120px] w-full relative bg-surface-soft">
        {place.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={place.imageUrl}
            alt={place.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl text-ink-mute">
              photo_camera
            </span>
          </div>
        )}
        {/* Badge */}
        {place.badge && (
          <span
            className={`absolute top-td-xs left-td-xs text-td-caption font-medium px-1.5 py-0.5 rounded ${badgeStyle}`}
          >
            {badgeText}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-td-sm flex flex-col flex-1">
        <Link
          href={`/itinerary/${tripId}/item/${place.id}`}
          className="text-td-card-title text-ink font-medium mb-td-xxs line-clamp-1 hover:text-purple transition-colors"
        >
          {place.name}
        </Link>
        <div className="flex items-center gap-td-xs mb-td-xxs">
          <span className="text-td-meta font-medium text-amber-deep">
            ⭐ {place.rating.toFixed(1)}
          </span>
          <span className="text-td-meta text-ink-mute">
            ({place.reviewCount})
          </span>
        </div>
        <p className="text-td-meta text-ink-soft mb-td-sm flex-1">
          {CATEGORY_EMOJI[place.category]} · {place.distance}
        </p>
        <button
          onClick={() => onAdd(place)}
          className="w-full py-1.5 text-td-body font-medium text-purple hover:bg-purple-soft rounded-md transition-colors border border-transparent hover:border-purple/20"
        >
          + 일정에 추가
        </button>
      </div>
    </div>
  );
}
