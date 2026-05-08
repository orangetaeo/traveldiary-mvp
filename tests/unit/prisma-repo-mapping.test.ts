/**
 * Prisma model ↔ Repository 매핑 일관성 검증.
 *
 * schema.prisma의 모든 model이 repository 파일에 매핑되는지,
 * 그리고 모든 repository가 유효한 model을 참조하는지 양방향 확인.
 */

import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

const SCHEMA_PATH = path.resolve("prisma/schema.prisma");
const REPO_DIR = path.resolve("lib/repositories");

const schemaSrc = fs.readFileSync(SCHEMA_PATH, "utf-8");
const repoFiles = fs
  .readdirSync(REPO_DIR)
  .filter((f) => f.endsWith(".ts"))
  .map((f) => f);

/** schema.prisma에서 model 이름 추출 */
function extractModels(src: string): string[] {
  const regex = /^model\s+(\w+)\s*\{/gm;
  const models: string[] = [];
  let match;
  while ((match = regex.exec(src)) !== null) {
    models.push(match[1]);
  }
  return models;
}

/** model 블록 전체 추출 (JSDoc 내 } 문자 안전 처리) */
function extractModelBlock(src: string, modelName: string): string | null {
  const startRegex = new RegExp(`^model\\s+${modelName}\\s*\\{`, "m");
  const startMatch = startRegex.exec(src);
  if (!startMatch) return null;
  let depth = 1;
  let i = startMatch.index + startMatch[0].length;
  while (i < src.length && depth > 0) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") depth--;
    i++;
  }
  return src.slice(startMatch.index, i);
}

const PRISMA_MODELS = extractModels(schemaSrc);

// model → repository 이름 매핑 규칙
const MODEL_TO_REPO: Record<string, string> = {
  User: "user.repository.ts",
  Trip: "trip.repository.ts",
  ItineraryItem: "trip.repository.ts", // Trip repository에서 함께 관리
  ItineraryDependency: "trip.repository.ts", // Trip에 종속
  ValidationResult: "validation.repository.ts",
  TripMember: "invite.repository.ts", // invite/member 관리
  AuditLog: "funnel.repository.ts", // audit log → funnel/ab에서 집계
  ChecklistItem: "checklist.repository.ts",
  CostEntry: "cost.repository.ts",
  ShareLink: "share.repository.ts",
  ShareComment: "shareComment.repository.ts",
  Vote: "vote.repository.ts",
  EvidenceCache: "evidence-cache.repository.ts",
  Place: "place.repository.ts",
  TripReview: "review.repository.ts",
  TripPhoto: "photo.repository.ts",
};

/* ════════════════════════════════════════════
 * Prisma model 수 불변성
 * ════════════════════════════════════════════ */

describe("Prisma schema — model 수", () => {
  it("16개 model 존재", () => {
    expect(PRISMA_MODELS.length).toBe(16);
  });

  it("알려진 model 전체 등록", () => {
    expect(PRISMA_MODELS.sort()).toEqual([
      "AuditLog",
      "ChecklistItem",
      "CostEntry",
      "EvidenceCache",
      "ItineraryDependency",
      "ItineraryItem",
      "Place",
      "ShareComment",
      "ShareLink",
      "Trip",
      "TripMember",
      "TripPhoto",
      "TripReview",
      "User",
      "ValidationResult",
      "Vote",
    ]);
  });
});

/* ════════════════════════════════════════════
 * Repository 파일 수
 * ════════════════════════════════════════════ */

describe("repository 파일 수", () => {
  it("18개 repository 파일 존재", () => {
    expect(repoFiles.length).toBe(18);
  });
});

/* ════════════════════════════════════════════
 * model → repository 매핑 (모든 model이 repository에 커버됨)
 * ════════════════════════════════════════════ */

describe("Prisma model → repository 매핑", () => {
  it.each(PRISMA_MODELS.map((m) => [m]))(
    "%s — 매핑된 repository 파일 존재",
    (model) => {
      const repoFile = MODEL_TO_REPO[model];
      expect(repoFile, `${model}에 매핑된 repository 없음`).toBeDefined();
      expect(
        repoFiles.includes(repoFile),
        `${model} → ${repoFile} 파일이 존재하지 않음`,
      ).toBe(true);
    },
  );
});

/* ════════════════════════════════════════════
 * repository → prisma 참조 (모든 repository가 prisma 사용)
 * ════════════════════════════════════════════ */

describe("repository — prisma 참조 검증", () => {
  it.each(repoFiles.map((f) => [f]))(
    "%s — prisma.xxx 호출 존재",
    (fileName) => {
      const src = fs.readFileSync(path.join(REPO_DIR, fileName), "utf-8");
      // prisma.modelName.findXxx / create / update 등
      expect(src).toMatch(/prisma\.\w+\.\w+/);
    },
  );
});

/* ════════════════════════════════════════════
 * schema 필수 컬럼 존재 확인
 * ════════════════════════════════════════════ */

describe("Prisma schema — 필수 컬럼 패턴", () => {
  it("모든 주요 model에 id 필드 존재", () => {
    const modelsWithId = ["Trip", "User", "ChecklistItem", "CostEntry", "ShareLink", "Vote"];
    for (const model of modelsWithId) {
      const block = extractModelBlock(schemaSrc, model);
      expect(block, `${model} 블록 미발견`).not.toBeNull();
      expect(block!).toContain("id");
    }
  });

  it("timestamp 컬럼 (createdAt + updatedAt) 패턴", () => {
    // createdAt + updatedAt 모두 보유: User, Trip, ItineraryItem, ChecklistItem, CostEntry
    // createdAt만 보유: AuditLog, ShareLink, ShareComment, Vote (immutable / soft-delete)
    const modelsWithBothTimestamps = ["User", "Trip", "ItineraryItem", "ChecklistItem", "CostEntry"];
    for (const model of modelsWithBothTimestamps) {
      const block = extractModelBlock(schemaSrc, model);
      expect(block, `${model} 블록 미발견`).not.toBeNull();
      expect(block!).toContain("createdAt");
      expect(block!).toContain("updatedAt");
    }
  });
});
