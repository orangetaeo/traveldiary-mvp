/**
 * lib/share/receivedKeys.ts 단위 테스트.
 *
 * listReceivedKeys, addReceivedKey, removeReceivedKey, clearReceivedKeys.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

let storageData: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => storageData[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { storageData[key] = value; }),
  removeItem: vi.fn((key: string) => { delete storageData[key]; }),
};

vi.stubGlobal("window", { localStorage: localStorageMock });

import {
  listReceivedKeys,
  addReceivedKey,
  removeReceivedKey,
  clearReceivedKeys,
  _internal,
} from "@/lib/share/receivedKeys";

describe("receivedKeys", () => {
  beforeEach(() => {
    storageData = {};
    localStorageMock.getItem.mockImplementation((key: string) => storageData[key] ?? null);
    localStorageMock.setItem.mockImplementation((key: string, value: string) => { storageData[key] = value; });
  });

  it("상수 검증", () => {
    expect(_internal.MAX_KEYS).toBe(50);
    expect(_internal.TTL_MS).toBe(365 * 24 * 60 * 60 * 1000);
  });

  // ─── listReceivedKeys ──────────────────────────────────────

  describe("listReceivedKeys", () => {
    it("비어있음 → 빈 배열", () => {
      expect(listReceivedKeys()).toEqual([]);
    });

    it("저장된 키 반환 (최신 순)", () => {
      const now = Date.now();
      storageData[_internal.STORAGE_KEY] = JSON.stringify({
        v: 1,
        items: [
          { key: "a", addedAt: now - 3000 },
          { key: "b", addedAt: now - 1000 },
          { key: "c", addedAt: now - 2000 },
        ],
      });
      const r = listReceivedKeys();
      expect(r[0].key).toBe("b"); // most recent
      expect(r[1].key).toBe("c");
      expect(r[2].key).toBe("a"); // oldest
    });

    it("TTL 만료된 키 필터링", () => {
      const expired = Date.now() - _internal.TTL_MS - 1;
      const fresh = Date.now();
      storageData[_internal.STORAGE_KEY] = JSON.stringify({
        v: 1,
        items: [
          { key: "old", addedAt: expired },
          { key: "new", addedAt: fresh },
        ],
      });
      const r = listReceivedKeys();
      expect(r).toHaveLength(1);
      expect(r[0].key).toBe("new");
    });

    it("잘못된 JSON → 빈 배열", () => {
      storageData[_internal.STORAGE_KEY] = "invalid json!!!";
      expect(listReceivedKeys()).toEqual([]);
    });

    it("잘못된 schema (v !== 1) → 빈 배열", () => {
      storageData[_internal.STORAGE_KEY] = JSON.stringify({ v: 2, items: [] });
      expect(listReceivedKeys()).toEqual([]);
    });
  });

  // ─── addReceivedKey ────────────────────────────────────────

  describe("addReceivedKey", () => {
    it("새 키 추가 → isNew=true", () => {
      const r = addReceivedKey("key-1", { destination: "다낭", nights: 3 });
      expect(r.isNew).toBe(true);

      const stored = JSON.parse(storageData[_internal.STORAGE_KEY]);
      expect(stored.items[0].key).toBe("key-1");
      expect(stored.items[0].cachedDestination).toBe("다낭");
      expect(stored.items[0].cachedNights).toBe(3);
    });

    it("기존 키 재추가 → isNew=false + addedAt 갱신", () => {
      addReceivedKey("key-1", { destination: "다낭" });
      const r = addReceivedKey("key-1", { destination: "호치민" });
      expect(r.isNew).toBe(false);

      const stored = JSON.parse(storageData[_internal.STORAGE_KEY]);
      // 기존 키의 destination 업데이트됨
      expect(stored.items[0].cachedDestination).toBe("호치민");
    });

    it("빈 key → isNew=false (무시)", () => {
      expect(addReceivedKey("")).toEqual({ isNew: false });
    });

    it("LRU — 50개 초과 시 오래된 것 제거", () => {
      // 50개 추가
      for (let i = 0; i < 55; i++) {
        addReceivedKey(`key-${i}`);
      }
      const stored = JSON.parse(storageData[_internal.STORAGE_KEY]);
      expect(stored.items.length).toBe(50);
    });
  });

  // ─── removeReceivedKey ─────────────────────────────────────

  describe("removeReceivedKey", () => {
    it("키 제거", () => {
      addReceivedKey("key-1");
      addReceivedKey("key-2");
      removeReceivedKey("key-1");

      const stored = JSON.parse(storageData[_internal.STORAGE_KEY]);
      expect(stored.items).toHaveLength(1);
      expect(stored.items[0].key).toBe("key-2");
    });

    it("없는 키 제거 → 에러 없음", () => {
      addReceivedKey("key-1");
      expect(() => removeReceivedKey("nonexistent")).not.toThrow();
    });
  });

  // ─── clearReceivedKeys ─────────────────────────────────────

  describe("clearReceivedKeys", () => {
    it("모든 키 초기화", () => {
      addReceivedKey("key-1");
      addReceivedKey("key-2");
      clearReceivedKeys();

      const stored = JSON.parse(storageData[_internal.STORAGE_KEY]);
      expect(stored.items).toEqual([]);
    });
  });
});
