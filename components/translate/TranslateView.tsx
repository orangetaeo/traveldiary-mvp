"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { MenuItemCard } from "./MenuItemCard";
import {
  ALLERGEN_CHIPS,
  matchAllergens,
} from "@/lib/allergens";
import {
  PHU_QUOC_MENU_VENUE,
  phuQuocMenu,
  type MenuItem,
} from "@/lib/seed/menu-phu-quoc";

/**
 * 카메라 번역 (M4) — 사이클 4 데모 화면.
 *
 * ADR-015: OCR/LLM 호출 없이 정적 베트남어 메뉴 시드로 시연.
 * 사이클 5에서 사진 업로드 + Google Vision + Claude API + writeAuditLog 도입.
 *
 * 핵심 인터랙션:
 *   - 알레르기 칩 토글 → 즉시 위험 메뉴 빨간색 표시
 *   - 한국인 BEST 정렬 토글 (사회적 증거)
 */
export function TranslateView({ tripId }: { tripId?: string }) {
  const [excludes, setExcludes] = useState<string[]>([]);
  const [sortByPopular, setSortByPopular] = useState(true);

  function toggle(raw: string) {
    setExcludes((prev) =>
      prev.includes(raw) ? prev.filter((x) => x !== raw) : [...prev, raw],
    );
  }

  const annotated = useMemo(() => {
    const list = phuQuocMenu.map((item) => {
      const haystack = [
        item.original,
        item.translated,
        item.phonetic,
        item.ingredients.join(" "),
        item.allergens.join(" "),
      ].join(" ");
      return { item, matches: matchAllergens(haystack, excludes) };
    });
    if (sortByPopular) {
      list.sort(
        (a, b) =>
          (b.item.koreanPopularity ?? 0) - (a.item.koreanPopularity ?? 0),
      );
    }
    return list;
  }, [excludes, sortByPopular]);

  const dangerCount = annotated.filter((a) =>
    a.matches.some((m) => m.severity === "critical"),
  ).length;

  return (
    <main className="min-h-screen flex flex-col">
      <header className="px-5 pt-5 pb-3 border-b border-divider">
        <div className="flex items-center justify-between mb-1.5">
          <Link
            href={tripId ? `/travel/${tripId}` : "/"}
            className="text-[12px] text-ink-soft hover:text-ink"
          >
            ‹ 여행 중 화면
          </Link>
          <Badge tone="amber">데모 메뉴</Badge>
        </div>
        <h1 className="text-[20px] font-medium leading-tight">메뉴 번역</h1>
        <p className="text-[12px] text-ink-soft mt-1">
          {PHU_QUOC_MENU_VENUE.name}
        </p>
      </header>

      {/* 알레르기 토글 */}
      <section className="px-4 py-3 border-b border-divider">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-medium text-ink-soft tracking-wider">
            알레르기·식이 필터
          </p>
          {dangerCount > 0 && (
            <Badge tone="danger">{dangerCount}개 위험</Badge>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ALLERGEN_CHIPS.map((chip) => {
            const active = excludes.includes(chip.raw);
            return (
              <button
                key={chip.raw}
                onClick={() => toggle(chip.raw)}
                className={`text-[11px] px-3 py-1.5 rounded-full whitespace-nowrap transition-colors border ${
                  active
                    ? "bg-danger-soft text-danger-deep border-danger"
                    : "bg-transparent text-ink-soft border-divider hover:border-ink-mute"
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* 정렬 토글 */}
      <section className="px-4 py-2 flex items-center justify-end gap-2 border-b border-divider">
        <span className="text-[11px] text-ink-soft">정렬:</span>
        <button
          onClick={() => setSortByPopular(true)}
          className={`text-[11px] px-2.5 py-1 rounded-full ${
            sortByPopular
              ? "bg-amber-soft text-amber-deep"
              : "text-ink-soft hover:bg-surface-soft"
          }`}
        >
          한국인 인기순
        </button>
        <button
          onClick={() => setSortByPopular(false)}
          className={`text-[11px] px-2.5 py-1 rounded-full ${
            !sortByPopular
              ? "bg-ink text-white"
              : "text-ink-soft hover:bg-surface-soft"
          }`}
        >
          메뉴판 순서
        </button>
      </section>

      {/* 메뉴 리스트 */}
      <section className="px-4 py-4 space-y-2.5 flex-1">
        {annotated.map(({ item, matches }) => (
          <MenuItemCard key={item.id} item={item} matches={matches} />
        ))}
      </section>

      <footer className="border-t border-divider p-4">
        <p className="text-[11px] text-ink-mute text-center">
          데모 메뉴 시드 (ADR-015) · 사이클 5에서 카메라 업로드·OCR·LLM 결합
        </p>
      </footer>
    </main>
  );
}

// re-export type for downstream
export type { MenuItem };
