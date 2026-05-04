import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, existsSync, readFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import {
  assertCycleCap,
  assertAutonomyEntry,
  incrementCycleCount,
  readCycleCounter,
  getKstDateString,
  getCounterPath,
  isAutonomyHours,
  CycleCapExceededError,
  NotAutonomyHoursError,
} from "@/lib/autonomy/cycle-counter";

const SAVED_ENV = { ...process.env };

let TMP_DIR: string;

describe("cycle-counter — 자율 일일 사이클 카운터 (사이클 AAAA1)", () => {
  beforeEach(() => {
    TMP_DIR = mkdtempSync(join(tmpdir(), "td-cycle-counter-"));
    delete process.env.AUTONOMY_DAILY_CYCLE_CAP;
  });

  afterEach(() => {
    process.env = { ...SAVED_ENV };
    if (existsSync(TMP_DIR)) rmSync(TMP_DIR, { recursive: true, force: true });
  });

  describe("getKstDateString", () => {
    it("UTC 12:00은 KST 21:00 → 같은 날", () => {
      const noon = Date.UTC(2026, 4, 4, 12, 0, 0);
      expect(getKstDateString(noon)).toBe("2026-05-04");
    });

    it("UTC 14:59는 KST 23:59 → 같은 날", () => {
      expect(getKstDateString(Date.UTC(2026, 4, 4, 14, 59, 0))).toBe("2026-05-04");
    });

    it("UTC 15:00은 KST 익일 00:00 → 다음 날", () => {
      expect(getKstDateString(Date.UTC(2026, 4, 4, 15, 0, 0))).toBe("2026-05-05");
    });
  });

  describe("isAutonomyHours (KST 22:00~09:00)", () => {
    it("KST 22:00은 autonomy hours", () => {
      // KST 22:00 = UTC 13:00
      expect(isAutonomyHours(Date.UTC(2026, 4, 4, 13, 0, 0))).toBe(true);
    });

    it("KST 03:00은 autonomy hours", () => {
      // KST 03:00 = UTC 18:00 (전날)
      expect(isAutonomyHours(Date.UTC(2026, 4, 3, 18, 0, 0))).toBe(true);
    });

    it("KST 08:59는 autonomy hours", () => {
      expect(isAutonomyHours(Date.UTC(2026, 4, 4, 23, 59, 0))).toBe(true);
    });

    it("KST 09:00은 autonomy hours 아님", () => {
      // KST 09:00 = UTC 00:00
      expect(isAutonomyHours(Date.UTC(2026, 4, 4, 0, 0, 0))).toBe(false);
    });

    it("KST 12:00은 autonomy hours 아님", () => {
      expect(isAutonomyHours(Date.UTC(2026, 4, 4, 3, 0, 0))).toBe(false);
    });

    it("KST 21:59는 autonomy hours 아님", () => {
      expect(isAutonomyHours(Date.UTC(2026, 4, 4, 12, 59, 0))).toBe(false);
    });
  });

  describe("readCycleCounter (초기 상태)", () => {
    it("파일 없으면 cycles=0 + cap=10 (default)", () => {
      const now = Date.UTC(2026, 4, 4, 13, 0, 0);
      const state = readCycleCounter(now, TMP_DIR);
      expect(state.kstDate).toBe("2026-05-04");
      expect(state.cycles).toBe(0);
      expect(state.cap).toBe(10);
      expect(state.lastCycleAt).toBeNull();
      expect(state.lastCycleId).toBeNull();
    });

    it("env AUTONOMY_DAILY_CYCLE_CAP=3 적용", () => {
      process.env.AUTONOMY_DAILY_CYCLE_CAP = "3";
      const state = readCycleCounter(Date.now(), TMP_DIR);
      expect(state.cap).toBe(3);
    });
  });

  describe("incrementCycleCount + 파일 쓰기", () => {
    it("첫 호출 시 cycles=1 + 파일 생성", () => {
      const now = Date.UTC(2026, 4, 4, 13, 0, 0);
      const state = incrementCycleCount("AAAA1", now, TMP_DIR);
      expect(state.cycles).toBe(1);
      expect(state.lastCycleId).toBe("AAAA1");
      const path = getCounterPath(now, TMP_DIR);
      expect(existsSync(path)).toBe(true);
      const raw = JSON.parse(readFileSync(path, "utf-8"));
      expect(raw.cycles).toBe(1);
      expect(raw.kstDate).toBe("2026-05-04");
    });

    it("연속 호출 시 cycles 누적", () => {
      const now = Date.UTC(2026, 4, 4, 13, 0, 0);
      incrementCycleCount("A", now, TMP_DIR);
      incrementCycleCount("B", now, TMP_DIR);
      const s = incrementCycleCount("C", now, TMP_DIR);
      expect(s.cycles).toBe(3);
      expect(s.lastCycleId).toBe("C");
    });

    it("KST 자정 후 호출은 새 파일 (자동 리셋)", () => {
      const before = Date.UTC(2026, 4, 4, 14, 0, 0); // KST 23:00
      const after = Date.UTC(2026, 4, 4, 16, 0, 0); // KST 익일 01:00
      incrementCycleCount("A", before, TMP_DIR);
      incrementCycleCount("B", before, TMP_DIR);
      const s = incrementCycleCount("C", after, TMP_DIR);
      expect(s.kstDate).toBe("2026-05-05");
      expect(s.cycles).toBe(1);
      expect(s.lastCycleId).toBe("C");
      // 전날 파일은 보존 (수동 archive 가능)
      expect(existsSync(getCounterPath(before, TMP_DIR))).toBe(true);
    });
  });

  describe("assertCycleCap", () => {
    it("cap 미만은 통과", () => {
      const now = Date.UTC(2026, 4, 4, 13, 0, 0);
      incrementCycleCount("A", now, TMP_DIR);
      incrementCycleCount("B", now, TMP_DIR);
      expect(() => assertCycleCap(now, TMP_DIR)).not.toThrow();
    });

    it("cap 도달(≥10) 시 CycleCapExceededError", () => {
      process.env.AUTONOMY_DAILY_CYCLE_CAP = "3";
      const now = Date.UTC(2026, 4, 4, 13, 0, 0);
      incrementCycleCount("A", now, TMP_DIR);
      incrementCycleCount("B", now, TMP_DIR);
      incrementCycleCount("C", now, TMP_DIR);
      try {
        assertCycleCap(now, TMP_DIR);
        expect.fail("should throw");
      } catch (err) {
        expect(err).toBeInstanceOf(CycleCapExceededError);
        expect((err as CycleCapExceededError).cycles).toBe(3);
        expect((err as CycleCapExceededError).cap).toBe(3);
      }
    });

    it("cap=0은 항상 차단", () => {
      process.env.AUTONOMY_DAILY_CYCLE_CAP = "0";
      const now = Date.UTC(2026, 4, 4, 13, 0, 0);
      expect(() => assertCycleCap(now, TMP_DIR)).toThrow(CycleCapExceededError);
    });
  });

  describe("파일 손상 fallback", () => {
    it("kstDate mismatch 파일은 무시 후 default 반환", () => {
      const now = Date.UTC(2026, 4, 4, 13, 0, 0);
      incrementCycleCount("X", now, TMP_DIR); // 파일 생성
      // 다른 날짜로 read → mismatch
      const future = Date.UTC(2026, 4, 5, 13, 0, 0);
      const state = readCycleCounter(future, TMP_DIR);
      expect(state.cycles).toBe(0);
      expect(state.kstDate).toBe("2026-05-05");
    });
  });

  describe("assertAutonomyEntry — 통합 게이트 (사이클 BBBB)", () => {
    it("KST 22:00 + cap 미만 → 통과", () => {
      const now = Date.UTC(2026, 4, 4, 13, 0, 0); // KST 22:00
      expect(() => assertAutonomyEntry(now, TMP_DIR)).not.toThrow();
    });

    it("KST 03:00 + cap 미만 → 통과", () => {
      const now = Date.UTC(2026, 4, 3, 18, 0, 0); // KST 03:00
      expect(() => assertAutonomyEntry(now, TMP_DIR)).not.toThrow();
    });

    it("KST 12:00 (자율 시간 외) → NotAutonomyHoursError", () => {
      const now = Date.UTC(2026, 4, 4, 3, 0, 0); // KST 12:00
      try {
        assertAutonomyEntry(now, TMP_DIR);
        expect.fail("should throw");
      } catch (err) {
        expect(err).toBeInstanceOf(NotAutonomyHoursError);
        expect((err as NotAutonomyHoursError).nowKstIso).toContain("+09:00");
      }
    });

    it("KST 22:00 + cap 도달 → CycleCapExceededError (시각 통과 후 cap에서 throw)", () => {
      process.env.AUTONOMY_DAILY_CYCLE_CAP = "2";
      const now = Date.UTC(2026, 4, 4, 13, 0, 0); // KST 22:00
      incrementCycleCount("A", now, TMP_DIR);
      incrementCycleCount("B", now, TMP_DIR);
      try {
        assertAutonomyEntry(now, TMP_DIR);
        expect.fail("should throw");
      } catch (err) {
        expect(err).toBeInstanceOf(CycleCapExceededError);
      }
    });

    it("KST 12:00 + cap 도달 → 시각 게이트가 우선 throw (NotAutonomyHoursError)", () => {
      process.env.AUTONOMY_DAILY_CYCLE_CAP = "1";
      const before = Date.UTC(2026, 4, 4, 13, 0, 0);
      incrementCycleCount("A", before, TMP_DIR);
      const now = Date.UTC(2026, 4, 4, 3, 0, 0); // KST 12:00 (시간 우선)
      try {
        assertAutonomyEntry(now, TMP_DIR);
        expect.fail("should throw");
      } catch (err) {
        expect(err).toBeInstanceOf(NotAutonomyHoursError);
      }
    });

    it("AAAA2: AUTONOMY_PAUSED.flag 존재 시 시각/cap보다 우선 throw (AutonomyPausedError)", async () => {
      const { writeFileSync } = await import("fs");
      const { AutonomyPausedError } = await import("@/lib/autonomy/budget");
      writeFileSync(
        join(TMP_DIR, "AUTONOMY_PAUSED.flag"),
        JSON.stringify({
          pausedAt: "2026-05-04T13:00:00.000Z",
          reason: "budget.emergency",
          currentUsd: 250,
          thresholdUsd: 200,
        }),
        "utf-8",
      );
      // 자율 시간대 + cap 미만이라도 flag가 우선
      const now = Date.UTC(2026, 4, 4, 13, 0, 0);
      try {
        assertAutonomyEntry(now, TMP_DIR);
        expect.fail("should throw");
      } catch (err) {
        expect(err).toBeInstanceOf(AutonomyPausedError);
        expect((err as InstanceType<typeof AutonomyPausedError>).reason).toBe(
          "budget.emergency",
        );
      }
    });
  });
});
