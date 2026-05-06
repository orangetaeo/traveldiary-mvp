"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { EvidencePanel } from "@/components/ui/EvidencePanel";
import { dayProgress } from "@/lib/mode-transition";
import type { ItineraryItem, ResolvedCity, Trip } from "@/lib/types";
import { AutoModeDetector } from "./AutoModeDetector";
import { CityContextStrip } from "@/components/city/CityContextStrip";
import { EmergencyHeaderButton } from "@/components/city/EmergencyHeader";
import { SpeedDialFab } from "@/components/ui/SpeedDialFab";

interface TravelHomeProps {
  trip: Trip;
  items: ItineraryItem[];
  /** 사이클 8 M5: 도시별 큐레이션 데이터. 미존재 도시면 null. 사이클 H: ResolvedCity (country merged) */
  city?: ResolvedCity | null;
}

/**
 * 여행 중 홈 (M2) — Stitch #2 매핑 (Home (On-trip) - Pretendard).
 *
 * 사이클 5b 옵션 C (2026-04-30): Stitch HTML → React 변환.
 *
 * 디자인:
 * - 상단 GPS 배너 (success 톤)
 * - TopAppBar (DAY n · HH:MM, 코랄 강조)
 * - Live Header (펄스 점 + 다음 일정 안내)
 * - Stats Grid (진행률 / 위치 / 예산)
 * - Vertical Timeline (Past 완료 / Current featured / Future 예정)
 * - FAB Stack (검색·카메라)
 *
 * 강조 색은 globals.css의 `--color-mode-primary` (data-travel-mode="in-travel" → 코랄).
 */
