-- Migration 0007 — ValidationResult enum status 컬럼 (ADR-031, 사이클 E)
-- 캐시 hit 시 priceStatus/distanceStatus 평탄화 해소.
-- NULLABLE — 기존 row 호환 (보수적 fallback 유지).

ALTER TABLE "ValidationResult"
  ADD COLUMN "priceStatus" TEXT,
  ADD COLUMN "distanceStatus" TEXT;
