"use client";

/**
 * DayRouteMapView — 일일 동선 지도 풀스크린 (Stitch 디자인 적용).
 *
 * 지도 배경 + 번호 핀 + SVG 루트 라인 + 하단 타임라인 카드 스크롤.
 * 실 지도 API 미연동 단계 — 플레이스홀더 배경 + 상대 좌표 핀.
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

/** 좌표 우선, 없으면 장소명으로 Google Maps Directions URL 생성 (A1) */
function stopToParam(stop: RouteStop): string {
  if (stop.lat != null && stop.lng != null) return `${stop.lat},${stop.lng}`;
  return stop.name;
}

function buildDirectionsUrl(stops: RouteStop[]): string {
  if (stops.length === 0) return "https://www.google.com/maps";
  const origin = stopToParam(stops[0]);
  const dest = stopToParam(stops[stops.length - 1]);
  const base = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(dest)}`;
  // 중간 경유지 (최대 8개 — Google Maps URL 제한)
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

  return (
    <div className="fixed inset-0 bg-surface-soft flex flex-col overflow-hidden">
      {/* Map Background */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-blue-50 via-green-50/30 to-surface-soft">
        {/* Placeholder pattern for map area */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* SVG Route Line */}
      <svg
        className="absolute inset-0 w-full h-full z-10 pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <polyline
          points={stops.map((s) => `${s.pinX},${s.pinY}`).join(" ")}
          fill="none"
          className="text-purple"
          stroke="currentColor"
          strokeWidth="0.5"
          strokeDasharray="1.5,1.5"
          opacity="0.6"
        />
      </svg>

      {/* Map Pins */}
      {stops.map((stop, idx) => (
        <button
          key={stop.id}
          onClick={() => setActiveIdx(idx)}
          className="absolute z-20 flex flex-col items-center gap-0.5 -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${stop.pinX}%`, top: `${stop.pinY}%` }}
        >
          {/* Ping animation for active */}
          {idx === activeIdx && (
            <div className="absolute w-10 h-10 rounded-full bg-accent/20 animate-ping" />
          )}
          <div
            className={`relative z-10 flex items-center justify-center rounded-full border-2 border-white shadow-md ${
              idx === activeIdx
                ? "w-10 h-10 bg-accent text-white"
                : "w-8 h-8 bg-purple text-white"
            }`}
          >
            <span className="text-td-meta font-bold">{stop.order}</span>
          </div>
          <div className="bg-surface-card/90 backdrop-blur-sm px-1.5 py-0.5 rounded shadow-sm border border-divider">
            <p className="text-td-caption text-ink font-medium whitespace-nowrap">
              {stop.name.length > 6 ? stop.name.slice(0, 6) + "…" : stop.name}
            </p>
          </div>
        </button>
      ))}

      {/* Gradient fade at bottom */}
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
