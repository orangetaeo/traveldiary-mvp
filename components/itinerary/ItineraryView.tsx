"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { ReplanModal } from "./ReplanModal";
import { ReplanTriggerCard } from "./ReplanTriggerCard";
import { TripSecondaryActions } from "./TripSecondaryActions";
import { ItineraryItemCard } from "./ItineraryItemCard";
import { DayTabsBar } from "./DayTabsBar";
import {
  generateReplanOptions,
  type ReplanTrigger,
} from "@/lib/replan";
import type { ItineraryItem, ReplanOption, Trip } from "@/lib/types";
import { commitReplan, type ReplanOptionId } from "@/actions/replan";
import { setTripMode } from "@/actions/trip";
import {
  addItineraryItem,
  reorderItineraryItems,
} from "@/actions/itinerary";
import { AddItemModal } from "./AddItemModal";
import { ShareModal } from "@/components/share/ShareModal";

interface ItineraryViewProps {
  trip: Trip;
  initialItems: ItineraryItem[];
}

/**
 * Itinerary 클라이언트 뷰 — Stitch #3/#4 디자인 (2026-04-30 옵션 C).
 *
 * 모드 강조색은 globals.css의 `--color-mode-primary` 변수로 자동 swap
 * (page에서 data-travel-mode 속성 설정).
 * pre-travel: 보라 / in-travel: 코랄 / post-travel: 그린.
 */
