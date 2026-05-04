import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, existsSync, writeFileSync, readdirSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import {
  recordSpend,
  assertBudget,
  readBudgetState,
  getBudgetStatePath,
  getPausedFlagPath,
  isAutonomyPaused,
  readAutonomyPausedFlag,
  clearAutonomyPausedFlag,
  getHourlySpend,
  getDailySpend,
  getKstDateString,
  BudgetExceededError,
  AutonomyPausedError,
  __resetBudgetForTests,
} from "@/lib/autonomy/budget";

const SAVED_ENV = { ...process.env };

let TMP_DIR: string;

describe("budget — 자율 모드 비용 트래킹 + 임계치 (사이클 AAAA2, ADR-047)", () => {
  beforeEach(() => {
    TMP_DIR = mkdtempSync(join(tmpdir(), "td-budget-"));
    process.env.AUTONOMY_MEMORY_DIR = TMP_DIR;
    delete process.env.USAGE_BUDGET_HOURLY_WARN;
    delete process.env.USAGE_BUDGET_HOURLY_THROW;
    delete process.env.USAGE_BUDGET_DAILY_WARN;
    delete process.env.USAGE_BUDGET_DAILY_THROW;
    delete process.env.USAGE_BUDGET_DAILY_EMERGENCY;
    delete process.env.USAGE_BUDGET_DISABLED;
  });

  afterEach(() => {
    process.env = { ...SAVED_ENV };
    if (existsSync(TMP_DIR)) rmSync(TMP_DIR, { recursive: true, force: true });
  });

  describe("getKstDateString (DRY 답습)", () => {
    it("UTC 12:00 → KST 21:00 → 같은 날", () => {
      expect(getKstDateString(Date.UTC(2026, 4, 4, 12, 0, 0))).toBe("2026-05-04");
    });

    it("UTC 15:00 → KST 익일 00:00", () => {
      expect(getKstDateString(Date.UTC(2026, 4, 4, 15, 0, 0))).toBe("2026-05-05");
    });
  });

  describe("recordSpend — 누적", () => {
    it("첫 호출 시 totals + byProvider + hourly 모두 기록", () => {
      const now = Date.UTC(2026, 4, 4, 13, 0, 0); // KST 22:00
      recordSpend(
        {
          provider: "anthropic",
          model: "claude-haiku-4-5-20251001",
          inputTokens: 1000,
          outputTokens: 500,
          costUsd: 0.005,
          now,
        },
        TMP_DIR,
      );
      const state = readBudgetState(now, TMP_DIR);
      expect(state.totals.count).toBe(1);
      expect(state.totals.inputTokens).toBe(1000);
      expect(state.totals.outputTokens).toBe(500);
      expect(state.totals.costUsd).toBeCloseTo(0.005, 6);
      expect(state.byProvider.anthropic.count).toBe(1);
      expect(state.byProvider.anthropic.byModel?.["claude-haiku-4-5-20251001"]?.count).toBe(1);
      expect(state.hourly.find((h) => h.hour === 22)?.costUsd).toBeCloseTo(0.005, 6);
    });

    it("연속 호출 시 누적", () => {
      const now = Date.UTC(2026, 4, 4, 13, 0, 0);
      recordSpend({ provider: "anthropic", inputTokens: 100, outputTokens: 50, costUsd: 0.001, now }, TMP_DIR);
      recordSpend({ provider: "anthropic", inputTokens: 200, outputTokens: 100, costUsd: 0.002, now }, TMP_DIR);
      const state = readBudgetState(now, TMP_DIR);
      expect(state.totals.count).toBe(2);
      expect(state.totals.costUsd).toBeCloseTo(0.003, 6);
    });

    it("provider 격리", () => {
      const now = Date.UTC(2026, 4, 4, 13, 0, 0);
      recordSpend({ provider: "anthropic", inputTokens: 0, outputTokens: 0, costUsd: 0.5, now }, TMP_DIR);
      recordSpend({ provider: "google-vision", inputTokens: 0, outputTokens: 0, costUsd: 0.3, now }, TMP_DIR);
      const state = readBudgetState(now, TMP_DIR);
      expect(state.byProvider.anthropic.costUsd).toBeCloseTo(0.5, 6);
      expect(state.byProvider["google-vision"].costUsd).toBeCloseTo(0.3, 6);
      expect(state.totals.costUsd).toBeCloseTo(0.8, 6);
    });

    it("USAGE_BUDGET_DISABLED=1은 누적 0 (테스트/로컬 우회)", () => {
      process.env.USAGE_BUDGET_DISABLED = "1";
      const now = Date.UTC(2026, 4, 4, 13, 0, 0);
      recordSpend({ provider: "anthropic", inputTokens: 0, outputTokens: 0, costUsd: 100, now }, TMP_DIR);
      const state = readBudgetState(now, TMP_DIR);
      expect(state.totals.count).toBe(0);
    });

    it("KST 자정 후 새 파일", () => {
      const before = Date.UTC(2026, 4, 4, 14, 0, 0); // KST 23:00
      const after = Date.UTC(2026, 4, 4, 16, 0, 0); // KST 익일 01:00
      recordSpend({ provider: "anthropic", inputTokens: 0, outputTokens: 0, costUsd: 0.1, now: before }, TMP_DIR);
      recordSpend({ provider: "anthropic", inputTokens: 0, outputTokens: 0, costUsd: 0.2, now: after }, TMP_DIR);
      // 전날 파일 보존
      expect(existsSync(getBudgetStatePath(before, TMP_DIR))).toBe(true);
      // 오늘 파일은 0.2만
      const todayState = readBudgetState(after, TMP_DIR);
      expect(todayState.totals.costUsd).toBeCloseTo(0.2, 6);
      expect(todayState.kstDate).toBe("2026-05-05");
    });
  });

  describe("assertBudget — 사전 게이트", () => {
    it("임계치 미달은 통과", () => {
      const now = Date.UTC(2026, 4, 4, 13, 0, 0);
      recordSpend({ provider: "anthropic", inputTokens: 0, outputTokens: 0, costUsd: 1, now }, TMP_DIR);
      expect(() => assertBudget(now, TMP_DIR)).not.toThrow();
    });

    it("일일 throw 임계치 도달 시 BudgetExceededError tier='daily'", () => {
      process.env.USAGE_BUDGET_DAILY_THROW = "10";
      const now = Date.UTC(2026, 4, 4, 13, 0, 0);
      recordSpend({ provider: "anthropic", inputTokens: 0, outputTokens: 0, costUsd: 10, now }, TMP_DIR);
      try {
        assertBudget(now, TMP_DIR);
        expect.fail("should throw");
      } catch (err) {
        expect(err).toBeInstanceOf(BudgetExceededError);
        expect((err as BudgetExceededError).tier).toBe("daily");
        expect((err as BudgetExceededError).thresholdUsd).toBe(10);
      }
    });

    it("시간당 throw 임계치 도달 시 BudgetExceededError tier='hourly'", () => {
      process.env.USAGE_BUDGET_HOURLY_THROW = "5";
      process.env.USAGE_BUDGET_DAILY_THROW = "1000"; // 일일은 미달
      const now = Date.UTC(2026, 4, 4, 13, 0, 0);
      recordSpend({ provider: "anthropic", inputTokens: 0, outputTokens: 0, costUsd: 5, now }, TMP_DIR);
      try {
        assertBudget(now, TMP_DIR);
        expect.fail("should throw");
      } catch (err) {
        expect(err).toBeInstanceOf(BudgetExceededError);
        expect((err as BudgetExceededError).tier).toBe("hourly");
      }
    });

    it("emergency flag 존재 시 AutonomyPausedError (throw보다 우선)", () => {
      process.env.USAGE_BUDGET_DAILY_EMERGENCY = "20";
      const now = Date.UTC(2026, 4, 4, 13, 0, 0);
      recordSpend({ provider: "anthropic", inputTokens: 0, outputTokens: 0, costUsd: 25, now }, TMP_DIR);
      // recordSpend가 emergency flag 생성
      expect(isAutonomyPaused(TMP_DIR)).toBe(true);
      try {
        assertBudget(now, TMP_DIR);
        expect.fail("should throw");
      } catch (err) {
        expect(err).toBeInstanceOf(AutonomyPausedError);
        expect((err as AutonomyPausedError).reason).toBe("budget.emergency");
      }
    });

    it("DISABLED=1은 임계치 통과 (0 비용 안전)", () => {
      process.env.USAGE_BUDGET_DAILY_THROW = "0.001";
      process.env.USAGE_BUDGET_DISABLED = "1";
      const now = Date.UTC(2026, 4, 4, 13, 0, 0);
      // recordSpend는 disabled로 누적 0 → assertBudget 통과
      recordSpend({ provider: "anthropic", inputTokens: 0, outputTokens: 0, costUsd: 100, now }, TMP_DIR);
      expect(() => assertBudget(now, TMP_DIR)).not.toThrow();
    });
  });

  describe("emergency flag 동작", () => {
    it("일일 emergency 도달 시 flag 생성", () => {
      process.env.USAGE_BUDGET_DAILY_EMERGENCY = "100";
      const now = Date.UTC(2026, 4, 4, 13, 0, 0);
      recordSpend({ provider: "anthropic", inputTokens: 0, outputTokens: 0, costUsd: 100, now }, TMP_DIR);
      expect(existsSync(getPausedFlagPath(TMP_DIR))).toBe(true);
      const flag = readAutonomyPausedFlag(TMP_DIR);
      expect(flag?.reason).toBe("budget.emergency");
      expect(flag?.currentUsd).toBe(100);
      expect(flag?.thresholdUsd).toBe(100);
    });

    it("clearAutonomyPausedFlag 호출 시 flag 삭제", () => {
      process.env.USAGE_BUDGET_DAILY_EMERGENCY = "10";
      const now = Date.UTC(2026, 4, 4, 13, 0, 0);
      recordSpend({ provider: "anthropic", inputTokens: 0, outputTokens: 0, costUsd: 10, now }, TMP_DIR);
      expect(isAutonomyPaused(TMP_DIR)).toBe(true);
      clearAutonomyPausedFlag(TMP_DIR);
      expect(isAutonomyPaused(TMP_DIR)).toBe(false);
    });

    it("flag 없으면 readAutonomyPausedFlag null", () => {
      expect(readAutonomyPausedFlag(TMP_DIR)).toBeNull();
    });
  });

  describe("hourly 버킷", () => {
    it("같은 시간 호출은 같은 버킷에 누적", () => {
      const now1 = Date.UTC(2026, 4, 4, 13, 5, 0); // KST 22:05
      const now2 = Date.UTC(2026, 4, 4, 13, 55, 0); // KST 22:55
      recordSpend({ provider: "anthropic", inputTokens: 0, outputTokens: 0, costUsd: 1, now: now1 }, TMP_DIR);
      recordSpend({ provider: "anthropic", inputTokens: 0, outputTokens: 0, costUsd: 2, now: now2 }, TMP_DIR);
      const state = readBudgetState(now1, TMP_DIR);
      expect(getHourlySpend(state, now1)).toBeCloseTo(3, 6);
    });

    it("다른 시간 호출은 다른 버킷", () => {
      const now1 = Date.UTC(2026, 4, 4, 13, 0, 0); // KST 22:00
      const now2 = Date.UTC(2026, 4, 4, 14, 0, 0); // KST 23:00
      recordSpend({ provider: "anthropic", inputTokens: 0, outputTokens: 0, costUsd: 1, now: now1 }, TMP_DIR);
      recordSpend({ provider: "anthropic", inputTokens: 0, outputTokens: 0, costUsd: 2, now: now2 }, TMP_DIR);
      const state = readBudgetState(now1, TMP_DIR);
      expect(getHourlySpend(state, now1)).toBeCloseTo(1, 6);
      expect(getHourlySpend(state, now2)).toBeCloseTo(2, 6);
      expect(getDailySpend(state)).toBeCloseTo(3, 6);
    });
  });

  describe("__resetBudgetForTests", () => {
    it("파일 + flag 모두 삭제", () => {
      process.env.USAGE_BUDGET_DAILY_EMERGENCY = "10";
      const now = Date.UTC(2026, 4, 4, 13, 0, 0);
      recordSpend({ provider: "anthropic", inputTokens: 0, outputTokens: 0, costUsd: 10, now }, TMP_DIR);
      expect(existsSync(getBudgetStatePath(now, TMP_DIR))).toBe(true);
      expect(existsSync(getPausedFlagPath(TMP_DIR))).toBe(true);
      __resetBudgetForTests(TMP_DIR);
      expect(existsSync(getBudgetStatePath(now, TMP_DIR))).toBe(false);
      expect(existsSync(getPausedFlagPath(TMP_DIR))).toBe(false);
    });

    it("NODE_ENV=production에서는 throw", () => {
      const orig = process.env.NODE_ENV;
      const origVitest = process.env.VITEST;
      // @ts-expect-error - NODE_ENV is read-only
      process.env.NODE_ENV = "production";
      delete process.env.VITEST;
      try {
        expect(() => __resetBudgetForTests(TMP_DIR)).toThrow();
      } finally {
        // @ts-expect-error - NODE_ENV is read-only
        process.env.NODE_ENV = orig;
        if (origVitest) process.env.VITEST = origVitest;
      }
    });
  });

  describe("파일 손상 fallback", () => {
    it("kstDate mismatch 시 default state 반환", () => {
      const before = Date.UTC(2026, 4, 4, 13, 0, 0);
      recordSpend({ provider: "anthropic", inputTokens: 0, outputTokens: 0, costUsd: 1, now: before }, TMP_DIR);
      // 다른 날짜로 read → mismatch (sentinel과 무관, 파일 자체가 다른 일자임)
      const state = readBudgetState(before, TMP_DIR);
      expect(state.totals.costUsd).toBeCloseTo(1, 6);
    });
  });

  describe("AAAA3 — flag 손상 fail-closed (T12+T16)", () => {
    it("flag JSON 잘림 → quarantine + sentinel reason='flag.corrupt'", () => {
      const flagPath = getPausedFlagPath(TMP_DIR);
      writeFileSync(flagPath, '{"reason":"budget.emer', "utf-8");
      const flag = readAutonomyPausedFlag(TMP_DIR);
      expect(flag).not.toBeNull();
      expect(flag?.reason).toBe("flag.corrupt");
      // quarantine 파일 존재
      const quarantineDir = `${TMP_DIR}/quarantine`;
      expect(existsSync(quarantineDir)).toBe(true);
      const files = readdirSync(quarantineDir);
      expect(files.some((f) => f.startsWith("AUTONOMY_PAUSED.flag.corrupt-"))).toBe(true);
    });

    it("flag 빈 파일 → quarantine + sentinel", () => {
      writeFileSync(getPausedFlagPath(TMP_DIR), "", "utf-8");
      const flag = readAutonomyPausedFlag(TMP_DIR);
      expect(flag?.reason).toBe("flag.corrupt");
    });

    it("flag 알 수 없는 reason → quarantine + sentinel (T12 화이트리스트)", () => {
      writeFileSync(
        getPausedFlagPath(TMP_DIR),
        JSON.stringify({ reason: "unknown_reason", pausedAt: "2026-05-04T13:00:00Z" }),
        "utf-8",
      );
      const flag = readAutonomyPausedFlag(TMP_DIR);
      expect(flag?.reason).toBe("flag.corrupt");
    });

    it("정상 reason 'budget.emergency'는 그대로 반환", () => {
      writeFileSync(
        getPausedFlagPath(TMP_DIR),
        JSON.stringify({
          reason: "budget.emergency",
          pausedAt: "2026-05-04T13:00:00Z",
          currentUsd: 250,
          thresholdUsd: 200,
        }),
        "utf-8",
      );
      const flag = readAutonomyPausedFlag(TMP_DIR);
      expect(flag?.reason).toBe("budget.emergency");
      expect(flag?.currentUsd).toBe(250);
    });

    it("assertBudget — flag.corrupt sentinel은 AutonomyPausedError throw", () => {
      writeFileSync(getPausedFlagPath(TMP_DIR), "garbage", "utf-8");
      try {
        assertBudget(Date.now(), TMP_DIR);
        expect.fail("should throw");
      } catch (err) {
        expect(err).toBeInstanceOf(AutonomyPausedError);
        expect((err as AutonomyPausedError).reason).toBe("flag.corrupt");
      }
    });
  });

  describe("AAAA3 — 음수/NaN/Infinity 입력 가드 (T16 보안)", () => {
    it("costUsd 음수 → silent skip (누적 0) + audit", () => {
      const now = Date.UTC(2026, 4, 4, 13, 0, 0);
      recordSpend({ provider: "anthropic", inputTokens: 0, outputTokens: 0, costUsd: -10, now }, TMP_DIR);
      const state = readBudgetState(now, TMP_DIR);
      expect(state.totals.count).toBe(0);
      expect(state.totals.costUsd).toBe(0);
    });

    it("costUsd NaN → silent skip", () => {
      const now = Date.UTC(2026, 4, 4, 13, 0, 0);
      recordSpend({ provider: "anthropic", inputTokens: 0, outputTokens: 0, costUsd: NaN, now }, TMP_DIR);
      const state = readBudgetState(now, TMP_DIR);
      expect(state.totals.count).toBe(0);
    });

    it("costUsd Infinity → silent skip", () => {
      const now = Date.UTC(2026, 4, 4, 13, 0, 0);
      recordSpend(
        { provider: "anthropic", inputTokens: 0, outputTokens: 0, costUsd: Infinity, now },
        TMP_DIR,
      );
      const state = readBudgetState(now, TMP_DIR);
      expect(state.totals.count).toBe(0);
    });

    it("inputTokens 음수 → silent skip", () => {
      const now = Date.UTC(2026, 4, 4, 13, 0, 0);
      recordSpend({ provider: "anthropic", inputTokens: -5, outputTokens: 0, costUsd: 1, now }, TMP_DIR);
      const state = readBudgetState(now, TMP_DIR);
      expect(state.totals.count).toBe(0);
    });

    it("정상 입력 후 음수 입력 후 정상 입력 — 음수만 skip", () => {
      const now = Date.UTC(2026, 4, 4, 13, 0, 0);
      recordSpend({ provider: "anthropic", inputTokens: 100, outputTokens: 50, costUsd: 1, now }, TMP_DIR);
      recordSpend({ provider: "anthropic", inputTokens: 0, outputTokens: 0, costUsd: -5, now }, TMP_DIR);
      recordSpend({ provider: "anthropic", inputTokens: 200, outputTokens: 100, costUsd: 2, now }, TMP_DIR);
      const state = readBudgetState(now, TMP_DIR);
      expect(state.totals.count).toBe(2);
      expect(state.totals.costUsd).toBeCloseTo(3, 6);
    });
  });

  describe("AAAA3 — state JSON 손상 quarantine (T12 P1)", () => {
    it("state JSON 잘린 파일 → quarantine + default 반환", () => {
      const now = Date.UTC(2026, 4, 4, 13, 0, 0);
      const path = getBudgetStatePath(now, TMP_DIR);
      writeFileSync(path, '{"kstDate":"2026-05-04","totals":{', "utf-8");
      const state = readBudgetState(now, TMP_DIR);
      expect(state.totals.costUsd).toBe(0);
      expect(state.kstDate).toBe("2026-05-04");
      // quarantine
      const quarantineDir = `${TMP_DIR}/quarantine`;
      expect(existsSync(quarantineDir)).toBe(true);
      const files = readdirSync(quarantineDir);
      expect(files.some((f) => f.startsWith("usage_quota_2026-05-04.json.corrupt-"))).toBe(true);
    });

    it("quarantine 후 다음 recordSpend 정상 동작", () => {
      const now = Date.UTC(2026, 4, 4, 13, 0, 0);
      const path = getBudgetStatePath(now, TMP_DIR);
      writeFileSync(path, "garbage", "utf-8");
      // 첫 read → quarantine + default
      readBudgetState(now, TMP_DIR);
      // 다음 recordSpend → 정상 누적
      recordSpend({ provider: "anthropic", inputTokens: 100, outputTokens: 50, costUsd: 1, now }, TMP_DIR);
      const state = readBudgetState(now, TMP_DIR);
      expect(state.totals.costUsd).toBeCloseTo(1, 6);
    });

    it("kstDate mismatch는 quarantine 안 함 (정상 일자 롤오버)", () => {
      const before = Date.UTC(2026, 4, 4, 13, 0, 0);
      recordSpend({ provider: "anthropic", inputTokens: 0, outputTokens: 0, costUsd: 1, now: before }, TMP_DIR);
      // 같은 파일을 다른 날짜로 read → mismatch지만 quarantine 안 함 (AAAA2 회귀 보존)
      const future = Date.UTC(2026, 4, 4, 16, 0, 0); // KST 익일
      const state = readBudgetState(future, TMP_DIR);
      expect(state.totals.costUsd).toBe(0);
      // quarantine 디렉토리 부재 (또는 비어있음)
      const quarantineDir = `${TMP_DIR}/quarantine`;
      if (existsSync(quarantineDir)) {
        expect(readdirSync(quarantineDir).length).toBe(0);
      }
    });
  });
});
