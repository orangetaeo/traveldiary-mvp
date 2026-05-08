"use client";

/**
 * 익명 협업 댓글/리액션 섹션 — 사이클 R (ADR-036).
 *
 * /share/[key] 페이지 하단에 노출. nickname + clientUuid 기반 (OAuth 미활성).
 * 본인 댓글만 삭제 가능 (clientUuid 매칭).
 *
 * 데모 모드(DB 미연결)에서는 LocalStorage에 저장 — 새로고침 시 유지.
 */

import { useEffect, useState, useTransition } from "react";
import {
  getOrCreateClientUuid,
  getStoredNickname,
  setStoredNickname,
} from "@/lib/share/clientId";
import {
  createCommentAction,
  deleteCommentAction,
  editCommentAction,
} from "@/actions/shareComment";
import type {
  CommentReaction,
  ShareCommentRow,
} from "@/lib/repositories/shareComment.repository";
import { REACTION_FULL_LABEL } from "@/lib/constants/reaction-constants";

interface CommentSectionProps {
  syncKey: string;
  /** SSR에서 받은 기존 댓글 (DB 모드). 데모 모드면 빈 배열 */
  initialComments: ShareCommentRow[];
  /** ShareLink 만료/revoke 시 작성 차단 — 표시만, 검증은 서버에서 다시 */
  disabled?: boolean;
  disabledReason?: string;
  /** C5 — 아이템별 댓글. null이면 trip 전체, string이면 해당 아이템 */
  itemId?: string | null;
  /** C5 — 아이템 내 인라인 모드 (축약 UI) */
  compact?: boolean;
}

const DEMO_STORAGE_KEY_PREFIX = "td_demo_comments_";

