/**
 * Share 모듈 + ResolvedTrip 테스트 — Batch 24.
 *
 * 4 모듈:
 *  - lib/share/clientId.ts: getOrCreateClientUuid, getStoredNickname, setStoredNickname
 *  - lib/share/receivedKeys.ts: listReceivedKeys, addReceivedKey, removeReceivedKey, clearReceivedKeys
 *  - lib/share/filterReceived.ts: matchesQuery, matchesStatus, filterReceived
 *  - lib/services/resolved-trip.ts: resolveTrip, resolveTripsByCityCode, listResolvedTrips
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  matchesQuery,
  matchesStatus,
  filterReceived,
  STATUS_FILTER_LABELS,
} from "@/lib/share/filterReceived";
import { resolveTrip, resolveTripsByCityCode, listResolvedTrips } from "@/lib/services/resolved-trip";

/* ════════════════════════════════════════════
 * filterReceived — matchesQuery
 * ════════════════════════════════════════════ */

describe("share/filterReceived — matchesQuery", () => {
  it("빈 query → 모두 통과", () => {
    expect(matchesQuery({ destination: "다낭", status: "active" }, "")).toBe(true);
    expect(matchesQuery({ destination: "다낭", status: "active" }, "  ")).toBe(true);
  });

  it("부분 일치 (한국어)", () => {
    expect(matchesQuery({ destination: "다낭 해변 여행", status: "active" }, "다낭")).toBe(true);
    expect(matchesQuery({ destination: "다낭 해변 여행", status: "active" }, "해변")).toBe(true);
  });

  it("대소문자 무시 (영어)", () => {
    expect(matchesQuery({ destination: "Da Nang", status: "active" }, "da nang")).toBe(true);
    expect(matchesQuery({ destination: "Da Nang", status: "active" }, "DA")).toBe(true);
  });

  it("미매칭 → false", () => {
    expect(matchesQuery({ destination: "다낭", status: "active" }, "호이안")).toBe(false);
  });

  it("destination undefined → 빈 문자열로 취급", () => {
    expect(matchesQuery({ status: "active" }, "다낭")).toBe(false);
    expect(matchesQuery({ status: "active" }, "")).toBe(true);
  });
});

/* ════════════════════════════════════════════
 * filterReceived — matchesStatus
 * ════════════════════════════════════════════ */

describe("share/filterReceived — matchesStatus", () => {
  it("'all' → 모두 true", () => {
    expect(matchesStatus({ status: "active", destination: "" }, "all")).toBe(true);
    expect(matchesStatus({ status: "revoked", destination: "" }, "all")).toBe(true);
    expect(matchesStatus({ status: "expired", destination: "" }, "all")).toBe(true);
    expect(matchesStatus({ status: "not_found", destination: "" }, "all")).toBe(true);
  });

  it("'active' → active만 true", () => {
    expect(matchesStatus({ status: "active", destination: "" }, "active")).toBe(true);
    expect(matchesStatus({ status: "revoked", destination: "" }, "active")).toBe(false);
    expect(matchesStatus({ status: "expired", destination: "" }, "active")).toBe(false);
  });

  it("'inactive' → active 아닌 것 true", () => {
    expect(matchesStatus({ status: "active", destination: "" }, "inactive")).toBe(false);
    expect(matchesStatus({ status: "revoked", destination: "" }, "inactive")).toBe(true);
    expect(matchesStatus({ status: "expired", destination: "" }, "inactive")).toBe(true);
    expect(matchesStatus({ status: "not_found", destination: "" }, "inactive")).toBe(true);
  });
});

/* ════════════════════════════════════════════
 * filterReceived — filterReceived (통합)
 * ════════════════════════════════════════════ */