export function TravelHome({ trip, items, city }: TravelHomeProps) {
  // 데모: Day 1 고정. 사이클 5에서 calculateTravelDay(trip.startDate)로 교체.
  const travelDay = 1;
  const dayIndex = travelDay - 1;

  const [now, setNow] = useState<Date | null>(null);

  // 데모 now: Day 1 첫 항목 종료 + 30분 → 진행률 시연
  const demoNow = useMemo(() => {
    const today = items
      .filter((it) => it.dayIndex === dayIndex)
      .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
    if (today.length === 0) return null;
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

  const dayItems = items
    .filter((it) => it.dayIndex === dayIndex)
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  const currentId = current?.id;
  const nextId = next?.id;
  const pastItems = dayItems.filter((it) => {
    const end = new Date(it.scheduledAt);
    end.setUTCMinutes(end.getUTCMinutes() + it.durationMinutes);
    return end <= referenceNow && it.id !== currentId;
  });
  const futureItems = dayItems.filter((it) => {
    const start = new Date(it.scheduledAt);
    return start > referenceNow && it.id !== currentId && it.id !== nextId;
  });

  const time = now
    ? `${String(now.getHours()).padStart(2, "0")}:${String(
        now.getMinutes()
      ).padStart(2, "0")}`
    : "--:--";
  const progressPercent = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div
      data-travel-mode="in-travel"
      className="min-h-screen bg-surface-soft text-ink pb-32"
    >
      {/* GPS Banner */}
      <div className="w-full bg-success-soft px-td-md py-td-xs flex justify-between items-center sticky top-0 z-50">
        <p className="text-td-meta text-success-deep">
          GPS 확인 — {trip.destination} 도착, 여행 중 모드 전환됨.
        </p>
        <span
          className="material-symbols-outlined text-[16px] text-success-deep"
          aria-hidden
        >
          check
        </span>
      </div>

      {/* TopAppBar */}
      <header className="flex justify-between items-center w-full px-td-md h-14 sticky top-[28px] z-40 bg-surface-card border-b border-divider">
        <div className="flex items-center">
          <span
            className="material-symbols-outlined mr-2 text-mode-primary"
            aria-hidden
          >
            location_on
          </span>
          <h1 className="text-td-body font-bold tracking-tight text-mode-primary">
            DAY {travelDay} · <span className="tabular-nums">{time}</span>
          </h1>
        </div>
        <div className="flex items-center gap-td-sm">
          {/* 사이클 P (ADR-035) — 응급 빠른 액세스 */}
          {city && (
            <EmergencyHeaderButton citySlug={city.slug} emphasized />
          )}
          <Link
            href={`/itinerary/${trip.id}`}
            aria-label="일정 전체"
            className="text-ink-soft hover:text-ink p-1 rounded-full"
          >
            <span className="material-symbols-outlined">calendar_month</span>
          </Link>
          <button
            type="button"
            aria-label="알림"
            className="text-ink-soft hover:text-ink p-1 rounded-full"
          >
            <span className="material-symbols-outlined">notifications</span>
          </button>
        </div>
      </header>

      <main className="px-td-md mt-td-md space-y-td-md">
        {/* Live Header */}
        <section className="space-y-td-xxs">
          <div className="flex items-center gap-td-xs">
            <span
              className="w-2 h-2 rounded-full bg-mode-primary animate-pulse"
              aria-hidden
            />
            <h2 className="text-td-title text-ink">
              DAY {travelDay} · <span className="tabular-nums">{time}</span>
            </h2>
          </div>
          <p className="text-td-body text-ink-soft">
            {next
              ? `다음: ${displayName(next.name)} · ${minutesUntil(
                  next.scheduledAt,
                  referenceNow
                )}분 후`
              : current
              ? "현재 진행 중"
              : "오늘 일정이 모두 끝났어요"}
          </p>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-2 gap-td-xs">
          <div className="col-span-2 bg-surface-card p-td-sm rounded-md border border-divider">
            <div className="flex justify-between items-end mb-td-xs">
              <span className="text-td-meta text-ink-soft">
                진행률 {done}/{total}
              </span>
              <span className="text-td-caption text-mode-primary font-bold">
                {progressPercent}% 완료
              </span>
            </div>
            <div className="w-full bg-surface-soft rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-mode-primary h-full transition-all duration-500 progress-bar"
                data-progress={progressPercent}
              />
            </div>
          </div>

          <div className="bg-surface-card p-td-sm rounded-md border border-divider flex flex-col gap-td-xxs">
            <div className="flex items-center gap-1 text-ink-soft">
              <span
                className="material-symbols-outlined text-[14px]"
                aria-hidden
              >
                location_on
              </span>
              <span className="text-td-meta">현재 위치</span>
            </div>
            <p className="text-td-body font-medium">{trip.destination}</p>
          </div>

          <div className="bg-surface-card p-td-sm rounded-md border border-divider flex flex-col gap-td-xxs">
            <div className="flex items-center gap-1 text-ink-soft">
              <span
                className="material-symbols-outlined text-[14px]"
                aria-hidden
              >
                account_balance_wallet
              </span>
              <span className="text-td-meta">예산 사용</span>
            </div>
            <p className="text-td-body font-medium">
              {progressPercent}% · 정상
            </p>
          </div>
        </section>

        {/* Vertical Timeline */}
        <section className="relative">
          <div
            className="absolute left-[11px] top-4 bottom-4 w-[2px] bg-divider"
            aria-hidden
          />
          <div className="space-y-td-md relative">
            {pastItems.map((item) => (
              <PastTimelineItem key={item.id} item={item} />
            ))}

            {current && <CurrentTimelineItem item={current} tripId={trip.id} />}

            {next && current && (
              <FutureTimelineItem item={next} label="다음 일정" />
            )}
            {next && !current && (
              <CurrentTimelineItem item={next} tripId={trip.id} />
            )}

            {futureItems.map((item) => (
              <FutureTimelineItem key={item.id} item={item} />
            ))}
          </div>
        </section>
      </main>

      {/* M2 자동 모드 전환 — currentMode가 아직 in-travel이 아닐 때만 노출 (ADR-017) */}
      {trip.currentMode !== "in-travel" && (
        <div className="mt-td-md">
          <AutoModeDetector trip={trip} />
        </div>
      )}

      {/* M5 City Context Strip — 사이클 P (ADR-035): currentMode 분기 제거, 항상 노출 */}
      {city && (
        <div className="mt-td-md">
          <CityContextStrip city={city} />
        </div>
      )}

      {/* Speed Dial FAB — 메인 탭 시 검색·카메라 펼침 */}
      <SpeedDialFab bottomClassName="bottom-20" zIndex="z-50">
        <button
          type="button"
          data-speed-dial-action="true"
          aria-label="주변 검색"
          className="w-12 h-12 rounded-full bg-surface-card border border-divider shadow-lg flex items-center justify-center active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-ink" aria-hidden="true">
            search
          </span>
        </button>
        <Link
          href={`/translate?trip=${trip.id}`}
          data-speed-dial-action="true"
          aria-label="카메라 번역"
          className="w-12 h-12 rounded-full bg-surface-card border border-divider shadow-lg flex items-center justify-center active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-ink" aria-hidden="true">
            photo_camera
          </span>
        </Link>
      </SpeedDialFab>

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 max-w-[420px] w-full px-td-md py-td-sm bg-surface-card/90 backdrop-blur-md border-t border-divider z-40 flex justify-between items-center">
        <Link
          href={`/itinerary/${trip.id}`}
          className="text-td-meta text-ink-soft hover:text-ink flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          일정 전체
        </Link>
        <p className="text-td-caption text-ink-mute">ADR-014 · 데모 토글</p>
      </div>
    </div>
  );
}

function PastTimelineItem({ item }: { item: ItineraryItem }) {
  const time = formatTime(item.scheduledAt);
  return (
    <div className="flex gap-td-sm">
      <div className="relative z-10">
        <div className="w-6 h-6 rounded-full bg-success-soft flex items-center justify-center">
          <span className="material-symbols-outlined filled text-[14px] text-success-deep">
            check_circle
          </span>
        </div>
      </div>
      <div className="flex-1 bg-surface-card p-td-sm rounded-lg border border-divider opacity-60">
        <p className="text-td-meta text-ink-soft">{time} — 완료됨</p>
        <h3 className="text-td-body font-medium mt-td-xxs">
          {displayName(item.name)}
        </h3>
      </div>
    </div>
  );
}

function CurrentTimelineItem({
  item,
  tripId,
}: {
  item: ItineraryItem;
  tripId: string;
}) {
  return (
    <div className="flex gap-td-sm">
      <div className="relative z-10">
        <div className="w-6 h-6 rounded-full bg-accent-soft flex items-center justify-center ring-4 ring-accent-soft/40">
          <div className="w-2.5 h-2.5 rounded-full bg-mode-primary" />
        </div>
      </div>
      <div className="flex-1 bg-surface-card p-td-md rounded-md border-l-4 border-mode-primary border-y border-r border-divider shadow-md">
        <div className="flex justify-between items-start mb-td-xs">
          <span className="bg-accent-soft text-accent-deep px-2 py-0.5 rounded-full text-td-caption font-bold uppercase tracking-wider">
            지금
          </span>
          <span className="text-td-meta text-mode-primary font-semibold">
            현재 체류 중
          </span>
        </div>
        <h3 className="text-td-card-title text-ink mb-td-xxs">
          {displayName(item.name)}
        </h3>
        <p className="text-td-body text-ink-soft mb-td-sm">
          {item.evidence.reasons[0] ?? "현재 진행 중인 일정입니다."}
        </p>
        {item.evidence.reasons.length > 0 && (
          <div className="mb-td-sm">
            <EvidencePanel evidence={item.evidence} />
          </div>
        )}
        <Link
          href={`/itinerary/${tripId}/item/${item.id}`}
          className="block text-center bg-mode-primary text-white py-2 rounded-md text-td-meta font-semibold hover:opacity-90 transition-opacity"
        >
          상세 보기
        </Link>
      </div>
    </div>
  );
}

function FutureTimelineItem({
  item,
  label,
}: {
  item: ItineraryItem;
  label?: string;
}) {
  const time = formatTime(item.scheduledAt);
  return (
    <div className="flex gap-td-sm">
      <div className="relative z-10">
        <div className="w-6 h-6 rounded-full bg-surface-soft flex items-center justify-center border border-divider">
          <div className="w-2 h-2 rounded-full bg-ink-mute" />
        </div>
      </div>
      <div className="flex-1 bg-surface-card p-td-sm rounded-md border border-divider shadow-sm">
        <p className="text-td-meta text-ink-soft mb-td-xxs">
          {time} — {label ?? "예정"}
        </p>
        <h3 className="text-td-body font-medium">{displayName(item.name)}</h3>
      </div>
    </div>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(
    d.getUTCMinutes()
  ).padStart(2, "0")}`;
}

function minutesUntil(iso: string, now: Date): number {
  const d = new Date(iso);
  return Math.max(0, Math.round((d.getTime() - now.getTime()) / 60_000));
}

function displayName(name: string): string {
  return name.replace(/\s*\([^)]+\)\s*$/, "");
}
