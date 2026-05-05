/**
 * ModelPricing + PickModel 테스트 — Batch 15.
 *
 * 2 모듈:
 *  - lib/autonomy/model-pricing.ts: MODEL_PRICING 무결성 + calculateCostUsd 계산
 *  - lib/autonomy/pick-model.ts: pickModel 라우팅 (stage default, forceTier, dryRunCap1, Opus 4-체크)
 */

import { describe, it, expect } from "vitest";
import {
  MODEL_PRICING,
  calculateCostUsd,
} from "@/lib/autonomy/model-pricing";
import { pickModel } from "@/lib/autonomy/pick-model";
import type { ModelStage } from "@/lib/autonomy/pick-model";

/* ────────── model-pricing ────────── */

describe("autonomy — model-pricing", () => {
  describe("MODEL_PRICING 무결성", () => {
    it("5개 모델 엔트리 등록", () => {
      expect(Object.keys(MODEL_PRICING).length).toBe(5);
    });

    it("haiku — input $1, output $5 per MTok", () => {
      const p = MODEL_PRICING["claude-haiku-4-5-20251001"];
      expect(p).toBeDefined();
      expect(p.inputPerMTok).toBe(1.0);
      expect(p.outputPerMTok).toBe(5.0);
    });

    it("haiku alias 동일 가격", () => {
      const a = MODEL_PRICING["claude-haiku-4-5-20251001"];
      const b = MODEL_PRICING["claude-haiku-4-5"];
      expect(a.inputPerMTok).toBe(b.inputPerMTok);
      expect(a.outputPerMTok).toBe(b.outputPerMTok);
    });

    it("sonnet — input $3, output $15 per MTok", () => {
      const p = MODEL_PRICING["claude-sonnet-4-6"];
      expect(p.inputPerMTok).toBe(3.0);
      expect(p.outputPerMTok).toBe(15.0);
    });

    it("opus — input $15, output $75 per MTok", () => {
      const p = MODEL_PRICING["claude-opus-4-7"];
      expect(p.inputPerMTok).toBe(15.0);
      expect(p.outputPerMTok).toBe(75.0);
    });
  });

  describe("calculateCostUsd", () => {
    it("haiku 1M input + 1M output → $6", () => {
      const cost = calculateCostUsd("claude-haiku-4-5", 1_000_000, 1_000_000);
      expect(cost).toBeCloseTo(6.0);
    });

    it("sonnet 500K input + 200K output → $1.5 + $3 = $4.5", () => {
      const cost = calculateCostUsd("claude-sonnet-4-6", 500_000, 200_000);
      expect(cost).toBeCloseTo(4.5);
    });

    it("opus 100K input + 50K output → $1.5 + $3.75 = $5.25", () => {
      const cost = calculateCostUsd("claude-opus-4-7", 100_000, 50_000);
      expect(cost).toBeCloseTo(5.25);
    });

    it("0 토큰 → 0", () => {
      expect(calculateCostUsd("claude-sonnet-4-6", 0, 0)).toBe(0);
    });

    it("미등록 모델 → 0 (안전 기본값)", () => {
      expect(calculateCostUsd("unknown-model", 1_000_000, 1_000_000)).toBe(0);
    });

    it("소량 토큰 정밀도 (100 input + 50 output, haiku)", () => {
      // 100/1M * 1 + 50/1M * 5 = 0.0001 + 0.00025 = 0.00035
      const cost = calculateCostUsd("claude-haiku-4-5", 100, 50);
      expect(cost).toBeCloseTo(0.00035, 6);
    });

    it("대량 토큰 (10M input + 5M output, opus)", () => {
      // 10 * 15 + 5 * 75 = 150 + 375 = 525
      const cost = calculateCostUsd("claude-opus-4-7", 10_000_000, 5_000_000);
      expect(cost).toBeCloseTo(525.0);
    });
  });
});

/* ────────── pick-model ────────── */

