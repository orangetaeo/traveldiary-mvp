/**
 * 사이클 SS — clientId LocalStorage 단위 테스트.
 *
 * 답습: tests/unit/received-keys.test.ts (사이클 W).
 *
 * 검증:
 *  - getOrCreateClientUuid: 신규 발급 + 기존 보존 + UUID 형식
 *  - getStoredNickname: 빈 + 저장된 값
 *  - setStoredNickname: 저장 + 재조회
 *  - SSR (window 미정의) 안전 가드
 */

import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";

class MemoryStorage {
  private store = new Map<string, string>();
  getItem(k: string): string | null {
    return this.store.has(k) ? this.store.get(k)! : null;
  }
  setItem(k: string, v: string): void {
    this.store.set(k, String(v));
  }
  removeItem(k: string): void {
    this.store.delete(k);
  }
  clear(): void {
    this.store.clear();
  }
}

const SAVED_WINDOW = (globalThis as Record<string, unknown>).window;
const STORAGE = new MemoryStorage();

beforeAll(() => {
  (globalThis as Record<string, unknown>).window = {
    localStorage: STORAGE,
  };
});

afterAll(() => {
  if (SAVED_WINDOW === undefined) {
    delete (globalThis as Record<string, unknown>).window;
  } else {
    (globalThis as Record<string, unknown>).window = SAVED_WINDOW;
  }
});

import {
  getOrCreateClientUuid,
  getStoredNickname,
  setStoredNickname,
} from "@/lib/share/clientId";

describe("clientId — clientUuid + nickname LocalStorage", () => {
  beforeEach(() => {
    STORAGE.clear();
  });

  it("getOrCreateClientUuid — 첫 호출 신규 발급", () => {
    const uuid = getOrCreateClientUuid();
    expect(uuid.length).toBeGreaterThan(0);
    // crypto.randomUUID 또는 폴백 → RFC 4122 v4 형식
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-/i);
  });

  it("getOrCreateClientUuid — 두 번째 호출 동일 UUID 반환 (LocalStorage 보존)", () => {
    const a = getOrCreateClientUuid();
    const b = getOrCreateClientUuid();
    expect(a).toBe(b);
  });

  it("getStoredNickname — 빈 상태 → 빈 문자열", () => {
    expect(getStoredNickname()).toBe("");
  });

  it("setStoredNickname → getStoredNickname 회수", () => {
    setStoredNickname("철수");
    expect(getStoredNickname()).toBe("철수");
  });

  it("setStoredNickname 덮어쓰기 — 마지막 값 보존", () => {
    setStoredNickname("first");
    setStoredNickname("second");
    expect(getStoredNickname()).toBe("second");
  });

  it("SSR 안전 가드 — window 미정의 시 빈 문자열", () => {
    const saved = (globalThis as Record<string, unknown>).window;
    delete (globalThis as Record<string, unknown>).window;
    try {
      expect(getOrCreateClientUuid()).toBe("");
      expect(getStoredNickname()).toBe("");
      // setStoredNickname은 throw 없이 무시
      setStoredNickname("ignored");
    } finally {
      (globalThis as Record<string, unknown>).window = saved;
    }
  });
});
