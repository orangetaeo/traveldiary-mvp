/**
 * Itinerary coach mark LocalStorage 헬퍼 — 사이클 3 (G4, 2026-05-06).
 *
 * /itinerary/[id] 첫 진입 시 M1 차별화 축(추천 근거 패널)을 사용자에게
 * 한 번 명시적으로 안내하기 위한 1회 표시 박제.
 *
 * 스코프: 글로벌 (앱 전체 1회). EvidencePanel은 trip 무관 컴포넌트.
 * 컨벤션: kebab-case `td-` prefix (pwa-install-dismissed 답습).
 *
 * 사이클 W (receivedKeys) try/catch silent 패턴 답습.
 */

const STORAGE_KEY = "td-itinerary-coach-seen";
const SEEN_VALUE = "1";

export function isItineraryCoachSeen(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === SEEN_VALUE;
  } catch {
    return false;
  }
}

export function markItineraryCoachSeen(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, SEEN_VALUE);
  } catch {
    // private 모드 / quota exceeded / disabled — silent
  }
}

export function clearItineraryCoachSeen(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // silent
  }
}

export const _internal = { STORAGE_KEY, SEEN_VALUE };
