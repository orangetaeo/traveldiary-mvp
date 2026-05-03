/**
 * 받은 ShareLink LocalStorage 추적 — 사이클 W (M7 미니).
 *
 * 익명 협업 답습(ADR-036, lib/share/clientId.ts):
 *  - LocalStorage만 사용, 서버에 user 매핑 X
 *  - OAuth 활성 후 actorId User FK 마이그(MEMORY 큰 사이클 후보 9)와 호환
 *
 * /share/[key] 방문 시 ReceivedKeysTracker가 add() 호출 → /shared에서 list().
 * lookup API가 revoke/expired 상태를 실시간 반환.
 */

const STORAGE_KEY = "td_received_share_keys";
const MAX_KEYS = 50;
const TTL_MS = 365 * 24 * 60 * 60 * 1000;

export interface ReceivedKey {
  key: string;
  addedAt: number;
  cachedDestination?: string;
  cachedNights?: number;
}

interface StoredShape {
  v: 1;
  items: ReceivedKey[];
}

function readRaw(): StoredShape {
  if (typeof window === "undefined") return { v: 1, items: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { v: 1, items: [] };
    const parsed = JSON.parse(raw) as StoredShape;
    if (!parsed || parsed.v !== 1 || !Array.isArray(parsed.items)) {
      return { v: 1, items: [] };
    }
    return parsed;
  } catch {
    return { v: 1, items: [] };
  }
}

function writeRaw(data: StoredShape): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // private 모드 / quota — 조용히 무시
  }
}

export function listReceivedKeys(): ReceivedKey[] {
  const cutoff = Date.now() - TTL_MS;
  const items = readRaw().items.filter((it) => it.addedAt >= cutoff);
  // 최신 순
  return [...items].sort((a, b) => b.addedAt - a.addedAt);
}

export function addReceivedKey(
  key: string,
  meta?: { destination?: string; nights?: number },
): void {
  if (!key || typeof key !== "string") return;
  const data = readRaw();
  const now = Date.now();
  const existing = data.items.find((it) => it.key === key);
  if (existing) {
    existing.addedAt = now;
    if (meta?.destination) existing.cachedDestination = meta.destination;
    if (typeof meta?.nights === "number") existing.cachedNights = meta.nights;
  } else {
    data.items.unshift({
      key,
      addedAt: now,
      cachedDestination: meta?.destination,
      cachedNights: meta?.nights,
    });
  }
  // LRU — 50개 초과 시 오래된 것 drop
  if (data.items.length > MAX_KEYS) {
    data.items.sort((a, b) => b.addedAt - a.addedAt);
    data.items.length = MAX_KEYS;
  }
  writeRaw(data);
}

export function removeReceivedKey(key: string): void {
  const data = readRaw();
  data.items = data.items.filter((it) => it.key !== key);
  writeRaw(data);
}

export function clearReceivedKeys(): void {
  writeRaw({ v: 1, items: [] });
}

/** 테스트 격리용 — vitest에서 module reset 대신 사용 */
export const _internal = {
  STORAGE_KEY,
  MAX_KEYS,
  TTL_MS,
};
