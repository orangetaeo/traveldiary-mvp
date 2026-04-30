-- TravelDiary 마이그레이션 0003 — ItineraryItem.photos (ADR-023, 사이클 7)
-- A3 이미지 시각 정체성. 기존 행은 빈 배열로 자동 채움. 다운타임 0.

ALTER TABLE "ItineraryItem"
    ADD COLUMN "photos" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
