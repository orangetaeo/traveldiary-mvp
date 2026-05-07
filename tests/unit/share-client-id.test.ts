/**
 * lib/share/clientId.ts 단위 테스트.
 *
 * getOrCreateClientUuid, getStoredNickname, setStoredNickname.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

let mockStorage: Record<string, string> = {};

// localStorage mock
const localStorageMock = {
  getItem: vi.fn((key: string) => mockStorage[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { mockStorage[key] = value; }),
  removeItem: vi.fn((key: string) => { delete mockStorage[key]; }),
};

vi.stubGlobal("window", { localStorage: localStorageMock });
vi.stubGlobal("crypto", { randomUUID: () => "mock-uuid-1234" });

import {
  getOrCreateClientUuid,
  getStoredNickname,
  setStoredNickname,
} from "@/lib/share/clientId";

describe("clientId", () => {
  beforeEach(() => {
    mockStorage = {};
    // Restore default implementations after clearAllMocks
    localStorageMock.getItem.mockImplementation((key: string) => mockStorage[key] ?? null);
    localStorageMock.setItem.mockImplementation((key: string, value: string) => { mockStorage[key] = value; });
    localStorageMock.removeItem.mockImplementation((key: string) => { delete mockStorage[key]; });
  });

  // ─── getOrCreateClientUuid ─────────────────────────────────

  describe("getOrCreateClientUuid", () => {
    it("기존 UUID → 반환 (신규 생성 안 함)", () => {
      mockStorage["td_client_uuid"] = "existing-uuid";
      const uuid = getOrCreateClientUuid();
      expect(uuid).toBe("existing-uuid");
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it("UUID 없음 → 신규 생성 + 저장", () => {
      const uuid = getOrCreateClientUuid();
      expect(uuid).toBe("mock-uuid-1234");
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "td_client_uuid",
        "mock-uuid-1234",
      );
    });

    it("빈 문자열 저장 → 신규 생성", () => {
      mockStorage["td_client_uuid"] = "";
      const uuid = getOrCreateClientUuid();
      expect(uuid).toBe("mock-uuid-1234");
    });

    it("localStorage 에러 → 메모리 UUID 반환", () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error("SecurityError");
      });
      const uuid = getOrCreateClientUuid();
      expect(uuid).toBe("mock-uuid-1234");
    });
  });

  // ─── getStoredNickname ─────────────────────────────────────

  describe("getStoredNickname", () => {
    it("저장된 닉네임 → 반환", () => {
      mockStorage["td_share_nickname"] = "여행자";
      expect(getStoredNickname()).toBe("여행자");
    });

    it("없으면 → 빈 문자열", () => {
      expect(getStoredNickname()).toBe("");
    });

    it("localStorage 에러 → 빈 문자열", () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error("QuotaExceeded");
      });
      expect(getStoredNickname()).toBe("");
    });
  });

  // ─── setStoredNickname ─────────────────────────────────────

  describe("setStoredNickname", () => {
    it("닉네임 저장", () => {
      setStoredNickname("탐험가");
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "td_share_nickname",
        "탐험가",
      );
    });

    it("localStorage 에러 → 무시 (throw 안 함)", () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error("QuotaExceeded");
      });
      expect(() => setStoredNickname("test")).not.toThrow();
    });
  });
});
