/**
 * 리액션 표시용 상수.
 * CommentSection + MyActivitySection 공유.
 */

/** 리액션 → 이모지 */
export const REACTION_EMOJI: Record<string, string> = {
  LIKE: "👍",
  DISLIKE: "👎",
  QUESTION: "❓",
};

/** 리액션 → 이모지 + 한국어 라벨 (선택 UI / 표시용) */
export const REACTION_FULL_LABEL: Record<string, string> = {
  LIKE: "👍 좋아",
  DISLIKE: "👎 별로",
  QUESTION: "❓ 질문",
};
