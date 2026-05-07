"use client";

/**
 * 일정 추가 모달 (A5) — 사이클 10 + AI 추천 카드.
 *
 * 상단: AI 추천 장소 카드 (최대 5개) → 탭하면 폼에 자동 입력.
 * 하단: 직접 입력 폼 — 시간·이름·카테고리·유연성·소요시간.
 */

import { useEffect, useState, useRef, useCallback } from "react";
import type {
  ItemCategory,
  ItemFlexibility,
  DiscoverPlace,
  Trip,
} from "@/lib/types";
import {
  PLACE_TO_ITEM_CATEGORY,
  CATEGORY_OPTIONS,
  FLEXIBILITY_OPTIONS,
  topSuggestions,
  suggestDuration,
} from "./add-item-utils";

interface AddItemModalProps {
  open: boolean;
  trip: Trip;
  defaultDayIndex: number;
  suggestions?: DiscoverPlace[];
  onClose: () => void;
  onSubmit: (input: {
    dayIndex: number;
    scheduledAt: string;     // ISO datetime
    durationMinutes: number;
    flexibility: ItemFlexibility;
    name: string;
    category: ItemCategory;
  }) => void;
  isPending?: boolean;
}


export function AddItemModal({
  open,
  trip,
  defaultDayIndex,
  suggestions = [],
  onClose,
  onSubmit,
  isPending,
}: AddItemModalProps) {
  const [day, setDay] = useState(defaultDayIndex);
  const [time, setTime] = useState("12:00");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ItemCategory>("food");
  const [flexibility, setFlexibility] = useState<ItemFlexibility>("flexible");
  const [duration, setDuration] = useState(60);
  const [address, setAddress] = useState("");

  // 드래그 dismiss
  const [dragY, setDragY] = useState(0);
  const dragStartY = useRef(0);
  const isDragging = useRef(false);

  useEffect(() => {
    if (open) setDay(defaultDayIndex);
  }, [open, defaultDayIndex]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    isDragging.current = true;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const delta = e.touches[0].clientY - dragStartY.current;
    if (delta > 0) setDragY(delta);
  }, []);

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
    if (dragY > 120) {
      onClose();
    }
    setDragY(0);
  }, [dragY, onClose]);

  // AI 추천 장소 중 상위 5개 (ai 배지 우선)
  const top5 = topSuggestions(suggestions);

  function handlePickSuggestion(place: DiscoverPlace) {
    setName(place.name);
    setCategory(PLACE_TO_ITEM_CATEGORY[place.category]);
    setDuration(suggestDuration(place.category));
  }

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    const [hh, mm] = time.split(":").map(Number);
    const start = new Date(`${trip.startDate}T00:00:00.000Z`);
    start.setUTCDate(start.getUTCDate() + day);
    start.setUTCHours(hh, mm, 0, 0);

    onSubmit({
      dayIndex: day,
      scheduledAt: start.toISOString(),
      durationMinutes: duration,
      flexibility,
      name: name.trim(),
      category,
    });
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/40"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-item-title"
    >
      <div
        className="relative w-full max-w-[420px] bg-surface-card rounded-t-[24px] shadow-2xl flex flex-col max-h-[calc(100dvh-2rem)] transition-transform"
        style={{ transform: dragY > 0 ? `translateY(${dragY}px)` : undefined }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle */}
        <div
          className="flex justify-center pt-3 pb-2 shrink-0 cursor-grab active:cursor-grabbing touch-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-10 h-1 rounded-full bg-divider" aria-hidden />
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="absolute top-3 right-3 text-ink-soft hover:text-ink p-1 rounded-full hover:bg-surface-soft z-10"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <header className="px-td-lg pt-td-xs pb-td-md shrink-0">
          <h2
            id="add-item-title"
            className="text-td-card-title text-ink font-semibold"
          >
            일정 추가
          </h2>
          <p className="text-td-caption text-ink-soft mt-td-xxs">
            AI 추천 장소를 선택하거나, 직접 입력하세요.
          </p>
        </header>

        {/* AI 추천 카드 */}
        {top5.length > 0 && (
          <div className="px-td-md pb-td-sm shrink-0">
            <p className="text-td-caption text-purple font-medium mb-td-xs flex items-center gap-1">
              <span className="material-symbols-outlined text-td-icon-sm" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              AI 추천
            </p>
            <div className="flex gap-td-xs overflow-x-auto no-scrollbar -mx-td-md px-td-md pb-1">
              {top5.map((place) => (
                <button
                  key={place.id}
                  type="button"
                  onClick={() => handlePickSuggestion(place)}
                  className={`shrink-0 flex items-center gap-td-xs px-3 py-2 rounded-lg border transition-colors ${
                    name === place.name
                      ? "border-purple bg-purple-soft text-purple-deep"
                      : "border-divider bg-surface-soft text-ink hover:border-purple/40"
                  }`}
                >
                  <span className="text-td-body font-medium whitespace-nowrap">{place.name}</span>
                  <span className="text-td-meta text-ink-mute whitespace-nowrap">⭐{place.rating.toFixed(1)}</span>
                  {place.badge === "ai" && (
                    <span className="text-td-caption bg-purple text-white px-1 py-px rounded">AI</span>
                  )}
                  {place.badge === "popular" && (
                    <span className="text-td-caption bg-amber text-white px-1 py-px rounded">인기</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-td-md space-y-td-sm"
        >
          <label className="flex flex-col">
            <span className="text-td-caption text-ink-soft mb-1">이름 (필수)</span>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 사오비치 일몰 산책"
              maxLength={80}
              className="px-td-sm py-2 border border-divider rounded-lg text-td-body bg-surface-soft focus:outline focus:outline-purple"
            />
          </label>

          <label className="flex flex-col">
            <span className="text-td-caption text-ink-soft mb-1">
              위치 메모
              <span className="text-ink-mute ml-1">(선택)</span>
            </span>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-ink-mute text-td-icon-md" aria-hidden>
                location_on
              </span>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="예: 다낭 미케비치 인근"
                maxLength={120}
                className="w-full pl-8 pr-td-sm py-2 border border-divider rounded-lg text-td-body bg-surface-soft focus:outline focus:outline-purple"
              />
            </div>
          </label>

          <div className="grid grid-cols-2 gap-td-sm">
            <label className="flex flex-col">
              <span className="text-td-caption text-ink-soft mb-1">Day</span>
              <select
                value={day}
                onChange={(e) => setDay(Number(e.target.value))}
                className="px-td-sm py-2 border border-divider rounded-lg text-td-body bg-surface-soft"
              >
                {Array.from({ length: trip.nights + 1 }, (_, i) => (
                  <option key={i} value={i}>
                    Day {i + 1}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col">
              <span className="text-td-caption text-ink-soft mb-1">시작 시간</span>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                step={300}
                className="px-td-sm py-2 border border-divider rounded-lg text-td-body bg-surface-soft tabular-nums"
              />
            </label>
          </div>

          <div className="flex flex-col">
            <span className="text-td-caption text-ink-soft mb-1">카테고리</span>
            <div className="grid grid-cols-4 gap-td-xs">
              {CATEGORY_OPTIONS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className={`flex flex-col items-center gap-1 py-td-xs rounded-lg border text-td-caption transition-colors ${
                    category === c.id
                      ? "border-purple bg-purple-soft text-purple-deep font-bold"
                      : "border-divider text-ink-soft hover:border-purple/40"
                  }`}
                >
                  <span className="material-symbols-outlined text-td-icon" aria-hidden>
                    {c.icon}
                  </span>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-td-sm">
            <label className="flex flex-col">
              <span className="text-td-caption text-ink-soft mb-1">유연성</span>
              <select
                value={flexibility}
                onChange={(e) =>
                  setFlexibility(e.target.value as ItemFlexibility)
                }
                className="px-td-sm py-2 border border-divider rounded-lg text-td-meta bg-surface-soft"
              >
                {FLEXIBILITY_OPTIONS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col">
              <span className="text-td-caption text-ink-soft mb-1">소요 시간 (분)</span>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                min={15}
                max={600}
                step={15}
                className="px-td-sm py-2 border border-divider rounded-lg text-td-body bg-surface-soft tabular-nums"
              />
            </label>
          </div>

          <p className="text-td-caption text-ink-mute pt-td-xs">
            💡 추가된 항목은 시간 충돌이 있어도 그대로 등록됩니다. Live Replan으로
            조정하세요.
          </p>
        </form>

        {/* 하단 버튼 — 스크롤 영역 밖 (항상 보임) */}
        <div className="shrink-0 px-td-md pt-td-sm pb-td-md flex gap-td-sm border-t border-divider">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 border border-divider text-ink rounded-lg text-td-body font-semibold hover:bg-surface-soft transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            form="add-item-form"
            disabled={!name.trim() || isPending}
            onClick={handleSubmit as unknown as React.MouseEventHandler}
            className="flex-[2] py-2.5 bg-purple text-white rounded-lg text-td-body font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
          >
            {isPending ? "추가 중…" : "일정 추가"}
          </button>
        </div>
      </div>
    </div>
  );
}
