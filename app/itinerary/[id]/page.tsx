/**
 * Itinerary 페이지 — Stitch #3 (Pre-trip) + #4 (On-trip) 매핑
 *
 * Stitch screens:
 *   #3 efa93174768e4fe588bff68d57fab330 (Itinerary Home)
 *   #4 5beff0fc64fb455aa3a0a2b2d735f3d1 (Itinerary - On-trip)
 *
 * 모드 분기:
 *   currentMode === "pre-travel"  → 보라 강조 (#3)
 *   currentMode === "in-travel"   → 코랄 강조 + LIVE 뱃지 (#4)
 *
 * 사이클 5b 옵션 C (2026-04-30): Stitch HTML 변환.
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { ItineraryView } from "@/components/itinerary/ItineraryView";
import { getDemoTrip } from "@/lib/seed";
import { fetchTripFromDb } from "@/lib/repositories/trip.repository";

const TODAY_ISO = "2026-04-30";

export default async function ItineraryPage({ params }: { params: { id: string } }) {
  const bundle = (await fetchTripFromDb(params.id)) ?? getDemoTrip(params.id);
  if (!bundle) notFound();

  const { trip, items } = bundle;
  const isOnTrip = trip.currentMode === "in-travel";
  const dDayNum = dDay(trip.startDate, TODAY_ISO);

  return (
    <div
      className="min-h-screen bg-surface-soft text-ink pb-24"
      data-travel-mode={trip.currentMode ?? "pre-travel"}
    >
      {/* TopAppBar */}
      <header className="bg-surface-card border-b border-divider sticky top-0 z-40 flex justify-between items-center w-full px-td-md h-16">
        <div className="flex items-center gap-td-sm">
          <Link
            href="/"
            aria-label="뒤로"
            className="p-2 rounded-full hover:bg-surface-soft transition-colors"
          >
            <span className="material-symbols-outlined text-ink">arrow_back</span>
          </Link>
          <h1 className="text-lg font-bold text-ink tracking-tight">TravelDiary</h1>
        </div>
        {isOnTrip && (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-accent-soft text-accent-deep rounded-full text-td-caption font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-deep animate-pulse" aria-hidden />
            LIVE
          </span>
        )}
      </header>

      <main className="max-w-xl mx-auto pt-td-lg">
        {/* Hero */}
        <section className="mb-td-md px-td-md">
          <div className="mb-td-xxs">
            <span
              className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                isOnTrip
                  ? "bg-accent-soft text-accent-deep"
                  : "bg-purple-soft text-purple-deep"
              }`}
            >
              {isOnTrip ? "여행 중 · 실시간 동행" : "AI가 24곳 검증 완료"}
            </span>
          </div>
          <h2 className="text-td-title text-ink mb-td-xxs">
            {trip.destination} {trip.nights}박 {trip.nights + 1}일
          </h2>
          <p className="text-td-body text-ink-soft mb-td-md">
            {formatRange(trip.startDate, trip.nights)} ·{" "}
            {companionLabel(trip.companion)} · {paceLabel(trip.preferences.pace)}
            {!isOnTrip && (
              <>
                {" "}·{" "}
                <span className="font-semibold text-purple">
                  {dDayNum > 0
                    ? `D-${dDayNum}`
                    : dDayNum === 0
                    ? "출발 당일"
                    : `D+${-dDayNum}`}
                </span>
              </>
            )}
          </p>

          {/* Summary Strip */}
          <div className="grid grid-cols-3 gap-td-xs p-td-sm bg-surface-card rounded-xl border border-divider">
            <Stat label="일정" value={`${items.length}곳`} />
            <Stat label="예약" value={`${items.filter((i) => i.flexibility === "booked").length}건`} divider />
            <Stat label="고정" value={`${items.filter((i) => i.flexibility === "fixed").length}건`} divider />
          </div>
        </section>

        <ItineraryView trip={trip} initialItems={items} />
      </main>
    </div>
  );
}

function Stat({
  label,
  value,
  divider,
}: {
  label: string;
  value: string;
  divider?: boolean;
}) {
  return (
    <div className={`text-center ${divider ? "border-l border-divider" : ""}`}>
      <p className="text-td-caption text-ink-soft">{label}</p>
      <p className="text-td-meta font-bold text-ink mt-0.5">{value}</p>
    </div>
  );
}

function dDay(startDate: string, today: string): number {
  const s = new Date(`${startDate}T00:00:00.000Z`);
  const t = new Date(`${today}T00:00:00.000Z`);
  return Math.ceil((s.getTime() - t.getTime()) / (1000 * 60 * 60 * 24));
}

function formatRange(startDate: string, nights: number): string {
  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + nights);
  const fmt = (d: Date) => `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일`;
  return `${fmt(start)} – ${fmt(end)}`;
}

function companionLabel(c: string): string {
  return (
    ({
      solo: "혼자",
      friends: "친구·연인",
      family: "가족",
      group: "단체",
    } as Record<string, string>)[c] ?? c
  );
}

function paceLabel(p: string): string {
  return (
    ({
      relaxed: "여유로운 페이스",
      balanced: "균형 페이스",
      packed: "꽉 찬 페이스",
    } as Record<string, string>)[p] ?? p
  );
}
