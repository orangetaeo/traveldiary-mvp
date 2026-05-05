/**
 * Auth / Share 유틸 테스트 — Batch 7.
 *
 * 3 모듈:
 *  - lib/share/clientId.ts: getOrCreateClientUuid, getStoredNickname, setStoredNickname
 *  - lib/share/receivedKeys.ts: addReceivedKey, listReceivedKeys, removeReceivedKey, clearReceivedKeys
 *  - lib/auth/admin-guard.ts: assertAdminAccess (timing-safe, fail-closed)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

/* ────────── localStorage mock ────────── */

function createLocalStorageMock() {
  const store = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => { store.set(key, value); }),
    removeItem: vi.fn((key: string) => { store.delete(key); }),
    clear: vi.fn(() => { store.clear(); }),
    get length() { return store.size; },
    key: vi.fn((i: number) => [...store.keys()][i] ?? null),
    _store: store,
  };
}

/* ────────── clientId ────────── */

describe("share — clientId", () => {
  let mockStorage: ReturnType<typeof createLocalStorageMock>;

  beforeEach(() => {
    vi.resetModules();
    mockStorage = createLocalStorageMock();
    Object.defineProperty(globalThis, "window", {
      value: { localStorage: mockStorage },
      writable: true,
      configurable: true,
    });
  });

  it("SSR (window undefined) → 빈 문자열", async () => {
    Object.defineProperty(globalThis, "window", { value: undefined, configurable: true });
    const { getOrCreateClientUuid } = await import("@/lib/share/clientId");
    expect(getOrCreateClientUuid()).toBe("");
  });

  it("첫 호출 → UUID 생성 + localStorage 저장", async () => {
    const { getOrCreateClientUuid } = await import("@/lib/share/clientId");
    const uuid = getOrCreateClientUuid();
    expect(uuid).toMatch(/^[0-9a-f-]{36}$/);
    expect(mockStorage.setItem).toHaveBeenCalledWith("td_client_uuid", uuid);
  });

  it("2번째 호출 → 기존 UUID 반환 (생성 1회만)", async () => {
    const { getOrCreateClientUuid } = await import("@/lib/share/clientId");
    const first = getOrCreateClientUuid();
    const second = getOrCreateClientUuid();
    expect(second).toBe(first);
  });

  it("localStorage 차단 → 폴백 UUID 반환 (throw 안 함)", async () => {
    mockStorage.getItem.mockImplementation(() => { throw new Error("blocked"); });
    mockStorage.setItem.mockImplementation(() => { throw new Error("blocked"); });
    const { getOrCreateClientUuid } = await import("@/lib/share/clientId");
    const uuid = getOrCreateClientUuid();
    expect(uuid.length).toBeGreaterThan(0);
  });

  it("getStoredNickname — SSR → 빈 문자열", async () => {
    Object.defineProperty(globalThis, "window", { value: undefined, configurable: true });
    const { getStoredNickname } = await import("@/lib/share/clientId");
    expect(getStoredNickname()).toBe("");
  });

  it("setStoredNickname + getStoredNickname 왕복", async () => {
    const { getStoredNickname, setStoredNickname } = await import("@/lib/share/clientId");
    setStoredNickname("여행자");
    expect(getStoredNickname()).toBe("여행자");
  });

  it("setStoredNickname — SSR → no-op (throw 안 함)", async () => {
    Object.defineProperty(globalThis, "window", { value: undefined, configurable: true });
    const { setStoredNickname } = await import("@/lib/share/clientId");
    expect(() => setStoredNickname("test")).not.toThrow();
  });
});

/* ────────── receivedKeys ────────── */

