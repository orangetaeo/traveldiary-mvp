/**
 * Home (Pre-trip) — Stitch #1 매핑
 *
 * Stitch screen: projects/4681512633268080895/screens/626e5350f3cc4f02a943486193eebd6b
 * Magic Moment: M1 추천 근거 패널
 *
 * 사이클 5b 옵션 C — Stitch HTML → React/Tailwind 변환 (2026-04-30).
 * 데모 모드: lib/seed의 푸꾸옥 데이터 직접 import (ADR-009).
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EvidencePanel } from "@/components/ui/EvidencePanel";

export const metadata: Metadata = {
  title: "TRAVELDIARY — 베트남 자유여행 AI 동반자",
  description: "AI가 추천한 일정에 근거까지. 여행 중에는 살아 움직여요.",
};
import { phuQuocTrip, phuQuocItinerary } from "@/lib/seed/phu-quoc";
import { listDemoItemsByDay, listDemoTrips, DEMO_TRIP_ID } from "@/lib/seed";
import { getCityByCode, isVietnamCity } from "@/lib/seed/cities";
import { LoginButton } from "@/components/auth/LoginButton";
import { BottomNav } from "@/components/ui/BottomNav";
import { getCurrentUserId } from "@/lib/auth/session";
import { kakaoAvailable } from "@/lib/auth/kakao";
import { jwtAvailable } from "@/lib/auth/jwt";
import { prisma } from "@/lib/prisma";

import { OrganizationJsonLd, WebAppJsonLd } from "@/components/seo/JsonLd";
import { todayISO } from "@/lib/seed/demo-date";
import { splitName, formatTime, CATEGORY_ICON } from "@/lib/utils/item-display";
const TODAY_ISO = todayISO(); // C1: 고정 날짜 제거 → 실제 오늘 날짜

function dDay(startDate: string, today: string): number {
  const s = new Date(`${startDate}T00:00:00.000Z`);
  const t = new Date(`${today}T00:00:00.000Z`);
  return Math.ceil((s.getTime() - t.getTime()) / (1000 * 60 * 60 * 24));
}

export default async function HomePage() {
  const days = listDemoItemsByDay(DEMO_TRIP_ID);
  const day1Items = days[0] ?? [];
  const totalItems = phuQuocItinerary.length;
  const dDayNum = dDay(phuQuocTrip.startDate, TODAY_ISO);

  // 사이클 11b — 로그인 상태 + OAuth 가용성 확인
  const oauthAvailable = kakaoAvailable() && jwtAvailable();
  const currentUserId = oauthAvailable ? await getCurrentUserId() : null;
  const currentUser =
    currentUserId && prisma
      ? await prisma.user.findUnique({
          where: { id: currentUserId },
          select: { id: true, name: true },
        })
      : null;

  // Stitch 디자인의 두 번째 카드(featured = AI 추천 최적) — Day 1에서 가장 의미 있는 항목
  const featuredId = "pq-item-1"; // 즈엉동 야시장
  // Evidence가 가장 풍부한 마지막 카드에만 EvidencePanel 표시 (Stitch와 일치)
  const evidenceCardId = day1Items[day1Items.length - 1]?.id;

  return (
    <div className="min-h-screen bg-surface-soft text-ink pb-24">
      <OrganizationJsonLd
        name="TRAVELDIARY"
        url="https://traveldiary-mvp-production.up.railway.app"
        description="베트남 자유여행자를 위한 AI 여행 동반자"
        logo="https://traveldiary-mvp-production.up.railway.app/icon-512.png"
      />
      <WebAppJsonLd
        name="TRAVELDIARY"
        url="https://traveldiary-mvp-production.up.railway.app"
        description="AI가 추천한 일정에 근거까지. 베트남 6개 도시 완전 지원."
        applicationCategory="TravelApplication"
        operatingSystem="Web"
      />
      {/* TopAppBar */}
      <header className="bg-surface-card border-b border-divider sticky top-0 z-40 flex justify-between items-center w-full px-td-md h-16">
        <div className="flex items-center gap-td-sm">
          <button
            type="button"
            className="hover:bg-surface-soft transition-colors p-2 rounded-full"
            aria-label="메뉴"
          >
            <span className="material-symbols-outlined text-ink">menu</span>
          </button>
          <h1 className="text-lg font-bold text-ink tracking-tight">TravelDiary</h1>
        </div>
        <LoginButton
          currentUserId={currentUserId}
          currentUserName={currentUser?.name}
          oauthAvailable={oauthAvailable}
        />
      </header>

      <main className="px-td-md pt-td-lg">
        {/* Hero — 검증 뱃지 + 제목 + D-day + Summary */}
        <section className="mb-td-lg">
          <div className="mb-td-xxs">
            <Badge tone="info">AI가 24곳 검증 완료</Badge>
          </div>
          <h2 className="text-td-title text-ink mb-td-xxs">
            {phuQuocTrip.destination} {phuQuocTrip.nights}박 {phuQuocTrip.nights + 1}일
          </h2>
          <p className="text-td-body text-ink-soft mb-td-md">
            {dDayNum > 0
              ? `출발까지 D-${dDayNum}`
              : dDayNum === 0
              ? "출발 당일"
              : `진행 중 D+${-dDayNum}`}
          </p>

          {/* Summary Strip — 3 columns */}
          <div className="grid grid-cols-3 gap-td-xs p-td-sm bg-surface-card rounded-xl border border-divider">
            <div className="text-center border-r border-divider">
              <p className="text-td-caption text-ink-soft">동선 거리</p>
              <p className="text-td-meta font-bold text-ink mt-0.5">12km</p>
            </div>
            <div className="text-center border-r border-divider">
              <p className="text-td-caption text-ink-soft">예상 경비</p>
              <p className="text-td-meta font-bold text-ink mt-0.5">₩450,000</p>
            </div>
            <div className="text-center">
              <p className="text-td-caption text-ink-soft">일정 항목</p>
              <p className="text-td-meta font-bold text-ink mt-0.5">{totalItems}개</p>
            </div>
          </div>
        </section>

        {/* Day Tabs */}
        <nav className="flex gap-td-xs mb-td-md overflow-x-auto pb-2" aria-label="여행 일자">
          {Array.from({ length: phuQuocTrip.nights + 1 }, (_, i) => i).map((d) => {
            const active = d === 0;
            return (
              <Link
                key={d}
                href={`/itinerary/${DEMO_TRIP_ID}?day=${d}`}
                className={`px-td-md py-td-xs rounded-full text-td-meta whitespace-nowrap transition-colors ${
                  active
                    ? "bg-purple text-white shadow-sm"
                    : "bg-surface-card text-ink-soft border border-divider hover:bg-surface-soft"
                }`}
                aria-current={active ? "page" : undefined}
              >
                Day {d + 1}
              </Link>
            );
          })}
        </nav>

        {/* Timeline */}
        <div className="relative space-y-td-md">
          {/* Vertical line */}
          <div
            className="absolute left-[15px] top-6 bottom-6 w-0.5 bg-divider z-0"
            aria-hidden
          />

          {day1Items.map((item) => {
            const isFeatured = item.id === featuredId;
            const time = formatTime(item.scheduledAt);
            const { ko, en } = splitName(item.name);
            const isBooked =
              item.flexibility === "booked" || item.flexibility === "fixed";
            const showEvidence =
              item.id === evidenceCardId &&
              item.evidence &&
              item.evidence.reasons.length > 0;

            return (
              <div key={item.id} className="relative pl-td-lg">
                {/* Dot icon */}
                <div
                  className={`absolute left-0 top-6 w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                    isFeatured
                      ? "bg-purple text-white shadow-lg"
                      : "bg-surface-card border-2 border-divider text-ink-soft"
                  }`}
                  aria-hidden
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {CATEGORY_ICON[item.category] ?? "place"}
                  </span>
                </div>

                <Card
                  variant={isFeatured ? "featured" : "raised"}
                  className={`!p-td-md ${
                    isFeatured ? "shadow-md" : "shadow-sm"
                  }`}
                >
                  <Link
                    href={`/itinerary/${DEMO_TRIP_ID}/item/${item.id}`}
                    className="block -m-td-md p-td-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple rounded-lg"
                  >
                    <div className="flex justify-between items-start mb-td-xs">
                      <div className="flex flex-col">
                        <span
                          className={`text-td-caption ${
                            isFeatured ? "text-purple font-bold" : "text-ink-soft"
                          }`}
                        >
                          {time}
                        </span>
                        {isFeatured && (
                          <span className="text-td-caption text-purple">
                            AI 추천 최적 도착
                          </span>
                        )}
                      </div>
                      {isBooked ? (
                        <Badge tone="success">예약 완료</Badge>
                      ) : (
                        <Badge tone="info">AI 추천</Badge>
                      )}
                    </div>
                    <h3 className="text-td-card-title text-ink">{ko}</h3>
                    {en && (
                      <p className="text-td-caption text-ink-soft mt-td-xxs">{en}</p>
                    )}
                  </Link>

                  {showEvidence && (
                    <div className="mt-td-sm">
                      <EvidencePanel evidence={item.evidence} />
                    </div>
                  )}
                </Card>
              </div>
            );
          })}
        </div>

        {/* 다른 도시 둘러보기 (사이클 D) — 사이클 I (ADR-033) "전체 보기" 링크 추가 */}
        <section className="px-td-md pt-td-lg pb-td-md">
          <div className="flex items-baseline justify-between mb-td-sm">
            <h2 className="text-td-card-title text-ink">다른 도시 둘러보기</h2>
            <Link
              href="/trips"
              className="text-td-caption text-purple-deep hover:underline"
            >
              전체 보기 →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-td-sm">
            {listDemoTrips()
              .filter((b) => b.trip.id !== DEMO_TRIP_ID)
              .filter((b) => isVietnamCity(getCityByCode(b.trip.destinationCode)))
              .map((b) => (
                <Link
                  key={b.trip.id}
                  href={`/itinerary/${b.trip.id}`}
                  className="block p-td-sm bg-surface-card border border-divider rounded-xl hover:border-purple/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-td-meta text-ink-soft uppercase tabular-nums">
                      {b.trip.destinationCode}
                    </p>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-700">
                      체험
                    </span>
                  </div>
                  <p className="text-td-card-title text-ink mt-td-xxs">
                    {b.trip.destination}
                  </p>
                  <p className="text-td-caption text-ink-mute mt-td-xxs">
                    {b.trip.nights}박 {b.trip.nights + 1}일 · {b.items.length} 일정
                  </p>
                </Link>
              ))}
          </div>
        </section>

        {/* 여행 가이드 CTA (C3 SEO) */}
        <section className="px-td-md pb-td-lg">
          <Link
            href="/guide"
            className="block bg-gradient-to-r from-purple/10 to-accent/10 border border-purple/20 rounded-xl p-td-md hover:border-purple/40 transition-colors"
          >
            <div className="flex items-center gap-td-sm">
              <span className="material-symbols-outlined text-purple text-2xl">
                menu_book
              </span>
              <div>
                <p className="text-td-card-title text-ink font-medium">
                  베트남 여행 가이드
                </p>
                <p className="text-td-caption text-ink-soft">
                  도시별 시그니처 코스 · 맛집 · 일출 명소
                </p>
              </div>
              <span className="material-symbols-outlined text-ink-mute ml-auto">
                chevron_right
              </span>
            </div>
          </Link>
        </section>
      </main>

      {/* FAB — Pre-trip 모드에서도 검색·번역 빠른 진입 */}
      <div className="fixed right-td-md bottom-24 flex flex-col gap-td-xs z-40 max-w-[420px] left-1/2 -translate-x-1/2 pointer-events-none">
        <div className="ml-auto flex flex-col gap-td-xs pointer-events-auto pr-td-md">
          <button
            type="button"
            className="w-12 h-12 bg-surface-card text-ink border border-divider rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform"
            aria-label="주변 검색"
          >
            <span className="material-symbols-outlined">search</span>
          </button>
          <Link
            href="/translate"
            className="w-14 h-14 bg-purple text-white rounded-full shadow-xl flex items-center justify-center active:scale-95 transition-transform"
            aria-label="카메라 번역"
          >
            <span className="material-symbols-outlined">photo_camera</span>
          </Link>
        </div>
      </div>

      {/* Bottom Nav — 사이클 O 컴포넌트 추출 (사이클 I ADR-033) */}
      <BottomNav active="home" />
    </div>
  );
}
