import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { ItineraryView } from "@/components/itinerary/ItineraryView";
import { getDemoTrip } from "@/lib/seed";
import { fetchTripFromDb } from "@/lib/repositories/trip.repository";

/**
 * 일정 전체 화면 (LEVEL 1)
 *
 * - 헤더: 목적지 · N박 N일 · 동행 · 페이스
 * - 통계 카드 + Day 탭 + Live Replan 시뮬레이션 진입 (사이클 2)
 *
 * 모드 색상 (T17 / docs/02-magic-moments.md M2):
 *   currentMode === "pre-travel" → 강조색 보라 (계획)
 *   사이클 3에서 in-travel 시 코랄로 자동 전환.
 *
 * 데이터: 서버에서 시드 import → 클라이언트 ItineraryView에 전달.
 * Replan으로 인한 변경은 클라이언트 상태로만 — ADR-012.
 */
export default async function ItineraryPage({ params }: { params: { id: string } }) {
  // DB-우선 조회. 없으면 시드 fallback (ADR-009/013).
  const bundle = (await fetchTripFromDb(params.id)) ?? getDemoTrip(params.id);
  if (!bundle) notFound();

  const { trip, items } = bundle;
  const startDate = formatDate(trip.startDate);
  const endDate = addDays(trip.startDate, trip.nights);

  return (
    <main
      className="min-h-screen flex flex-col"
      data-travel-mode={trip.currentMode ?? "pre-travel"}
    >
      <header className="px-5 pt-5 pb-3 border-b border-divider">
        <div className="flex items-center justify-between mb-1.5">
          <Link
            href="/onboarding"
            className="text-[12px] text-ink-soft hover:text-ink"
          >
            ‹ 처음으로
          </Link>
          <Badge tone="info">계획 중</Badge>
        </div>
        <h1 className="text-[22px] font-medium leading-tight">
          {trip.destination} {trip.nights}박 {trip.nights + 1}일
        </h1>
        <p className="text-[12px] text-ink-soft mt-1">
          {startDate} – {formatDate(endDate)} · {companionLabel(trip.companion)} · {paceLabel(trip.preferences.pace)}
        </p>
      </header>

      <ItineraryView trip={trip} initialItems={items} />

      <footer className="border-t border-divider p-4">
        <p className="text-[11px] text-ink-mute text-center">
          데모 모드 · 푸꾸옥 시드 데이터 (ADR-009) · Replan은 클라이언트 시뮬레이션 (ADR-012)
        </p>
      </footer>
    </main>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일`;
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function companionLabel(c: string): string {
  return ({
    solo: "혼자",
    friends: "친구·연인",
    family: "가족",
    group: "단체",
  } as Record<string, string>)[c] ?? c;
}

function paceLabel(p: string): string {
  return ({
    relaxed: "여유로운 페이스",
    balanced: "균형 페이스",
    packed: "꽉 찬 페이스",
  } as Record<string, string>)[p] ?? p;
}
