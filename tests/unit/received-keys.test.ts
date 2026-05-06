/**
 * 사이클 W — receivedKeys LocalStorage 추적 단위 테스트.
 *
 * vitest jsdom 환경에서 window.localStorage 사용 가능.
 */

import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";

// LocalStorage mock — vitest node 환경 (jsdom 의존성 0).
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

beforeAll(() => {
  (globalThis as Record<string, unknown>).window = {
    localStorage: new MemoryStorage(),
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
  addReceivedKey,
  listReceivedKeys,
  removeReceivedKey,
  clearReceivedKeys,
  _internal,
} from "@/lib/share/receivedKeys";

describe("receivedKeys — LocalStorage 추적", () => {
  beforeEach(() => {
    clearReceivedKeys();
  });

  it("빈 상태 → list 빈 배열", () => {
    expect(listReceivedKeys()).toEqual([]);
  });

  it("add 후 list — 메타 보존", () => {
    addReceivedKey("key-aaa", { destination: "푸꾸옥", nights: 4 });
    const items = listReceivedKeys();
    expect(items).toHaveLength(1);
    expect(items[0].key).toBe("key-aaa");
    expect(items[0].cachedDestination).toBe("푸꾸옥");
    expect(items[0].cachedNights).toBe(4);
  });

  it("동일 key 재등록 → 1건 유지(LRU 갱신)", () => {
    addReceivedKey("key-aaa", { destination: "푸꾸옥" });
    addReceivedKey("key-aaa", { destination: "푸꾸옥(updated)" });
    const items = listReceivedKeys();
    expect(items).toHaveLength(1);
    expect(items[0].cachedDestination).toBe("푸꾸옥(updated)");
  });

  it("최신순 정렬", async () => {
    addReceivedKey("first");
    await new Promise((r) => setTimeout(r, 5));
    addReceivedKey("second");
    const items = listReceivedKeys();
    expect(items[0].key).toBe("second");
    expect(items[1].key).toBe("first");
  });

  it("remove → 해당 항목 사라짐", () => {
    addReceivedKey("key-a");
    addReceivedKey("key-b");
    removeReceivedKey("key-a");
    const items = listReceivedKeys();
    expect(items.map((it) => it.key)).toEqual(["key-b"]);
  });

  it("MAX_KEYS 초과 → LRU drop", () => {
    for (let i = 0; i < _internal.MAX_KEYS + 5; i++) {
      addReceivedKey(`key-${i}`);
    }
    expect(listReceivedKeys().length).toBe(_internal.MAX_KEYS);
  });

  it("invalid input 무시", () => {
    addReceivedKey("");
    addReceivedKey(undefined as unknown as string);
    expect(listReceivedKeys()).toEqual([]);
  });

  it("clearReceivedKeys → 전체 삭제", () => {
    addReceivedKey("a");
    addReceivedKey("b");
    clearReceivedKeys();
    expect(listReceivedKeys()).toEqual([]);
  });

  describe("사이클 2 (G7, 2026-05-06) — addReceivedKey return value", () => {
    it("첫 추가 → isNew=true (banner 트리거)", () => {
      const result = addReceivedKey("brand-new-key");
      expect(result.isNew).toBe(true);
    });

    it("같은 key 재추가 → isNew=false (LRU 갱신만, banner 미표시)", () => {
      addReceivedKey("dup-key");
      const second = addReceivedKey("dup-key", { destination: "푸꾸옥" });
      expect(second.isNew).toBe(false);
    });

    it("빈 key/undefined → isNew=false (early return)", () => {
      const empty = addReceivedKey("");
      const undef = addReceivedKey(undefined as unknown as string);
      expect(empty.isNew).toBe(false);
      expect(undef.isNew).toBe(false);
    });
  });
});