describe("share — receivedKeys", () => {
  let mockStorage: ReturnType<typeof createLocalStorageMock>;

  beforeEach(() => {
    vi.resetModules();
    mockStorage = createLocalStorageMock();
    Object.defineProperty(globalThis, "window", {
      value: { localStorage: mockStorage },
      writable: true,
      configurable: true,
    });
  });

  it("초기 상태 → 빈 배열", async () => {
    const { listReceivedKeys } = await import("@/lib/share/receivedKeys");
    expect(listReceivedKeys()).toEqual([]);
  });

  it("addReceivedKey → list에 포함", async () => {
    const { addReceivedKey, listReceivedKeys } = await import("@/lib/share/receivedKeys");
    addReceivedKey("abc123", { destination: "다낭", nights: 3 });
    const keys = listReceivedKeys();
    expect(keys.length).toBe(1);
    expect(keys[0].key).toBe("abc123");
    expect(keys[0].cachedDestination).toBe("다낭");
    expect(keys[0].cachedNights).toBe(3);
  });

  it("중복 key → 덮어쓰기 (addedAt 갱신)", async () => {
    const { addReceivedKey, listReceivedKeys } = await import("@/lib/share/receivedKeys");
    const before = Date.now();
    addReceivedKey("k1", { destination: "푸꾸옥" });
    // 약간 시간 후 재추가
    vi.spyOn(Date, "now").mockReturnValue(before + 1000);
    addReceivedKey("k1", { destination: "푸꾸옥 업데이트" });
    const keys = listReceivedKeys();
    expect(keys.length).toBe(1);
    expect(keys[0].cachedDestination).toBe("푸꾸옥 업데이트");
    expect(keys[0].addedAt).toBeGreaterThanOrEqual(before);
    vi.restoreAllMocks();
  });

  it("최신 순 정렬", async () => {
    const { addReceivedKey, listReceivedKeys } = await import("@/lib/share/receivedKeys");
    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(now);
    addReceivedKey("old");
    vi.spyOn(Date, "now").mockReturnValue(now + 5000);
    addReceivedKey("new");
    const keys = listReceivedKeys();
    expect(keys[0].key).toBe("new");
    expect(keys[1].key).toBe("old");
    vi.restoreAllMocks();
  });

  it("LRU — 50개 초과 시 오래된 것 drop", async () => {
    const { addReceivedKey, listReceivedKeys, _internal } = await import("@/lib/share/receivedKeys");
    const now = Date.now();
    for (let i = 0; i < 55; i++) {
      vi.spyOn(Date, "now").mockReturnValue(now + i * 100);
      addReceivedKey(`key-${i}`);
    }
    const keys = listReceivedKeys();
    expect(keys.length).toBe(_internal.MAX_KEYS); // 50
    // 가장 최신이 첫 번째
    expect(keys[0].key).toBe("key-54");
    vi.restoreAllMocks();
  });

  it("TTL — 1년 초과 항목 필터링", async () => {
    const { addReceivedKey, listReceivedKeys, _internal } = await import("@/lib/share/receivedKeys");
    const pastYear = Date.now() - _internal.TTL_MS - 1000;
    vi.spyOn(Date, "now").mockReturnValue(pastYear);
    addReceivedKey("expired");
    vi.restoreAllMocks();
    // 현재 시점에서 조회 시 만료
    const keys = listReceivedKeys();
    expect(keys.length).toBe(0);
  });

  it("removeReceivedKey → 해당 key 제거", async () => {
    const { addReceivedKey, removeReceivedKey, listReceivedKeys } = await import("@/lib/share/receivedKeys");
    addReceivedKey("a");
    addReceivedKey("b");
    removeReceivedKey("a");
    const keys = listReceivedKeys();
    expect(keys.length).toBe(1);
    expect(keys[0].key).toBe("b");
  });

  it("clearReceivedKeys → 전체 초기화", async () => {
    const { addReceivedKey, clearReceivedKeys, listReceivedKeys } = await import("@/lib/share/receivedKeys");
    addReceivedKey("x");
    addReceivedKey("y");
    clearReceivedKeys();
    expect(listReceivedKeys()).toEqual([]);
  });

  it("빈 key → 무시 (추가 안 됨)", async () => {
    const { addReceivedKey, listReceivedKeys } = await import("@/lib/share/receivedKeys");
    addReceivedKey("");
    expect(listReceivedKeys()).toEqual([]);
  });

  it("SSR → 빈 배열 (throw 안 함)", async () => {
    Object.defineProperty(globalThis, "window", { value: undefined, configurable: true });
    const { listReceivedKeys } = await import("@/lib/share/receivedKeys");
    expect(listReceivedKeys()).toEqual([]);
  });

  it("localStorage 깨진 JSON → 빈 배열로 복구", async () => {
    mockStorage._store.set("td_received_share_keys", "not-json{{{");
    const { listReceivedKeys } = await import("@/lib/share/receivedKeys");
    expect(listReceivedKeys()).toEqual([]);
  });

  it("잘못된 version → 빈 배열로 복구", async () => {
    mockStorage._store.set("td_received_share_keys", JSON.stringify({ v: 99, items: [] }));
    const { listReceivedKeys } = await import("@/lib/share/receivedKeys");
    expect(listReceivedKeys()).toEqual([]);
  });
});

/* ────────── admin-guard ────────── */

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({
  notFound: () => { throw new Error("NEXT_NOT_FOUND"); },
}));

describe("auth — admin-guard", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("올바른 키 → 예외 없음", async () => {
    process.env.ADMIN_SECRET_KEY = "s3cr3t-key-123";
    const { assertAdminAccess } = await import("@/lib/auth/admin-guard");
    expect(() => assertAdminAccess({ key: "s3cr3t-key-123" })).not.toThrow();
  });

  it("잘못된 키 → notFound()", async () => {
    process.env.ADMIN_SECRET_KEY = "correct";
    const { assertAdminAccess } = await import("@/lib/auth/admin-guard");
    expect(() => assertAdminAccess({ key: "wrong" })).toThrow("NEXT_NOT_FOUND");
  });

  it("env 미설정 (fail-closed) → notFound()", async () => {
    delete process.env.ADMIN_SECRET_KEY;
    const { assertAdminAccess } = await import("@/lib/auth/admin-guard");
    expect(() => assertAdminAccess({ key: "anything" })).toThrow("NEXT_NOT_FOUND");
  });

  it("key 미제공 → notFound()", async () => {
    process.env.ADMIN_SECRET_KEY = "correct";
    const { assertAdminAccess } = await import("@/lib/auth/admin-guard");
    expect(() => assertAdminAccess({})).toThrow("NEXT_NOT_FOUND");
  });

  it("빈 문자열 env → notFound() (fail-closed)", async () => {
    process.env.ADMIN_SECRET_KEY = "";
    const { assertAdminAccess } = await import("@/lib/auth/admin-guard");
    expect(() => assertAdminAccess({ key: "" })).toThrow("NEXT_NOT_FOUND");
  });

  it("길이 다른 키 → notFound() (timing-safe)", async () => {
    process.env.ADMIN_SECRET_KEY = "short";
    const { assertAdminAccess } = await import("@/lib/auth/admin-guard");
    expect(() => assertAdminAccess({ key: "very-long-key" })).toThrow("NEXT_NOT_FOUND");
  });
});
