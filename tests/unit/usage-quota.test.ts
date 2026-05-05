import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  assertQuota,
  checkQuotaOrBlock,
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
    process.env.AUTONOMY_TZ_OFFSET_HOURS = "9"; // 테스트는 KST(+9) 가정
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

  describe("AAAA2 옵션 객체 진화 (헬퍼 진화 #7 답습)", () => {
    it("scalar number fallback — 기존 호출 패턴 유지", () => {
      const ts = Date.UTC(2026, 4, 4, 14, 0, 0);
      recordExternalCall("anthropic", ts);
      expect(getDailyUsage("anthropic", ts).count).toBe(1);
    });

    it("옵션 객체 — now 필드", () => {
      const ts = Date.UTC(2026, 4, 4, 14, 0, 0);
      recordExternalCall("anthropic", { now: ts });
      expect(getDailyUsage("anthropic", ts).count).toBe(1);
    });

    it("옵션 객체 — model/inputTokens/outputTokens/costUsd (count는 그대로 증가)", () => {
      recordExternalCall("anthropic", {
        model: "claude-haiku-4-5-20251001",
        inputTokens: 100,
        outputTokens: 50,
        costUsd: 0.001,
      });
      expect(getDailyUsage("anthropic").count).toBe(1);
    });

    it("scalar timestamp + 옵션 빈 객체 둘 다 정상 동작", () => {
      const ts = Date.UTC(2026, 4, 4, 14, 0, 0);
      recordExternalCall("anthropic", ts);
      recordExternalCall("anthropic", { now: ts });
      expect(getDailyUsage("anthropic", ts).count).toBe(2);
    });

    it("토큰 옵션 없는 호출은 budget forward 0 (별도 검증)", () => {
      // budget 검증은 budget.test.ts에서. 여기서는 cap 카운터만 확인.
      recordExternalCall("anthropic");
      recordExternalCall("anthropic", { now: Date.now() });
      expect(getDailyUsage("anthropic").count).toBe(2);
    });
  });

  describe("AAAA5b — attempted/succeeded/blockedBy 분리 (R1 옵션 B)", () => {
    it("scalar 호출은 succeeded count++ + attempted++ (BC 보장)", () => {
      const now = Date.UTC(2026, 4, 4, 13, 0, 0);
      recordExternalCall("anthropic", now);
      const u = getDailyUsage("anthropic", now);
      expect(u.count).toBe(1);
      expect(u.attempted).toBe(1);
      expect(u.blocked.total).toBe(0);
    });

    it("blockedBy='quota' 명시 시 attempted++ + blocked.quota++ + count 변화 X", () => {
      const now = Date.UTC(2026, 4, 4, 13, 0, 0);
      recordExternalCall("anthropic", { now, blockedBy: "quota" });
      const u = getDailyUsage("anthropic", now);
      expect(u.count).toBe(0);
      expect(u.attempted).toBe(1);
      expect(u.blocked.quota).toBe(1);
      expect(u.blocked.total).toBe(1);
    });

    it("blockedBy='budget' / 'emergency' 분리 카운터", () => {
      const now = Date.UTC(2026, 4, 4, 13, 0, 0);
      recordExternalCall("anthropic", { now, blockedBy: "budget" });
      recordExternalCall("anthropic", { now, blockedBy: "emergency" });
      recordExternalCall("anthropic", { now }); // 정상
      const u = getDailyUsage("anthropic", now);
      expect(u.count).toBe(1);
      expect(u.attempted).toBe(3);
      expect(u.blocked.budget).toBe(1);
      expect(u.blocked.emergency).toBe(1);
      expect(u.blocked.quota).toBe(0);
      expect(u.blocked.total).toBe(2);
    });

    it("blockedBy 명시 시 budget forward 안 됨 (외부 응답 미수신)", () => {
      const now = Date.UTC(2026, 4, 4, 13, 0, 0);
      recordExternalCall("anthropic", {
        now,
        blockedBy: "budget",
        // 차단된 시도이므로 토큰/$ 정보가 있어도 무시되어야 함 (방어적)
        inputTokens: 1000,
        outputTokens: 500,
        costUsd: 100,
      });
      const u = getDailyUsage("anthropic", now);
      expect(u.attempted).toBe(1);
      expect(u.count).toBe(0);
    });

    it("succeeded:false 명시 시도 (응답 실패) → attempted++ + count 변화 X", () => {
      const now = Date.UTC(2026, 4, 4, 13, 0, 0);
      recordExternalCall("anthropic", { now, succeeded: false });
      const u = getDailyUsage("anthropic", now);
      expect(u.attempted).toBe(1);
      expect(u.count).toBe(0);
      expect(u.blocked.total).toBe(0); // succeeded:false는 blocked가 아님
    });

    it("assertQuota cap 비교는 succeeded count 기준 (회귀 보장)", () => {
      process.env.QUOTA_DAILY_CAP_ANTHROPIC = "2";
      const now = Date.UTC(2026, 4, 4, 13, 0, 0);
      // blocked 시도 100번도 cap 영향 X
      for (let i = 0; i < 100; i++) {
        recordExternalCall("anthropic", { now, blockedBy: "budget" });
      }
      expect(() => assertQuota("anthropic", now)).not.toThrow();

      // succeeded 2번 → cap 도달
      recordExternalCall("anthropic", now);
      recordExternalCall("anthropic", now);
      expect(() => assertQuota("anthropic", now)).toThrow(QuotaExceededError);
    });
  });

  describe("checkQuotaOrBlock 헬퍼", () => {
    it("quota 여유 시 null 반환 (통과)", () => {
      process.env.QUOTA_DAILY_CAP_ANTHROPIC = "10";
      const result = checkQuotaOrBlock("anthropic");
      expect(result).toBeNull();
    });

    it("cap 도달 시 QuotaBlockedResult 반환", () => {
      process.env.QUOTA_DAILY_CAP_ANTHROPIC = "1";
      recordExternalCall("anthropic");
      const result = checkQuotaOrBlock("anthropic");
      expect(result).not.toBeNull();
      expect(result!.mode).toBe("error");
      expect(result!.code).toBe("quota_exceeded");
      expect(result!.message).toContain("cap=1");
      expect(result!.message).toContain("resetAt=");
    });

    it("차단 시 blockedBy='quota' 카운터 증가", () => {
      const now = Date.UTC(2026, 4, 4, 13, 0, 0);
      process.env.QUOTA_DAILY_CAP_ANTHROPIC = "0";
      checkQuotaOrBlock("anthropic", now);
      const u = getDailyUsage("anthropic", now);
      expect(u.attempted).toBe(1);
      expect(u.blocked.quota).toBe(1);
      expect(u.count).toBe(0);
    });

    it("통과 시 카운터 변동 없음", () => {
      const now = Date.UTC(2026, 4, 4, 13, 0, 0);
      process.env.QUOTA_DAILY_CAP_ANTHROPIC = "10";
      checkQuotaOrBlock("anthropic", now);
      const u = getDailyUsage("anthropic", now);
      expect(u.attempted).toBe(0);
      expect(u.count).toBe(0);
    });

    it("now 인자 전달 시 해당 시점 기준 quota 체크", () => {
      const before = Date.UTC(2026, 4, 4, 14, 0, 0);
      const after = Date.UTC(2026, 4, 4, 16, 0, 0);
      process.env.QUOTA_DAILY_CAP_ANTHROPIC = "1";
      recordExternalCall("anthropic", before);
      // 같은 날(자정 전) → 차단
      expect(checkQuotaOrBlock("anthropic", before)).not.toBeNull();
      // 자정 후 → 리셋되어 통과
      expect(checkQuotaOrBlock("anthropic", after)).toBeNull();
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
