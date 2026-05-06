/**
 * 사이클 5 (G8) — OTA outgoing tracking 단위 테스트.
 *
 * sessionStorage 사용 — received-keys / coachMark MemoryStorage 답습.
 */

import {
  describe,
  it,
  expect,
  beforeEach,
  beforeAll,
  afterAll,
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

beforeAll(() => {
  (globalThis as Record<string, unknown>).window = {
    sessionStorage: new MemoryStorage(),
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
  setOtaOutgoing,
  getOtaOutgoing,
  clearOtaOutgoing,
  _internal,
} from "@/lib/ota/outgoing";

const SAMPLE = {
  itemId: "pq-item-1",
  offerId: "agoda-1",
  ota: "agoda",
  priceKrw: 89000,
};

describe("OTA outgoing — sessionStorage 마킹", () => {
  beforeEach(() => {
    clearOtaOutgoing();
  });

  it("초기 상태 null", () => {
    expect(getOtaOutgoing()).toBeNull();
  });

  it("setOtaOutgoing 후 getOtaOutgoing이 mark 반환 (clickedAt 자동 박힘)", () => {
    setOtaOutgoing(SAMPLE);
    const got = getOtaOutgoing();
    expect(got).not.toBeNull();
    expect(got?.itemId).toBe(SAMPLE.itemId);
    expect(got?.offerId).toBe(SAMPLE.offerId);
    expect(got?.ota).toBe(SAMPLE.ota);
    expect(got?.priceKrw).toBe(SAMPLE.priceKrw);
    expect(typeof got?.clickedAt).toBe("number");
  });

  it("clearOtaOutgoing으로 제거", () => {
    setOtaOutgoing(SAMPLE);
    expect(getOtaOutgoing()).not.toBeNull();
    clearOtaOutgoing();
    expect(getOtaOutgoing()).toBeNull();
  });

  it("TTL 30분 만료 시 자동 정리 + null 반환", () => {
    setOtaOutgoing(SAMPLE);
    const futureNow = Date.now() + _internal.TTL_MS + 1000;
    expect(getOtaOutgoing(futureNow)).toBeNull();
    // 자동 정리 — 다음 호출도 null
    expect(getOtaOutgoing()).toBeNull();
  });

  it("TTL 경계 직전(만료 10초 전)은 여전히 유효", () => {
    setOtaOutgoing(SAMPLE);
    const justBefore = Date.now() + _internal.TTL_MS - 10_000;
    expect(getOtaOutgoing(justBefore)).not.toBeNull();
  });

  it("스키마 손상(필드 누락) 시 null 반환 — 오염 방지", () => {
    (globalThis as { window: { sessionStorage: MemoryStorage } }).window.sessionStorage.setItem(
      _internal.STORAGE_KEY,
      JSON.stringify({ itemId: "x", offerId: "y" }), // ota/priceKrw/clickedAt 누락
    );
    expect(getOtaOutgoing()).toBeNull();
  });

  it("STORAGE_KEY 컨벤션 — td- prefix", () => {
    expect(_internal.STORAGE_KEY).toBe("td-ota-outgoing");
    expect(_internal.STORAGE_KEY.startsWith("td-")).toBe(true);
  });

  it("TTL 30분 = 30 * 60 * 1000 ms", () => {
    expect(_internal.TTL_MS).toBe(30 * 60 * 1000);
  });
});

describe("SSR 안전성 — window 미정의", () => {
  it("window 미정의 시 getOtaOutgoing은 null (throw 금지)", () => {
    const saved = (globalThis as Record<string, unknown>).window;
    delete (globalThis as Record<string, unknown>).window;
    try {
      expect(getOtaOutgoing()).toBeNull();
      expect(() => setOtaOutgoing(SAMPLE)).not.toThrow();
      expect(() => clearOtaOutgoing()).not.toThrow();
    } finally {
      (globalThis as Record<string, unknown>).window = saved;
    }
  });
});
