"use client";

/**
 * DayRouteMapView — 일일 동선 지도 풀스크린 (Stitch 디자인 + Google Maps Embed).
 *
 * Google Maps Embed v1 Directions iframe을 풀스크린 배경으로 표시 (ADR-028 답습).
 * NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY 미설정 시 안내 텍스트 폴백.
 * 헤더 + 하단 timeline + "길찾기 시작" CTA는 항상 표시.
 *
 * 좌표는 클라이언트 iframe 내부에서만 사용 — 서버 미전송 (ADR-017 답습).
 */

import { useState } from "react";
import Link from "next/link";
import type { RouteStop } from "@/lib/types";

// ─── Types ─────────────────────────────────────

export type { RouteStop } from "@/lib/types";

interface Props {
  tripId: string;
  dayIndex: number;
  stops: RouteStop[];
  walkingKm: number;
  drivingKm: number;
}

// ─── Helpers ────────────────────────────────────

/** 좌표 우선, 없으면 장소명으로 Google Maps URL param 생성 (A1 답습) */
function stopToParam(stop: RouteStop): string {
  if (stop.lat != null && stop.lng != null) return `${stop.lat},${stop.lng}`;
  return stop.name;
}

/** 외부 Google Maps 길찾기 URL (CTA 클릭 시 새 탭) */
function buildDirectionsUrl(stops: RouteStop[]): string {
  if (stops.length === 0) return "https://www.google.com/maps";
  const origin = stopToParam(stops[0]);
  const dest = stopToParam(stops[stops.length - 1]);
  const base = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(dest)}`;
  // 중간 경유지 (Google Maps URL 제한 8개)
  if (stops.length > 2) {
    const waypoints = stops
      .slice(1, -1)
      .slice(0, 8)
      .map(stopToParam)
      .join("|");
    return `${base}&waypoints=${encodeURIComponent(waypoints)}`;
  }
  return base;
}

/**
 * Google Maps Embed v1 Directions iframe URL (ADR-028 패턴).
 * Embed API: waypoints 최대 9개.
 */
function buildEmbedDirectionsUrl(stops: RouteStop[], apiKey: string): string {
  const params = new URLSearchParams({
    key: apiKey,
    origin: stopToParam(stops[0]),
    destination: stopToParam(stops[stops.length - 1]),
    mode: "driving",
  });
  if (stops.length > 2) {
    const waypoints = stops
      .slice(1, -1)
      .slice(0, 9)
      .map(stopToParam)
      .join("|");
    params.set("waypoints", waypoints);
  }
  return `https://www.google.com/maps/embed/v1/directions?${params.toString()}`;
}

// ─── Component ─────────────────────────────────

