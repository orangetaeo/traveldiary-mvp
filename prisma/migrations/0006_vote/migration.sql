-- TravelDiary 마이그레이션 0006 — C4 Vote (사이클 E)

CREATE TABLE "Vote" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "decidedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Vote_tripId_status_idx" ON "Vote"("tripId", "status");

ALTER TABLE "Vote"
    ADD CONSTRAINT "Vote_tripId_fkey"
    FOREIGN KEY ("tripId") REFERENCES "Trip"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
