/**
 * useWrapUpReview LocalStorage helpers 단위 테스트.
 * use-item-checkins.test.ts 패턴 답습 (MemoryStorage + globalThis.window 주입).
 */

import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  afterAll,
  afterEach,
} from "vitest";

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
  getWrapUpReviewStorageKey,
  readWrapUpReviewFromStorage,
  writeWrapUpReviewToStorage,
} from "@/lib/hooks/useWrapUpReview";

const TRIP = "trip-pqc";

describe("useWrapUpReview helpers", () => {
  beforeEach(() => STORAGE.clear());

  describe("getWrapUpReviewStorageKey", () => {
    it("trip별 격리 키", () => {
      expect(getWrapUpReviewStorageKey("a")).toBe("td-wrap-review-a");
      expect(getWrapUpReviewStorageKey("b")).toBe("td-wrap-review-b");
      expect(getWrapUpReviewStorageKey("a")).not.toBe(
        getWrapUpReviewStorageKey("b"),
      );
    });
  });

  describe("readWrapUpReviewFromStorage", () => {
    it("미저장 → { rating: 0, text: '' }", () => {
      expect(readWrapUpReviewFromStorage(TRIP)).toEqual({ rating: 0, text: "" });
    });

    it("정상 객체 round-trip", () => {
      writeWrapUpReviewToStorage(TRIP, { rating: 4, text: "최고" });
      expect(readWrapUpReviewFromStorage(TRIP)).toEqual({
        rating: 4,
        text: "최고",
      });
    });

    it("malformed JSON → empty", () => {
      STORAGE.setItem(getWrapUpReviewStorageKey(TRIP), "not-json{");
      expect(readWrapUpReviewFromStorage(TRIP)).toEqual({ rating: 0, text: "" });
    });

    it("배열은 거부", () => {
      STORAGE.setItem(getWrapUpReviewStorageKey(TRIP), JSON.stringify([4, "x"]));
      expect(readWrapUpReviewFromStorage(TRIP)).toEqual({ rating: 0, text: "" });
    });

    it("rating 음수/초과 → 0", () => {
      STORAGE.setItem(
        getWrapUpReviewStorageKey(TRIP),
        JSON.stringify({ rating: -1, text: "" }),
      );
      expect(readWrapUpReviewFromStorage(TRIP).rating).toBe(0);
      STORAGE.setItem(
        getWrapUpReviewStorageKey(TRIP),
        JSON.stringify({ rating: 6, text: "" }),
      );
      expect(readWrapUpReviewFromStorage(TRIP).rating).toBe(0);
    });

    it("rating 부동소수 → floor", () => {
      STORAGE.setItem(
        getWrapUpReviewStorageKey(TRIP),
        JSON.stringify({ rating: 3.7, text: "" }),
      );
      expect(readWrapUpReviewFromStorage(TRIP).rating).toBe(3);
    });

    it("rating NaN/Infinity → 0", () => {
      STORAGE.setItem(
        getWrapUpReviewStorageKey(TRIP),
        '{"rating":"NaN","text":""}',
      );
      expect(readWrapUpReviewFromStorage(TRIP).rating).toBe(0);
    });

    it("text 2000자 cap", () => {
      const long = "가".repeat(2500);
      writeWrapUpReviewToStorage(TRIP, { rating: 0, text: long });
      const got = readWrapUpReviewFromStorage(TRIP);
      expect(got.text.length).toBe(2000);
    });

    it("text 비-string → empty string", () => {
      STORAGE.setItem(
        getWrapUpReviewStorageKey(TRIP),
        JSON.stringify({ rating: 5, text: 42 }),
      );
      expect(readWrapUpReviewFromStorage(TRIP).text).toBe("");
    });
  });

  describe("writeWrapUpReviewToStorage", () => {
    it("정상 저장", () => {
      writeWrapUpReviewToStorage(TRIP, { rating: 5, text: "추천" });
      const raw = STORAGE.getItem(getWrapUpReviewStorageKey(TRIP));
      expect(raw).toBe(JSON.stringify({ rating: 5, text: "추천" }));
    });

    it("저장 실패 시 silent skip (QuotaExceeded 모방)", () => {
      const original = STORAGE.setItem.bind(STORAGE);
      STORAGE.setItem = () => {
        throw new Error("QuotaExceeded");
      };
      expect(() =>
        writeWrapUpReviewToStorage(TRIP, { rating: 4, text: "x" }),
      ).not.toThrow();
      STORAGE.setItem = original;
    });
  });

  describe("trip 격리", () => {
    it("trip A의 후기는 trip B에 영향 없음", () => {
      writeWrapUpReviewToStorage("trip-a", { rating: 5, text: "A" });
      writeWrapUpReviewToStorage("trip-b", { rating: 2, text: "B" });
      expect(readWrapUpReviewFromStorage("trip-a")).toEqual({
        rating: 5,
        text: "A",
      });
      expect(readWrapUpReviewFromStorage("trip-b")).toEqual({
        rating: 2,
        text: "B",
      });
    });
  });

  describe("SSR 안전 — window undefined", () => {
    let savedWindow: unknown;
    beforeEach(() => {
      savedWindow = (globalThis as Record<string, unknown>).window;
      delete (globalThis as Record<string, unknown>).window;
    });

    it("read는 EMPTY 반환", () => {
      expect(readWrapUpReviewFromStorage(TRIP)).toEqual({ rating: 0, text: "" });
    });

    it("write는 noop", () => {
      expect(() =>
        writeWrapUpReviewToStorage(TRIP, { rating: 5, text: "x" }),
      ).not.toThrow();
    });

    afterEach(() => {
      (globalThis as Record<string, unknown>).window = savedWindow;
    });
  });
});

