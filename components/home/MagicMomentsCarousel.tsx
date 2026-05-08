"use client";

/**
 * 매직 모먼트 4축 캐러셀 (M1~M4).
 *
 * ORANGE TOUR 메인 카드 캐러셀 패턴 차용:
 * - 가로 스크롤 + snap-x snap-mandatory
 * - touch-pan-x + overscroll-x-contain (PR #346/#352 답습)
 * - dot pagination (IntersectionObserver로 활성 dot 추적)
 * - 카드 너비 80% — 다음 카드 살짝 보임 (peek)
 *
 * Server Component에서 정적 데이터를 props로 받음. dot 활성 추적만 클라이언트.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export interface MomentCard {
  id: "m1" | "m2" | "m3" | "m4";
  badge: string;
  title: string;
  description: string;
  icon: string;
  gradient: string;
  href: string;
  hrefLabel: string;
}

interface MagicMomentsCarouselProps {
  cards: MomentCard[];
}

export function MagicMomentsCarousel({ cards }: MagicMomentsCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          const idx = itemRefs.current.findIndex(
            (el) => el === visible.target,
          );
          if (idx >= 0) setActiveIndex(idx);
        }
      },
      {
        root,
        threshold: [0.5, 0.75, 1],
      },
    );
    itemRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [cards.length]);

  function scrollToIndex(index: number) {
    const target = itemRefs.current[index];
    if (target) {
      target.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
    }
  }

  return (
    <section className="mb-td-lg" aria-label="매직 모먼트 4축">
      <div className="px-td-md mb-td-sm flex items-baseline justify-between">
        <h2 className="text-td-card-title text-ink">우리만의 4가지 차별점</h2>
        <span className="text-td-caption text-ink-soft">밀어서 보기 →</span>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-td-sm px-td-md pb-td-xs overflow-x-auto touch-pan-x overscroll-x-contain snap-x snap-mandatory"
        role="region"
        aria-roledescription="carousel"
      >
        {cards.map((card, idx) => (
          <article
            key={card.id}
            ref={(el) => {
              itemRefs.current[idx] = el;
            }}
            className={`shrink-0 w-[80%] snap-start rounded-lg p-td-md text-white shadow-md ${card.gradient}`}
            aria-roledescription="slide"
            aria-label={`${idx + 1} / ${cards.length} — ${card.title}`}
          >
            <div className="flex items-center gap-td-xs mb-td-sm">
              <span
                className="material-symbols-outlined text-td-icon-xl"
                aria-hidden
              >
                {card.icon}
              </span>
              <span className="text-td-caption text-white/80 uppercase tracking-wider font-semibold">
                {card.badge}
              </span>
            </div>
            <h3 className="text-td-card-title text-white mb-td-xs">
              {card.title}
            </h3>
            <p className="text-td-meta text-white/90 mb-td-md leading-relaxed">
              {card.description}
            </p>
            <Link
              href={card.href}
              className="inline-flex items-center gap-1 text-td-meta text-white font-semibold hover:underline"
            >
              {card.hrefLabel}
              <span
                className="material-symbols-outlined text-td-icon-sm"
                aria-hidden
              >
                arrow_forward
              </span>
            </Link>
          </article>
        ))}
      </div>

      <div
        className="flex justify-center gap-1.5 mt-td-sm"
        role="tablist"
        aria-label="캐러셀 페이지"
      >
        {cards.map((card, idx) => {
          const isActive = idx === activeIndex;
          return (
            <button
              key={card.id}
              type="button"
              role="tab"
              aria-selected={isActive ? "true" : "false"}
              aria-label={`${idx + 1}: ${card.title}`}
              onClick={() => scrollToIndex(idx)}
              className={`h-1.5 rounded-full transition-all ${
                isActive ? "bg-purple w-6" : "bg-divider w-1.5 hover:bg-ink-mute"
              }`}
            />
          );
        })}
      </div>
    </section>
  );
}
