-- TravelDiary 마이그레이션 0005 — SYSTEM_OWNER_ID seed (사이클 C)
-- 11b createTripWithSeedItinerary 트랜잭션 내 user upsert로 우회됐던 부분을 명시화.
-- 데모 모드 trip 생성 시 외래키 안전 보장.

INSERT INTO "User" (id, name, "createdAt", "updatedAt")
VALUES ('system-owner-pqc', 'System Demo User', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
