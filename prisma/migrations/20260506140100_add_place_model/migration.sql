-- CreateTable
CREATE TABLE "Place" (
    "id" TEXT NOT NULL,
    "googlePlaceId" TEXT,
    "cityCode" VARCHAR(10) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "nameLocal" VARCHAR(200),
    "category" TEXT NOT NULL,
    "subCategory" TEXT,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "address" VARCHAR(500) NOT NULL,
    "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rating" DOUBLE PRECISION,
    "userRatingsTotal" INTEGER,
    "priceLevel" INTEGER,
    "estimatedPrice" JSONB,
    "evidence" JSONB NOT NULL,
    "qualityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "zone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "defaultDurationMinutes" INTEGER NOT NULL DEFAULT 60,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Place_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Place_googlePlaceId_key" ON "Place"("googlePlaceId");

-- CreateIndex
CREATE INDEX "Place_cityCode_category_idx" ON "Place"("cityCode", "category");

-- CreateIndex
CREATE INDEX "Place_cityCode_qualityScore_idx" ON "Place"("cityCode", "qualityScore");

-- CreateIndex
CREATE INDEX "Place_isActive_idx" ON "Place"("isActive");
