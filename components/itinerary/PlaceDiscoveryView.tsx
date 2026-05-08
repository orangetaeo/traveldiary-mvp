"use client";

/**
 * PlaceDiscoveryView — AI 추천 장소 탐색 (디자인 갭 #1 U2 재설계, 사이클 2 매핑).
 *
 * Stitch screenId `8c4d688f50fd481e932c4501edaf8d6f` (AI 추천 장소 — 카테고리 우선) 기반.
 * 사용자 진단: 기존 가로 스크롤 캐러셀 → "스크롤 지옥 + 카드 정보 부족".
 * 새 흐름 3단계:
 *   1. 카테고리 그리드 (3열 6 카드: 음식/관광/액티비티/쇼핑/카페/야간)
 *   2. 필터 칩 (가까운 순 / 가격 낮은 순 / 평점 4.5+ / 한국 후기 있음 / 알레르기 제외)
 *   3. 풍부 정보 카드 그리드 (사진 + 뱃지 + 한국 후기 인용 + AI 이유)
 *
 * Pretendard only — 영문 버전 만들지 말 것 (feedback_stitch_pretendard_only).
 */

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useToast } from "@/lib/hooks/useToast";
import { Toast } from "@/components/ui/Toast";
import type { DiscoverPlace, PlaceCategory, ItemCategory } from "@/lib/types";
import {
  scorePlace,
  getRecentSearches,
  addRecentSearch,
  clearRecentSearches,
} from "@/lib/utils/place-search";
import { addItineraryItem } from "@/actions/itinerary";

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
  isIcon?: boolean;
}

