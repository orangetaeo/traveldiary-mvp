/**
 * BLOCKER6 — actorId 격리 테스트 (마이그 0014).
 *
 * CostEntry, ItineraryItem, Vote 3개 모델에 actorId NULLABLE 컬럼 추가.
 * Server Actions에서 resolveActorIdForTrip으로 DEMO trip 오염 차단.
 */

import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

/** 모델 블록 추출: model Name { ... } 단위 (JSDoc 내부 } 무시) */
function extractModelBlock(schema: string, modelName: string): string {
  const startIdx = schema.indexOf(`model ${modelName}`);
  if (startIdx === -1) return "";
  // 모델 경계: 줄 시작 `}`을 찾음 (Prisma 모델은 항상 ^} 로 닫힘)
  const afterOpen = schema.indexOf("{", startIdx);
  let depth = 1;
  let i = afterOpen + 1;
  while (i < schema.length && depth > 0) {
    if (schema[i] === "{") depth++;
    if (schema[i] === "}") depth--;
    i++;
  }
  return schema.slice(startIdx, i);
}

// ═══════════════════════════════════════════
// 1. 스키마 검증
// ═══════════════════════════════════════════

describe("BLOCKER6 — Prisma schema actorId 컬럼", () => {
  const schema = fs.readFileSync(
    path.resolve("prisma/schema.prisma"),
    "utf-8",
  );

  it("CostEntry에 actorId String? 필드 존재", () => {
    const block = extractModelBlock(schema, "CostEntry");
    expect(block).toContain("actorId");
    expect(block).toContain("String?");
  });

  it("ItineraryItem에 actorId String? 필드 존재", () => {
    const block = extractModelBlock(schema, "ItineraryItem");
    expect(block).toContain("actorId");
    expect(block).toContain("String?");
  });

  it("Vote에 actorId String? 필드 존재", () => {
    const block = extractModelBlock(schema, "Vote");
    expect(block).toContain("actorId");
    expect(block).toContain("String?");
  });

  it("User 모델에 역방향 relation 3종 추가", () => {
    const block = extractModelBlock(schema, "User");
    expect(block).toContain("costEntries");
    expect(block).toContain("itineraryItems");
    expect(block).toContain("votes");
  });

  it("3개 모델 모두 actorId FK + ON DELETE SetNull", () => {
    for (const model of ["CostEntry", "ItineraryItem", "Vote"]) {
      const block = extractModelBlock(schema, model);
      expect(block).toContain("onDelete: SetNull");
      expect(block).toContain("@@index([actorId])");
    }
  });
});

// ═══════════════════════════════════════════
// 2. 마이그레이션 SQL 검증
// ═══════════════════════════════════════════

describe("BLOCKER6 — Migration 0014 SQL", () => {
  const sql = fs.readFileSync(
    path.resolve(
      "prisma/migrations/0014_actorid_cost_itinerary_vote/migration.sql",
    ),
    "utf-8",
  );

  it("CostEntry actorId ALTER + FK + INDEX", () => {
    expect(sql).toContain('ALTER TABLE "CostEntry" ADD COLUMN "actorId" TEXT');
    expect(sql).toContain("CostEntry_actorId_fkey");
    expect(sql).toContain("CostEntry_actorId_idx");
  });

  it("ItineraryItem actorId ALTER + FK + INDEX", () => {
    expect(sql).toContain(
      'ALTER TABLE "ItineraryItem" ADD COLUMN "actorId" TEXT',
    );
    expect(sql).toContain("ItineraryItem_actorId_fkey");
    expect(sql).toContain("ItineraryItem_actorId_idx");
  });

  it("Vote actorId ALTER + FK + INDEX", () => {
    expect(sql).toContain('ALTER TABLE "Vote" ADD COLUMN "actorId" TEXT');
    expect(sql).toContain("Vote_actorId_fkey");
    expect(sql).toContain("Vote_actorId_idx");
  });

  it("Vote.createdBy → actorId 데이터 마이그레이션", () => {
    expect(sql).toContain('UPDATE "Vote" SET "actorId" = "createdBy"');
    expect(sql).toContain('IN (SELECT "id" FROM "User")');
  });

  it("모든 FK는 ON DELETE SET NULL ON UPDATE CASCADE (3개 이상)", () => {
    const fkMatches = sql.match(/ON DELETE SET NULL ON UPDATE CASCADE/g);
    expect(fkMatches!.length).toBeGreaterThanOrEqual(3);
  });
});

