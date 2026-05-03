-- Migration 0010 — String 컬럼 VarChar 정합성 (사이클 GG, U 답습)
-- 사용자 입력 또는 외부 API 응답이 들어가는 String 컬럼에 명시적 한도 부여.
-- defense-in-depth + 코드 검증과 정합성 (feedback_schema_validation_consistency 답습).
-- 모두 확장 또는 보수적 축소라 데이터 손실 없음.

-- User
ALTER TABLE "User" ALTER COLUMN "email"   TYPE VARCHAR(320);
ALTER TABLE "User" ALTER COLUMN "kakaoId" TYPE VARCHAR(40);
ALTER TABLE "User" ALTER COLUMN "name"    TYPE VARCHAR(80);

-- Trip
ALTER TABLE "Trip" ALTER COLUMN "destination"     TYPE VARCHAR(80);
ALTER TABLE "Trip" ALTER COLUMN "destinationCode" TYPE VARCHAR(20);

-- ItineraryItem
ALTER TABLE "ItineraryItem" ALTER COLUMN "name"            TYPE VARCHAR(200);
ALTER TABLE "ItineraryItem" ALTER COLUMN "locationAddress" TYPE VARCHAR(500);