const CATEGORY_CARDS: CategoryCard[] = [
  { key: "food", emoji: "restaurant_menu", label: "음식", isIcon: true },
  { key: "spot", emoji: "account_balance", label: "관광", isIcon: true },
  { key: "activity", emoji: "directions_run", label: "액티비티", isIcon: true },
  { key: "shopping", emoji: "shopping_bag", label: "쇼핑", isIcon: true },
  { key: "cafe", emoji: "local_cafe", label: "카페", isIcon: true },
  { key: "nightlife", emoji: "nightlife", label: "야간", isIcon: true },
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

/** PlaceCategory → ItemCategory 변환 (ItineraryItem은 4종류만) */
const PLACE_TO_ITEM_CATEGORY: Record<PlaceCategory, ItemCategory> = {
  food: "food",
  cafe: "food",
  spot: "spot",
  nature: "spot",
  activity: "spot",
  nightlife: "spot",
  shopping: "shopping",
};

// ── Component ────────────────────────────────────────────────────────────
export function PlaceDiscoveryView({
  tripId,
  dayIndex,
  destination,
  places,
  verifiedCount,
}: Props) {
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("food");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [activeFilters, setActiveFilters] = useState<Set<FilterKey>>(new Set());
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showRecent, setShowRecent] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast, show: showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [addingPlaceId, setAddingPlaceId] = useState<string | null>(null);

  // 디바운스 (200ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 200);
    return () => clearTimeout(timer);
  }, [query]);

  // 최근 검색어 로드
  useEffect(() => {
    if (searchOpen) setRecentSearches(getRecentSearches());
  }, [searchOpen]);

  // 검색 확정 (Enter 또는 포커스 아웃)
  const commitSearch = useCallback(() => {
    if (query.trim().length >= 2) {
      addRecentSearch(query.trim());
      setRecentSearches(getRecentSearches());
    }
    setShowRecent(false);
  }, [query]);

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
      // "activity" 선택 시 기존 "nature" 데이터도 포함 (BC 호환)
      if (activeCategory === "activity") {
        list = list.filter((p) => p.category === "activity" || p.category === "nature");
      } else {
        list = list.filter((p) => p.category === activeCategory);
      }
    }

    // A4 Tier 2: 관련도 점수 기반 검색
    const q = debouncedQuery.trim();
    let scored: Array<{ place: DiscoverPlace; score: number }> | null = null;
    if (q) {
      scored = list
        .map((p) => ({ place: p, score: scorePlace(p, q) }))
        .filter((s) => s.score > 0);
      list = scored.map((s) => s.place);
    }

    if (activeFilters.has("rating")) {
      list = list.filter((p) => p.rating >= 4.5);
      if (scored) scored = scored.filter((s) => s.place.rating >= 4.5);
    }
    if (activeFilters.has("korean")) {
      const pred = (p: DiscoverPlace) =>
        (p.koreanReviewCount ?? 0) > 0 || !!p.koreanReviewQuote;
      list = list.filter(pred);
      if (scored) scored = scored.filter((s) => pred(s.place));
    }
    if (activeFilters.has("allergen")) {
      const pred = (p: DiscoverPlace) =>
        !!p.koreanFoodFriendly || (p.aiReason ?? "").includes("알레르기");
      list = list.filter(pred);
      if (scored) scored = scored.filter((s) => pred(s.place));
    }

    // 정렬: 검색 중이면 관련도순, 아니면 기존 정렬
    if (q && scored) {
      list = scored
        .sort((a, b) => b.score - a.score || b.place.rating - a.place.rating)
        .map((s) => s.place);
    } else if (activeFilters.has("distance")) {
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
  }, [places, activeCategory, activeFilters, debouncedQuery]);

  function handleAdd(place: DiscoverPlace) {
    if (isPending) return;
    setAddingPlaceId(place.id);

    // Day 기준 시간 계산: 09:00 + (기존 아이템 수 × 2시간) — 간단한 슬롯 배치
    const baseHour = 9;
    const existingCount = places.filter(
      (p) => favorites.has(p.id), // 이미 추가된 장소 수 대용 (실제로는 서버 측 정보 필요)
    ).length;
    const hour = Math.min(baseHour + existingCount * 2, 21);
    const scheduledAt = `2026-01-01T${String(hour).padStart(2, "0")}:00:00`;

    const itemCategory = PLACE_TO_ITEM_CATEGORY[place.category] ?? "spot";
    const durationMinutes = place.category === "food" || place.category === "cafe" ? 60 : 90;

    startTransition(async () => {
      const result = await addItineraryItem({
        tripId,
        dayIndex,
        scheduledAt,
        durationMinutes,
        flexibility: "flexible",
        priority: 3,
        flexMinutes: 30,
        name: place.name,
        category: itemCategory,
        location: {
          lat: place.lat ?? 0,
          lng: place.lng ?? 0,
          address: place.address ?? "",
        },
      });
      setAddingPlaceId(null);

      if (result.ok) {
        showToast(`"${place.name}" 일정에 추가됨`, { variant: "success" });
      } else {
        showToast(`추가 실패 — 다시 시도해 주세요`, { variant: "danger" });
      }
    });
  }

  function handleToggleFavorite(placeId: string) {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(placeId)) next.delete(placeId);
      else next.add(placeId);
      return next;
    });
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
            onClick={() => {
              const next = !searchOpen;
              setSearchOpen(next);
              if (!next) {
                setQuery("");
                setDebouncedQuery("");
                setShowRecent(false);
              }
            }}
            aria-label="검색 토글"
            aria-pressed={searchOpen ? "true" : "false"}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
              searchOpen
                ? "bg-purple-soft text-purple-deep"
                : "hover:bg-surface-soft text-ink"
            }`}
          >
            <span className="material-symbols-outlined">
              {searchOpen ? "close" : "search"}
            </span>
          </button>
        </div>
      </header>

      <main className="max-w-xl mx-auto pt-td-sm">
        {/* 검색 박스 (토글) — A4 Tier 2 */}
        {searchOpen && (
          <div className="px-td-md mb-td-sm relative">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowRecent(!e.target.value.trim());
                }}
                onFocus={() => setShowRecent(!query.trim())}
                onBlur={() => {
                  // 딜레이: 최근 검색어 클릭 허용
                  setTimeout(() => {
                    commitSearch();
                    setShowRecent(false);
                  }, 150);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    commitSearch();
                    inputRef.current?.blur();
                  }
                }}
                placeholder={`${destination}에서 검색... (초성 ㅂㄴㅎ 지원)`}
                className="w-full bg-surface-card border border-divider rounded-full py-2.5 pl-td-lg pr-10 text-td-body text-ink placeholder:text-ink-mute focus:outline-none focus:border-purple focus:ring-1 focus:ring-purple"
                autoFocus
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setDebouncedQuery("");
                    inputRef.current?.focus();
                  }}
                  aria-label="검색어 지우기"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-mute hover:text-ink"
                >
                  <span className="material-symbols-outlined text-[18px]">cancel</span>
                </button>
              )}
            </div>

            {/* 최근 검색어 드롭다운 */}
            {showRecent && recentSearches.length > 0 && !query.trim() && (
              <div className="absolute left-td-md right-td-md top-full mt-1 bg-surface-card border border-divider rounded-lg shadow-lg z-50 overflow-hidden">
                <div className="flex items-center justify-between px-td-sm py-2 border-b border-divider">
                  <span className="text-td-meta text-ink-soft font-medium">최근 검색</span>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      clearRecentSearches();
                      setRecentSearches([]);
                    }}
                    className="text-td-meta text-ink-mute hover:text-danger-deep"
                  >
                    전체 삭제
                  </button>
                </div>
                {recentSearches.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setQuery(term);
                      setDebouncedQuery(term);
                      setShowRecent(false);
                    }}
                    className="w-full flex items-center gap-2 px-td-sm py-2.5 text-td-body text-ink hover:bg-surface-soft transition-colors text-left"
                  >
                    <span className="material-symbols-outlined text-[16px] text-ink-mute" aria-hidden>history</span>
                    {term}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2. Context Bar */}
        <section className="flex justify-between items-center h-8 px-td-md mt-td-xs">
          <div className="bg-purple-soft text-purple-deep px-td-sm py-1 rounded-full">
            <span className="text-td-caption font-bold">
              {destination} · {verifiedCount}곳 검증 완료
            </span>
          </div>
          <p className="text-td-meta text-ink-soft">
            {debouncedQuery.trim() ? `"${debouncedQuery}" · ` : ""}
            {filtered.length}곳
          </p>
        </section>

        {/* 3. Category Grid */}
        <section className="px-td-md mt-td-md">
          <h2 className="text-td-card-title text-ink font-bold mb-td-sm">
            어떤 종류를 찾으시나요?
          </h2>
          <div className="grid grid-cols-3 gap-td-sm">
            {CATEGORY_CARDS.map((cat) => {
              const active = cat.key === activeCategory;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setActiveCategory(cat.key)}
                  aria-pressed={active ? "true" : "false"}
                  className={`relative aspect-square bg-surface-card rounded-md flex flex-col items-center justify-center gap-td-xs transition-all active:scale-95 ${
                    active
                      ? "border-2 border-purple shadow-sm"
                      : "border border-divider hover:border-purple/40"
                  }`}
                >
                  {active && (
                    <span className="absolute top-1.5 left-1.5 w-5 h-5 bg-purple rounded-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-white text-[14px]" aria-hidden>check</span>
                    </span>
                  )}
                  <span
                    className={`material-symbols-outlined text-[36px] ${
                      active ? "text-purple-deep" : "text-ink-mute"
                    }`}
                    aria-hidden
                  >
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
                  ? "bg-danger text-white border-danger"
                  : "bg-danger-soft text-danger-deep border-danger/30"
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
              <p className="text-td-meta text-ink-mute mt-1">
                {debouncedQuery.trim()
                  ? "이름·지역·카테고리·후기·초성으로 검색됩니다"
                  : "필터를 줄여보세요"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-td-sm">
              {filtered.slice(0, 30).map((place) => (
                <PlaceResultCard
                  key={place.id}
                  place={place}
                  tripId={tripId}
                  isFavorite={favorites.has(place.id)}
                  isAdding={addingPlaceId === place.id}
                  onToggleFavorite={handleToggleFavorite}
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
  isFavorite,
  isAdding,
  onToggleFavorite,
  onAdd,
}: {
  place: DiscoverPlace;
  tripId: string;
  isFavorite: boolean;
  isAdding: boolean;
  onToggleFavorite: (id: string) => void;
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
            “{place.koreanReviewQuote.text}” — {place.koreanReviewQuote.author}
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

// ── Helpers ──────────────────────────────────────────────────────────────
function categoryLabel(category: PlaceCategory): string {
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

function parseDistance(distance: string): number {
  const match = distance.match(/[\d.]+/);
  if (!match) return Number.POSITIVE_INFINITY;
  const value = parseFloat(match[0]);
  if (distance.includes("km")) return value * 10;
  return value;
}
