"use client";

/**
 * ProfileEditForm — 프로필 닉네임 편집 인라인 폼.
 * 프로필 카드 클릭 → 모달 폼 → 저장 → 페이지 새로고침.
 */

import { useState, useCallback } from "react";
import { updateUserProfile } from "@/actions/user";

interface ProfileEditFormProps {
  currentName: string | null;
  userEmail: string | null;
}

export function ProfileEditForm({ currentName, userEmail }: ProfileEditFormProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(currentName ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleOpen = useCallback(() => {
    setName(currentName ?? "");
    setError(null);
    setSuccess(false);
    setOpen(true);
  }, [currentName]);

  const handleClose = useCallback(() => {
    setOpen(false);
    setError(null);
    setSuccess(false);
  }, []);

  const handleSubmit = useCallback(async () => {
    const trimmed = name.trim();
    if (trimmed.length < 1) {
      setError("닉네임을 입력해 주세요");
      return;
    }
    if (trimmed.length > 80) {
      setError("닉네임은 80자 이내로 입력해 주세요");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const result = await updateUserProfile({ name: trimmed });
      if (result.ok) {
        setSuccess(true);
        setTimeout(() => {
          setOpen(false);
          setSuccess(false);
          // Server action revalidatePath 후 페이지 새로고침
          window.location.reload();
        }, 600);
      } else if (result.code === "invalid") {
        setError("올바른 닉네임을 입력해 주세요");
      } else if (result.code === "forbidden") {
        setError("로그인이 필요합니다");
      } else {
        setError("저장 중 오류가 발생했습니다");
      }
    } catch {
      setError("네트워크 오류가 발생했습니다");
    } finally {
      setSaving(false);
    }
  }, [name]);

  return (
    <>
      {/* 프로필 카드 — 클릭하면 편집 모달 */}
      <button
        type="button"
        onClick={handleOpen}
        className="w-full bg-surface-card border border-divider rounded-md p-4 flex items-center gap-4 hover:bg-surface-soft transition-colors text-left"
        aria-label="프로필 편집"
      >
        <div className="w-16 h-16 rounded-full bg-purple-soft border-2 border-purple/30 flex items-center justify-center shrink-0">
          {currentName ? (
            <span className="text-xl font-bold text-purple">{currentName.charAt(0)}</span>
          ) : (
            <span className="material-symbols-outlined text-purple text-[28px]">person</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-td-card-title font-medium text-ink truncate">
            {currentName ?? "미설정"}
          </p>
          <p className="text-td-meta text-ink-mute truncate">
            {userEmail ?? "이메일 미설정"}
          </p>
        </div>
        <span className="material-symbols-outlined text-ink-mute" aria-hidden>edit</span>
      </button>

      {/* 편집 모달 */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-edit-modal-title"
        >
          {/* 백드롭 */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={handleClose}
            aria-hidden
          />

          {/* 모달 본체 */}
          <div className="relative bg-surface-card w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 shadow-xl animate-in slide-in-from-bottom-4 duration-200">
            <div className="flex justify-between items-center mb-5">
              <h3 id="profile-edit-modal-title" className="text-td-title font-bold text-ink">프로필 편집</h3>
              <button
                type="button"
                onClick={handleClose}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-soft transition-colors"
                aria-label="닫기"
              >
                <span className="material-symbols-outlined text-ink-mute">close</span>
              </button>
            </div>

            {/* 닉네임 필드 */}
            <label className="block mb-2">
              <span className="text-td-body font-medium text-ink">닉네임</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                placeholder="닉네임을 입력하세요"
                className="mt-1 w-full px-4 py-3 bg-surface border border-divider rounded-lg text-td-body text-ink placeholder:text-ink-mute focus:outline-none focus:ring-2 focus:ring-purple/40 focus:border-purple transition-colors"
                disabled={saving}
                autoFocus
              />
            </label>
            <p className="text-td-caption text-ink-mute mb-4">
              {name.trim().length}/80자 · 다른 여행자에게 보이는 이름입니다
            </p>

            {/* 이메일 (읽기 전용) */}
            {userEmail && (
              <label className="block mb-5">
                <span className="text-td-body font-medium text-ink-mute">이메일</span>
                <p className="mt-1 px-4 py-3 bg-surface-soft border border-divider rounded-lg text-td-body text-ink-mute">
                  {userEmail}
                </p>
                <p className="text-td-caption text-ink-mute mt-1">
                  카카오 계정 이메일 · 변경 불가
                </p>
              </label>
            )}

            {/* 에러/성공 메시지 */}
            {error && (
              <p className="text-td-body text-red-500 mb-3" role="alert">{error}</p>
            )}
            {success && (
              <p className="text-td-body text-green-600 mb-3" role="status">저장되었습니다</p>
            )}

            {/* 버튼 */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-3 rounded-lg border border-divider text-td-body font-medium text-ink-mute hover:bg-surface-soft transition-colors"
                disabled={saving}
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="flex-1 py-3 rounded-lg bg-purple text-white text-td-body font-bold hover:bg-purple-dark transition-colors disabled:opacity-50"
                disabled={saving || name.trim().length < 1}
              >
                {saving ? "저장 중…" : "저장"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