export function CommentSection({
  syncKey,
  initialComments,
  disabled = false,
  disabledReason,
  itemId = null,
  compact = false,
}: CommentSectionProps) {
  const [comments, setComments] = useState<ShareCommentRow[]>(initialComments);
  const [nickname, setNickname] = useState("");
  const [body, setBody] = useState("");
  const [reaction, setReaction] = useState<CommentReaction>(null);
  const [error, setError] = useState<string | null>(null);
  const [clientUuid, setClientUuid] = useState("");
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");

  // 클라이언트 마운트 후 — clientUuid + 저장된 nickname 채움
  useEffect(() => {
    setClientUuid(getOrCreateClientUuid());
    setNickname(getStoredNickname());
    // 데모 모드 댓글 LocalStorage에서 읽기
    if (initialComments.length === 0) {
      try {
        const raw = window.localStorage.getItem(
          DEMO_STORAGE_KEY_PREFIX + syncKey,
        );
        if (raw) {
          const parsed = JSON.parse(raw) as ShareCommentRow[];
          if (Array.isArray(parsed)) setComments(parsed);
        }
      } catch {
        // ignore
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncKey]);

  function persistDemoComments(next: ShareCommentRow[]) {
    try {
      window.localStorage.setItem(
        DEMO_STORAGE_KEY_PREFIX + syncKey,
        JSON.stringify(next),
      );
    } catch {
      // ignore
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (disabled) {
      setError(disabledReason ?? "댓글 작성이 잠시 차단되어 있어요");
      return;
    }
    if (nickname.trim().length < 2 || nickname.trim().length > 10) {
      setError("닉네임은 2~10자");
      return;
    }
    if (body.trim().length < 1 || body.trim().length > 200) {
      setError("내용은 1~200자");
      return;
    }

    setStoredNickname(nickname.trim());

    startTransition(async () => {
      const result = await createCommentAction({
        syncKey,
        itemId,
        nickname: nickname.trim(),
        body: body.trim(),
        reaction,
        clientUuid,
      });

      if (!result.ok) {
        setError(result.message ?? "댓글 작성에 실패했어요");
        return;
      }

      // optimistic — 화면에 즉시 추가
      const fakeId =
        result.demo === false ? result.commentId : `demo-${Date.now()}`;
      const newComment: ShareCommentRow = {
        id: fakeId,
        shareLinkId: "demo",
        itemId: itemId ?? null,
        nickname: nickname.trim(),
        body: body.trim(),
        reaction,
        clientUuid,
        actorId: null,
        createdAt: new Date().toISOString(),
        deletedAt: null,
      };
      const next = [newComment, ...comments];
      setComments(next);
      if (result.demo) persistDemoComments(next);
      setBody("");
      setReaction(null);
    });
  }

  async function handleDelete(commentId: string) {
    if (!confirm("이 댓글을 삭제할까요?")) return;
    startTransition(async () => {
      const result = await deleteCommentAction({
        syncKey,
        commentId,
        clientUuid,
      });
      if (!result.ok) {
        setError("삭제 실패 — 본인 댓글만 삭제 가능");
        return;
      }
      const next = comments.filter((c) => c.id !== commentId);
      setComments(next);
      // 데모 모드 LocalStorage 갱신
      if (commentId.startsWith("demo-")) persistDemoComments(next);
    });
  }

  function handleStartEdit(comment: ShareCommentRow) {
    setEditingId(comment.id);
    setEditBody(comment.body);
    setError(null);
  }

  function handleCancelEdit() {
    setEditingId(null);
    setEditBody("");
  }

  async function handleSaveEdit(commentId: string) {
    if (editBody.trim().length < 1 || editBody.trim().length > 200) {
      setError("내용은 1~200자");
      return;
    }
    startTransition(async () => {
      const result = await editCommentAction({
        syncKey,
        commentId,
        body: editBody.trim(),
        clientUuid,
      });
      if (!result.ok) {
        setError(result.message ?? "수정 실패");
        return;
      }
      // optimistic update
      const next = comments.map((c) =>
        c.id === commentId ? { ...c, body: editBody.trim() } : c,
      );
      setComments(next);
      if (commentId.startsWith("demo-")) persistDemoComments(next);
      setEditingId(null);
      setEditBody("");
    });
  }

  const headingId = compact ? `comment-heading-${itemId}` : "comment-heading";

  return (
    <section
      aria-labelledby={headingId}
      className={compact ? "mt-td-sm pt-td-sm border-t border-divider/50" : "mt-td-lg pt-td-lg border-t border-divider"}
    >
      <h3
        id={headingId}
        className={compact ? "text-td-meta text-ink-soft mb-td-xs" : "text-td-card-title text-ink mb-td-sm"}
      >
        {compact ? "의견 남기기" : "함께 의견 나누기"}
      </h3>
      {disabled && (
        <p className="bg-amber-soft text-amber-deep text-td-meta px-td-md py-td-sm rounded-lg mb-td-md">
          🔒 {disabledReason ?? "이 링크는 댓글을 받지 않아요."}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-surface-card border border-divider rounded-md p-td-md mb-td-md space-y-td-xs"
      >
        <div className="flex gap-td-xs">
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="닉네임 (2~10자)"
            maxLength={10}
            className="px-td-sm py-td-xs rounded-lg border border-divider text-td-meta w-32 flex-shrink-0"
            aria-label="닉네임"
            disabled={disabled || isPending}
          />
          <select
            value={reaction ?? ""}
            onChange={(e) =>
              setReaction((e.target.value || null) as CommentReaction)
            }
            className="px-td-sm py-td-xs rounded-lg border border-divider text-td-meta flex-1"
            aria-label="리액션"
            disabled={disabled || isPending}
          >
            <option value="">리액션 없음</option>
            {(Object.entries(REACTION_FULL_LABEL) as [
              NonNullable<CommentReaction>,
              string,
            ][]).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="의견을 남겨주세요 (최대 200자)"
          maxLength={200}
          rows={3}
          className="w-full px-td-sm py-td-xs rounded-lg border border-divider text-td-meta resize-none"
          aria-label="댓글 본문"
          disabled={disabled || isPending}
        />
        {error && (
          <p className="text-td-caption text-danger" role="alert">
            {error}
          </p>
        )}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={disabled || isPending}
            className="bg-purple text-white px-td-md py-td-xs rounded-full text-td-meta font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isPending ? "등록 중..." : "등록"}
          </button>
        </div>
      </form>

      {comments.length === 0 ? (
        <p className="text-td-meta text-ink-mute text-center py-td-md">
          아직 의견이 없어요. 첫 의견을 남겨보세요.
        </p>
      ) : (
        <ul className="space-y-td-sm">
          {comments.map((c) => {
            const mine = c.clientUuid === clientUuid;
            return (
              <li
                key={c.id}
                className="bg-surface-card border border-divider rounded-lg p-td-sm"
              >
                <div className="flex items-center justify-between gap-td-sm mb-td-xxs">
                  <div className="flex items-center gap-td-xs min-w-0">
                    <span className="text-td-meta text-ink font-bold truncate">
                      {c.nickname}
                    </span>
                    {c.reaction && (
                      <span className="text-td-caption bg-purple-soft text-purple-deep px-1 py-0.5 rounded">
                        {REACTION_FULL_LABEL[c.reaction]}
                      </span>
                    )}
                  </div>
                  <span className="text-td-caption text-ink-mute flex-shrink-0">
                    {new Date(c.createdAt).toLocaleDateString("ko-KR", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                {editingId === c.id ? (
                  <div className="mt-td-xxs space-y-td-xxs">
                    <textarea
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      maxLength={200}
                      rows={3}
                      className="w-full px-td-sm py-td-xs rounded-lg border border-divider text-td-meta resize-none"
                      aria-label="댓글 수정"
                      disabled={isPending}
                    />
                    <div className="flex justify-end gap-td-xs">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        disabled={isPending}
                        className="text-td-caption text-ink-mute hover:underline disabled:opacity-50"
                      >
                        취소
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(c.id)}
                        disabled={isPending}
                        className="text-td-caption text-purple font-medium hover:underline disabled:opacity-50"
                      >
                        {isPending ? "저장 중..." : "저장"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-td-meta text-ink-soft whitespace-pre-wrap">
                    {c.body}
                  </p>
                )}
                {mine && editingId !== c.id && (
                  <div className="flex justify-end gap-td-xs mt-td-xxs">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(c)}
                      disabled={isPending}
                      className="text-td-caption text-ink-mute hover:underline disabled:opacity-50"
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(c.id)}
                      disabled={isPending}
                      className="text-td-caption text-danger hover:underline disabled:opacity-50"
                    >
                      삭제
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
