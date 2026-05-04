-- Migration 0014 — CostEntry + ItineraryItem + Vote actorId NULLABLE + FK + INDEX
-- (사이클 BLOCKER6, PRD §2 Phase 3)
-- 0013 ChecklistItem 답습: ON DELETE SET NULL ON UPDATE CASCADE.
-- NULLABLE 컬럼 신규 추가 → 기존 row 영향 0.
-- Railway start.sh가 prisma migrate deploy로 자동 적용.

-- ═══════════════════════════════════════════
-- CostEntry.actorId
-- ═══════════════════════════════════════════
ALTER TABLE "CostEntry" ADD COLUMN "actorId" TEXT;

ALTER TABLE "CostEntry"
  ADD CONSTRAINT "CostEntry_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "CostEntry_actorId_idx" ON "CostEntry"("actorId");

-- ═══════════════════════════════════════════
-- ItineraryItem.actorId
-- ═══════════════════════════════════════════
ALTER TABLE "ItineraryItem" ADD COLUMN "actorId" TEXT;

ALTER TABLE "ItineraryItem"
  ADD CONSTRAINT "ItineraryItem_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "ItineraryItem_actorId_idx" ON "ItineraryItem"("actorId");

-- ═══════════════════════════════════════════
-- Vote.actorId (createdBy 유지 — BC. 신규 코드는 actorId 사용)
-- ═══════════════════════════════════════════
ALTER TABLE "Vote" ADD COLUMN "actorId" TEXT;

ALTER TABLE "Vote"
  ADD CONSTRAINT "Vote_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Vote_actorId_idx" ON "Vote"("actorId");

-- 기존 createdBy 데이터를 actorId로 복사 (User FK 존재하는 경우만)
UPDATE "Vote" SET "actorId" = "createdBy"
  WHERE "createdBy" IS NOT NULL
    AND "createdBy" IN (SELECT "id" FROM "User");
