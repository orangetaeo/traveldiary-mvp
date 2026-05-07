"use client";

/**
 * PhotoAlbumView — E3 여행 사진 앨범 뷰.
 *
 * 날짜별 그룹핑 + masonry grid + 사진 추가 모달.
 * PostTripRecapView의 Moments 섹션을 발전시킨 독립 뷰.
 */

import { useState, useTransition } from "react";
import { addPhoto } from "@/actions/photo";
import type { TripPhoto } from "@/lib/types";

interface Props {
  tripId: string;
  photos: TripPhoto[];
  totalDays: number;
}

/** 사진을 dayIndex별로 그룹핑 */
function groupByDay(photos: TripPhoto[]): Map<number, TripPhoto[]> {
  const map = new Map<number, TripPhoto[]>();
  for (const p of photos) {
    const day = p.dayIndex ?? -1;
    const list = map.get(day) ?? [];
    list.push(p);
    map.set(day, list);
  }
  return map;
}

export function PhotoAlbumView({ tripId, photos, totalDays }: Props) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [dayIndex, setDayIndex] = useState<number | undefined>(undefined);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const grouped = groupByDay(photos);
  const dayKeys = Array.from(grouped.keys()).sort((a, b) => a - b);

  const handleAdd = () => {
    if (!url.trim()) return;
    setError("");
    startTransition(async () => {
      const result = await addPhoto({
        tripId,
        url: url.trim(),
        caption: caption.trim() || undefined,
        dayIndex,
      });
      if (result.ok) {
        setShowAddModal(false);
        setUrl("");
        setCaption("");
        setDayIndex(undefined);
      } else {
        setError("저장에 실패했습니다. 다시 시도해주세요.");
      }
    });
  };

  return (
    <div className="px-td-md py-td-md">
      {/* 사진 추가 버튼 */}
      <button
        type="button"
        onClick={() => setShowAddModal(true)}
        className="w-full mb-td-md py-td-xs rounded-md border-2 border-dashed border-purple/40 text-purple font-semibold text-td-body flex items-center justify-center gap-2 hover:bg-purple-soft/20 transition-colors"
      >
        <span className="material-symbols-outlined" aria-hidden>add_photo_alternate</span>
        사진 추가
      </button>

      {/* 사진 없을 때 */}
      {photos.length === 0 && (
        <div className="text-center py-16">
          <span className="material-symbols-outlined text-6xl text-ink-mute mb-td-sm block">
            photo_library
          </span>
          <p className="text-td-body text-ink-soft">아직 사진이 없어요.</p>
          <p className="text-td-caption text-ink-mute mt-td-xxs">
            위 버튼으로 사진 URL을 추가해보세요.
          </p>
        </div>
      )}

      {/* 날짜별 그룹 */}
      {dayKeys.map((day) => {
        const dayPhotos = grouped.get(day) ?? [];
        const label = day >= 0 ? `Day ${day + 1}` : "기타";
        return (
          <section key={day} className="mb-td-lg">
            <h2 className="text-td-body font-bold text-ink mb-td-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-purple text-td-icon-sm" aria-hidden>
                calendar_today
              </span>
              {label}
              <span className="text-td-caption text-ink-soft font-normal">
                {dayPhotos.length}장
              </span>
            </h2>
            <div className="columns-2 gap-td-xs space-y-td-xs">
              {dayPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative rounded-md overflow-hidden border border-divider break-inside-avoid"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt={photo.caption ?? "여행 사진"}
                    className="w-full h-auto object-cover"
                    loading="lazy"
                  />
                  {photo.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <span className="text-white text-td-caption">{photo.caption}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {/* 사진 추가 모달 */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddModal(false);
          }}
        >
          <div
            role="dialog"
            aria-label="사진 추가"
            className="bg-surface-card w-full max-w-lg rounded-t-xl p-td-md pb-8 animate-slide-up"
          >
            <h2 className="text-td-card-title font-bold text-ink mb-td-sm">
              사진 추가
            </h2>

            <label className="block text-td-meta text-ink-soft mb-td-xxs">
              이미지 URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/photo.jpg"
              className="w-full bg-surface-soft border border-divider rounded-md p-td-sm text-td-body mb-td-sm focus:ring-purple focus:border-purple"
            />

            <label className="block text-td-meta text-ink-soft mb-td-xxs">
              설명 (선택)
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={200}
              placeholder="사진 설명..."
              className="w-full bg-surface-soft border border-divider rounded-md p-td-sm text-td-body mb-td-sm focus:ring-purple focus:border-purple"
            />

            <label className="block text-td-meta text-ink-soft mb-td-xxs">
              여행 일차 (선택)
            </label>
            <select
              value={dayIndex ?? ""}
              onChange={(e) =>
                setDayIndex(e.target.value ? Number(e.target.value) : undefined)
              }
              className="w-full bg-surface-soft border border-divider rounded-md p-td-sm text-td-body mb-td-sm"
            >
              <option value="">선택 안함</option>
              {Array.from({ length: totalDays }, (_, i) => (
                <option key={i} value={i}>
                  Day {i + 1}
                </option>
              ))}
            </select>

            {error && (
              <p className="text-td-caption text-coral mb-td-sm">{error}</p>
            )}

            <div className="flex gap-td-xs">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-td-xs rounded-md border border-divider text-td-body font-semibold text-ink"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleAdd}
                disabled={!url.trim() || isPending}
                className="flex-1 py-td-xs rounded-md bg-purple text-white text-td-body font-semibold disabled:opacity-40"
              >
                {isPending ? "추가 중..." : "추가"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
