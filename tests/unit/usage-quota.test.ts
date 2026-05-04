import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  assertQuota,
  recordExternalCall,
  getDailyUsage,
  getKstMidnightMs,
  QuotaExceededError,
  __resetUsageQuotaForTests,
} from "@/lib/usage-quota";

const SAVED_ENV = { ...process.env };

describe("usage-quota — 외부 API 일일 cap (사이클 ZZZ 안전 킬스위치)", () => {
  beforeEach(() => {
    __resetUsageQuotaForTests();
    delete process.env.QUOTA_DAILY_CAP_ANTHROPIC;
    delete process.env.QUOTA_DAILY_CAP_GOOGLE_VISION;
    delete process.env.QUOTA_DAILY_CAP_NAVER_SEARCH;
  });

  afterEach(() => {
    process.env = { ...SAVED_ENV };
  });

  describe("getKstMidnightMs", () => {
    it("UTC 12:00은 다음 KST 자정(=15:00 UTC)을 반환", () => {
      // 2026-05-04 12:00:00 UTC = 2026-05-04 21:00 KST → 다음 자정 = 2026-05-04 15:00 UTC
      const noon = Date.UTC(2026, 4, 4, 12, 0, 0);
      const next = getKstMidnightMs(noon);
      expect(new Date(next).toISOString()).toBe("2026-05-04T15:00:00.000Z");
    });

    it("KST 자정 직전(=14:59 UTC)은 같은 날 KST 자정", () => {
      const just = Date.UTC(2026, 4, 4, 14, 59, 0);
      const next = getKstMidnightMs(just);
      expect(new Date(next).toISOString()).toBe("2026-05-04T15:00:00.000Z");
    });

    it("KST 자정 직후(=15:01 UTC)는 다음 날 KST 자정", () => {
      const just = Date.UTC(2026, 4, 4, 15, 1, 0);
      const next = getKstMidnightMs(just);
      expect(new Date(next).toISOString()).toBe("2026-05-05T15:00:00.000Z");
    });
  });

  describe("getDailyUsage 기본값", () => {
    it("초기 상태는 count=0, cap=DEFAULT", () => {
      const u = getDailyUsage("anthropic");
      expect(u.count).toBe(0);
      expect(u.cap).toBe(1000);
      expect(u.remaining).toBe(1000);
    });

    it("env QUOTA_DAILY_CAP_ANTHROPIC=10 적용", () => {
      process.env.QUOTA_DAILY_CAP_ANTHROPIC = "10";
      const u = getDailyUsage("anthropic");
      expect(u.cap).toBe(10);
    });

    it("env 형식 오류는 무시(default 적용)", () => {
      process.env.QUOTA_DAILY_CAP_ANTHROPIC = "abc";
      expect(getDailyUsage("anthropic").cap).toBe(1000);
      process.env.QUOTA_DAILY_CAP_ANTHROPIC = "-5";
      expect(getDailyUsage("anthropic").cap).toBe(1000);
    });

    it("provider별 cap이 격리됨", () => {
      process.env.QUOTA_DAILY_CAP_ANTHROPIC = "10";
      process.env.QUOTA_DAILY_CAP_GOOGLE_VISION = "20";
      expect(getDailyUsage("anthropic").cap).toBe(10);
      expect(getDailyUsage("google-vision").cap).toBe(20);
      expect(getDailyUsage("naver-search").cap).toBe(5000);
    });
  });

  describe("recordExternalCall + assertQuota", () => {
    it("recordExternalCall 호출 시 count 증가", () => {
      recordExternalCall("anthropic");
      recordExternalCall("anthropic");
      expect(getDailyUsage("anthropic").count).toBe(2);
      expect(getDailyUsage("anthropic").remaining).toBe(998);
    });

    it("provider별 카운트 격리", () => {
      recordExternalCall("anthropic");
      recordExternalCall("anthropic");
      recordExternalCall("naver-search");
      expect(getDailyUsage("anthropic").count).toBe(2);
      expect(getDailyUsage("naver-search").count).toBe(1);
      expect(getDailyUsage("google-vision").count).toBe(0);
    });

    it("cap 미만은 assertQuota 통과", () => {
      process.env.QUOTA_DAILY_CAP_ANTHROPIC = "3";
      recordExternalCall("anthropic");
      recordExternalCall("anthropic");
      expect(() => assertQuota("anthropic")).not.toThrow();
    });

    it("cap 도달 시 QuotaExceededError throw", () => {
      process.env.QUOTA_DAILY_CAP_ANTHROPIC = "2";
      recordExternalCall("anthropic");
      recordExternalCall("anthropic");
      try {
        assertQuota("anthropic");
        expect.fail("should throw");
      } catch (err) {
        expect(err).toBeInstanceOf(QuotaExceededError);
        expect((err as QuotaExceededError).provider).toBe("anthropic");
        expect((err as QuotaExceededError).cap).toBe(2);
      }
    });

    it("cap=0 (env='0')은 항상 차단", () => {
      process.env.QUOTA_DAILY_CAP_ANTHROPIC = "0";
      expect(() => assertQuota("anthropic")).toThrow(QuotaExceededError);
    });
  });

  describe("KST 자정 자동 리셋", () => {
    it("resetAt 도달 시 count=0으로 리셋", () => {
      const before = Date.UTC(2026, 4, 4, 14, 0, 0); // 2026-05-04 23:00 KST
      const after = Date.UTC(2026, 4, 4, 16, 0, 0); // 2026-05-05 01:00 KST (자정 지남)
      recordExternalCall("anthropic", before);
      recordExternalCall("anthropic", before);
      expect(getDailyUsage("anthropic", before).count).toBe(2);
      // 자정 후 동일 provider 조회 → 리셋
      expect(getDailyUsage("anthropic", after).count).toBe(0);
    });

    it("자정 후 첫 record는 count=1, resetAt 갱신", () => {
      const before = Date.UTC(2026, 4, 4, 14, 0, 0);
      const after = Date.UTC(2026, 4, 4, 16, 0, 0);
      recordExternalCall("anthropic", before);
      recordExternalCall("anthropic", after);
      const u = getDailyUsage("anthropic", after);
      expect(u.count).toBe(1);
      expect(new Date(u.resetAt).toISOString()).toBe("2026-05-05T15:00:00.000Z");
    });
  });
});
