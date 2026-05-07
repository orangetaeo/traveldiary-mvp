-- E2: TripReview (여행 후기 DB 영속화)
CREATE TABLE "TripReview" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "actorId" TEXT,
    "rating" INTEGER NOT NULL DEFAULT 0,
    "text" VARCHAR(2000) NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TripReview_pkey" PRIMARY KEY ("id")
);

-- E3: TripPhoto (여행 사진 앨범)
CREATE TABLE "TripPhoto" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "actorId" TEXT,
    "url" VARCHAR(500) NOT NULL,
    "caption" VARCHAR(200),
    "dayIndex" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TripPhoto_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "TripReview_tripId_idx" ON "TripReview"("tripId");
CREATE INDEX "TripReview_actorId_idx" ON "TripReview"("actorId");
CREATE UNIQUE INDEX "TripReview_tripId_actorId_key" ON "TripReview"("tripId", "actorId");

CREATE INDEX "TripPhoto_tripId_dayIndex_idx" ON "TripPhoto"("tripId", "dayIndex");
CREATE INDEX "TripPhoto_actorId_idx" ON "TripPhoto"("actorId");

-- Foreign keys
ALTER TABLE "TripReview" ADD CONSTRAINT "TripReview_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TripReview" ADD CONSTRAINT "TripReview_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TripPhoto" ADD CONSTRAINT "TripPhoto_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TripPhoto" ADD CONSTRAINT "TripPhoto_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
