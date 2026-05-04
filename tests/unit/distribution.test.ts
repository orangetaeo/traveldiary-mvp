import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, existsSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import {
  classifyModel,
  getDailyModelDistribution,
  isWithinTargetDistribution,
  getEmergencyStats,
} from "@/lib/autonomy/distribution";
import {
  recordSpend,
  readBudgetState,
  __resetBudgetForTests,
} from "@/lib/autonomy/budget";

const SAVED_ENV = { ...process.env };
let TMP_DIR: string;

describe("distribution — ADR-047 모델 라우팅 분포 측정 (사이클 AAAA5b)", () => {
  beforeEach(() => {
    TMP_DIR = mkdtempSync(join(tmpdir(), "td-distribution-"));
    process.env.AUTONOMY_MEMORY_DIR = TMP_DIR;
    delete process.env.USAGE_BUDGET_DISABLED;
    delete process.env.USAGE_BUDGET_HOURLY_WARN;
    delete process.env.USAGE_BUDGET_HOURLY_THROW;
    delete process.env.USAGE_BUDGET_DAILY_WARN;
    delete process.env.USAGE_BUDGET_DAILY_THROW;
    delete process.env.USAGE_BUDGET_DAILY_EMERGENCY;
  });

  afterEach(() => {
    process.env = { ...SAVED_ENV };
    if (existsSync(TMP_DIR)) rmSync(TMP_DIR, { recursive: true, force: true });
  });

  describe("classifyModel", () => {
    it("Haiku 모델명 매칭", () => {
      expect(classifyModel("claude-haiku-4-5-20251001")).toBe("haiku");
      expect(classifyModel("Haiku")).toBe("haiku");
    });

    it("Sonnet 모델명 매칭", () => {
      expect(classifyModel("claude-sonnet-4-6")).toBe("sonnet");
      expect(classifyModel("SONNET-4-6")).toBe("sonnet");
    });

    it("Opus 모델명 매칭", () => {
      expect(classifyModel("claude-opus-4-7")).toBe("opus");
    });

    it("매칭 실패 시 null", () => {
      expect(classifyModel("gpt-4")).toBeNull();
      expect(classifyModel("")).toBeNull();
    });
  });

  describe("getDailyModelDistribution", () => {
    it("byModel 미존재 시 모든 tier 0", () => {
      const now = Date.UTC(2026, 4, 4, 13, 0, 0);
      const d = getDailyModelDistribution(now, TMP_DIR);
      expect(d.haiku.count).toBe(0);
      expect(d.sonnet.count).toBe(0);
      expect(d.opus.count).toBe(0);
      expect(d.total.costUsd).toBe(0);
    });

    it("Sonnet 단일 호출 → sonnet 100%", () => {
      const now = Date.UTC(2026, 4, 4, 13, 0, 0);
      recordSpend(
        {
          provider: "anthropic",
          model: "claude-sonnet-4-6",
          inputTokens: 1000,
          outputTokens: 500,
          costUsd: 0.005,
          now,
        },
        TMP_DIR,
      );
      const d = getDailyModelDistribution(now, TMP_DIR);
      expect(d.sonnet.count).toBe(1);
      expect(d.sonnet.costUsd).toBeCloseTo(0.005, 6);
      expect(d.sonnet.pct).toBeCloseTo(100, 1);
      expect(d.haiku.pct).toBe(0);
      expect(d.opus.pct).toBe(0);
    });

    it("3-tier 혼합: 비용 가중 % 계산", () => {
      const now = Date.UTC(2026, 4, 4, 13, 0, 0);
      // Haiku $0.5 + Sonnet $7 + Opus $2.5 = $10 → 5%/70%/25%
      recordSpend(
        { provider: "anthropic", model: "claude-haiku-4-5-20251001", inputTokens: 0, outputTokens: 0, costUsd: 0.5, now },
        TMP_DIR,
      );
      recordSpend(
        { provider: "anthropic", model: "claude-sonnet-4-6", inputTokens: 0, outputTokens: 0, costUsd: 7, now },
        TMP_DIR,
      );
      recordSpend(
        { provider: "anthropic", model: "claude-opus-4-7", inputTokens: 0, outputTokens: 0, costUsd: 2.5, now },
        TMP_DIR,
      );
      const d = getDailyModelDistribution(now, TMP_DIR);
      expect(d.total.costUsd).toBeCloseTo(10, 4);
      expect(d.haiku.pct).toBeCloseTo(5, 1);
      expect(d.sonnet.pct).toBeCloseTo(70, 1);
      expect(d.opus.pct).toBeCloseTo(25, 1);
    });

    it("unclassified 모델은 unclassified 버킷에 누적", () => {
      const now = Date.UTC(2026, 4, 4, 13, 0, 0);
      recordSpend(
        { provider: "anthropic", model: "gpt-4-turbo", inputTokens: 0, outputTokens: 0, costUsd: 1, now },
        TMP_DIR,
      );
      const d = getDailyModelDistribution(now, TMP_DIR);
      expect(d.unclassified.count).toBe(1);
      expect(d.unclassified.costUsd).toBeCloseTo(1, 4);
      expect(d.haiku.count).toBe(0);
    });
  });

  describe("isWithinTargetDistribution (ADR-047 §분포 목표)", () => {
    it("데이터 부족 (total=0) → ok=true, alerts=[]", () => {
      const d = getDailyModelDistribution(Date.UTC(2026, 4, 4, 13, 0, 0), TMP_DIR);
      const result = isWithinTargetDistribution(d);
      expect(result.ok).toBe(true);
      expect(result.alerts).toEqual([]);
    });

    it("목표 달성 분포 (5/70/25) → ok=true", () => {
      const now = Date.UTC(2026, 4, 4, 13, 0, 0);
      recordSpend({ provider: "anthropic", model: "claude-haiku-4-5-20251001", inputTokens: 0, outputTokens: 0, costUsd: 0.5, now }, TMP_DIR);
      recordSpend({ provider: "anthropic", model: "claude-sonnet-4-6", inputTokens: 0, outputTokens: 0, costUsd: 7, now }, TMP_DIR);
      recordSpend({ provider: "anthropic", model: "claude-opus-4-7", inputTokens: 0, outputTokens: 0, costUsd: 2.5, now }, TMP_DIR);
      const d = getDailyModelDistribution(now, TMP_DIR);
      expect(isWithinTargetDistribution(d).ok).toBe(true);
    });

    it("Opus 100% → opus overused alert", () => {
      const now = Date.UTC(2026, 4, 4, 13, 0, 0);
      recordSpend({ provider: "anthropic", model: "claude-opus-4-7", inputTokens: 0, outputTokens: 0, costUsd: 10, now }, TMP_DIR);
      const d = getDailyModelDistribution(now, TMP_DIR);
      const result = isWithinTargetDistribution(d);
      expect(result.ok).toBe(false);
      expect(result.alerts.some((a) => a.includes("opus overused"))).toBe(true);
      expect(result.alerts.some((a) => a.includes("haiku underused"))).toBe(true);
      expect(result.alerts.some((a) => a.includes("sonnet underused"))).toBe(true);
    });

    it("unclassified 모델 검출 시 alert", () => {
      const now = Date.UTC(2026, 4, 4, 13, 0, 0);
      recordSpend({ provider: "anthropic", model: "claude-sonnet-4-6", inputTokens: 0, outputTokens: 0, costUsd: 7, now }, TMP_DIR);
      recordSpend({ provider: "anthropic", model: "gpt-4", inputTokens: 0, outputTokens: 0, costUsd: 1, now }, TMP_DIR);
      const d = getDailyModelDistribution(now, TMP_DIR);
      const result = isWithinTargetDistribution(d);
      expect(result.alerts.some((a) => a.includes("unclassified"))).toBe(true);
    });
  });

  describe("getEmergencyStats — emergency 트리거 카운터 (사이클 AAAA7)", () => {
    it("초기 상태는 triggers=0 + duplicates=0", () => {
      const stats = getEmergencyStats(Date.now(), TMP_DIR);
      expect(stats.triggers).toBe(0);
      expect(stats.duplicates).toBe(0);
      expect(stats.firstAt).toBeUndefined();
      expect(stats.lastAt).toBeUndefined();
    });

    it("emergency 도달 1회 시 triggers=1 + duplicates=0 + firstAt=lastAt", () => {
      // emergency $200 도달 → 1번째 호출 (duplicate=false)
      const now = Date.UTC(2026, 4, 4, 13, 0, 0);
      recordSpend(
        { provider: "anthropic", model: "claude-opus-4-7", inputTokens: 0, outputTokens: 0, costUsd: 250, now },
        TMP_DIR,
      );
      const stats = getEmergencyStats(now, TMP_DIR);
      expect(stats.triggers).toBe(1);
      expect(stats.duplicates).toBe(0);
      expect(stats.firstAt).toBeDefined();
      expect(stats.lastAt).toBe(stats.firstAt);
    });

    it("emergency 반복 호출 시 triggers/duplicates 증분 (AAAA5b duplicate 메타 운영 활용)", () => {
      const now = Date.UTC(2026, 4, 4, 13, 0, 0);
      // 1번째: flag 작성 (duplicate=false)
      recordSpend(
        { provider: "anthropic", model: "claude-opus-4-7", inputTokens: 0, outputTokens: 0, costUsd: 250, now },
        TMP_DIR,
      );
      // 2~3번째: flag 이미 존재 (duplicate=true)
      recordSpend(
        { provider: "anthropic", model: "claude-opus-4-7", inputTokens: 0, outputTokens: 0, costUsd: 1, now: now + 1 },
        TMP_DIR,
      );
      recordSpend(
        { provider: "anthropic", model: "claude-opus-4-7", inputTokens: 0, outputTokens: 0, costUsd: 1, now: now + 2 },
        TMP_DIR,
      );
      const stats = getEmergencyStats(now + 2, TMP_DIR);
      expect(stats.triggers).toBe(3);
      expect(stats.duplicates).toBe(2);
    });

    it("BudgetState.emergency 영속화 — 재 read 시 보존", () => {
      const now = Date.UTC(2026, 4, 4, 13, 0, 0);
      recordSpend(
        { provider: "anthropic", model: "claude-opus-4-7", inputTokens: 0, outputTokens: 0, costUsd: 250, now },
        TMP_DIR,
      );
      const state = readBudgetState(now, TMP_DIR);
      expect(state.emergency).toBeDefined();
      expect(state.emergency?.triggers).toBe(1);
    });
  });
});
