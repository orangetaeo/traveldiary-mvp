/**
 * 사이클 AAAA9 — env `AUTONOMY_TZ_OFFSET_HOURS` 인지 시간대 회귀.
 *
 * 베트남 거주 사용자(UTC+7) 등 비-KST 환경에서 자율 시간대 게이트가 정확히 동작하는지 검증.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  getTzOffsetMs,
  getTzOffsetIsoString,
  getKstDateString,
} from "@/lib/autonomy/kst";

const SAVED_ENV = { ...process.env };

describe("kst — 자율 모드 시간대 offset (사이클 AAAA9, env override)", () => {
  beforeEach(() => {
    delete process.env.AUTONOMY_TZ_OFFSET_HOURS;
  });

  afterEach(() => {
    process.env = { ...SAVED_ENV };
  });

  describe("getTzOffsetMs — env override", () => {
    it("env 미설정 시 default 9시간 (KST)", () => {
      expect(getTzOffsetMs()).toBe(9 * 60 * 60 * 1000);
    });

    it("AUTONOMY_TZ_OFFSET_HOURS=7 → 7시간 (베트남/태국)", () => {
      process.env.AUTONOMY_TZ_OFFSET_HOURS = "7";
      expect(getTzOffsetMs()).toBe(7 * 60 * 60 * 1000);
    });

    it("AUTONOMY_TZ_OFFSET_HOURS=0 → UTC (0시간)", () => {
      process.env.AUTONOMY_TZ_OFFSET_HOURS = "0";
      expect(getTzOffsetMs()).toBe(0);
    });

    it("AUTONOMY_TZ_OFFSET_HOURS=-5 → UTC-5 (NY EST)", () => {
      process.env.AUTONOMY_TZ_OFFSET_HOURS = "-5";
      expect(getTzOffsetMs()).toBe(-5 * 60 * 60 * 1000);
    });

    it("소수점 offset 지원 — 5.5 (인도)", () => {
      process.env.AUTONOMY_TZ_OFFSET_HOURS = "5.5";
      expect(getTzOffsetMs()).toBe(5.5 * 60 * 60 * 1000);
    });

    it("범위 위반 (15) → default fallback + console.warn", () => {
      process.env.AUTONOMY_TZ_OFFSET_HOURS = "15";
      expect(getTzOffsetMs()).toBe(9 * 60 * 60 * 1000);
    });

    it("범위 위반 (-13) → default fallback", () => {
      process.env.AUTONOMY_TZ_OFFSET_HOURS = "-13";
      expect(getTzOffsetMs()).toBe(9 * 60 * 60 * 1000);
    });

    it("NaN / 비숫자 → default fallback", () => {
      process.env.AUTONOMY_TZ_OFFSET_HOURS = "abc";
      expect(getTzOffsetMs()).toBe(9 * 60 * 60 * 1000);
    });

    it("빈 문자열 → default fallback", () => {
      process.env.AUTONOMY_TZ_OFFSET_HOURS = "";
      expect(getTzOffsetMs()).toBe(9 * 60 * 60 * 1000);
    });

    it("Infinity → default fallback (Number.isFinite 가드)", () => {
      process.env.AUTONOMY_TZ_OFFSET_HOURS = "Infinity";
      expect(getTzOffsetMs()).toBe(9 * 60 * 60 * 1000);
    });
  });

  describe("getTzOffsetIsoString — ISO 표기", () => {
    it("default (KST) → '+09:00'", () => {
      expect(getTzOffsetIsoString()).toBe("+09:00");
    });

    it("offset 7 (베트남) → '+07:00'", () => {
      process.env.AUTONOMY_TZ_OFFSET_HOURS = "7";
      expect(getTzOffsetIsoString()).toBe("+07:00");
    });

    it("offset 0 (UTC) → '+00:00'", () => {
      process.env.AUTONOMY_TZ_OFFSET_HOURS = "0";
      expect(getTzOffsetIsoString()).toBe("+00:00");
    });

    it("offset -5 (NY) → '-05:00'", () => {
      process.env.AUTONOMY_TZ_OFFSET_HOURS = "-5";
      expect(getTzOffsetIsoString()).toBe("-05:00");
    });

    it("offset 5.5 (인도) → '+05:30'", () => {
      process.env.AUTONOMY_TZ_OFFSET_HOURS = "5.5";
      expect(getTzOffsetIsoString()).toBe("+05:30");
    });

    it("offset -3.5 (뉴펀들랜드) → '-03:30'", () => {
      process.env.AUTONOMY_TZ_OFFSET_HOURS = "-3.5";
      expect(getTzOffsetIsoString()).toBe("-03:30");
    });
  });

  describe("getKstDateString — 시간대별 일자 경계", () => {
    it("UTC 12:00 + KST(+9) → 같은 날 KST 21:00", () => {
      // env 미설정 = default KST
      expect(getKstDateString(Date.UTC(2026, 4, 4, 12, 0, 0))).toBe(
        "2026-05-04",
      );
    });

    it("UTC 15:00 + KST(+9) → 익일 KST 00:00", () => {
      expect(getKstDateString(Date.UTC(2026, 4, 4, 15, 0, 0))).toBe(
        "2026-05-05",
      );
    });

    it("UTC 15:00 + ICT(+7) → 같은 날 ICT 22:00", () => {
      // 베트남 거주자 시나리오 — KST보다 2시간 일찍
      process.env.AUTONOMY_TZ_OFFSET_HOURS = "7";
      expect(getKstDateString(Date.UTC(2026, 4, 4, 15, 0, 0))).toBe(
        "2026-05-04",
      );
    });

    it("UTC 17:00 + ICT(+7) → 익일 ICT 00:00", () => {
      process.env.AUTONOMY_TZ_OFFSET_HOURS = "7";
      expect(getKstDateString(Date.UTC(2026, 4, 4, 17, 0, 0))).toBe(
        "2026-05-05",
      );
    });
  });
});
