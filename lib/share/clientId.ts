/**
 * 익명 협업 — 본인 식별 토큰 (LocalStorage UUID).
 *
 * 사이클 R (ADR-036) — OAuth 미활성 시점에도 본인 댓글/리액션 식별 가능.
 * 1년 유효, 만료 시 자동 재발급. 서버에는 매 요청마다 함께 전송 (Server Action 인자).
 *
 * Privacy: clientUuid는 본인 댓글 삭제 권한에만 사용. 외부 노출 X (서버 저장만).
 */

const STORAGE_KEY = "td_client_uuid";

/** crypto.randomUUID() — Node 18+, 모든 모던 브라우저 지원 */
function generateUuid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // 폴백 (RFC 4122 v4 단순)
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * LocalStorage에서 client UUID 읽거나 신규 발급.
 * "use client" 컴포넌트에서만 호출 (SSR 호출 시 빈 문자열 반환).
 */
export function getOrCreateClientUuid(): string {
  if (typeof window === "undefined") return ""; // SSR 가드
  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing && existing.length > 0) return existing;
    const fresh = generateUuid();
    window.localStorage.setItem(STORAGE_KEY, fresh);
    return fresh;
  } catch {
    // private 모드 / 차단 시 메모리 폴백 (세션 한정)
    return generateUuid();
  }
}

/**
 * nickname LocalStorage 저장 — 다음 댓글 시 자동 채움 (UX 편의).
 * 길이 제한 2~10자.
 */
const NICKNAME_KEY = "td_share_nickname";

export function getStoredNickname(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(NICKNAME_KEY) ?? "";
  } catch {
    return "";
  }
}

export function setStoredNickname(name: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(NICKNAME_KEY, name);
  } catch {
    // ignore
  }
}
