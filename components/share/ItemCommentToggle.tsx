"use client";

/**
 * C5 — 아이템별 댓글 토글 버튼 + 인라인 CommentSection.
 *
 * 공유 페이지(/share/[key])의 각 일정 카드 하단에 배치.
 * 클릭 → 해당 아이템 댓글 섹션 펼침/접힘.
 */

import { useState } from "react";
import type { ShareCommentRow } from "@/lib/repositories/shareComment.repository";
import { CommentSection } from "./CommentSection";

interface ItemCommentToggleProps {
  syncKey: string;
  itemId: string;
  itemName: string;
  initialComments: ShareCommentRow[];
  disabled?: boolean;
  disabledReason?: string;
}

export function ItemCommentToggle({
  syncKey,
  itemId,
  itemName,
  initialComments,
  disabled,
  disabledReason,
}: ItemCommentToggleProps) {
  const [open, setOpen] = useState(false);
  const count = initialComments.length;

  return (
    <div className="mt-td-xs">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-td-caption text-purple hover:text-purple-deep transition-colors"
        aria-expanded={open}
        aria-label={`${itemName} 댓글 ${count}개`}
      >
        <span className="material-symbols-outlined text-[16px]" aria-hidden>
          {open ? "chat" : "chat_bubble_outline"}
        </span>
        <span>의견 {count > 0 ? count : ""}</span>
        <span className="material-symbols-outlined text-[14px]" aria-hidden>
          {open ? "expand_less" : "expand_more"}
        </span>
      </button>

      {open && (
        <CommentSection
          syncKey={syncKey}
          itemId={itemId}
          initialComments={initialComments}
          disabled={disabled}
          disabledReason={disabledReason}
          compact
        />
      )}
    </div>
  );
}
