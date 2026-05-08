-- TripPhoto.url: VARCHAR(500) → TEXT
--
-- 이유: 갭 2 — 사진 추가 시 파일 선택(클라이언트 압축 → base64 data URL 저장).
-- base64 data URL은 사진 1장당 ~200~400KB → VARCHAR(500) 초과로 저장 불가.
-- TEXT는 VARCHAR(500)의 superset이라 비파괴 변환 (기존 데이터 손실 0).

ALTER TABLE "TripPhoto" ALTER COLUMN "url" SET DATA TYPE TEXT;
