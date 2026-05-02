-- Migration 0008 — ShareComment (ADR-036, 사이클 R)
-- 익명 댓글/리액션 협업. nickname + clientUuid 기반 (OAuth 미활성 시점에도 동작).
-- OAuth 활성 시 actorId 컬럼에 user.id 자연 매핑 (마이그 추가 없이).

CREATE TABLE "ShareComment" (
  "id"          TEXT NOT NULL,
  "shareLinkId" TEXT NOT NULL,
  "itemId"      TEXT,
  "nickname"    TEXT NOT NULL,
  "body"        VARCHAR(500) NOT NULL,
  "reaction"    TEXT,
  "clientUuid"  TEXT NOT NULL,
  "actorId"     TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt"   TIMESTAMP(3),

  CONSTRAINT "ShareComment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ShareComment_shareLinkId_idx" ON "ShareComment"("shareLinkId");
CREATE INDEX "ShareComment_clientUuid_idx" ON "ShareComment"("clientUuid");
CREATE INDEX "ShareComment_deletedAt_idx" ON "ShareComment"("deletedAt");

ALTER TABLE "ShareComment"
  ADD CONSTRAINT "ShareComment_shareLinkId_fkey"
  FOREIGN KEY ("shareLinkId") REFERENCES "ShareLink"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