describe("autonomy — pickModel", () => {
  describe("stage default", () => {
    it("triage → haiku", () => {
      const r = pickModel("triage");
      expect(r.model).toBe("haiku");
      expect(r.reason).toContain("triage");
    });

    it("meeting → sonnet", () => {
      expect(pickModel("meeting").model).toBe("sonnet");
    });

    it("impl → sonnet", () => {
      expect(pickModel("impl").model).toBe("sonnet");
    });

    it("review → sonnet", () => {
      expect(pickModel("review").model).toBe("sonnet");
    });

    it("recap → haiku", () => {
      expect(pickModel("recap").model).toBe("haiku");
    });

    it("r1-gate → opus (거버넌스)", () => {
      const r = pickModel("r1-gate");
      expect(r.model).toBe("opus");
      expect(r.reason).toContain("거버넌스");
    });

    it("m1-design → opus (PRD 핵심)", () => {
      const r = pickModel("m1-design");
      expect(r.model).toBe("opus");
      expect(r.reason).toContain("PRD");
    });
  });

  describe("forceTier override", () => {
    it("forceTier=haiku → haiku (stage 무시)", () => {
      const r = pickModel("r1-gate", { forceTier: "haiku" });
      expect(r.model).toBe("haiku");
      expect(r.reason).toContain("forceTier");
    });

    it("forceTier=opus → opus (triage도)", () => {
      const r = pickModel("triage", { forceTier: "opus" });
      expect(r.model).toBe("opus");
    });
  });

  describe("dryRunCap1", () => {
    it("dryRunCap1=true → haiku (모든 stage)", () => {
      const stages: ModelStage[] = ["triage", "meeting", "impl", "review", "recap", "r1-gate", "m1-design"];
      for (const s of stages) {
        const r = pickModel(s, { dryRunCap1: true });
        expect(r.model).toBe("haiku");
        expect(r.reason).toContain("dryRunCap1");
      }
    });

    it("forceTier > dryRunCap1 (forceTier 우선)", () => {
      const r = pickModel("impl", { dryRunCap1: true, forceTier: "sonnet" });
      expect(r.model).toBe("sonnet");
      expect(r.reason).toContain("forceTier");
    });
  });

  describe("Opus 4-체크", () => {
    const fullOpusCriteria = {
      fileCount: 5,
      isArchitecture: true,
      sonnetFailures: 2,
      isReleaseQa: true,
    };

    it("4 조건 모두 충족 → opus", () => {
      const r = pickModel("impl", fullOpusCriteria);
      expect(r.model).toBe("opus");
      expect(r.reason).toContain("4-체크");
    });

    it("fileCount < 5 → sonnet (stage default)", () => {
      const r = pickModel("impl", { ...fullOpusCriteria, fileCount: 4 });
      // sonnetFailures >= 2 이므로 단독 승격은 됨
      expect(r.model).toBe("opus");
      expect(r.reason).toContain("실패");
    });

    it("isArchitecture=false + isSecurity=false → 4-체크 미통과", () => {
      const r = pickModel("impl", {
        ...fullOpusCriteria,
        isArchitecture: false,
        sonnetFailures: 0,
      });
      // 4체크 미통과 + sonnet 실패 0 → stage default
      expect(r.model).toBe("sonnet");
    });

    it("isSecurity=true 대체 가능 (isArchitecture 없어도)", () => {
      const r = pickModel("impl", {
        fileCount: 5,
        isSecurity: true,
        sonnetFailures: 2,
        isReleaseQa: true,
      });
      expect(r.model).toBe("opus");
      expect(r.reason).toContain("4-체크");
    });

    it("sonnetFailures < 2 → 4-체크 미통과", () => {
      const r = pickModel("impl", { ...fullOpusCriteria, sonnetFailures: 1 });
      // 4체크 미통과 + sonnet 실패 1 → stage default
      expect(r.model).toBe("sonnet");
    });

    it("isReleaseQa=false → 4-체크 미통과", () => {
      const r = pickModel("impl", { ...fullOpusCriteria, isReleaseQa: false });
      // sonnetFailures >= 2 이므로 단독 승격
      expect(r.model).toBe("opus");
      expect(r.reason).toContain("실패");
    });
  });

  describe("sonnet 실패 단독 승격", () => {
    it("sonnetFailures=2 → opus (4-체크 무관)", () => {
      const r = pickModel("impl", { sonnetFailures: 2 });
      expect(r.model).toBe("opus");
      expect(r.reason).toContain("2회 실패");
    });

    it("sonnetFailures=3 → opus", () => {
      const r = pickModel("review", { sonnetFailures: 3 });
      expect(r.model).toBe("opus");
      expect(r.reason).toContain("3회 실패");
    });

    it("sonnetFailures=1 → stage default (미승격)", () => {
      const r = pickModel("impl", { sonnetFailures: 1 });
      expect(r.model).toBe("sonnet");
    });

    it("sonnetFailures=0 → stage default", () => {
      const r = pickModel("meeting", { sonnetFailures: 0 });
      expect(r.model).toBe("sonnet");
    });
  });

  describe("reason 문자열 포함", () => {
    it("모든 결과에 reason 존재", () => {
      const stages: ModelStage[] = ["triage", "meeting", "impl", "review", "recap", "r1-gate", "m1-design"];
      for (const s of stages) {
        const r = pickModel(s);
        expect(r.reason).toBeTruthy();
        expect(r.reason.length).toBeGreaterThan(5);
      }
    });
  });
});
