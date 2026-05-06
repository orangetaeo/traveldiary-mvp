/**
 * Prisma schema 심화 검증.
 *
 * schema.prisma의 구조적 규칙과 보안/성능 패턴 확인:
 * - 모든 model에 @id 존재
 * - FK 관계의 onDelete 전략
 * - @@index 존재 (쿼리 성능)
 * - Cascade delete 전파 경로
 * - @db.VarChar 길이 제한 (사용자 입력 컬럼)
 * - @default 값 유효성
 * - soft delete (deletedAt) 패턴
 */

import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

const SCHEMA_PATH = path.resolve("prisma/schema.prisma");
const schemaSrc = fs.readFileSync(SCHEMA_PATH, "utf-8");

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

/** model 이름 추출 */
function extractModels(src: string): string[] {
  const regex = /^model\s+(\w+)\s*\{/gm;
  const models: string[] = [];
  let match;
  while ((match = regex.exec(src)) !== null) {
    models.push(match[1]);
  }
  return models;
}

const ALL_MODELS = extractModels(schemaSrc);

/* ════════════════════════════════════════════
 * 모든 model에 @id 존재
 * ════════════════════════════════════════════ */

describe("Prisma schema — @id 존재", () => {
  it.each(ALL_MODELS.map((m) => [m]))(
    "%s — @id 필드 존재",
    (model) => {
      const block = extractModelBlock(schemaSrc, model);
      expect(block).not.toBeNull();
      expect(block!).toContain("@id");
    },
  );
});

/* ════════════════════════════════════════════
 * @id는 @default(cuid()) 사용
 * ════════════════════════════════════════════ */

describe("Prisma schema — @default(cuid()) ID 전략", () => {
  it.each(ALL_MODELS.map((m) => [m]))(
    "%s — @id @default(cuid())",
    (model) => {
      const block = extractModelBlock(schemaSrc, model);
      expect(block).not.toBeNull();
      expect(block!).toContain("@default(cuid())");
    },
  );
});

/* ════════════════════════════════════════════
 * FK 관계 — onDelete 전략
 * ════════════════════════════════════════════ */

describe("Prisma schema — onDelete 전략", () => {
  // Trip에 종속되는 모델은 Cascade
  const CASCADE_MODELS = [
    "ItineraryItem",
    "ItineraryDependency",
    "ChecklistItem",
    "CostEntry",
    "ShareLink",
    "Vote",
  ];

  it.each(CASCADE_MODELS.map((m) => [m]))(
    "%s — Trip FK에 onDelete: Cascade",
    (model) => {
      const block = extractModelBlock(schemaSrc, model);
      expect(block).not.toBeNull();
      // tripId → Trip 관계에서 Cascade
      if (block!.includes("tripId")) {
        expect(block!).toContain("onDelete: Cascade");
      }
    },
  );

  // User 참조 (actorId)는 SetNull
  const ACTOR_MODELS = [
    "ItineraryItem",
    "ChecklistItem",
    "CostEntry",
    "ShareComment",
    "Vote",
  ];

  it.each(ACTOR_MODELS.map((m) => [m]))(
    "%s — User FK (actorId)에 onDelete: SetNull",
    (model) => {
      const block = extractModelBlock(schemaSrc, model);
      expect(block).not.toBeNull();
      if (block!.includes("actorId")) {
        expect(block!).toContain("onDelete: SetNull");
      }
    },
  );
});

/* ════════════════════════════════════════════
 * @@index 존재 — 주요 모델
 * ════════════════════════════════════════════ */

describe("Prisma schema — @@index 존재", () => {
  const MODELS_WITH_INDEXES = [
    "User",
    "Trip",
    "ItineraryItem",
    "ChecklistItem",
    "CostEntry",
    "ShareLink",
    "ShareComment",
    "Vote",
    "AuditLog",
    "EvidenceCache",
  ];

  it.each(MODELS_WITH_INDEXES.map((m) => [m]))(
    "%s — @@index 또는 @@unique 존재",
    (model) => {
      const block = extractModelBlock(schemaSrc, model);
      expect(block).not.toBeNull();
      const hasIndex = block!.includes("@@index") || block!.includes("@@unique");
      expect(hasIndex, `${model}에 @@index 없음`).toBe(true);
    },
  );
});

/* ════════════════════════════════════════════
 * @db.VarChar — 사용자 입력 컬럼
 * ════════════════════════════════════════════ */

describe("Prisma schema — @db.VarChar 사용", () => {
  it("User.email에 @db.VarChar(320) 제한", () => {
    const block = extractModelBlock(schemaSrc, "User")!;
    expect(block).toContain("@db.VarChar(320)");
  });

  it("ItineraryItem.name에 @db.VarChar 제한", () => {
    const block = extractModelBlock(schemaSrc, "ItineraryItem")!;
    expect(block).toContain("@db.VarChar(200)");
  });

  it("ShareComment.body에 @db.VarChar 제한", () => {
    const block = extractModelBlock(schemaSrc, "ShareComment")!;
    expect(block).toContain("@db.VarChar(1000)");
  });

  it("ShareComment.nickname에 @db.VarChar 제한", () => {
    const block = extractModelBlock(schemaSrc, "ShareComment")!;
    expect(block).toContain("@db.VarChar(50)");
  });
});

/* ════════════════════════════════════════════
 * soft delete — deletedAt 패턴
 * ════════════════════════════════════════════ */

describe("Prisma schema — soft delete 패턴", () => {
  const SOFT_DELETE_MODELS = ["User", "Trip", "ShareComment"];

  it.each(SOFT_DELETE_MODELS.map((m) => [m]))(
    "%s — deletedAt 필드 존재",
    (model) => {
      const block = extractModelBlock(schemaSrc, model)!;
      expect(block).toContain("deletedAt");
    },
  );

  it.each(SOFT_DELETE_MODELS.map((m) => [m]))(
    "%s — deletedAt에 @@index 존재",
    (model) => {
      const block = extractModelBlock(schemaSrc, model)!;
      expect(block).toContain("@@index([deletedAt])");
    },
  );
});

/* ════════════════════════════════════════════
 * AuditLog — 특수 구조 (불변, User FK 없음)
 * ════════════════════════════════════════════ */

describe("Prisma schema — AuditLog 불변 구조", () => {
  const block = extractModelBlock(schemaSrc, "AuditLog")!;

  it("AuditLog — updatedAt 없음 (append-only)", () => {
    expect(block).not.toContain("updatedAt");
  });

  it("AuditLog — action/resource/resourceId 필드 존재", () => {
    expect(block).toContain("action");
    expect(block).toContain("resource");
    expect(block).toContain("resourceId");
  });

  it("AuditLog — before/after/metadata Json? 필드", () => {
    expect(block).toContain("before");
    expect(block).toContain("after");
    expect(block).toContain("metadata");
  });

  it("AuditLog — 3개 @@index 존재", () => {
    const indexCount = (block.match(/@@index/g) || []).length;
    expect(indexCount).toBe(3);
  });
});

/* ════════════════════════════════════════════
 * EvidenceCache — 캐시 구조
 * ════════════════════════════════════════════ */

describe("Prisma schema — EvidenceCache 캐시 구조", () => {
  const block = extractModelBlock(schemaSrc, "EvidenceCache")!;

  it("@@unique([placeId, platform]) 복합 유니크", () => {
    expect(block).toContain("@@unique([placeId, platform])");
  });

  it("expiresAt 필드 + @@index 존재", () => {
    expect(block).toContain("expiresAt");
    expect(block).toContain("@@index([expiresAt])");
  });
});

/* ════════════════════════════════════════════
 * Trip 종속 모델 — tripId @@index 존재
 * ════════════════════════════════════════════ */

describe("Prisma schema — tripId 인덱스", () => {
  const TRIP_DEPENDENT_MODELS = [
    "ItineraryItem",
    "ChecklistItem",
    "CostEntry",
    "ShareLink",
    "Vote",
  ];

  it.each(TRIP_DEPENDENT_MODELS.map((m) => [m]))(
    "%s — tripId 포함 @@index 존재",
    (model) => {
      const block = extractModelBlock(schemaSrc, model)!;
      const hasTripIndex =
        block.includes("@@index([tripId") || block.includes("@@index([tripId])");
      expect(hasTripIndex, `${model}에 tripId 인덱스 없음`).toBe(true);
    },
  );
});

/* ════════════════════════════════════════════
 * datasource + generator 설정
 * ════════════════════════════════════════════ */

describe("Prisma schema — 설정", () => {
  it("provider = postgresql", () => {
    expect(schemaSrc).toContain('provider = "postgresql"');
  });

  it("generator prisma-client-js", () => {
    expect(schemaSrc).toContain('provider = "prisma-client-js"');
  });
});
