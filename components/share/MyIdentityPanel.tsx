"use client";

/**
 * 사이클 SS — /shared 페이지 "내 정보" 섹션.
 *
 * clientUuid (앞 8자리만 표시 — PII 보호) + nickname 편집.
 * OAuth 미활성 시점 익명 협업의 본인 식별 정보를 사용자가 직접 확인.
 * OAuth 활성 후 actorId User FK 자연 통합 (ADR-038 답습).
 */

import { useEffect, useState } from "react";
import {
  getOrCreateClientUuid,
  getStoredNickname,
  setStoredNickname,
} from "@/lib/share/clientId";

const NICKNAME_MIN = 2;
const NICKNAME_MAX = 10;

export function MyIdentityPanel() {
  const [uuid, setUuid] = useState("");
  const [nickname, setNickname] = useState("");
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    const u = getOrCreateClientUuid();
    setUuid(u);
    const n = getStoredNickname();
    setNickname(n);
    setDraft(n);
  }, []);

  function handleSave() {
    const trimmed = draft.trim();
    if (trimmed.length < NICKNAME_MIN || trimmed.length > NICKNAME_MAX) return;
    setStoredNickname(trimmed);
    setNickname(trimmed);
    setEditing(false);
    setSavedAt(Date.now());
  }

  function handleCancel() {
    setDraft(nickname);
    setEditing(false);
  }

  // SSR 시 uuid 빈 값 — 빈 출력 (UI flash 방지)
  if (!uuid) return null;

  const uuidPrefix = uuid.slice(0, 8);
  const canSave =
    draft.trim().length >= NICKNAME_MIN &&
    draft.trim().length <= NICKNAME_MAX &&
    draft.trim() !== nickname;

  return (
    <section
      aria-label="내 정보 (익명 협업)"
      className="bg-surface-card border border-divider rounded-xl p-4 mb-4"
    >
      <header className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-ink">내 정보</h2>
        <span className="text-[11px] text-ink-mute">익명 협업 ID</span>
      </header>

      <div className="space-y-2 text-xs text-ink-soft">
        <div className="flex items-center justify-between gap-2">
          <span>닉네임</span>
          {editing ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value.slice(0, NICKNAME_MAX))}
                placeholder="2~10자"
                aria-label="닉네임 편집"
                className="px-2 py-1 border border-divider rounded text-xs bg-surface-soft w-24"
                maxLength={NICKNAME_MAX}
              />
              <button
                type="button"
                onClick={handleSave}
                disabled={!canSave}
                className="text-xs text-purple font-semibold disabled:opacity-40"
              >
                저장
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="text-xs text-ink-mute hover:text-ink"
              >
                취소
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-ink font-medium">
                {nickname || <em className="text-ink-mute">(미설정)</em>}
              </span>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="text-xs text-purple hover:text-purple-deep"
              >
                {nickname ? "변경" : "설정"}
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <span>Client ID</span>
          <code className="text-[11px] text-ink-mute font-mono tabular-nums">
            {uuidPrefix}…
          </code>
        </div>

        {savedAt && (
          <p
            role="status"
            className="text-[11px] text-success-deep mt-1"
          >
            저장됨 — 다음 댓글부터 새 닉네임 적용
          </p>
        )}
      </div>

      <p className="text-[11px] text-ink-mute mt-3 leading-relaxed">
        💡 익명 협업 모드 — 댓글/리액션은 이 ID로 식별됩니다. 향후 카카오 로그인
        활성화 시 자동 연결됩니다.
      </p>
    </section>
  );
}