describe("share/filterReceived — filterReceived", () => {
  const items = [
    { destination: "다낭 여행", status: "active" as const },
    { destination: "호이안 투어", status: "revoked" as const },
    { destination: "하노이 맛집", status: "active" as const },
    { destination: "호치민", status: "expired" as const },
  ];

  it("query + status 복합 필터", () => {
    const result = filterReceived(items, "호", "all");
    expect(result.length).toBe(2); // 호이안 + 호치민
  });

  it("active + 검색 → 매칭 + active만", () => {
    const result = filterReceived(items, "", "active");
    expect(result.length).toBe(2); // 다낭 + 하노이
  });

  it("빈 query + all → 전체 반환", () => {
    expect(filterReceived(items, "", "all").length).toBe(4);
  });

  it("매칭 없음 → 빈 배열", () => {
    expect(filterReceived(items, "나트랑", "all").length).toBe(0);
  });

  it("STATUS_FILTER_LABELS 3종", () => {
    expect(Object.keys(STATUS_FILTER_LABELS).length).toBe(3);
    expect(STATUS_FILTER_LABELS.all).toBe("전체");
  });
});

/* ════════════════════════════════════════════
 * share/clientId — localStorage mock
 * ════════════════════════════════════════════ */

describe("share/clientId", () => {
  let origWindow: typeof globalThis.window;
  let store: Record<string, string>;

  beforeEach(() => {
    origWindow = globalThis.window;
    store = {};
    // @ts-expect-error mock window
    globalThis.window = {
      localStorage: {
        getItem: (k: string) => store[k] ?? null,
        setItem: (k: string, v: string) => { store[k] = v; },
        removeItem: (k: string) => { delete store[k]; },
      },
    };
  });

  afterEach(() => {
    // @ts-expect-error restore
    globalThis.window = origWindow;
  });

  it("SSR (window undefined) → 빈 문자열", async () => {
    // @ts-expect-error SSR simulation
    globalThis.window = undefined;
    const { getOrCreateClientUuid } = await import("@/lib/share/clientId");
    expect(getOrCreateClientUuid()).toBe("");
  });

  it("첫 호출 → UUID 발급 + 저장", async () => {
    const { getOrCreateClientUuid } = await import("@/lib/share/clientId");
    const uuid = getOrCreateClientUuid();
    expect(uuid.length).toBeGreaterThan(10);
    expect(store["td_client_uuid"]).toBe(uuid);
  });

  it("재호출 → 동일 UUID 반환", async () => {
    store["td_client_uuid"] = "existing-uuid-123";
    const { getOrCreateClientUuid } = await import("@/lib/share/clientId");
    expect(getOrCreateClientUuid()).toBe("existing-uuid-123");
  });

  it("getStoredNickname — 없으면 빈 문자열", async () => {
    const { getStoredNickname } = await import("@/lib/share/clientId");
    expect(getStoredNickname()).toBe("");
  });

  it("setStoredNickname + get → 저장/조회", async () => {
    const { setStoredNickname, getStoredNickname } = await import("@/lib/share/clientId");
    setStoredNickname("여행자");
    expect(getStoredNickname()).toBe("여행자");
  });
});

/* ════════════════════════════════════════════
 * share/receivedKeys — localStorage mock
 * ════════════════════════════════════════════ */

