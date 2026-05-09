"use client";

/**
 * PhotoAddModal — 사진 추가 모달 (파일 선택 / URL 입력).
 *
 * PhotoAlbumView에서 분리 — 자체 useTransition으로 업로드 진행 상태 관리.
 */

import { useRef, useState, useTransition } from "react";
import { addPhoto } from "@/actions/photo";
import { compressImageToDataUrl } from "@/lib/utils/image-compress";

type AddMode = "file" | "url";

interface UploadProgress {
  current: number;
  total: number;
  succeeded: number;
  failed: number;
}

interface Props {
  tripId: string;
  totalDays: number;
  onClose: () => void;
  onPhotoAdded: () => void;
}

export function PhotoAddModal({ tripId, totalDays, onClose, onPhotoAdded }: Props) {
  const [addMode, setAddMode] = useState<AddMode>("file");
  const [url, setUrl] = useState("");
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [caption, setCaption] = useState("");
  const [dayIndex, setDayIndex] = useState<number | undefined>(undefined);
  const [isPending, startTransition] = useTransition();
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const resetAddForm = () => {
    onClose();
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
          if (!demoEncountered) onPhotoAdded();
        } else {
          setUploadProgress(null);
          setError(
            succeeded === 0
              ? "사진 저장에 실패했어요. 잠시 후 다시 시도해주세요."
              : `${succeeded}장 추가 완료, ${failed}장 실패. 실패한 사진은 그대로 남아 있어요.`,
          );
          setFilePreviews((prev) => prev.slice(succeeded));
          if (succeeded > 0 && !demoEncountered) onPhotoAdded();
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
        if (!result.demo) onPhotoAdded();
      } else {
        setError("저장에 실패했습니다. 다시 시도해주세요.");
      }
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="photo-add-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) resetAddForm();
      }}
    >
      <div
        className="bg-surface-card w-full max-w-lg rounded-t-xl p-td-md pb-8 animate-slide-up max-h-[90vh] overflow-y-auto"
      >
        <h2 id="photo-add-modal-title" className="text-td-card-title font-bold text-ink mb-td-sm">
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
                        loading="lazy"
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
  );
}
