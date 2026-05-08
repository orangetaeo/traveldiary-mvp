"use client";

/**
 * PhotoAlbumView — E3 여행 사진 앨범 뷰.
 *
 * 날짜별 그룹핑 + masonry grid + 사진 추가 모달.
 * PostTripRecapView의 Moments 섹션을 발전시킨 독립 뷰.
 */

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addPhoto, editPhoto, removePhoto } from "@/actions/photo";
import { PhotoLightbox } from "@/components/album/PhotoLightbox";
import { compressImageToDataUrl } from "@/lib/utils/image-compress";
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

type AddMode = "file" | "url";

interface UploadProgress {
  current: number;
  total: number;
  succeeded: number;
  failed: number;
}

export function PhotoAlbumView({ tripId, photos, totalDays }: Props) {
  const router = useRouter();
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMode, setAddMode] = useState<AddMode>("file");
  const [url, setUrl] = useState("");
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [caption, setCaption] = useState("");
  const [dayIndex, setDayIndex] = useState<number | undefined>(undefined);
  const [isPending, startTransition] = useTransition();
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [optimisticHidden, setOptimisticHidden] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 캡션 편집
  const [editingPhoto, setEditingPhoto] = useState<TripPhoto | null>(null);
  const [editCaption, setEditCaption] = useState("");
  // 옵티미스틱 캡션 오버라이드
  const [captionOverrides, setCaptionOverrides] = useState<Map<string, string | undefined>>(new Map());

  // 라이트박스 (사진 확대 보기)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const visiblePhotos = photos
    .filter((p) => !optimisticHidden.has(p.id))
    .map((p) => (captionOverrides.has(p.id) ? { ...p, caption: captionOverrides.get(p.id) } : p));
  const grouped = groupByDay(visiblePhotos);
  const dayKeys = Array.from(grouped.keys()).sort((a, b) => a - b);

  const resetAddForm = () => {
    setShowAddModal(false);
    setAddMode("file");
    setUrl("");
    setFilePreviews([]);
    setCaption("");
    setDayIndex(undefined);
    setError("");
    setIsCompressing(false);
    setUploadProgress(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFilesSelect = async (files: FileList) => {
    setError("");
    setIsCompressing(true);
    const previews: string[] = [];
    let skipped = 0;
    try {
      for (const file of Array.from(files)) {
        const result = await compressImageToDataUrl(file);
        if (result.ok) {
          previews.push(result.dataUrl);
        } else {
          skipped += 1;
        }
      }
      setFilePreviews(previews);
      if (previews.length === 0) {
        setError(
          skipped > 0
            ? "선택한 파일을 처리하지 못했어요. 이미지 파일만 가능해요."
            : "사진을 선택해 주세요.",
        );
      } else if (skipped > 0) {
        setError(`${skipped}장은 이미지가 아니라 건너뛰었어요.`);
      }
    } finally {
      setIsCompressing(false);
    }
  };

  const removeFilePreview = (idx: number) => {
    setFilePreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAdd = () => {
    setError("");
    if (addMode === "file") {
      if (filePreviews.length === 0) {
        setError("사진을 먼저 선택해 주세요.");
        return;
      }
      const captionInput = caption.trim() || undefined;
      const dayIdx = dayIndex;
      const total = filePreviews.length;
      const queued = [...filePreviews];

      setUploadProgress({ current: 0, total, succeeded: 0, failed: 0 });

      startTransition(async () => {
        let succeeded = 0;
        let failed = 0;
        let demoEncountered = false;
        for (let i = 0; i < queued.length; i += 1) {
          const dataUrl = queued[i]!;
          setUploadProgress({ current: i + 1, total, succeeded, failed });
          const result = await addPhoto({
            tripId,
            url: dataUrl,
            caption: captionInput,
            dayIndex: dayIdx,
          });
          if (result.ok) {
            succeeded += 1;
            if (result.demo) demoEncountered = true;
          } else {
            failed += 1;
          }
          setUploadProgress({ current: i + 1, total, succeeded, failed });
        }

        if (failed === 0) {
          resetAddForm();
          if (!demoEncountered) router.refresh();
        } else {
          setUploadProgress(null);
          setError(
            succeeded === 0
              ? "사진 저장에 실패했어요. 잠시 후 다시 시도해주세요."
              : `${succeeded}장 추가 완료, ${failed}장 실패. 실패한 사진은 그대로 남아 있어요.`,
          );
          // 실패 사진만 남기기 — 성공한 것은 제거
          setFilePreviews((prev) => prev.slice(succeeded));
          if (succeeded > 0 && !demoEncountered) router.refresh();
        }
      });
      return;
    }

    // URL 모드 (단일)
    const payloadUrl = url.trim();
    if (!payloadUrl) {
      setError("이미지 URL을 입력해 주세요.");
      return;
    }
    startTransition(async () => {
      const result = await addPhoto({
        tripId,
        url: payloadUrl,
        caption: caption.trim() || undefined,
        dayIndex,
      });
      if (result.ok) {
        resetAddForm();
        if (!result.demo) router.refresh();
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
              {dayPhotos.map((photo) => {
                const flatIndex = visiblePhotos.indexOf(photo);
                return (
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
                  {/* 클릭 영역 — 사진 확대 보기 (편집/삭제 버튼은 z-30으로 위에 배치) */}
                  <button
                    type="button"
                    onClick={() => setLightboxIndex(flatIndex)}
                    aria-label={photo.caption ? `${photo.caption} — 확대 보기` : "사진 확대 보기"}
                    className="absolute inset-0 z-10 cursor-zoom-in focus-visible:ring-2 focus-visible:ring-purple"
                  >
                    <span className="sr-only">확대 보기</span>
                  </button>
                  {photo.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 z-20 pointer-events-none">
                      <span className="text-white text-td-caption">{photo.caption}</span>
                    </div>
                  )}
                  {/* 호버 시 편집/삭제 버튼 — DB 사진만 편집/삭제 가능 (z-30으로 클릭 영역 위에) */}
                  {isDeletablePhoto(photo) && <div className="absolute top-1 right-1 z-30 flex gap-1 opacity-80 md:opacity-0 md:group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
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
                  </div>}
                </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* 라이트박스 — 사진 확대 보기 */}
      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={visiblePhotos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      {/* 사진 추가 모달 */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) resetAddForm();
          }}
        >
          <div
            role="dialog"
            aria-label="사진 추가"
            className="bg-surface-card w-full max-w-lg rounded-t-xl p-td-md pb-8 animate-slide-up max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-td-card-title font-bold text-ink mb-td-sm">
              사진 추가
            </h2>

            {/* 모드 segmented control — 파일 / URL */}
            <div
              role="tablist"
              aria-label="사진 추가 방식"
              className="flex gap-1 p-1 bg-surface-soft rounded-md mb-td-sm"
            >
              <button
                type="button"
                role="tab"
                aria-selected={addMode === "file" ? "true" : "false"}
                onClick={() => {
                  setAddMode("file");
                  setError("");
                }}
                className={`flex-1 py-2 rounded text-td-meta font-semibold transition-colors ${
                  addMode === "file"
                    ? "bg-surface-card text-ink shadow-sm"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                <span className="material-symbols-outlined text-[18px] align-middle mr-1" aria-hidden>
                  photo_camera
                </span>
                촬영·앨범
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={addMode === "url" ? "true" : "false"}
                onClick={() => {
                  setAddMode("url");
                  setError("");
                }}
                className={`flex-1 py-2 rounded text-td-meta font-semibold transition-colors ${
                  addMode === "url"
                    ? "bg-surface-card text-ink shadow-sm"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                <span className="material-symbols-outlined text-[18px] align-middle mr-1" aria-hidden>
                  link
                </span>
                URL
              </button>
            </div>

            {addMode === "file" ? (
              <>
                <label className="block text-td-meta text-ink-soft mb-td-xxs">
                  사진 선택 (여러 장 가능)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  aria-label="사진 파일 선택 (여러 장 가능)"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files && files.length > 0) void handleFilesSelect(files);
                  }}
                  className="block w-full text-td-meta text-ink-soft file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-td-meta file:font-semibold file:bg-purple-soft file:text-purple-deep hover:file:bg-purple-soft/80 mb-td-xxs"
                />
                <p className="text-td-caption text-ink-mute mb-td-sm">
                  여러 장 한 번에 선택 가능. 자동으로 1280px / 70% 품질로 압축돼요.
                </p>

                {isCompressing && (
                  <p className="text-td-caption text-ink-soft mb-td-sm" role="status">
                    사진을 처리하고 있어요...
                  </p>
                )}

                {filePreviews.length > 0 && !isCompressing && (
                  <div className="mb-td-sm">
                    <p className="text-td-meta text-ink-soft mb-td-xxs">
                      {filePreviews.length}장 선택됨
                    </p>
                    <div className="grid grid-cols-3 gap-td-xxs">
                      {filePreviews.map((preview, idx) => (
                        <div
                          key={idx}
                          className="relative aspect-square rounded-md overflow-hidden border border-divider bg-black/5"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={preview}
                            alt={`추가할 사진 ${idx + 1}/${filePreviews.length}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeFilePreview(idx)}
                            aria-label={`${idx + 1}번째 사진 선택 해제`}
                            disabled={isPending}
                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 disabled:opacity-40"
                          >
                            <span className="material-symbols-outlined text-[14px]" aria-hidden>
                              close
                            </span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {uploadProgress && (
                  <div
                    role="status"
                    aria-live="polite"
                    className="mb-td-sm p-td-xs rounded-md bg-purple-soft/40 border border-purple/20"
                  >
                    <p className="text-td-meta text-purple-deep font-semibold mb-1">
                      업로드 중 — {uploadProgress.current} / {uploadProgress.total}
                    </p>
                    <div
                      className="w-full h-1.5 bg-white/60 rounded-full overflow-hidden"
                      role="progressbar"
                      aria-valuenow={uploadProgress.current}
                      aria-valuemin={0}
                      aria-valuemax={uploadProgress.total}
                      aria-label="사진 업로드 진행"
                    >
                      <div
                        className="h-full bg-purple transition-[width]"
                        // eslint-disable-next-line react/forbid-dom-props -- 동적 width는 progressbar 필수
                        style={{
                          width: `${(uploadProgress.current / Math.max(1, uploadProgress.total)) * 100}%`,
                        }}
                      />
                    </div>
                    {uploadProgress.failed > 0 && (
                      <p className="text-td-caption text-coral mt-1">
                        실패 {uploadProgress.failed}장
                      </p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
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
              </>
            )}

            <label className="block text-td-meta text-ink-soft mb-td-xxs">
              {addMode === "file" && filePreviews.length > 1
                ? "공통 설명 (선택, 모든 사진에 같게 적용)"
                : "설명 (선택)"}
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
              aria-label="여행 일차 선택"
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
              <p className="text-td-caption text-coral mb-td-sm" role="alert">
                {error}
              </p>
            )}

            <div className="flex gap-td-xs">
              <button
                type="button"
                onClick={resetAddForm}
                className="flex-1 py-td-xs rounded-md border border-divider text-td-body font-semibold text-ink"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleAdd}
                disabled={
                  isPending ||
                  isCompressing ||
                  (addMode === "file" ? filePreviews.length === 0 : !url.trim())
                }
                className="flex-1 py-td-xs rounded-md bg-purple text-white text-td-body font-semibold disabled:opacity-40"
              >
                {isPending && uploadProgress
                  ? `추가 중 ${uploadProgress.current}/${uploadProgress.total}`
                  : isPending
                    ? "추가 중..."
                    : addMode === "file" && filePreviews.length > 1
                      ? `${filePreviews.length}장 추가`
                      : "추가"}
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
