"use client";

import Link from "next/link";
import {
  WEATHER_ICON_NAME,
  WEATHER_ICON_COLOR,
  WEATHER_ICON_LABEL,
  type WeatherDay,
} from "@/lib/seed/weather";
import type { ItineraryItem, ResolvedCity, Trip } from "@/lib/types";
import type { MorningPhrase } from "@/lib/seed/morning-phrases";

interface MorningBriefingProps {
  trip: Trip;
  city: ResolvedCity | null;
  travelDay: number;
  todayWeather: WeatherDay;
  firstItem: ItineraryItem | null;
  todayCount: number;
  phrase: MorningPhrase;
}

/**
 * A1 모닝 브리핑 — 디자인 갭 자율 발견 #1.
 *
 * 진입: D-Day 모드(`/travel/[id]`)에서 헤더 진입 링크.
 * 데이터: trip + items + city + weather seed (외부 API 0).
 * 알림 트리거(매일 7시 push)는 R1 게이트 — 본 사이클은 화면만.
 */
export function MorningBriefing({
  trip,
  city,
  travelDay,
  todayWeather,
  firstItem,
  todayCount,
  phrase,
}: MorningBriefingProps) {
  const cityName = city?.name ?? trip.destination;
  const firstTimeStr = firstItem ? formatTime(firstItem.scheduledAt) : null;
  const departLead = firstItem ? estimateDepartLeadMin(firstItem) : null;

  return (
    <div className="min-h-screen bg-surface-soft text-ink pb-24">
      {/* TopAppBar */}
      <header className="flex justify-between items-center w-full px-td-md h-14 sticky top-0 z-40 bg-surface-card border-b border-divider">
        <Link
          href={`/travel/${trip.id}`}
          aria-label="여행 중 홈으로"
          className="text-ink-soft hover:text-ink p-1 -ml-1 rounded-full"
        >
          <span className="material-symbols-outlined" aria-hidden>
            arrow_back
          </span>
        </Link>
        <h1 className="text-td-body font-bold tracking-tight text-ink">
          오늘의 브리핑
        </h1>
        <div className="w-6" aria-hidden />
      </header>

      <main className="px-td-md mt-td-md space-y-td-md">
        {/* 인사 카드 */}
        <section className="bg-surface-card p-td-md rounded-md border border-divider">
          <p className="text-td-meta text-ink-soft">아침 인사</p>
          <h2 className="text-td-title text-ink mt-td-xxs leading-snug">
            오늘은 <span className="text-mode-primary font-bold">{cityName}</span>에서{" "}
            <span className="tabular-nums">{travelDay}</span>일째에요
          </h2>
          <p className="text-td-meta text-ink-soft mt-td-xs">
            {totalDescription(todayCount)}
          </p>
        </section>

        {/* 날씨 카드 */}
        <section
          aria-label="오늘 날씨"
          className="bg-surface-card p-td-md rounded-md border border-divider flex items-center gap-td-md"
        >
          <span
            className={`material-symbols-outlined text-[40px] ${WEATHER_ICON_COLOR[todayWeather.icon]}`}
            aria-hidden
          >
            {WEATHER_ICON_NAME[todayWeather.icon]}
          </span>
          <div className="flex-1">
            <p className="text-td-meta text-ink-soft">오늘 날씨</p>
            <p className="text-td-card-title text-ink mt-td-xxs">
              <span className="tabular-nums">{todayWeather.tempC}</span>°C ·{" "}
              {WEATHER_ICON_LABEL[todayWeather.icon]}
            </p>
          </div>
        </section>

        {/* 첫 일정 카드 */}
        {firstItem ? (
          <section
            aria-label="첫 일정"
            className="bg-surface-card p-td-md rounded-md border border-divider"
          >
            <div className="flex items-center justify-between mb-td-xs">
              <span className="text-td-meta text-ink-soft">첫 일정</span>
              <span className="text-td-meta text-mode-primary font-semibold tabular-nums">
                {firstTimeStr}
              </span>
            </div>
            <h3 className="text-td-card-title text-ink">{displayName(firstItem.name)}</h3>
            <p className="text-td-meta text-ink-soft mt-td-xxs">
              {firstItem.location.address}
            </p>
            {departLead !== null && (
              <p className="text-td-body text-ink mt-td-sm">
                <span
                  className="material-symbols-outlined text-[16px] text-mode-primary mr-1 align-middle"
                  aria-hidden
                >
                  schedule
                </span>
                출발 권장:{" "}
                <span className="font-semibold tabular-nums">{departLead}</span>분 전
              </p>
            )}
            <Link
              href={`/itinerary/${trip.id}/item/${firstItem.id}`}
              className="block text-center bg-mode-primary text-white py-2 mt-td-sm rounded-md text-td-meta font-semibold hover:opacity-90 transition-opacity"
            >
              상세 보기
            </Link>
          </section>
        ) : (
          <section className="bg-surface-card p-td-md rounded-md border border-divider">
            <p className="text-td-body text-ink-soft">
              오늘은 자유 일정이에요. 도시를 마음껏 둘러보세요.
            </p>
          </section>
        )}

        {/* 오늘의 베트남어 */}
        <section
          aria-label="오늘의 베트남어"
          className="bg-accent-soft p-td-md rounded-md border border-divider"
        >
          <p className="text-td-meta text-accent-deep font-semibold">
            오늘의 베트남어
          </p>
          <p className="text-td-card-title text-ink mt-td-xs">{phrase.vi}</p>
          <p className="text-td-meta text-ink-soft mt-td-xxs">
            <span className="font-medium">{phrase.pronunciation}</span> · {phrase.ko}
          </p>
        </section>

        {/* CTA — 전체 일정 보기 */}
        <Link
          href={`/itinerary/${trip.id}`}
          className="block w-full text-center bg-surface-card border border-divider py-3 rounded-md text-td-body font-semibold text-ink hover:bg-surface-soft transition-colors"
        >
          전체 일정 보기
        </Link>

        <p className="text-td-caption text-ink-mute text-center pt-td-xs">
          매일 아침 알림은 출시 후 활성화돼요 (R1 게이트 + PWA 푸시).
        </p>
      </main>
    </div>
  );
}

function totalDescription(count: number): string {
  if (count === 0) return "오늘은 일정이 비어있어요";
  if (count === 1) return "오늘 일정 1개";
  return `오늘 일정 ${count}개`;
}

function displayName(name: string): string {
  return name.replace(/\s*\([^)]+\)\s*$/, "");
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(
    d.getUTCMinutes()
  ).padStart(2, "0")}`;
}

/**
 * 출발 권장 시간(분 전) — 카테고리·도시 컨텍스트로 추정.
 * 외부 API 미연동(Distance Matrix). 베트남 더위/짐/그랩 대기 고려한 단순 추정치.
 */
function estimateDepartLeadMin(item: ItineraryItem): number {
  switch (item.category) {
    case "food":
      return 20;
    case "shopping":
      return 25;
    case "rest":
      return 15;
    case "spot":
    default:
      return 30;
  }
}
