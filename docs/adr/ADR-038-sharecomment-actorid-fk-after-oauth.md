---
id: ADR-038
title: ShareComment.actorId User FK 마이그 — OAuth 활성 후 적용 정책
status: Accepted (2026-05-03, cycle HH)
date: 2026-05-03
decider: R1 CTO
proposer: T14 DB + T16 Security
related: ADR-026 (카카오 OAuth), ADR-036 (익명 협업), 마이그 0008, 마이그 0012
---

# ADR-038: ShareComment.actorId User FK 정책 (사이클 GG/HH 분리 적용)

## 컨텍스트

사이클 R(ADR-036, 마이그 0008)에서 ShareComment 모델에 `actorId String?` 컬럼을 도입했다. **목적**: 카카오 OAuth 활성 후 자연 통합 — 익명 댓글(`clientUuid`) 우선, OAuth 로그인 사용자는 `actorId`에 user.id 매핑.

**현 시점**: 카카오 OAuth가 사용자 액션 대기 중 → `actorId`는 모든 댓글에서 null. FK 추가는 데이터 영향 0이지만 의미도 0.

**핵심 질문**: OAuth 활성 전에 FK를 미리 걸어두는 것이 가치 있는가, 아니면 활성 후에만 적용해야 하는가.

## 결정

**Deferred — OAuth 활성 직후에 적용. 지금은 SQL 초안만 본 ADR에 보존.**

### 근거

1. **사용자 액션 부담**: 마이그 0010까지 이미 누적 4건(0007/0008/0009/0010) 대기 중. 0011 추가는 사용자 부담 증가 + OAuth 활성 직전에 일괄 적용이 더 깔끔
2. **검증 가치**: OAuth 활성 후 첫 카카오 사용자 댓글 작성 → actorId가 정상 user.id로 채워지는지 동작 검증 → FK 추가 → 무결성 보장. 순서를 뒤집으면 활성 직후 회귀 추적 어려움
3. **Rollback 안정성**: FK constraint 추가 후 데이터 손실은 없으나 제거 시 `pg_dump` 사전 백업 권장 — 이는 OAuth 활성 시 함께 안내가 더 자연스러움

## SQL 초안 (활성 시 사용)

```sql
-- Migration 0011 — ShareComment.actorId User FK (사용자 OAuth 활성 직후)
-- 사전 점검: SELECT COUNT(*) FROM "ShareComment" WHERE "actorId" IS NOT NULL AND "actorId" NOT IN (SELECT id FROM "User");
-- 결과 > 0이면 데이터 정합성 문제 — FK 적용 전 정리 필요(actorId NULL로 set 또는 row 삭제)

ALTER TABLE "ShareComment"
  ADD CONSTRAINT "ShareComment_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "ShareComment_actorId_idx" ON "ShareComment"("actorId");
```

### Schema 동시 갱신

```prisma
model ShareComment {
  // ... 기존 ...
  actorId    String?
  actor      User?     @relation(fields: [actorId], references: [id], onDelete: SetNull)

  @@index([actorId])
}

model User {
  // ... 기존 ...
  shareComments ShareComment[]
}
```

## 트리거 — 언제 0011 마이그 작성?

**모두 충족 시**:
1. 사용자가 카카오 OAuth 활성 (`docs/12-user-actions.md` §B 7단계 완료)
2. 라이브에서 첫 카카오 로그인 사용자가 댓글 1건 이상 작성 → `actorId`에 user.id 매핑 동작 확인
3. `SELECT COUNT(*) FROM "ShareComment" WHERE "actorId" IS NOT NULL AND "actorId" NOT IN (SELECT id FROM "User") = 0` (정합성 사전 점검 통과)

## 결과

### 사이클 GG (2026-05-03, 319991a, PR #3)
- 옵션 A 1단계 — wiring only (마이그 X)
- `createCommentAction`/`deleteCommentAction`에 `getActorId()` 주입
- `canDeleteComment` 순수 함수 분리 — clientUuid OR actorId OR 게이트 (T16 OWASP A01)
- `createCommentRow` P2003 catch + actorId=null retry (HH FK race 사전 wiring)
- 회귀 6건 (OR 게이트 4 사분면 + null 우회 차단)
- 사용자 액션 +0

### 사이클 HH (2026-05-03, PR #4)
- 마이그 0012 적용 — FK + INDEX (위 §SQL 초안 그대로)
- schema.prisma 갱신 — `actor User?` 관계 + `User.shareComments[]` 백 관계 + `@@index([actorId])`
- T12 백로그 회귀 추가 — prisma mock P2003 throw → actorId=null retry 분기 검증
- 사용자 액션 +1 — 라이브 카카오 댓글 1건 + DB SELECT 2건 (orphan=0 사전 점검)
- ADR-038 status `Deferred` → `Accepted`

## 회귀 방어

- ADR-036 (익명 협업) 패턴은 그대로 — clientUuid 식별 우선
- OAuth 활성되어도 익명 댓글 흐름 유지 (`clientUuid`는 항상 채움, `actorId`는 옵션)
- FK 적용 후에도 actorId가 null인 익명 댓글 동작은 변함 없음
