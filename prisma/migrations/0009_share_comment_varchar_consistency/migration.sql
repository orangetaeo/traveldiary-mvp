-- Migration 0009 — ShareComment VarChar 일관성 (사이클 U)
-- validateBody 200자 / validateNickname 10자와 DB 컬럼 한도를 정합화.
-- worst-case HTML escape 부풀림(1자 → 최대 5자) 고려해서 5배 여유 마진.
-- 사이클 R(0008) 직후라 실데이터 영향 없음(축소도 안전).

ALTER TABLE "ShareComment"
  ALTER COLUMN "nickname" TYPE VARCHAR(50);

ALTER TABLE "ShareComment"
  ALTER COLUMN "body" TYPE VARCHAR(1000);
