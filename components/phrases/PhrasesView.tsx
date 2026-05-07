"use client";

/**
 * PhrasesView — 베트남어 핵심 문장 카테고리 뷰 (A3 디자인 갭).
 *
 * 카테고리 칩(4) + 카드 그리드. 카테고리 전환 시 해당 그룹만 표시.
 * 음성 재생은 PhraseCard에서 SpeechSynthesis Web API로 처리.
 */

import { useState } from "react";
import {
  PHRASE_CATEGORIES,
  PHRASES,
  type PhraseCategory,
} from "@/lib/vietnamese-phrases";
import { PhraseCard } from "./PhraseCard";

const ACCENT_TOKENS = {
  purple: {
    chipActive: "bg-purple text-white border-purple",
    chipIdle: "bg-purple-soft/40 text-purple-deep border-purple-soft hover:bg-purple-soft",
  },
  amber: {
    chipActive: "bg-amber text-white border-amber",
    chipIdle: "bg-amber-soft/40 text-amber-deep border-amber-soft hover:bg-amber-soft",
  },
  success: {
    chipActive: "bg-success text-white border-success",
    chipIdle: "bg-success-soft/40 text-success-deep border-success-soft hover:bg-success-soft",
  },
  danger: {
    chipActive: "bg-danger text-white border-danger",
    chipIdle: "bg-danger-soft/40 text-danger-deep border-danger-soft hover:bg-danger-soft",
  },
} as const;

export function PhrasesView() {
  const [activeCategory, setActiveCategory] = useState<PhraseCategory>("restaurant");

  const visiblePhrases = PHRASES.filter((p) => p.category === activeCategory);
  const total = PHRASES.length;

  return (
    <main className="max-w-md mx-auto px-td-md py-td-lg">
      {/* Hero */}
      <div className="mb-td-md">
        <h2 className="text-td-title text-ink mb-td-xxs">
          베트남어 핵심 문장 {total}개
        </h2>
        <p className="text-td-body text-ink-soft">
          현지에서 자주 쓰는 표현을 카테고리별로 모아뒀어요. 발음 듣기 버튼으로
          현지 발음을 들어볼 수 있습니다.
        </p>
      </div>

      {/* 데모 마커 (정체성 투명화) */}
      <div className="mb-td-md rounded-sm bg-amber-soft/30 border border-amber/30 px-td-sm py-td-xs text-td-caption text-amber-deep">
        🟡 발음 재생은 브라우저 음성 합성(SpeechSynthesis) 기반입니다. 일부
        기기/언어팩에서 베트남어 음성이 미지원될 수 있어요.
      </div>

      {/* 카테고리 탭 */}
      <div
        role="tablist"
        aria-label="베트남어 문장 카테고리"
        className="grid grid-cols-4 gap-td-xs mb-td-md"
      >
        {PHRASE_CATEGORIES.map((cat) => {
          const isActive = cat.id === activeCategory;
          const accent = ACCENT_TOKENS[cat.accent];
          return (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={isActive ? "true" : "false"}
              data-category={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex flex-col items-center justify-center gap-td-xxs rounded-md border py-td-sm transition-colors focus:outline-none focus:ring-2 focus:ring-purple/40 ${
                isActive ? accent.chipActive : accent.chipIdle
              }`}
            >
              <span className="material-symbols-outlined text-[22px]" aria-hidden>
                {cat.icon}
              </span>
              <span className="text-td-meta font-medium">{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* 카드 리스트 */}
      <div className="flex flex-col gap-td-sm">
        {visiblePhrases.map((phrase) => (
          <PhraseCard key={phrase.id} phrase={phrase} />
        ))}
      </div>

      {/* 푸터 안내 */}
      <p className="mt-td-lg text-td-caption text-ink-mute text-center leading-relaxed">
        북부(하노이) 표준 발음 기준입니다. 호치민 등 남부에선 일부 발음이 다를
        수 있어요.
      </p>
    </main>
  );
}
