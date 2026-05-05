/**
 * Itinerary Item Card — 사이클 HH (CC/DD 답습 추출).
 *
 * ItineraryView에서 카드 렌더링(~95행)을 분리. 순수 presentation.
 * Drag handler는 callback prop으로 받음 — useState 0개.
 *
 * 사이클 O / CC / DD 답습 — props만 받는 presentation.
 */

"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EvidencePanel } from "@/components/ui/EvidencePanel";
import type { ItineraryItem } from "@/lib/types";
import {
  splitName,
  formatTime,
  CATEGORY_ICON,
} from "@/lib/utils/item-display";

/** @deprecated splitName re-export (기존 테스트 호환) */
export const splitItemName = splitName;
/** @deprecated formatTime re-export (기존 테스트 호환) */
export const formatItineraryTime = formatTime;

interface ItineraryItemCardProps {
  item: ItineraryItem;
  tripId: string;
  isFeatured: boolean;
  isOnTrip: boolean;
  showEvidence: boolean;
  isDragging: boolean;
  isDragOver: boolean;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDragLeave: () => void;
  onDragEnd: () => void;
  onDrop: (e: React.DragEvent, id: string) => void;
  /** 화살표 정렬 — 사이클 BLOCKER4 (모바일 터치 대응) */
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
}

export function ItineraryItemCard({
  item,
  tripId,
  isFeatured,
  isOnTrip,
  showEvidence,
  isDragging,
  isDragOver,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDragEnd,
  onDrop,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
}: ItineraryItemCardProps) {
  const isBooked =
    item.flexibility === "booked" || item.flexibility === "fixed";
  const time = formatTime(item.scheduledAt);
  const { ko, en } = splitName(item.name);
  const icon = CATEGORY_ICON[item.category] ?? "place";

  return (
    <div
      className={`relative pl-td-lg transition-opacity ${
        isDragging ? "opacity-40" : ""
      }`}
      draggable
      onDragStart={(e) => onDragStart(e, item.id)}
      onDragOver={(e) => onDragOver(e, item.id)}
      onDragLeave={onDragLeave}
      onDragEnd={onDragEnd}
      onDrop={(e) => onDrop(e, item.id)}
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
        <span className="material-symbols-outlined text-[16px]">{icon}</span>
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
          href={`/itinerary/${tripId}/item/${item.id}`}
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

        {/* 사이클 BLOCKER4 — 화살표 정렬 (모바일 터치 대응) */}
        <div className="flex justify-end gap-td-xxs mt-td-xs">
          <button
            type="button"
            disabled={isFirst}
            onClick={(e) => { e.stopPropagation(); onMoveUp(item.id); }}
            className="p-1 rounded hover:bg-surface-soft disabled:opacity-30 transition-colors"
            aria-label="위로 이동"
          >
            <span className="material-symbols-outlined text-[18px] text-ink-soft" aria-hidden>
              keyboard_arrow_up
            </span>
          </button>
          <button
            type="button"
            disabled={isLast}
            onClick={(e) => { e.stopPropagation(); onMoveDown(item.id); }}
            className="p-1 rounded hover:bg-surface-soft disabled:opacity-30 transition-colors"
            aria-label="아래로 이동"
          >
            <span className="material-symbols-outlined text-[18px] text-ink-soft" aria-hidden>
              keyboard_arrow_down
            </span>
          </button>
        </div>

        {showEvidence && (
          <div className="mt-td-sm">
            <EvidencePanel evidence={item.evidence} />
          </div>
        )}
      </Card>
    </div>
  );
}
