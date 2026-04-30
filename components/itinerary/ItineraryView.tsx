"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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
  const [items, setItems] = useState<ItineraryItem[]>(initialItems);
  const [activeDay, setActiveDay] = useState(0);
  const [replanOpen, setReplanOpen] = useState(false);
  const [appliedLabel, setAppliedLabel] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

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
    setItems(itemsAfter);
    setReplanOpen(false);
    setAppliedLabel(option.label);
    setToast(
      `${option.label} 옵션 적용 — Day ${(demoTriggerItem?.dayIndex ?? 0) + 1} 일정 갱신됨`
    );
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
      {/* Day Tabs */}
      <nav
        className="flex gap-td-xs mb-td-md overflow-x-auto pb-2 px-td-md"
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

          return (
            <div key={item.id} className="relative pl-td-lg">
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
            <Link
              href={`/travel/${trip.id}`}
              className="inline-flex items-center gap-1.5 text-td-meta font-semibold text-accent-deep border border-accent/40 rounded-md px-3 py-2 transition-colors hover:bg-accent-soft"
            >
              여행 중 모드로 전환 (데모) →
            </Link>
          </div>
        )}
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
