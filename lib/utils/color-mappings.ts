/**
 * 공유 색상 매핑 유틸리티.
 *
 * 사용처:
 *   - components/notifications/NotificationListView.tsx
 *   - components/recap/PostTripRecapView.tsx
 */

/** 아이콘/뱃지 배경색 (soft) */
export const COLOR_BG: Record<string, string> = {
  purple: "bg-purple-soft",
  coral: "bg-accent-soft",
  amber: "bg-amber-soft",
  gray: "bg-surface-soft",
};

/** 아이콘/텍스트 강조색 */
export const COLOR_TEXT: Record<string, string> = {
  purple: "text-purple",
  coral: "text-accent",
  amber: "text-amber-deep",
  gray: "text-ink-soft",
};
