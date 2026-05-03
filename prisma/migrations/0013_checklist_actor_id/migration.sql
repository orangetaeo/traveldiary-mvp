-- Migration 0013 — ChecklistItem.actorId NULLABLE + FK + INDEX (사이클 TT, ADR-045)
-- ADR-038/마이그 0012 답습: ON DELETE SET NULL ON UPDATE CASCADE.
-- NULLABLE 컬럼 신규 추가 → 기존 row 영향 0 → 사전 점검 SQL 불필요.
-- Railway start.sh가 prisma migrate deploy로 자동 적용 → 사용자 액션 +0.
--
-- 후속 트리거 (TT-2 사이클):
--   1. OAuth 활성 + 첫 카카오 사용자 addChecklistItem 호출 → actorId === user.id 확인
--   2. SELECT COUNT(*) FROM "ChecklistItem"
--      WHERE "actorId" IS NOT NULL AND "actorId" NOT IN (SELECT id FROM "User") = 0
--   3. 둘 다 충족 시 CostEntry/Vote에 동형 마이그 0014 적용

ALTER TABLE "ChecklistItem" ADD COLUMN "actorId" TEXT;

ALTER TABLE "ChecklistItem"
  ADD CONSTRAINT "ChecklistItem_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "ChecklistItem_actorId_idx" ON "ChecklistItem"("actorId");
