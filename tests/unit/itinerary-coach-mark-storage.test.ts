/**
 * 사이클 3 (G4) — itinerary coach mark LocalStorage 헬퍼 단위 테스트.
 *
 * 사이클 W (received-keys) MemoryStorage mock 패턴 답습.
 * vitest node 환경에서 window 직접 주입.
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
  isItineraryCoachSeen,
  markItineraryCoachSeen,
  clearItineraryCoachSeen,
  _internal,
} from "@/lib/itinerary/coachMark";

describe("itinerary coach mark — LocalStorage 박제", () => {
  beforeEach(() => {
    clearItineraryCoachSeen();
  });

  it("초기 상태는 미표시 (false)", () => {
    expect(isItineraryCoachSeen()).toBe(false);
  });

  it("markItineraryCoachSeen 후 isItineraryCoachSeen=true", () => {
    markItineraryCoachSeen();
    expect(isItineraryCoachSeen()).toBe(true);
  });

  it("clearItineraryCoachSeen으로 초기화 가능 (개발자 디버그용)", () => {
    markItineraryCoachSeen();
    expect(isItineraryCoachSeen()).toBe(true);
    clearItineraryCoachSeen();
    expect(isItineraryCoachSeen()).toBe(false);
  });

  it("STORAGE_KEY는 td- prefix 컨벤션 (pwa-install-dismissed 답습)", () => {
    expect(_internal.STORAGE_KEY).toBe("td-itinerary-coach-seen");
    expect(_internal.STORAGE_KEY.startsWith("td-")).toBe(true);
  });

  it("저장 값은 정확히 '1' — 다른 truthy 값은 미표시 처리", () => {
    expect(_internal.SEEN_VALUE).toBe("1");
    // 임의 truthy 문자열은 SEEN으로 인정하지 않음 (오염 방지)
    (globalThis as { window: { localStorage: MemoryStorage } }).window.localStorage.setItem(
      _internal.STORAGE_KEY,
      "true",
    );
    expect(isItineraryCoachSeen()).toBe(false);
  });
});

describe("SSR 안전성 — window 미정의 환경", () => {
  it("window 미정의 시 isItineraryCoachSeen은 false (throw 금지)", () => {
    const savedWindow = (globalThis as Record<string, unknown>).window;
    delete (globalThis as Record<string, unknown>).window;
    try {
      expect(isItineraryCoachSeen()).toBe(false);
    } finally {
      (globalThis as Record<string, unknown>).window = savedWindow;
    }
  });

  it("window 미정의 시 markItineraryCoachSeen은 throw 안 함", () => {
    const savedWindow = (globalThis as Record<string, unknown>).window;
    delete (globalThis as Record<string, unknown>).window;
    try {
      expect(() => markItineraryCoachSeen()).not.toThrow();
    } finally {
      (globalThis as Record<string, unknown>).window = savedWindow;
    }
  });
});
