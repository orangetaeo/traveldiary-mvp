"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EvidencePanel } from "@/components/ui/EvidencePanel";
import { ReplanModal } from "./ReplanModal";
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

interface ItineraryViewProps {
  trip: Trip;
  initialItems: ItineraryItem[];
}

const CATEGORY_ICON: Record<string, string> = {
  food: "restaurant",
  spot: "photo_camera",
  shopping: "shopping_bag",
  rest: "bed",
};

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

  const demoTrigger: ReplanTrigger = {
    type: "delay",
    itemId: "pq-item-6",
    minutes: 90,
  };
  const demoTriggerItem = items.find((it) => it.id === demoTrigger.itemId) ?? null;

  const replanResults = useMemo(
    () => (replanOpen ? generateReplanOptions(items, demoTrigger) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [replanOpen, items]
  );

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
        trigger: demoTrigger,
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
      {/* Day Tabs + 자유 추가 버튼 (A5) */}
      <div className="flex items-center gap-td-xs mb-td-md px-td-md">
        <nav
          className="flex-1 flex gap-td-xs overflow-x-auto pb-2 hide-scrollbar"
          aria-label="여행 일자"
        >
          {Array.from({ length: trip.nights + 1 }, (_, i) => i).map((d) => {
            const active = d === activeDay;
            return (
              <button
                key={d}
                type="button"
                onClick={() => setActiveDay(d)}
                className={`px-td-md py-td-xs rounded-full text-td-meta whitespace-nowrap transition-colors ${
                  active
                    ? "bg-mode-primary text-white shadow-sm"
                    : "bg-surface-card text-ink-soft border border-divider hover:bg-surface-soft"
                }`}
                aria-current={active ? "page" : undefined}
              >
                Day {d + 1}
              </button>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          aria-label="일정 추가"
          className="flex-shrink-0 w-9 h-9 rounded-full bg-purple text-white flex items-center justify-center shadow-sm hover:opacity-90 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
        </button>
      </div>

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

        {dayItems.map((item) => {
          const isFeatured = item.id === featuredId;
          const isBooked =
            item.flexibility === "booked" || item.flexibility === "fixed";
          const showEvidence =
            item.id === evidenceCardId &&
            item.evidence &&
            item.evidence.reasons.length > 0;
          const time = formatTime(item.scheduledAt);
          const { ko, en } = splitName(item.name);
          const icon = CATEGORY_ICON[item.category] ?? "place";

          const isDragging = item.id === draggingId;
          const isDragOver = item.id === dragOverId;

          return (
            <div
              key={item.id}
              className={`relative pl-td-lg transition-opacity ${
                isDragging ? "opacity-40" : ""
              }`}
              draggable
              onDragStart={(e) => handleDragStart(e, item.id)}
              onDragOver={(e) => handleDragOver(e, item.id)}
              onDragLeave={handleDragLeave}
              onDragEnd={handleDragEnd}
              onDrop={(e) => handleDrop(e, item.id)}
            >
              {/* Dot — featured는 mode-primary로 자동 swap */}
              <div
                className={`absolute left-0 top-6 w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                  isFeatured
                    ? "bg-mode-primary text-white shadow-lg"
                    : "bg-surface-card border-2 border-divider text-ink-soft"
                }`}
                aria-hidden
              >
                <span className="material-symbols-outlined text-[16px]">
                  {icon}
                </span>
              </div>

              <Card
                variant={isFeatured ? "featured" : "raised"}
                className={`!p-td-md ${
                  isFeatured
                    ? "shadow-md !border-mode-primary border-2"
                    : isDragOver
                    ? "shadow-md !border-purple border-2"
                    : "shadow-sm"
                }`}
              >
                <Link
                  href={`/itinerary/${trip.id}/item/${item.id}`}
                  className="block -m-td-md p-td-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple rounded-lg"
                >
                  <div className="flex justify-between items-start mb-td-xs">
                    <div className="flex flex-col">
                      <span
                        className={`text-td-caption ${
                          isFeatured
                            ? "text-mode-primary font-bold"
                            : "text-ink-soft"
                        }`}
                      >
                        {time}
                      </span>
                      {isFeatured && (
                        <span className="text-td-caption text-mode-primary">
                          {isOnTrip ? "진행 중" : "AI 추천"}
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

      {/* Replan + Travel Mode 진입점 */}
      <section className="px-td-md py-td-lg space-y-td-sm">
        <div className="bg-surface-card border border-divider rounded-xl p-td-md">
          <div className="flex items-center justify-between gap-td-sm mb-td-xs">
            <p className="text-td-body font-semibold text-ink">
              지연 시뮬레이션 (M3)
            </p>
            {appliedLabel && <Badge tone="info">{appliedLabel} 적용됨</Badge>}
          </div>
          <p className="text-td-meta text-ink-soft mb-td-sm">
            Day 3 사오비치가 90분 지연된 상황. 추천·안전·강행 3옵션을 비교해 보세요.
          </p>
          <div className="flex gap-td-xs">
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

        {!isOnTrip && (
          <div className="bg-surface-card border border-divider rounded-xl p-td-md">
            <p className="text-td-body font-semibold text-ink mb-td-xs">
              여행 중 모드 (M2)
            </p>
            <p className="text-td-meta text-ink-soft mb-td-sm">
              헤더가 보라 → 코랄로 바뀌고 FAB가 등장합니다 (ADR-014).
            </p>
            <button
              type="button"
              onClick={handleEnterTravelMode}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 text-td-meta font-semibold text-accent-deep border border-accent/40 rounded-md px-3 py-2 transition-colors hover:bg-accent-soft disabled:opacity-60 disabled:cursor-wait"
            >
              {isPending ? "전환 중…" : "여행 중 모드로 전환 (데모) →"}
            </button>
          </div>
        )}

        {/* M6 진입점 (사이클 9, ADR-022) */}
        <div className="bg-surface-card border border-divider rounded-xl p-td-md">
          <p className="text-td-body font-semibold text-ink mb-td-xs">
            여행 도구 (M6)
          </p>
          <p className="text-td-meta text-ink-soft mb-td-sm">
            D-Day 체크리스트와 비용 관리를 한 곳에서. 자동 환율 변환 포함.
          </p>
          <div className="grid grid-cols-2 gap-td-sm">
            <Link
              href={`/checklist/${trip.id}`}
              className="flex items-center gap-1.5 text-td-meta font-semibold text-purple-deep border border-purple/40 rounded-md px-3 py-2 transition-colors hover:bg-purple-soft"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden>
                checklist
              </span>
              체크리스트
            </Link>
            <Link
              href={`/cost/${trip.id}`}
              className="flex items-center gap-1.5 text-td-meta font-semibold text-amber-deep border border-amber/40 rounded-md px-3 py-2 transition-colors hover:bg-amber-soft"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden>
                account_balance_wallet
              </span>
              비용 관리
            </Link>
          </div>
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

      <AddItemModal
        open={addOpen}
        trip={trip}
        defaultDayIndex={activeDay}
        onClose={() => setAddOpen(false)}
        onSubmit={handleAddItem}
        isPending={isPending}
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

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(
    d.getUTCMinutes()
  ).padStart(2, "0")}`;
}

function splitName(name: string): { ko: string; en: string } {
  const m = name.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (m) return { ko: m[1].trim(), en: m[2].trim() };
  return { ko: name, en: "" };
}