// ═══════════════════════════════════════════
// 3. Server Actions — resolveActorIdForTrip 사용 검증
// ═══════════════════════════════════════════

describe("BLOCKER6 — Server Actions actorId stamp", () => {
  const costAction = fs.readFileSync(
    path.resolve("actions/cost.ts"),
    "utf-8",
  );
  const itinAction = fs.readFileSync(
    path.resolve("actions/itinerary.ts"),
    "utf-8",
  );
  const voteAction = fs.readFileSync(
    path.resolve("actions/vote.ts"),
    "utf-8",
  );

  it("cost.ts: resolveActorIdForTrip import + 호출", () => {
    expect(costAction).toContain("resolveActorIdForTrip");
    expect(costAction).toContain("actorId");
  });

  it("itinerary.ts: resolveActorIdForTrip import + 호출", () => {
    expect(itinAction).toContain("resolveActorIdForTrip");
    expect(itinAction).toContain("actorId");
  });

  it("vote.ts: resolveActorIdForTrip import + 호출", () => {
    expect(voteAction).toContain("resolveActorIdForTrip");
    expect(voteAction).toContain("actorId");
  });

  it("DEMO trip에서는 actorId=null 강제 (resolveActorIdForTrip 검증)", () => {
    // resolveActorIdForTrip은 DEMO_TRIP_IDS에 포함된 tripId → null 반환
    const actorResolution = fs.readFileSync(
      path.resolve("lib/auth/actor-resolution.ts"),
      "utf-8",
    );
    expect(actorResolution).toContain("DEMO_TRIP_IDS");
    expect(actorResolution).toContain("return null");
  });
});

// ═══════════════════════════════════════════
// 4. Repository — actorId 수용 검증
// ═══════════════════════════════════════════

describe("BLOCKER6 — Repository actorId 수용", () => {
  const costRepo = fs.readFileSync(
    path.resolve("lib/repositories/cost.repository.ts"),
    "utf-8",
  );
  const tripRepo = fs.readFileSync(
    path.resolve("lib/repositories/trip.repository.ts"),
    "utf-8",
  );
  const voteRepo = fs.readFileSync(
    path.resolve("lib/repositories/vote.repository.ts"),
    "utf-8",
  );

  it("cost.repository CreateCostInput에 actorId 필드", () => {
    expect(costRepo).toContain("actorId?: string | null");
    expect(costRepo).toContain("actorId: input.actorId");
  });

  it("trip.repository AddItineraryItemInput에 actorId 필드", () => {
    expect(tripRepo).toContain("actorId?: string | null");
    expect(tripRepo).toContain("actorId: input.actorId");
  });

  it("vote.repository CreateVoteInput에 actorId 필드", () => {
    expect(voteRepo).toContain("actorId?: string | null");
    expect(voteRepo).toContain("actorId: input.actorId");
  });
});

// ═══════════════════════════════════════════
// 5. 기존 ChecklistItem + ShareComment 동형 검증
// ═══════════════════════════════════════════

describe("BLOCKER6 — 동형 패턴 일관성 (5 모델 전수)", () => {
  const schema = fs.readFileSync(
    path.resolve("prisma/schema.prisma"),
    "utf-8",
  );

  const modelsWithActorId = [
    "ChecklistItem",
    "ShareComment",
    "CostEntry",
    "ItineraryItem",
    "Vote",
  ];

  for (const model of modelsWithActorId) {
    it(`${model}에 actorId + @@index([actorId]) 존재`, () => {
      const block = extractModelBlock(schema, model);
      expect(block).toContain("actorId");
      expect(block).toContain("@@index([actorId])");
    });
  }
});
