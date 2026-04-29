"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { CategoryBadge } from "@/components/itinerary/CategoryBadge";
import { TravelHeader } from "./TravelHeader";
import { dayProgress } from "@/lib/mode-transition";
import type { ItineraryItem, Trip } from "@/lib/types";

interface TravelHomeProps {
  trip: Trip;
  items: ItineraryItem[];
}

/**
 * 여행 중 홈 (M2 매직 모먼트 시연 화면) — LEVEL 1.
 *
 * 데모 정책 (ADR-014):
 *   - 사용자가 /itinerary/[id]에서 "여행 중 모드" 버튼을 눌렀을 때 진입.
 *   - travelDay는 Day 1로 고정해 시연 (실 자동 전환은 사이클 5).
 *   - 시계는 실시간이지만 진행률은 시드 시각 기준이라 demo Day 1 중 일부만 매칭.
 *
 * UI 룰 (T17 / docs/02-magic-moments.md M2):
 *   - 강조 색 = 코랄 (data-travel-mode="in-travel" → --color-mode-primary)
 *   - FAB 등장 (카메라 번역·주변 검색)
 *   - 헤더 "DAY n · HH:MM"
 */
export function TravelHome({ trip, items }: TravelHomeProps) {
  // 데모: Day 1로 고정. 사이클 5에서 calculateTravelDay(trip.startDate)로 교체.
  const travelDay = 1;
  const dayIndex = travelDay - 1;

  const [now, setNow] = useState<Date | null>(null);

  // Day 1의 첫 일정을 "기준 시각"으로 잡아 진행률 시연.
  // 실 운영 시 Date()로 대체 — 사이클 5.
  const demoNow = useMemo(() => {
    const today = items
      .filter((it) => it.dayIndex === dayIndex)
      .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
    if (today.length === 0) return null;
    // 진행률을 보여주려고 첫 항목 종료 직후 시점을 데모 now로 사용.
    const first = new Date(today[0].scheduledAt);
    first.setUTCMinutes(first.getUTCMinutes() + today[0].durationMinutes + 30);
    return first;
  }, [items, dayIndex]);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const referenceNow = demoNow ?? now ?? new Date();
  const { done, total, current, next } = dayProgress(items, dayIndex, referenceNow);

  return (
    <div data-travel-mode="in-travel" className="min-h-screen flex flex-col">
      <TravelHeader travelDay={travelDay} destination={trip.destination} />

      {/* 진행률 + 데모 안내 */}
      <section className="px-5 py-4 border-b border-divider">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-medium text-ink-soft tracking-wider">
            오늘 진행률
          </p>
          <Badge tone="amber">데모</Badge>
        </div>
        <div className="flex items-baseline gap-2 mb-1.5">
          <span className="text-[24px] font-medium tabular-nums text-mode-primary">
            {done}
          </span>
          <span className="text-[14px] text-ink-soft">/ {total}곳 완료</span>
        </div>
        <div className="h-[6px] bg-surface-soft rounded-full overflow-hidden">
          <div
            className="h-full bg-mode-primary rounded-full transition-all"
            style={{ width: total === 0 ? "0%" : `${Math.round((done / total) * 100)}%` }}
          />
        </div>
      </section>

      {/* 현재 일정 */}
      <section className="px-4 pt-4">
        <p className="text-[10px] font-medium text-ink-soft tracking-wider mb-2">
          {current ? "지금 진행 중" : "다음으로 시작할 항목"}
        </p>
        {(current ?? next) ? (
          <CurrentCard item={(current ?? next)!} highlight={!!current} />
        ) : (
          <Card variant="plain">
            <p className="text-[13px] text-ink-soft text-center py-4">
              오늘 일정이 모두 끝났어요
            </p>
          </Card>
        )}
      </section>

      {/* 다음 일정 (current가 있을 때만 별도 표시) */}
      {current && next && (
        <section className="px-4 pt-3">
          <p className="text-[10px] font-medium text-ink-soft tracking-wider mb-2">
            다음
          </p>
          <NextCard item={next} />
        </section>
      )}

      <div className="flex-1" />

      {/* 푸터 + 일정 전체로 돌아가기 */}
      <footer className="border-t border-divider p-4 flex items-center justify-between">
        <Link
          href={`/itinerary/${trip.id}`}
          className="text-[12px] text-ink-soft hover:text-ink"
        >
          ‹ 일정 전체
        </Link>
        <p className="text-[11px] text-ink-mute">
          ADR-014 · 데모 토글
        </p>
      </footer>

      {/* FAB — 코랄 강조 (모바일 우하단 고정). 사이클 4 카메라 번역 활성화. */}
      <Fab tripId={trip.id} />
    </div>
  );
}

// ── 현재 일정 카드 (코랄 강조) ──

function CurrentCard({ item, highlight }: { item: ItineraryItem; highlight: boolean }) {
  return (
    <div
      className={`rounded-lg p-4 bg-surface-card border-2 ${
        highlight ? "border-mode-primary" : "border-divider"
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <div className="flex items-baseline gap-2 min-w-0">
          {highlight && (
            <span
              className="w-1.5 h-1.5 rounded-full bg-mode-primary animate-pulse shrink-0"
              aria-hidden="true"
            />
          )}
          <span className="text-[14px] font-medium tabular-nums">
            {formatTime(item.scheduledAt)}
          </span>
          <span className="text-[11px] text-ink-mute">
            {item.durationMinutes}분
          </span>
        </div>
        <CategoryBadge category={item.category} />
      </div>
      <h3 className="text-[16px] font-medium leading-tight mb-1">{item.name}</h3>
      <p className="text-[12px] text-ink-soft truncate">
        {item.location.address}
      </p>
      {item.evidence.reasons[0] && (
        <p className="text-[11px] text-purple-deep mt-2 line-clamp-1">
          ▾ {item.evidence.reasons[0]}
        </p>
      )}
    </div>
  );
}

function NextCard({ item }: { item: ItineraryItem }) {
  return (
    <Card variant="plain">
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-[12px] tabular-nums text-ink-soft">
          {formatTime(item.scheduledAt)}
        </span>
        <CategoryBadge category={item.category} />
      </div>
      <p className="text-[14px] font-medium">{item.name}</p>
    </Card>
  );
}

// ── FAB ──

function Fab({ tripId }: { tripId: string }) {
  return (
    <div className="fixed bottom-6 right-[max(1rem,calc(50vw-210px+1rem))] z-30 flex flex-col gap-2 items-end">
      <button
        type="button"
        className="w-11 h-11 rounded-full bg-surface-card border border-divider text-ink-soft text-sm shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        disabled
        aria-label="주변 검색 (사이클 5 활성화)"
        title="주변 검색 (사이클 5)"
      >
        🔍
      </button>
      <Link
        href={`/translate?trip=${tripId}`}
        className="w-14 h-14 rounded-full bg-mode-primary text-white text-lg shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity"
        aria-label="카메라 번역"
      >
        📷
      </Link>
    </div>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}