describe("share/receivedKeys", () => {
  let origWindow: typeof globalThis.window;
  let store: Record<string, string>;

  beforeEach(() => {
    origWindow = globalThis.window;
    store = {};
    // @ts-expect-error mock window
    globalThis.window = {
      localStorage: {
        getItem: (k: string) => store[k] ?? null,
        setItem: (k: string, v: string) => { store[k] = v; },
        removeItem: (k: string) => { delete store[k]; },
      },
    };
  });

  afterEach(() => {
    // @ts-expect-error restore
    globalThis.window = origWindow;
  });

  it("빈 상태 → listReceivedKeys 빈 배열", async () => {
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

  it("동일 키 재추가 → 시간 갱신 (중복 없음)", async () => {
    const { addReceivedKey, listReceivedKeys } = await import("@/lib/share/receivedKeys");
    addReceivedKey("key1");
    addReceivedKey("key1", { destination: "호이안" });
    const keys = listReceivedKeys();
    expect(keys.length).toBe(1);
    expect(keys[0].cachedDestination).toBe("호이안");
  });

  it("removeReceivedKey → 삭제", async () => {
    const { addReceivedKey, removeReceivedKey, listReceivedKeys } = await import("@/lib/share/receivedKeys");
    addReceivedKey("x");
    addReceivedKey("y");
    removeReceivedKey("x");
    const keys = listReceivedKeys();
    expect(keys.length).toBe(1);
    expect(keys[0].key).toBe("y");
  });

  it("clearReceivedKeys → 전체 삭제", async () => {
    const { addReceivedKey, clearReceivedKeys, listReceivedKeys } = await import("@/lib/share/receivedKeys");
    addReceivedKey("a");
    addReceivedKey("b");
    clearReceivedKeys();
    expect(listReceivedKeys()).toEqual([]);
  });

  it("빈 키 무시", async () => {
    const { addReceivedKey, listReceivedKeys } = await import("@/lib/share/receivedKeys");
    addReceivedKey("");
    expect(listReceivedKeys()).toEqual([]);
  });

  it("SSR (window undefined) → 빈 배열", async () => {
    // @ts-expect-error SSR simulation
    globalThis.window = undefined;
    const { listReceivedKeys } = await import("@/lib/share/receivedKeys");
    expect(listReceivedKeys()).toEqual([]);
  });

  it("MAX_KEYS(50) 초과 → LRU drop", async () => {
    const { addReceivedKey, listReceivedKeys, _internal } = await import("@/lib/share/receivedKeys");
    for (let i = 0; i < _internal.MAX_KEYS + 5; i++) {
      addReceivedKey(`key-${i}`);
    }
    const keys = listReceivedKeys();
    expect(keys.length).toBeLessThanOrEqual(_internal.MAX_KEYS);
  });
});

/* ════════════════════════════════════════════
 * resolved-trip — 시드 기반
 * ════════════════════════════════════════════ */

describe("services/resolved-trip", () => {
  it("listResolvedTrips → 1개 이상", () => {
    const trips = listResolvedTrips();
    expect(trips.length).toBeGreaterThanOrEqual(1);
  });

  it("모든 trip에 city + items 존재", () => {
    for (const rt of listResolvedTrips()) {
      expect(rt.city).toBeDefined();
      expect(rt.city.name).toBeTruthy();
      expect(rt.items.length).toBeGreaterThan(0);
      expect(rt.itemCount).toBe(rt.items.length);
    }
  });

  it("resolveTrip 유효 ID → ResolvedTrip 반환", () => {
    const all = listResolvedTrips();
    const tripId = all[0].trip.id;
    const resolved = resolveTrip(tripId);
    expect(resolved).not.toBeNull();
    expect(resolved!.trip.id).toBe(tripId);
  });

  it("resolveTrip 없는 ID → null", () => {
    expect(resolveTrip("nonexistent-trip")).toBeNull();
  });

  it("resolveTripsByCityCode — 시드 도시 코드", () => {
    const all = listResolvedTrips();
    const code = all[0].trip.destinationCode;
    const trips = resolveTripsByCityCode(code);
    expect(trips.length).toBeGreaterThanOrEqual(1);
    expect(trips[0].trip.destinationCode).toBe(code);
  });

  it("resolveTripsByCityCode — 없는 코드 → 빈 배열", () => {
    expect(resolveTripsByCityCode("XXX")).toEqual([]);
  });

  it("verifiedCount 계산 정확", () => {
    const all = listResolvedTrips();
    for (const rt of all) {
      const expectedVerified = rt.items.filter((it) => it.evidence.sources.length > 0).length;
      expect(rt.verifiedCount).toBe(expectedVerified);
    }
  });
});