export function DayRouteMapView({
  tripId,
  dayIndex,
  stops,
  walkingKm,
  drivingKm,
}: Props) {
  const [activeIdx, setActiveIdx] = useState(
    stops.findIndex((s) => s.isActive) >= 0
      ? stops.findIndex((s) => s.isActive)
      : 0,
  );

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;
  const hasKey = Boolean(apiKey);
  const showEmbed = hasKey && stops.length >= 2;

  return (
    <div className="fixed inset-0 bg-surface-soft flex flex-col overflow-hidden">
      {/* Map Background — Google Maps Embed iframe 또는 placeholder */}
      {showEmbed ? (
        <iframe
          src={buildEmbedDirectionsUrl(stops, apiKey!)}
          title={`Day ${dayIndex + 1} 동선 지도`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
          className="absolute inset-0 w-full h-full z-0 border-0"
        />
      ) : (
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-blue-50 via-green-50/30 to-surface-soft flex items-center justify-center">
          <div className="text-center px-td-md">
            <span
              className="material-symbols-outlined text-ink-mute text-[48px] mb-td-xs"
              aria-hidden
            >
              map
            </span>
            <p className="text-td-body text-ink-soft">
              {!hasKey
                ? "지도 키가 곧 연결될 예정입니다."
                : "지도에 표시할 일정이 부족합니다."}
            </p>
          </div>
        </div>
      )}

      {/* Gradient fade at bottom — timeline 카드 가독성 */}
      <div className="absolute bottom-0 left-0 right-0 h-56 bg-gradient-to-t from-surface-soft via-surface-soft/80 to-transparent z-10 pointer-events-none" />

      {/* Header Overlay */}
      <header className="relative z-40 bg-surface-card/85 backdrop-blur-md border-b border-divider/30 rounded-b-lg shadow-sm flex items-center justify-between px-td-md h-14 shrink-0">
        <Link
          href={`/itinerary/${tripId}?day=${dayIndex}`}
          aria-label="뒤로"
          className="p-2 rounded-full hover:bg-surface-soft transition-colors"
        >
          <span className="material-symbols-outlined text-ink">arrow_back</span>
        </Link>
        <h1 className="text-td-title font-bold text-ink tracking-tight">
          Day {dayIndex + 1} 동선
        </h1>
        <div className="flex flex-col items-end">
          <p className="text-td-meta text-purple font-bold">도보 {walkingKm}km</p>
          <p className="text-td-meta text-ink-soft">차량 {drivingKm}km</p>
        </div>
      </header>

      {/* Bottom Area */}
      <div className="absolute bottom-0 left-0 w-full z-40 flex flex-col pb-6">
        {/* FAB */}
        <div className="flex justify-end px-td-md mb-td-md">
          <a
            href={buildDirectionsUrl(stops)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-td-sm bg-purple hover:bg-purple-deep text-white font-medium px-td-lg py-3 rounded-full shadow-lg transition-colors"
          >
            <span className="material-symbols-outlined">navigation</span>
            <span>길찾기 시작</span>
          </a>
        </div>

        {/* Horizontal Timeline Cards */}
        <div className="flex overflow-x-auto touch-pan-x overscroll-x-contain hide-scrollbar gap-td-sm px-td-md pb-td-sm snap-x snap-mandatory">
          {stops.map((stop, idx) => (
            <button
              key={stop.id}
              onClick={() => setActiveIdx(idx)}
              className={`snap-center shrink-0 w-[260px] bg-surface-card rounded-md p-td-sm flex flex-col gap-td-xs text-left relative ${
                idx === activeIdx
                  ? "border-2 border-accent shadow-md"
                  : "border border-divider shadow-sm"
              } ${idx > activeIdx ? "opacity-70" : ""}`}
            >
              {/* "지금 여기" badge */}
              {stop.isActive && (
                <span className="absolute -top-2.5 right-3 bg-accent text-white text-td-caption font-bold px-1.5 py-0.5 rounded shadow-sm">
                  지금 여기
                </span>
              )}

              <div className="flex justify-between items-start">
                <div className="flex items-center gap-td-xs">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      idx === activeIdx
                        ? "bg-accent text-white"
                        : "bg-surface-soft text-ink"
                    }`}
                  >
                    <span className="text-td-caption font-bold">{stop.order}</span>
                  </div>
                  <p
                    className={`text-td-card-title ${
                      idx === activeIdx ? "font-bold text-ink" : "text-ink"
                    }`}
                  >
                    {stop.name}
                  </p>
                </div>
                <span
                  className={`text-td-meta shrink-0 ${
                    idx === activeIdx ? "text-accent font-bold" : "text-ink-soft"
                  }`}
                >
                  {stop.time}
                </span>
              </div>

              <div className="flex items-center gap-td-xs text-ink-soft">
                <span className="material-symbols-outlined text-td-icon-md">
                  {stop.categoryIcon}
                </span>
                <span className="text-td-meta">{stop.category}</span>
              </div>

              {stop.nextTransit && (
                <div className="mt-td-xxs pt-td-xxs border-t border-divider/50 flex items-center gap-td-xs text-purple">
                  <span className="material-symbols-outlined text-td-icon-sm">
                    directions_car
                  </span>
                  <span className="text-td-meta font-medium">
                    {stop.nextTransit}
                  </span>
                </div>
              )}

              {!stop.nextTransit && idx === stops.length - 1 && (
                <div className="mt-td-xxs pt-td-xxs border-t border-divider/50 flex items-center gap-td-xs text-ink-mute">
                  <span className="material-symbols-outlined text-td-icon-sm">flag</span>
                  <span className="text-td-meta">오늘의 마지막 일정</span>
                </div>
              )}
            </button>
          ))}
          <div className="shrink-0 w-4" />
        </div>
      </div>
    </div>
  );
}
