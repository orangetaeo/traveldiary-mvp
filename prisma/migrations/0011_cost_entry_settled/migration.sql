-- Migration 0011 — CostEntry.settledAt (ADR-042, 사이클 UU, E1 v3 미니)
-- 정산 완료 마커. NULL = 미정산 / NOT NULL = 정산 완료 시점.
-- NULLABLE — 기존 row 모두 NULL (미정산)로 호환 (마이그 0007 답습).
-- @@index([tripId, settledAt]) — 미정산만 필터링 빠르게.

ALTER TABLE "CostEntry"
  ADD COLUMN "settledAt" TIMESTAMP(3);

CREATE INDEX "CostEntry_tripId_settledAt_idx" ON "CostEntry"("tripId", "settledAt");