export function ItineraryView({ trip, initialItems }: ItineraryViewProps) {
  const router = useRouter();
  const [items, setItems] = useState<ItineraryItem[]>(initialItems);
  const [activeDay, setActiveDay] = useState(0);
  const [replanOpen, setReplanOpen] = useState(false);
  const [appliedLabel, setAppliedLabel] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  // 사이클 10 — A2 드래그 + A5 자유 추가
  const [addOpen, setAddOpen] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  // 사이클 11a — M7 공유
  const [shareOpen, setShareOpen] = useState(false);
  // 사이클 X — 동적 replan trigger (카드별 "지연 발생" 진입점)
  const [activeTrigger, setActiveTrigger] = useState<ReplanTrigger | null>(null);

  const days = useMemo(
    () => groupByDay(items, trip.nights + 1),
    [items, trip.nights]
  );
  const dayItems = days[activeDay] ?? [];
  const isOnTrip = trip.currentMode === "in-travel";

  const featuredId =
    dayItems.find((it) => it.priority === 5)?.id ??
    dayItems[1]?.id ??
    dayItems[0]?.id;

  const evidenceCardId = [...dayItems].sort(
    (a, b) =>
      (b.evidence?.reasons.length ?? 0) - (a.evidence?.reasons.length ?? 0)
  )[0]?.id;

  // activeTrigger가 있으면 그걸 우선, 없으면 데모 시드 trigger로 폴백
  const fallbackTriggerId = items.find((it) => it.id === "pq-item-6")?.id
    ?? items.find((it) => it.priority >= 4)?.id
    ?? items[0]?.id
    ?? "";
  const effectiveTrigger: ReplanTrigger = activeTrigger ?? {
    type: "delay",
    itemId: fallbackTriggerId,
    minutes: 90,
  };
  const demoTriggerItem =
    items.find((it) => it.id === effectiveTrigger.itemId) ?? null;

  const replanResults = useMemo(
    () =>
      replanOpen ? generateReplanOptions(items, effectiveTrigger) : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [replanOpen, items, effectiveTrigger.itemId, effectiveTrigger.minutes, effectiveTrigger.type]
  );

  // 사이클 CC — buildTrigger / openReplanWithTrigger는 ReplanTriggerCard로 이전

  function handleApply(itemsAfter: ItineraryItem[], option: ReplanOption) {
    // 1. 클라이언트 즉시 반영 (optimistic update — 데모/DB 모두 동일 UX)
    setItems(itemsAfter);
    setReplanOpen(false);
    setAppliedLabel(option.label);

    // 2. Server Action 호출 — 데모 trip ID면 서버가 demo:true 반환 (DB 미쓰기)
    startTransition(async () => {
      const result = await commitReplan({
        tripId: trip.id,
        optionId: option.id as ReplanOptionId,
        trigger: effectiveTrigger,
        expectedTripUpdatedAt: trip.updatedAt,
      });

      if (!result.ok) {
        if (result.code === "conflict") {
          setToast("일정이 다른 탭에서 변경됐어요. 새로고침합니다.");
          router.refresh();
        } else {
          setToast(`적용 실패: ${result.code}`);
        }
        setTimeout(() => setToast(null), 4000);
        return;
      }

      const dayLabel = `Day ${(demoTriggerItem?.dayIndex ?? 0) + 1}`;
      if (result.demo) {
        setToast(`${option.label} 옵션 적용 — ${dayLabel} (데모 시뮬)`);
      } else {
        setToast(
          `${option.label} 적용됨 — ${dayLabel} ${result.changedCount}건 DB 영속화`,
        );
        router.refresh();
      }
      setTimeout(() => setToast(null), 4000);
    });
  }

  function handleReset() {
    setItems(initialItems);
    setAppliedLabel(null);
    setToast("초기 일정으로 되돌림 (클라이언트 상태)");
    setTimeout(() => setToast(null), 3000);
  }

  // ── 사이클 10 — A2 드래그 정렬 ──────────────────────────────────────
  function handleDragStart(e: React.DragEvent, id: string) {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  }

  function handleDragOver(e: React.DragEvent, id: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (id !== dragOverId) setDragOverId(id);
  }

  function handleDragLeave() {
    setDragOverId(null);
  }

  function handleDragEnd() {
    setDraggingId(null);
    setDragOverId(null);
  }

  function handleDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault();
    setDragOverId(null);

    const sourceId = draggingId ?? e.dataTransfer.getData("text/plain");
    setDraggingId(null);
    if (!sourceId || sourceId === targetId) return;

    const source = items.find((it) => it.id === sourceId);
    const target = items.find((it) => it.id === targetId);
    if (!source || !target) return;
    if (source.dayIndex !== target.dayIndex) {
      setToast("같은 Day 내에서만 순서를 바꿀 수 있어요.");
      setTimeout(() => setToast(null), 3000);
      return;
    }

    // 두 카드의 scheduledAt swap (durationMinutes·dependencies 그대로)
    const newItems = items.map((it) => {
      if (it.id === sourceId) return { ...it, scheduledAt: target.scheduledAt };
      if (it.id === targetId) return { ...it, scheduledAt: source.scheduledAt };
      return it;
    });
    setItems(newItems);

    // Server Action — 변경된 두 항목만 batch update
    startTransition(async () => {
      const result = await reorderItineraryItems({
        tripId: trip.id,
        changes: [
          { id: sourceId, scheduledAt: target.scheduledAt },
          { id: targetId, scheduledAt: source.scheduledAt },
        ],
      });
      if (!result.ok) {
        // 롤백
        setItems(items);
        setToast(`정렬 실패: ${result.code}`);
        setTimeout(() => setToast(null), 3000);
        return;
      }
      if (result.demo) {
        setToast("순서 변경 (데모 시뮬)");
      } else {
        setToast(`순서 변경됨 — ${result.changedCount}건 영속화`);
        router.refresh();
      }
      setTimeout(() => setToast(null), 3000);
    });
  }

  // ── 사이클 10 — A5 자유 추가 ────────────────────────────────────────
  function handleAddItem(input: {
    dayIndex: number;
    scheduledAt: string;
    durationMinutes: number;
    flexibility: ItineraryItem["flexibility"];
    name: string;
    category: ItineraryItem["category"];
  }) {
    setAddOpen(false);
    startTransition(async () => {
      const result = await addItineraryItem({
        tripId: trip.id,
        dayIndex: input.dayIndex,
        scheduledAt: input.scheduledAt,
        durationMinutes: input.durationMinutes,
        flexibility: input.flexibility,
        priority: 3,
        flexMinutes: 30,
        name: input.name,
        category: input.category,
        // 사용자 추가 일정은 위치 미상 — trip 기본 좌표 (cycle 10 단순화)
        location: { lat: 0, lng: 0, address: "사용자 추가" },
      });

      if (!result.ok) {
        setToast(`추가 실패: ${result.code}`);
        setTimeout(() => setToast(null), 3000);
        return;
      }

      if (result.demo) {
        // 데모 시뮬 — 클라이언트에 즉시 반영
        const now = new Date().toISOString();
        const simulated: ItineraryItem = {
          id: `demo-${Date.now()}`,
          tripId: trip.id,
          dayIndex: input.dayIndex,
          scheduledAt: input.scheduledAt,
          durationMinutes: input.durationMinutes,
          flexibility: input.flexibility,
          priority: 3,
          flexMinutes: 30,
          name: input.name,
          category: input.category,
          location: { lat: 0, lng: 0, address: "사용자 추가" },
          evidence: {
            reasons: ["사용자가 직접 추가한 일정입니다"],
            sources: [],
            verifiedAt: now,
          },
          dependencies: [],
        };
        setItems((prev) => [...prev, simulated]);
        setActiveDay(input.dayIndex);
        setToast(`'${input.name}' 추가 (데모 시뮬)`);
      } else {
        setToast(`'${input.name}' 추가됨 (DB 영속화)`);
        setActiveDay(input.dayIndex);
        router.refresh();
      }
      setTimeout(() => setToast(null), 3000);
    });
  }

  function handleEnterTravelMode() {
    startTransition(async () => {
      const result = await setTripMode({
        tripId: trip.id,
        mode: "in-travel",
        expectedTripUpdatedAt: trip.updatedAt,
      });

      if (!result.ok) {
        if (result.code === "conflict") {
          setToast("다른 탭에서 변경됐어요. 새로고침합니다.");
          router.refresh();
        } else {
          setToast(`전환 실패: ${result.code}`);
          setTimeout(() => setToast(null), 4000);
        }
        return;
      }

      router.push(`/travel/${trip.id}`);
    });
  }

  return (
    <>
      {/* 사이클 JJ — DayTabsBar 추출 (Day 탭 + A5 자유 추가) */}
      <DayTabsBar
        dayCount={trip.nights + 1}
        activeDay={activeDay}
        onActiveDayChange={setActiveDay}
        onAddOpen={() => setAddOpen(true)}
      />

      {/* Timeline */}
      <div className="relative space-y-td-md px-td-md">
        {dayItems.length > 0 && (
          <div
            className="absolute left-[31px] top-6 bottom-6 w-0.5 bg-divider z-0"
            aria-hidden
          />
        )}

        {dayItems.length === 0 && (
          <p className="text-td-body text-ink-soft text-center py-td-lg">
            이 날의 일정이 없습니다.
          </p>
        )}

        {dayItems.map((item) => (
          <ItineraryItemCard
            key={item.id}
            item={item}
            tripId={trip.id}
            isFeatured={item.id === featuredId}
            isOnTrip={isOnTrip}
            showEvidence={
              item.id === evidenceCardId &&
              !!item.evidence &&
              item.evidence.reasons.length > 0
            }
            isDragging={item.id === draggingId}
            isDragOver={item.id === dragOverId}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDragEnd={handleDragEnd}
            onDrop={handleDrop}
          />
        ))}
      </div>

      {/* Replan + Travel Mode 진입점 */}
      <section className="px-td-md py-td-lg space-y-td-sm">
        <ReplanTriggerCard
          trigger={effectiveTrigger}
          dayItems={dayItems}
          replanOpen={replanOpen}
          appliedLabel={appliedLabel}
          onTriggerChange={setActiveTrigger}
          onOpenReplan={() => setReplanOpen(true)}
          onReset={handleReset}
        />

        <TripSecondaryActions
          tripId={trip.id}
          isOnTrip={isOnTrip}
          isPending={isPending}
          onEnterTravelMode={handleEnterTravelMode}
          onShareClick={() => setShareOpen(true)}
        />
      </section>

      <ReplanModal
        open={replanOpen}
        trigger={effectiveTrigger}
        triggerItem={demoTriggerItem}
        results={replanResults}
        onApply={handleApply}
        onClose={() => {
          setReplanOpen(false);
          setActiveTrigger(null);
        }}
      />

      <AddItemModal
        open={addOpen}
        trip={trip}
        defaultDayIndex={activeDay}
        onClose={() => setAddOpen(false)}
        onSubmit={handleAddItem}
        isPending={isPending}
      />

      <ShareModal
        open={shareOpen}
        tripId={trip.id}
        onClose={() => setShareOpen(false)}
      />

      {toast && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 bg-ink text-white text-td-meta px-4 py-2.5 rounded-full shadow-lg"
          role="status"
        >
          {toast}
        </div>
      )}
    </>
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

