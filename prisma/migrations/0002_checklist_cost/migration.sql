-- TravelDiary 마이그레이션 0002 — M6 ChecklistItem + CostEntry (ADR-022, 사이클 9)

-- ChecklistItem
CREATE TABLE "ChecklistItem" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "dDayBucket" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "cityNote" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChecklistItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ChecklistItem_tripId_dDayBucket_idx" ON "ChecklistItem"("tripId", "dDayBucket");
CREATE INDEX "ChecklistItem_tripId_done_idx" ON "ChecklistItem"("tripId", "done");

ALTER TABLE "ChecklistItem"
    ADD CONSTRAINT "ChecklistItem_tripId_fkey"
    FOREIGN KEY ("tripId") REFERENCES "Trip"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- CostEntry
CREATE TABLE "CostEntry" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "label" TEXT NOT NULL,
    "amountKrw" INTEGER NOT NULL,
    "amountLocal" JSONB,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "category" TEXT,
    "splitWith" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CostEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CostEntry_tripId_date_idx" ON "CostEntry"("tripId", "date");
CREATE INDEX "CostEntry_tripId_status_idx" ON "CostEntry"("tripId", "status");

ALTER TABLE "CostEntry"
    ADD CONSTRAINT "CostEntry_tripId_fkey"
    FOREIGN KEY ("tripId") REFERENCES "Trip"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
