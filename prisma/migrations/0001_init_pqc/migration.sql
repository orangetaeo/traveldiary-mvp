-- TravelDiary 초기 마이그레이션 (사이클 5b-1 / ADR-013)
-- 사이클 1 schema.prisma를 PostgreSQL 16 DDL로 그대로 변환.

-- =============================================================
-- USER
-- =============================================================
CREATE TABLE "User" (
  "id"          TEXT PRIMARY KEY,
  "email"       TEXT,
  "kakaoId"     TEXT,
  "name"        TEXT,
  "preferences" JSONB,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  "deletedAt"   TIMESTAMP(3)
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_kakaoId_key" ON "User"("kakaoId");
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

-- =============================================================
-- TRIP
-- =============================================================
CREATE TABLE "Trip" (
  "id"              TEXT PRIMARY KEY,
  "ownerId"         TEXT NOT NULL,
  "destination"     TEXT NOT NULL,
  "destinationCode" TEXT NOT NULL,
  "startDate"       TIMESTAMP(3) NOT NULL,
  "nights"          INTEGER NOT NULL,
  "companion"       TEXT NOT NULL,
  "preferences"     JSONB NOT NULL,
  "status"          TEXT NOT NULL DEFAULT 'draft',
  "currentMode"     TEXT NOT NULL DEFAULT 'pre-travel',
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL,
  "deletedAt"       TIMESTAMP(3),
  CONSTRAINT "Trip_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON UPDATE CASCADE ON DELETE RESTRICT
);
CREATE INDEX "Trip_ownerId_status_idx" ON "Trip"("ownerId", "status");
CREATE INDEX "Trip_startDate_idx" ON "Trip"("startDate");
CREATE INDEX "Trip_destinationCode_idx" ON "Trip"("destinationCode");
CREATE INDEX "Trip_deletedAt_idx" ON "Trip"("deletedAt");

-- =============================================================
-- ITINERARY ITEM (DAG 노드)
-- =============================================================
CREATE TABLE "ItineraryItem" (
  "id"              TEXT PRIMARY KEY,
  "tripId"          TEXT NOT NULL,
  "dayIndex"        INTEGER NOT NULL,
  "scheduledAt"     TIMESTAMP(3) NOT NULL,
  "durationMinutes" INTEGER NOT NULL,
  "flexibility"     TEXT NOT NULL,
  "priority"        INTEGER NOT NULL,
  "flexMinutes"     INTEGER NOT NULL DEFAULT 0,
  "name"            TEXT NOT NULL,
  "category"        TEXT NOT NULL,
  "locationLat"     DOUBLE PRECISION NOT NULL,
  "locationLng"     DOUBLE PRECISION NOT NULL,
  "locationAddress" TEXT NOT NULL,
  "estimatedPrice"  JSONB,
  "bookingStatus"   JSONB,
  "evidence"        JSONB NOT NULL,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ItineraryItem_tripId_fkey"
    FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX "ItineraryItem_tripId_dayIndex_idx" ON "ItineraryItem"("tripId", "dayIndex");
CREATE INDEX "ItineraryItem_tripId_scheduledAt_idx" ON "ItineraryItem"("tripId", "scheduledAt");
CREATE INDEX "ItineraryItem_category_idx" ON "ItineraryItem"("category");

-- =============================================================
-- ITINERARY DEPENDENCY (인접 리스트 — DAG 엣지)
-- =============================================================
CREATE TABLE "ItineraryDependency" (
  "id"           TEXT PRIMARY KEY,
  "dependentId"  TEXT NOT NULL,
  "dependencyId" TEXT NOT NULL,
  CONSTRAINT "ItineraryDependency_dependentId_fkey"
    FOREIGN KEY ("dependentId") REFERENCES "ItineraryItem"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "ItineraryDependency_dependencyId_fkey"
    FOREIGN KEY ("dependencyId") REFERENCES "ItineraryItem"("id") ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE UNIQUE INDEX "ItineraryDependency_dependentId_dependencyId_key"
  ON "ItineraryDependency"("dependentId", "dependencyId");
CREATE INDEX "ItineraryDependency_dependencyId_idx" ON "ItineraryDependency"("dependencyId");

-- =============================================================
-- VALIDATION RESULT (5단계 환각 차단)
-- =============================================================
CREATE TABLE "ValidationResult" (
  "id"               TEXT PRIMARY KEY,
  "itemId"           TEXT NOT NULL,
  "placeExists"      BOOLEAN NOT NULL,
  "operatingStatus"  TEXT NOT NULL,
  "bookingRequired"  BOOLEAN NOT NULL,
  "distanceVerified" BOOLEAN NOT NULL,
  "priceVerified"    BOOLEAN NOT NULL,
  "validatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ValidationResult_itemId_fkey"
    FOREIGN KEY ("itemId") REFERENCES "ItineraryItem"("id") ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX "ValidationResult_itemId_validatedAt_idx" ON "ValidationResult"("itemId", "validatedAt");

-- =============================================================
-- TRIP MEMBER (협업)
-- =============================================================
CREATE TABLE "TripMember" (
  "id"       TEXT PRIMARY KEY,
  "tripId"   TEXT NOT NULL,
  "userId"   TEXT NOT NULL,
  "role"     TEXT NOT NULL,
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TripMember_tripId_fkey"
    FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "TripMember_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON UPDATE CASCADE ON DELETE RESTRICT
);
CREATE UNIQUE INDEX "TripMember_tripId_userId_key" ON "TripMember"("tripId", "userId");
CREATE INDEX "TripMember_userId_idx" ON "TripMember"("userId");

-- =============================================================
-- AUDIT LOG (S-13 절대 규칙)
-- =============================================================
CREATE TABLE "AuditLog" (
  "id"         TEXT PRIMARY KEY,
  "actorId"    TEXT,
  "action"     TEXT NOT NULL,
  "resource"   TEXT NOT NULL,
  "resourceId" TEXT NOT NULL,
  "before"     JSONB,
  "after"      JSONB,
  "metadata"   JSONB,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "AuditLog_resource_resourceId_idx" ON "AuditLog"("resource", "resourceId");
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");

-- =============================================================
-- EVIDENCE CACHE (외부 API 비용 절감 — Phase 1+)
-- =============================================================
CREATE TABLE "EvidenceCache" (
  "id"        TEXT PRIMARY KEY,
  "placeId"   TEXT NOT NULL,
  "platform"  TEXT NOT NULL,
  "data"      JSONB NOT NULL,
  "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "EvidenceCache_placeId_platform_key" ON "EvidenceCache"("placeId", "platform");
CREATE INDEX "EvidenceCache_expiresAt_idx" ON "EvidenceCache"("expiresAt");

-- =============================================================
-- 시스템 유저 (사이클 5b-1 한정 — 인증 도입 전 ownerId 필드 충족용)
-- 카카오 OAuth(사이클 11)에서 실제 유저로 마이그레이션.
-- =============================================================
INSERT INTO "User" ("id", "name", "createdAt", "updatedAt")
VALUES ('system-owner-pqc', 'System Owner (cycle 5b-1 임시)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
