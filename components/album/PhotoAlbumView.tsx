"use client";

/**
 * PhotoAlbumView — E3 여행 사진 앨범 뷰.
 *
 * 날짜별 그룹핑 + masonry grid + 사진 추가 모달.
 * PostTripRecapView의 Moments 섹션을 발전시킨 독립 뷰.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addPhoto, editPhoto, removePhoto } from "@/actions/photo";
import type { TripPhoto } from "@/lib/types";

interface Props {
  tripId: string;
  photos: TripPhoto[];
  totalDays: number;
}

/** 일정 자동 수집 사진은 id가 "item-" 접두사 (album/page.tsx). DB 사진만 삭제 가능. */
function isDeletablePhoto(photo: TripPhoto): boolean {
  return !photo.id.startsWith("item-");
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
  const router = useRouter();
  const [showAddModal, setShowAddModal] = useState(false);
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [dayIndex, setDayIndex] = useState<number | undefined>(undefined);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [optimisticHidden, setOptimisticHidden] = useState<Set<string>>(new Set());

  // 캡션 편집
  const [editingPhoto, setEditingPhoto] = useState<TripPhoto | null>(null);
  const [editCaption, setEditCaption] = useState("");
  // 옵티미스틱 캡션 오버라이드
  const [captionOverrides, setCaptionOverrides] = useState<Map<string, string | undefined>>(new Map());

  const visiblePhotos = photos
    .filter((p) => !optimisticHidden.has(p.id))
    .map((p) => (captionOverrides.has(p.id) ? { ...p, caption: captionOverrides.get(p.id) } : p));
  const grouped = groupByDay(visiblePhotos);
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

  const handleDelete = (photoId: string) => {
    setOptimisticHidden((prev) => new Set(prev).add(photoId));
    setConfirmDeleteId(null);
    startTransition(async () => {
      const result = await removePhoto({ id: photoId, tripId });
      if (result.ok) {
        router.refresh();
      } else {
        setOptimisticHidden((prev) => {
          const next = new Set(prev);
          next.delete(photoId);
          return next;
        });
        setError("삭제에 실패했습니다. 다시 시도해주세요.");
      }
    });
  };

  function handleEditCaption() {
    if (!editingPhoto) return;
    const trimmed = editCaption.trim() || undefined;
    if (trimmed === editingPhoto.caption) {
      setEditingPhoto(null);
      return;
    }

    const prev = editingPhoto;
    setCaptionOverrides((m) => new Map(m).set(prev.id, trimmed));
    setEditingPhoto(null);

    startTransition(async () => {
      const result = await editPhoto({
        id: prev.id,
        tripId,
        caption: trimmed,
      });
      if (!result.ok) {
        setCaptionOverrides((m) => {
          const next = new Map(m);
          next.delete(prev.id);
          return next;
        });
        setError(`캡션 수정 실패: ${result.code}`);
        return;
      }
      if (!result.demo) router.refresh();
    });
  }

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
      {visiblePhotos.length === 0 && (
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
                  className="relative rounded-md overflow-hidden border border-divider break-inside-avoid group"
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
                  {/* 호버 시 편집/삭제 버튼 */}
                  <div className="absolute top-1 right-1 flex gap-1 opacity-80 md:opacity-0 md:group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPhoto(photo);
                        setEditCaption(photo.caption ?? "");
                      }}
                      aria-label="캡션 수정"
                      className="w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(photo.id)}
                      aria-label="사진 삭제"
                      className="w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-danger/80"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
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

      {/* 캡션 수정 모달 */}
      {editingPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-td-md"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingPhoto(null);
          }}
        >
          <div className="bg-surface-card border border-divider rounded-lg p-td-md w-full max-w-md shadow-lg">
            <h3 className="text-td-card-title text-ink mb-td-sm">캡션 수정</h3>
            <input
              type="text"
              value={editCaption}
              onChange={(e) => setEditCaption(e.target.value)}
              maxLength={200}
              autoFocus
              placeholder="사진 설명..."
              className="w-full px-td-sm py-2 border border-divider rounded-md text-td-body bg-surface-soft focus:outline focus:outline-purple"
              aria-label="사진 캡션 수정"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleEditCaption();
                if (e.key === "Escape") setEditingPhoto(null);
              }}
            />
            <div className="flex gap-td-sm mt-td-sm">
              <button
                type="button"
                onClick={() => setEditingPhoto(null)}
                className="flex-1 py-2 border border-divider text-ink rounded-md text-td-body font-semibold hover:bg-surface-soft transition-colors"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleEditCaption}
                disabled={isPending}
                className="flex-1 py-2 bg-purple text-white rounded-md text-td-body font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
              >
                {isPending ? "수정 중..." : "수정"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {confirmDeleteId && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center px-td-md"
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmDeleteId(null);
          }}
        >
          <div
            role="alertdialog"
            aria-label="사진 삭제 확인"
            className="bg-surface-card w-full max-w-sm rounded-xl p-td-md"
          >
            <h2 className="text-td-card-title font-bold text-ink mb-td-xxs">
              사진을 삭제할까요?
            </h2>
            <p className="text-td-body text-ink-soft mb-td-md">
              삭제된 사진은 되돌릴 수 없습니다.
            </p>
            <div className="flex gap-td-xs">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-td-xs rounded-md border border-divider text-td-body font-semibold text-ink"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={isPending}
                className="flex-1 py-td-xs rounded-md bg-coral text-white text-td-body font-semibold disabled:opacity-40"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
