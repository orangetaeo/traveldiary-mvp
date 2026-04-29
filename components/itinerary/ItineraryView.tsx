"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DayTabs } from "./DayTabs";
import { ReplanModal } from "./ReplanModal";
import {
  generateReplanOptions,
  type ReplanTrigger,
} from "@/lib/replan";
import type { ItineraryItem, ReplanOption, Trip } from "@/lib/types";

interface ItineraryViewProps {
  trip: Trip;
  initialItems: ItineraryItem[];
}

/**
 * 일정 전체 화면의 클라이언트 래퍼.
 *
 * 사이클 2(ADR-012): Replan 결과를 클라이언트 상태로만 보관.
 * 새로고침 시 시드(initialItems)로 리셋 — "데모 시뮬레이션"임을 모달 헤더에 명시.
 */
export function ItineraryView({ trip, initialItems }: ItineraryViewProps) {
  const [items, setItems] = useState<ItineraryItem[]>(initialItems);
  const [replanOpen, setReplanOpen] = useState(false);
  const [activeTrigger, setActiveTrigger] = useState<ReplanTrigger | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [appliedLabel, setAppliedLabel] = useState<string | null>(null);

  const days = useMemo(() => groupByDay(items, trip.nights + 1), [items, trip.nights]);

  // 시연 트리거 — 합의문(2026-04-29-cycle-2) A4.
  // Day 3 사오비치(pq-item-6) 90분 지연이 가장 풍부한 영향 시각화를 보여줌.
  const demoTrigger: ReplanTrigger = {
    type: "delay",
    itemId: "pq-item-6",
    minutes: 90,
  };
  const demoTriggerItem = items.find((it) => it.id === demoTrigger.itemId) ?? null;

  const replanResults = useMemo(
    () => (replanOpen ? generateReplanOptions(items, demoTrigger) : []),
    // demoTrigger는 const라 deps에 안 넣어도 됨
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [replanOpen, items],
  );

  const totalItems = items.length;
  const bookedCount = items.filter((it) => it.flexibility === "booked").length;
  const fixedCount = items.filter((it) => it.flexibility === "fixed").length;

  function handleApply(itemsAfter: ItineraryItem[], option: ReplanOption) {
    setItems(itemsAfter);
    setReplanOpen(false);
    setAppliedLabel(option.label);
    setToast(`${option.label} 옵션 적용 — Day ${(demoTriggerItem?.dayIndex ?? 0) + 1} 일정 갱신됨`);
    setTimeout(() => setToast(null), 4000);
  }

  function handleReset() {
    setItems(initialItems);
    setAppliedLabel(null);
    setToast("초기 일정으로 되돌림");
    setTimeout(() => setToast(null), 3000);
  }

  return (
    <>
      <section className="grid grid-cols-3 gap-2 px-5 py-4 border-b border-divider">
        <Stat label="일정" value={`${totalItems}곳`} />
        <Stat label="예약 완료" value={`${bookedCount}건`} />
        <Stat label="고정" value={`${fixedCount}건`} />
      </section>

      <section className="px-4 py-4 flex-1">
        <DayTabs days={days} hrefBase={`/itinerary/${trip.id}`} />
      </section>

      <section className="px-4 pb-4 space-y-2.5">
        <div className="bg-surface-soft border border-divider rounded-lg p-3.5">
          <div className="flex items-center justify-between gap-3 mb-2">
            <p className="text-[12px] font-medium text-ink">
              지연 시뮬레이션 (M3)
            </p>
            {appliedLabel && (
              <Badge tone="info">{appliedLabel} 적용됨</Badge>
            )}
          </div>
          <p className="text-[11px] text-ink-soft mb-3 leading-relaxed">
            Day 3 사오비치가 90분 지연된 상황. 추천·안전·강행 3옵션을 비교해 보세요.
          </p>
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setReplanOpen(true)}
            >
              Live Replan 열기
            </Button>
            {appliedLabel && (
              <Button variant="secondary" size="sm" onClick={handleReset}>
                초기화
              </Button>
            )}
          </div>
        </div>

        <div className="bg-surface-soft border border-divider rounded-lg p-3.5">
          <p className="text-[12px] font-medium text-ink mb-2">
            여행 중 모드 (M2)
          </p>
          <p className="text-[11px] text-ink-soft mb-3 leading-relaxed">
            출발일 + 위치 자동 감지 대신 데모 토글로 전환합니다 (ADR-014).
            헤더 색이 보라 → 코랄로 바뀌고 FAB가 등장해요.
          </p>
          <Link
            href={`/travel/${trip.id}`}
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-accent-deep hover:text-accent border border-accent/40 rounded-md px-3 py-2 transition-colors"
          >
            여행 중 모드로 전환 (데모) →
          </Link>
        </div>
      </section>

      <ReplanModal
        open={replanOpen}
        trigger={demoTrigger}
        triggerItem={demoTriggerItem}
        results={replanResults}
        onApply={handleApply}
        onClose={() => setReplanOpen(false)}
      />

      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-ink text-white text-[12px] px-4 py-2.5 rounded-full shadow-lg"
          role="status"
        >
          {toast}
        </div>
      )}
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-soft rounded-md p-2.5 text-center">
      <p className="text-[10px] text-ink-soft tracking-wider">{label}</p>
      <p className="text-[14px] font-medium mt-0.5">{value}</p>
    </div>
  );
}

function groupByDay(items: ItineraryItem[], dayCount: number): ItineraryItem[][] {
  const days: ItineraryItem[][] = Array.from({ length: dayCount }, () => []);
  for (const it of items) {
    if (days[it.dayIndex]) days[it.dayIndex].push(it);
  }
  for (const list of days) {
    list.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  }
  return days;
}
