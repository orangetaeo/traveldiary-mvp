/**
 * OTA outgoing tracking — 사이클 5 (G8, 2026-05-06).
 *
 * OTA 카드 클릭 → window.open 외부 이동 직전에 sessionStorage에 outgoing 마킹.
 * reentry 감지 시(visibilitychange/focus) 이 마킹을 읽어 "예약하셨나요?" inline 카드 표시.
 *
 * 스코프: itemId 단위 (한 일정에 OTA 여러 offer 가능 — 가장 최근 outgoing만 유지).
 * TTL: 30분 — 결제 후 reentry까지 합리적 시간 + 만료된 outgoing은 무시.
 *
 * 컨벤션: `td-` kebab prefix (사이클 3 coachMark 답습).
 * 안전: SSR/private mode try/catch silent (사이클 W received-keys 답습).
 */

const STORAGE_KEY = "td-ota-outgoing";
const TTL_MS = 30 * 60 * 1000;

export interface OtaOutgoingMark {
  itemId: string;
  offerId: string;
  ota: string;
  priceKrw: number;
  /** 클릭 시각 (Date.now() ms) */
  clickedAt: number;
}

export function setOtaOutgoing(mark: Omit<OtaOutgoingMark, "clickedAt">): void {
  if (typeof window === "undefined") return;
  try {
    const full: OtaOutgoingMark = { ...mark, clickedAt: Date.now() };
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(full));
  } catch {
    // private mode / quota — silent
  }
}

export function getOtaOutgoing(now: number = Date.now()): OtaOutgoingMark | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OtaOutgoingMark;
    if (
      typeof parsed?.itemId !== "string" ||
      typeof parsed?.offerId !== "string" ||
      typeof parsed?.ota !== "string" ||
      typeof parsed?.priceKrw !== "number" ||
      typeof parsed?.clickedAt !== "number"
    ) {
      return null;
    }
    if (now - parsed.clickedAt > TTL_MS) {
      // TTL 만료 — 자동 정리
      clearOtaOutgoing();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearOtaOutgoing(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // silent
  }
}

export const _internal = { STORAGE_KEY, TTL_MS };
