/**
 * Trip Dashboard ?focus=<key> query param 파싱 — 옵션 J (PR #288 후속).
 *
 * 외부 진입점(payment 가이드, 향후 모닝 브리핑/공유 링크 등)에서 dashboard로 들어올 때
 * 어떤 카드(BentoSummary)를 강조할지 지정. 알려지지 않은 값은 undefined로 무시(BC).
 *
 * 순수 함수 — 외부 의존성 0.
 */

export const FOCUS_KEYS = [
  "itinerary",
  "cost",
  "checklist",
  "vote",
] as const;

export type FocusKey = (typeof FOCUS_KEYS)[number];

const FOCUS_KEY_SET: ReadonlySet<string> = new Set(FOCUS_KEYS);

/** searchParams의 focus 값을 안전하게 파싱. 알려지지 않은 값/배열/없음 → undefined. */
export function parseFocusKey(
  raw: string | string[] | undefined,
): FocusKey | undefined {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (typeof v !== "string") return undefined;
  return FOCUS_KEY_SET.has(v) ? (v as FocusKey) : undefined;
}

/** focus key → DOM id ("focus-cost" 등). FocusScroller가 scrollIntoView로 사용. */
export function focusElementId(key: FocusKey): string {
  return `focus-${key}`;
}
