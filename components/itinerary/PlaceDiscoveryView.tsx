"use client";

/**
 * PlaceDiscoveryView — AI 추천 장소 탐색 (디자인 갭 #1 U2 재설계, 사이클 2 매핑).
 *
 * Stitch screenId `8c4d688f50fd481e932c4501edaf8d6f` (AI 추천 장소 — 카테고리 우선) 기반.
 * 사용자 진단: 기존 가로 스크롤 캐러셀 → "스크롤 지옥 + 카드 정보 부족".
 * 새 흐름 3단계:
 *   1. 카테고리 그리드 (2열 6 카드: 전체/음식/관광/쇼핑/자연/카페)
 *   2. 필터 칩 (가까운 순 / 가격 낮은 순 / 평점 4.5+ / 한국 후기 있음 / 알레르기 제외)
 *   3. 풍부 정보 카드 그리드 (사진 + 뱃지 + 한국 후기 인용 + AI 이유)
 *
 * Pretendard only — 영문 버전 만들지 말 것 (feedback_stitch_pretendard_only).
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { useToast } from "@/lib/hooks/useToast";
import { Toast } from "@/components/ui/Toast";
import type { DiscoverPlace, PlaceCategory } from "@/lib/types";

export type { PlaceCategory, DiscoverPlace } from "@/lib/types";

interface Props {
  tripId: string;
  dayIndex: number;
  destination: string;
  places: DiscoverPlace[];
  verifiedCount: number;
}

// ── Category 6 카드 (전체 + 5 카테고리) ───────────────────────────────────
type CategoryKey = "all" | PlaceCategory;

interface CategoryCard {
  key: CategoryKey;
  emoji: string;
  label: string;
}

const CATEGORY_CARDS: CategoryCard[] = [
  { key: "all", emoji: "🗂️", label: "전체" },
  { key: "food", emoji: "🍜", label: "음식" },
  { key: "spot", emoji: "🏛️", label: "관광" },
  { key: "shopping", emoji: "🛍️", label: "쇼핑" },
  { key: "nature", emoji: "🌿", label: "자연" },
  { key: "cafe", emoji: "☕", label: "카페" },
];

// ── Filter Chip ──────────────────────────────────────────────────────────
type FilterKey = "distance" | "price" | "rating" | "korean" | "allergen";

interface FilterChip {
  key: FilterKey;
  emoji: string;
  label: string;
  isCaution?: boolean;
}

const FILTER_CHIPS: FilterChip[] = [
  { key: "distance", emoji: "📍", label: "거리 가까운 순" },
  { key: "price", emoji: "💰", label: "가격 낮은 순" },
  { key: "rating", emoji: "⭐", label: "평점 4.5+" },
  { key: "korean", emoji: "🇰🇷", label: "한국 후기 있음" },
  { key: "allergen", emoji: "🌶", label: "알레르기 제외", isCaution: true },
];

function priceLabel(level: number | undefined): string {
  if (!level) return "";
  return "₩".repeat(Math.min(3, Math.max(1, level)));
}

// ── Component ────────────────────────────────────────────────────────────
export function PlaceDiscoveryView({
  tripId,
  dayIndex,
  destination,
  places,
  verifiedCount,
}: Props) {
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("all");
  const [activeFilters, setActiveFilters] = useState<Set<FilterKey>>(new Set());
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { toast, show: showToast } = useToast();

  function toggleFilter(key: FilterKey) {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const filtered = useMemo(() => {
    let list = places;
    if (activeCategory !== "all") {
      list = list.filter((p) => p.category === activeCategory);
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    if (activeFilters.has("rating")) {
      list = list.filter((p) => p.rating >= 4.5);
    }
    if (activeFilters.has("korean")) {
      list = list.filter(
        (p) => (p.koreanReviewCount ?? 0) > 0 || !!p.koreanReviewQuote,
      );
    }
    if (activeFilters.has("allergen")) {
      list = list.filter(
        (p) =>
          !!p.koreanFoodFriendly ||
          (p.aiReason ?? "").includes("알레르기"),
      );
    }
    if (activeFilters.has("distance")) {
      list = [...list].sort(
        (a, b) => parseDistance(a.distance) - parseDistance(b.distance),
      );
    } else if (activeFilters.has("price")) {
      list = [...list].sort(
        (a, b) => (a.priceLevel ?? 99) - (b.priceLevel ?? 99),
      );
    } else {
      list = [...list].sort((a, b) => b.rating - a.rating);
    }
    return list;
  }, [places, activeCategory, activeFilters, query]);

  function handleAdd(place: DiscoverPlace) {
    showToast(`"${place.name}" 일정에 추가됨 (데모)`, { variant: "success" });
  }

  return (
    <div className="min-h-screen bg-surface-soft text-ink pb-24">
      {/* 1. TopAppBar */}
      <header className="bg-surface-card/95 backdrop-blur-md border-b border-divider sticky top-0 z-40 flex justify-between items-center w-full px-td-md h-14">
        <div className="flex items-center gap-td-xs">
          <Link
            href={`/itinerary/${tripId}?day=${dayIndex}`}
            aria-label="뒤로"
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-soft transition-colors"
          >
            <span className="material-symbols-outlined text-ink">arrow_back</span>
          </Link>
          <h1 className="text-lg font-bold text-ink tracking-tight">
            AI 추천 장소
          </h1>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            aria-label="검색 토글"
            aria-pressed={searchOpen ? "true" : "false"}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
              searchOpen
                ? "bg-purple-soft text-purple-deep"
                : "hover:bg-surface-soft text-ink"
            }`}
          >
            <span className="material-symbols-outlined">search</span>
          </button>
        </div>
      </header>

      <main className="max-w-xl mx-auto pt-td-sm">
        {/* 검색 박스 (토글) */}
        {searchOpen && (
          <div className="px-td-md mb-td-sm">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`${destination}에서 검색...`}
              className="w-full bg-surface-card border border-divider rounded-full py-2.5 px-td-md text-td-body text-ink placeholder:text-ink-mute focus:outline-none focus:border-purple focus:ring-1 focus:ring-purple"
              autoFocus
            />
          </div>
        )}

        {/* 2. Context Bar */}
        <section className="flex justify-between items-center h-8 px-td-md mt-td-xs">
          <div className="bg-purple-soft text-purple-deep px-td-sm py-1 rounded-full">
            <span className="text-td-caption font-bold">
              {destination} · {verifiedCount}곳 검증 완료
            </span>
          </div>
          <p className="text-td-meta text-ink-soft">{filtered.length}곳</p>
        </section>

        {/* 3. Category Grid */}
        <section className="px-td-md mt-td-md">
          <h2 className="text-td-card-title text-ink font-bold mb-td-sm">
            어떤 곳을 찾으세요?
          </h2>
          <div className="grid grid-cols-2 gap-td-sm">
            {CATEGORY_CARDS.map((cat) => {
              const active = cat.key === activeCategory;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setActiveCategory(cat.key)}
                  aria-pressed={active ? "true" : "false"}
                  className={`aspect-square bg-surface-card rounded-md flex flex-col items-center justify-center gap-td-xs transition-all active:scale-95 ${
                    active
                      ? "border-2 border-purple shadow-sm"
                      : "border border-divider hover:border-purple/40"
                  }`}
                >
                  <span className="text-[40px]" aria-hidden>
                    {cat.emoji}
                  </span>
                  <span
                    className={`text-td-body font-bold ${
                      active ? "text-purple-deep" : "text-ink-soft"
                    }`}
                  >
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 4. Filter Chips */}
        <section className="mt-td-md">
          <div
            className="flex overflow-x-auto px-td-md gap-td-xs hide-scrollbar pb-1"
            aria-label="결과 필터"
          >
            {FILTER_CHIPS.map((chip) => {
              const active = activeFilters.has(chip.key);
              const baseStyle = chip.isCaution
                ? active
                  ? "bg-red-500 text-white border-red-500"
                  : "bg-red-50 text-red-700 border-red-300/50"
                : active
                  ? "bg-purple text-white border-purple"
                  : "bg-surface-card text-ink-soft border-divider";
              return (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => toggleFilter(chip.key)}
                  aria-pressed={active ? "true" : "false"}
                  className={`flex-none px-td-md py-2 border rounded-md text-td-meta font-medium whitespace-nowrap transition-colors ${baseStyle}`}
                >
                  <span aria-hidden>{chip.emoji}</span> {chip.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* 5. Result Grid */}
        <section className="px-td-md mt-td-md">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <span
                className="material-symbols-outlined text-4xl text-ink-mute mb-td-sm"
                aria-hidden
              >
                search_off
              </span>
              <p className="text-td-body text-ink-soft">조건에 맞는 곳이 없어요</p>
              <p className="text-td-meta text-ink-mute mt-1">필터를 줄여보세요</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-td-sm">
              {filtered.slice(0, 30).map((place) => (
                <PlaceResultCard
                  key={place.id}
                  place={place}
                  tripId={tripId}
                  onAdd={handleAdd}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <Toast toast={toast} />
    </div>
  );
}

// ── Result Card ──────────────────────────────────────────────────────────
function PlaceResultCard({
  place,
  tripId,
  onAdd,
}: {
  place: DiscoverPlace;
  tripId: string;
  onAdd: (p: DiscoverPlace) => void;
}) {
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
        {showAi && (
          <span
            className="absolute top-2 right-2 bg-purple/90 text-white text-[10px] px-2 py-0.5 rounded-full font-bold"
            aria-label="AI 추천"
          >
            AI ❤
          </span>
        )}
        {showPopular && (
          <span
            className="absolute top-2 right-2 bg-amber/90 text-white text-[10px] px-2 py-0.5 rounded-full font-bold"
            aria-label="한국인 인기"
          >
            🇰🇷 인기
          </span>
        )}
        {place.koreanFoodFriendly && (
          <span
            className="absolute top-2 left-2 bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold"
            aria-label="한식 메뉴 가능"
          >
            한식 OK
          </span>
        )}
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
            “{place.koreanReviewQuote.text}” — {place.koreanReviewQuote.author}
          </p>
        )}
        {place.aiReason && (
          <span className="self-start bg-purple-soft/60 text-purple-deep text-[10px] font-bold px-2 py-0.5 rounded border border-purple/15 mb-td-sm">
            {place.aiReason}
          </span>
        )}
        <button
          type="button"
          onClick={() => onAdd(place)}
          className="mt-auto w-full py-1.5 text-td-meta font-bold text-purple-deep border border-purple/30 rounded-md hover:bg-purple-soft transition-colors"
        >
          + 일정에 추가
        </button>
      </div>
    </article>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────
function categoryLabel(category: PlaceCategory): string {
  return (
    {
      food: "음식",
      spot: "관광",
      shopping: "쇼핑",
      nature: "자연",
      cafe: "카페",
    } as Record<PlaceCategory, string>
  )[category];
}

function parseDistance(distance: string): number {
  const match = distance.match(/[\d.]+/);
  if (!match) return Number.POSITIVE_INFINITY;
  const value = parseFloat(match[0]);
  if (distance.includes("km")) return value * 10;
  return value;
}
