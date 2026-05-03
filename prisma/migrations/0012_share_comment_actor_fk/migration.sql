-- Migration 0012 — ShareComment.actorId User FK (ADR-038, 사이클 HH)
-- 사이클 GG (319991a)에서 createCommentAction에 getActorId() 주입 + P2003 fallback 사전 wiring 완료.
-- 트리거 ② 라이브 actorId 매핑 동작 + 트리거 ③ orphan=0 검증 후 적용.
--
-- 사전 점검 SQL (Railway shell psql 또는 마이그 직전):
--   SELECT COUNT(*) FROM "ShareComment"
--   WHERE "actorId" IS NOT NULL AND "actorId" NOT IN (SELECT id FROM "User");
-- 결과 0이어야 함. > 0이면 마이그 중단 + RCA ADR 신규 (R1 사인오프 조건).
--
-- ON DELETE SET NULL — 사용자 탈퇴 시 댓글 본문은 익명화되어 보존 (GDPR right-to-erasure 정합).
-- @@index([actorId]) — M7 본인 활동 (사이클 YY) 등 actorId 조회 경로 사전 인덱스.

ALTER TABLE "ShareComment"
  ADD CONSTRAINT "ShareComment_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "ShareComment_actorId_idx" ON "ShareComment"("actorId");
