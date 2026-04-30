-- TravelDiary 마이그레이션 0004 — M7 ShareLink (ADR-024, 사이클 11a)

CREATE TABLE "ShareLink" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "syncKey" TEXT NOT NULL,
    "permission" TEXT NOT NULL DEFAULT 'view',
    "expiresAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "ShareLink_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ShareLink_syncKey_key" ON "ShareLink"("syncKey");
CREATE INDEX "ShareLink_syncKey_idx" ON "ShareLink"("syncKey");
CREATE INDEX "ShareLink_tripId_idx" ON "ShareLink"("tripId");

ALTER TABLE "ShareLink"
    ADD CONSTRAINT "ShareLink_tripId_fkey"
    FOREIGN KEY ("tripId") REFERENCES "Trip"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
