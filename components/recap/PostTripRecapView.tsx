"use client";

/**
 * PostTripRecapView — 여행 추억 리캡 (Stitch 디자인 적용).
 *
 * 히어로 + 통계 카드 스크롤 + 하이라이트 + 포토 그리드 + 공유 CTA.
 * DB 미구현 단계 — 시드 기반 데모.
 */

import { useState } from "react";
import Link from "next/link";
import { formatKrw } from "@/lib/utils/format-krw";
import { COLOR_BG, COLOR_TEXT } from "@/lib/utils/color-mappings";
import { ShareModal } from "@/components/share/ShareModal";
import type { RecapStats, RecapHighlight, RecapMoment } from "@/lib/types";

// ─── Types ─────────────────────────────────────

export type { RecapStats, RecapHighlight, RecapMoment } from "@/lib/types";

interface Props {
  tripId: string;
  tripTitle: string;
  dateRange: string;
  stats: RecapStats;
  highlights: RecapHighlight[];
  moments: RecapMoment[];
}

// ─── Helpers ───────────────────────────────────


// ─── Component ─────────────────────────────────

export function PostTripRecapView({
  tripId,
  tripTitle,
  dateRange,
  stats,
  highlights,
  moments,
}: Props) {
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface-soft text-ink pb-24">
      {/* Hero Section */}
      <section className="relative w-full h-72 flex items-end p-td-md bg-surface-soft overflow-hidden">
        {/* Placeholder gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple/60 via-purple/30 to-amber/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

        {/* Back button */}
        <Link
          href={`/wrap-up/${tripId}`}
          aria-label="뒤로"
          className="absolute top-td-sm left-td-sm z-20 p-2 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 transition-colors"
        >
          <span className="material-symbols-outlined text-white">
            arrow_back
          </span>
        </Link>

        {/* Title overlay */}
        <div className="relative z-10 text-white w-full">
          <h1 className="text-td-title font-bold text-white mb-td-xxs flex items-center gap-2">
            {tripTitle}
            <span
              className="material-symbols-outlined text-purple-soft"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              stars
            </span>
          </h1>
          <p className="text-td-meta text-white/80">{dateRange}</p>
        </div>
      </section>

      {/* Stats Horizontal Scroll */}
      <section className="py-td-lg px-td-md">
        <div className="flex overflow-x-auto touch-pan-x overscroll-x-contain gap-td-sm pb-td-xs snap-x snap-mandatory hide-scrollbar">
          {/* Card: 방문 */}
          <div className="min-w-[220px] flex-shrink-0 bg-gradient-to-br from-purple to-purple-deep p-td-md rounded-md shadow-sm text-white snap-center">
            <span className="material-symbols-outlined mb-td-sm text-3xl opacity-80">
              location_on
            </span>
            <h3 className="text-td-card-title font-bold text-white mb-td-xxs">
              {stats.placesVisited}곳 방문
            </h3>
            <p className="text-td-meta opacity-90 text-white">
              가장 오래 머문 곳: {stats.longestStay}
            </p>
          </div>

          {/* Card: 이동 거리 */}
          <div className="min-w-[220px] flex-shrink-0 bg-gradient-to-br from-accent to-accent-deep p-td-md rounded-md shadow-sm text-white snap-center">
            <span className="material-symbols-outlined mb-td-sm text-3xl opacity-80">
              directions_walk
            </span>
            <h3 className="text-td-card-title font-bold text-white mb-td-xxs">
              총 이동 거리 {stats.totalDistanceKm}km
            </h3>
            <p className="text-td-meta opacity-90 text-white">
              걸음 수 약 {stats.totalSteps.toLocaleString("ko-KR")}보
            </p>
          </div>

          {/* Card: 지출 */}
          <div className="min-w-[220px] flex-shrink-0 bg-gradient-to-br from-amber to-amber-deep p-td-md rounded-md shadow-sm text-white snap-center">
            <span className="material-symbols-outlined mb-td-sm text-3xl opacity-80">
              payments
            </span>
            <h3 className="text-td-card-title font-bold text-white mb-td-xxs">
              총 지출 {formatKrw(stats.totalSpentKRW)}
            </h3>
            <p className="text-td-meta opacity-90 text-white">
              가장 큰 지출: {stats.biggestCategory}
            </p>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="px-td-md pb-td-lg">
        <h2 className="text-td-card-title font-bold text-ink mb-td-sm">
          Trip Highlights
        </h2>
        <div className="flex flex-col gap-td-xs">
          {highlights.map((h) => (
            <div
              key={h.id}
              className="bg-surface-card p-td-sm rounded-md border border-divider flex items-center gap-td-sm"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${COLOR_BG[h.color]}`}
              >
                <span
                  className={`material-symbols-outlined ${COLOR_TEXT[h.color]}`}
                >
                  {h.icon}
                </span>
              </div>
              <div>
                <div className="text-td-body text-ink">
                  {h.emoji} {h.label}
                </div>
                <div
                  className={`text-td-card-title font-bold ${COLOR_TEXT[h.color]}`}
                >
                  {h.name}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Photo Grid (Masonry) */}
      <section className="px-td-md pb-td-lg">
        <h2 className="text-td-card-title font-bold text-ink mb-td-sm">
          Moments
        </h2>
        <div className="columns-2 gap-td-xs space-y-td-xs">
          {moments.map((m) => (
            <div
              key={m.id}
              className="relative rounded-md overflow-hidden border border-divider break-inside-avoid"
            >
              {m.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.imageUrl}
                  alt={m.alt}
                  loading="lazy"
                  className="w-full h-auto object-cover"
                />
              ) : (
                <div className="w-full aspect-[4/3] bg-surface-soft flex items-center justify-center">
                  <span className="material-symbols-outlined text-4xl text-ink-mute">
                    photo_camera
                  </span>
                </div>
              )}
              <div className="absolute bottom-2 left-2 bg-black/60 text-white text-td-caption px-2 py-0.5 rounded backdrop-blur-sm">
                {m.dayLabel}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom Actions — 옵션 R: ShareModal 진입 (D5 인스타 스토리 카드 + 카카오톡 + URL 복사 통합) */}
      <section className="px-td-md pb-td-lg flex flex-col gap-td-sm">
        <button
          type="button"
          onClick={() => setShareOpen(true)}
          aria-label="여행 공유 — 카카오톡·인스타 스토리·URL 복사"
          className="w-full bg-purple text-white font-bold text-td-body py-3 rounded-md flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-95"
        >
          <span className="material-symbols-outlined" aria-hidden>share</span>
          여행 공유하기
        </button>
        <Link
          href={`/wrap-up/${tripId}`}
          className="w-full bg-transparent border border-divider text-ink font-bold text-td-body py-3 rounded-md flex items-center justify-center gap-2 transition-transform active:scale-95 hover:bg-surface-card"
        >
          <span className="material-symbols-outlined" aria-hidden>arrow_back</span>
          마무리 페이지로
        </Link>
      </section>

      <ShareModal
        open={shareOpen}
        tripId={tripId}
        onClose={() => setShareOpen(false)}
      />
    </div>
  );
}
