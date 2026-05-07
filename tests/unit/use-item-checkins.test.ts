/**
 * useItemCheckins LocalStorage helpers + computeDayProgress 단위 테스트.
 * A2 (Session X cap 2, 2026-05-07) — 디자인 갭 #7 장소 도착 체크인.
 *
 * @testing-library/react 미설치 → hook 자체는 미테스트, helper만 직접 호출.
 * client-id.test.ts 패턴 답습 (MemoryStorage + globalThis.window 주입).
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
  computeDayProgress,
  getCheckinStorageKey,
  readCheckinsFromStorage,
  writeCheckinsToStorage,
  type CheckinMap,
} from "@/lib/hooks/useItemCheckins";

describe("getCheckinStorageKey", () => {
  it("trip ID 격리 — prefix + tripId", () => {
    expect(getCheckinStorageKey("pq-2026")).toBe("td-checkins-pq-2026");
    expect(getCheckinStorageKey("hn-2026")).toBe("td-checkins-hn-2026");
  });
});

describe("computeDayProgress", () => {
  const items = [{ id: "a" }, { id: "b" }, { id: "c" }];

  it("0/3 — 빈 checkins → ratio 0", () => {
    const r = computeDayProgress(items, {});
    expect(r).toEqual({ done: 0, total: 3, ratio: 0 });
  });

  it("2/3 — 부분 체크인 → ratio 2/3", () => {
    const r = computeDayProgress(items, { a: "2026-05-10T10:00:00Z", c: "2026-05-10T15:00:00Z" });
    expect(r.done).toBe(2);
    expect(r.total).toBe(3);
    expect(r.ratio).toBeCloseTo(2 / 3);
  });

  it("3/3 — 모두 체크인 → ratio 1", () => {
    const r = computeDayProgress(items, {
      a: "x", b: "y", c: "z",
    } as CheckinMap);
    expect(r.ratio).toBe(1);
  });

  it("dayItems 0건 → 0/0 (UI에서 숨김)", () => {
    const r = computeDayProgress([], { a: "x" });
    expect(r).toEqual({ done: 0, total: 0, ratio: 0 });
  });

  it("checkins에 없는 item ID는 무시 (다른 day 잔여)", () => {
    const r = computeDayProgress(items, { z: "다른날" });
    expect(r.done).toBe(0);
  });
});

describe("readCheckinsFromStorage / writeCheckinsToStorage", () => {
  beforeEach(() => {
    STORAGE.clear();
  });

  it("write → read 라운드트립", () => {
    writeCheckinsToStorage("trip-1", { "item-a": "2026-05-10T10:00:00.000Z" });
    expect(readCheckinsFromStorage("trip-1")).toEqual({
      "item-a": "2026-05-10T10:00:00.000Z",
    });
  });

  it("키 없을 때 read → 빈 객체", () => {
    expect(readCheckinsFromStorage("trip-empty")).toEqual({});
  });

  it("trip ID 격리 — 다른 tripId는 별도 저장", () => {
    writeCheckinsToStorage("trip-A", { "item-1": "iso-A" });
    writeCheckinsToStorage("trip-B", { "item-2": "iso-B" });
    expect(readCheckinsFromStorage("trip-A")).toEqual({ "item-1": "iso-A" });
    expect(readCheckinsFromStorage("trip-B")).toEqual({ "item-2": "iso-B" });
  });

  it("LocalStorage 손상값(JSON 파싱 실패) → 빈 객체로 복구", () => {
    STORAGE.setItem("td-checkins-trip-x", "not-json{{");
    expect(readCheckinsFromStorage("trip-x")).toEqual({});
  });

  it("형식 가드 — string 아닌 값은 필터링", () => {
    STORAGE.setItem(
      "td-checkins-trip-1",
      JSON.stringify({ "item-x": 123, "item-y": "valid-iso", "item-z": null }),
    );
    const result = readCheckinsFromStorage("trip-1");
    expect(result["item-x"]).toBeUndefined();
    expect(result["item-y"]).toBe("valid-iso");
    expect(result["item-z"]).toBeUndefined();
  });

  it("write 빈 객체 → read 빈 객체 (clearAll 시뮬)", () => {
    writeCheckinsToStorage("trip-1", { "item-a": "iso" });
    writeCheckinsToStorage("trip-1", {});
    expect(readCheckinsFromStorage("trip-1")).toEqual({});
  });

  it("객체가 아닌 LocalStorage 값(배열/숫자) → 빈 객체", () => {
    STORAGE.setItem("td-checkins-trip-1", JSON.stringify(["a", "b"]));
    expect(readCheckinsFromStorage("trip-1")).toEqual({});
  });

  it("SSR 안전 가드 — window 미정의 시 read 빈 객체 + write no-op", () => {
    const saved = (globalThis as Record<string, unknown>).window;
    delete (globalThis as Record<string, unknown>).window;
    try {
      expect(readCheckinsFromStorage("trip-1")).toEqual({});
      // throw 없이 무시
      writeCheckinsToStorage("trip-1", { x: "y" });
    } finally {
      (globalThis as Record<string, unknown>).window = saved;
    }
  });
});
