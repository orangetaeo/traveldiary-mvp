import { describe, it, expect } from "vitest";
import { pickModel } from "@/lib/autonomy/pick-model";

describe("pick-model — 자율 모드 모델 라우팅 (사이클 AAAA2, ADR-047)", () => {
  describe("stage default 분포", () => {
    it("triage → haiku", () => {
      expect(pickModel("triage").model).toBe("haiku");
    });

    it("recap → haiku", () => {
      expect(pickModel("recap").model).toBe("haiku");
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

    it("r1-gate → opus (4-체크 우회)", () => {
      expect(pickModel("r1-gate").model).toBe("opus");
    });

    it("m1-design → opus (4-체크 우회)", () => {
      expect(pickModel("m1-design").model).toBe("opus");
    });
  });

  describe("Opus 4-체크 (ADR-047)", () => {
    it("4-체크 모두 통과 시 opus 권장", () => {
      const result = pickModel("impl", {
        fileCount: 5,
        isArchitecture: true,
        sonnetFailures: 2,
        isReleaseQa: true,
      });
      expect(result.model).toBe("opus");
      expect(result.reason).toContain("Opus 4-체크 통과");
    });

    it("4-체크 중 1개라도 미달이면 stage default (sonnet 단독 승격도 미달)", () => {
      // fileCount 5, isSecurity true, sonnetFailures 1 (미달), isReleaseQa false → 4-체크 미달 + sonnet 승격도 미달
      const result = pickModel("impl", {
        fileCount: 5,
        isSecurity: true,
        sonnetFailures: 1,
        isReleaseQa: false,
      });
      expect(result.model).toBe("sonnet");
    });

    it("isArchitecture 또는 isSecurity 둘 중 하나면 OK", () => {
      const arch = pickModel("impl", {
        fileCount: 5,
        isArchitecture: true,
        sonnetFailures: 2,
        isReleaseQa: true,
      });
      expect(arch.model).toBe("opus");

      const sec = pickModel("impl", {
        fileCount: 5,
        isSecurity: true,
        sonnetFailures: 2,
        isReleaseQa: true,
      });
      expect(sec.model).toBe("opus");
    });
  });

  describe("Sonnet 2+ 실패 → Opus 승격", () => {
    it("sonnetFailures=2면 opus", () => {
      const result = pickModel("impl", { sonnetFailures: 2 });
      expect(result.model).toBe("opus");
      expect(result.reason).toContain("실패");
    });

    it("sonnetFailures=1은 sonnet (승격 미달)", () => {
      const result = pickModel("impl", { sonnetFailures: 1 });
      expect(result.model).toBe("sonnet");
    });

    it("sonnetFailures=5는 opus (승격 유지)", () => {
      const result = pickModel("review", { sonnetFailures: 5 });
      expect(result.model).toBe("opus");
    });
  });

  describe("dryRunCap1 강제 (R1 자율 시동 정책)", () => {
    it("dryRunCap1=true면 stage 무관 항상 haiku", () => {
      expect(pickModel("r1-gate", { dryRunCap1: true }).model).toBe("haiku");
      expect(pickModel("m1-design", { dryRunCap1: true }).model).toBe("haiku");
      expect(pickModel("impl", { dryRunCap1: true }).model).toBe("haiku");
    });

    it("dryRunCap1=false는 정상 라우팅", () => {
      expect(pickModel("r1-gate", { dryRunCap1: false }).model).toBe("opus");
    });
  });

  describe("forceTier override (호출처 명시)", () => {
    it("forceTier=opus는 stage 무관 opus", () => {
      expect(pickModel("triage", { forceTier: "opus" }).model).toBe("opus");
    });

    it("forceTier=haiku는 r1-gate도 haiku", () => {
      expect(pickModel("r1-gate", { forceTier: "haiku" }).model).toBe("haiku");
    });

    it("forceTier가 dryRunCap1보다 우선", () => {
      expect(
        pickModel("impl", { forceTier: "opus", dryRunCap1: true }).model,
      ).toBe("opus");
    });
  });

  describe("reason 자연어 한국어 (T13 권고)", () => {
    it("reason은 비어있지 않음", () => {
      expect(pickModel("triage").reason.length).toBeGreaterThan(0);
    });

    it("opus 승격 시 사유 명시", () => {
      const r = pickModel("impl", { sonnetFailures: 2 });
      expect(r.reason).toMatch(/sonnet|실패|승격/);
    });
  });
});
