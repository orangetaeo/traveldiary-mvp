---
id: ADR-045
title: TT 다중 사용자 격리 — ChecklistItem.actorId NULLABLE 시범 도입
status: Accepted (2026-05-03, cycle TT)
date: 2026-05-03
decider: R1 CTO
proposer: T14 DB + T16 Security + T13 Code Reviewer + T18 Self-Evolution
related: ADR-022 (Checklist/Cost 모델), ADR-026 (카카오 OAuth), ADR-038 (ShareComment.actorId FK 분리 사이클), ADR-039 (E1 Settlement)
---

# ADR-045: ChecklistItem.actorId NULLABLE 시범 도입 (사이클 TT)

## 컨텍스트

사이클 R(ADR-036)에서 ShareComment에 `actorId String?`을 도입했고, GG/HH(ADR-038)에서 wiring → FK 마이그를 분리 사이클로 적용하여 사용자 액션 +0을 달성했다. 이 패턴을 ChecklistItem/CostEntry/Vote에도 확장하려는 요구가 사이클 KK 회고 백로그에 등록되었다.

**현 상태 (2026-05-03)**:
- `ChecklistItem`, `CostEntry`: `actorId` 컬럼 부재. 누가 만든/수정한 row인지 추적 불가
- `Vote`: `createdBy String?` (FK 없음, ShareLink와 동일 패턴)
- `canWriteTrip`: trip-level만 — `Trip.ownerId === actorId` 일치 시 통과. 미인증 → legacy 통과, DEMO_TRIP_ID → 항상 통과
- 카카오 OAuth는 사용자 액션 대기 중 (미활성) → 실제 actorId는 거의 항상 null

**핵심 질문**: actorId 컬럼을 미리 도입할 가치가 있는가? OAuth 미활성 시점에서는 컬럼이 항상 null이라 "가짜 추상화" 우려.

## 결정

**ChecklistItem만 actorId NULLABLE 컬럼 시범 도입. CostEntry/Vote는 후속 사이클(트리거 충족 시).**

### 결정 매트릭스

| 결정 | 선택 | 근거 |
|---|---|---|
| **D1 마이그 범위** | A2 — ChecklistItem만 | 1 모델 시범으로 회귀 부담 ↓. 답습 검증 후 CostEntry/Vote 확장. 사이클 UU(`feedback_v3_trigger_partial_adoption`) 답습 |
| **D2 actorId NULL 정책** | A — NULLABLE 유지 | legacy/DEMO_TRIP_ID 호환. SYSTEM_OWNER_ID backfill은 가짜 의미 부여 + rollback 부담 |
| **D3 격리 수준** | A — trip-level 유지 | `canWriteTrip` ownerId 게이트로 충분. row-level 격리는 OAuth GA 후 트리거 충족 시 분리 사이클 |
| **D4 soft delete** | C — 미도입 | 트리거 없음. `auditLog.before` 스냅샷으로 복구 가능 (사이클 JJ 답습) |
| **D5 DEMO_TRIP_ID 정책** | A — 그대로 통과 + actorId=null 강제 | 시드 시연 보호 절대 규칙. write 차단은 데모 회귀 위험 |
| **D6 Vote.createdBy FK** | B — deferred | ADR-038 트리거 답습. OAuth 활성 + 첫 매핑 검증 후 별도 사이클 |

### 분리 사이클 정책 — TT는 1 PR

ADR-038 GG/HH는 컬럼이 R 사이클에 이미 존재한 후 wiring(GG)+FK(HH) 분리. TT는 **컬럼 자체가 미존재**이므로 wiring과 마이그를 분리하면 사용자 액션이 2회로 분리(타입 안정성 위반 우려). 1 모델로 좁혔으므로 마이그 + repository 시그니처 + actions wiring + 회귀 테스트를 **단일 PR**로 통합.

CostEntry/Vote 확장은 **TT-2** 사이클로 분리(트리거 ②③ 충족 시):
- 트리거 ②: ChecklistItem.actorId 라이브 매핑 동작 검증 (OAuth 활성 후)
- 트리거 ③: orphan=0 사전 점검 (`SELECT COUNT(*) FROM "ChecklistItem" WHERE "actorId" NOT IN (SELECT id FROM "User")`)

## 마이그 0013 SQL

```sql
-- Migration 0013 — ChecklistItem.actorId NULLABLE + FK + INDEX (사이클 TT, ADR-045)
-- ADR-038/마이그 0012 답습: ON DELETE SET NULL ON UPDATE CASCADE.
-- 신규 컬럼 NULLABLE 추가 → 기존 row 영향 0 → 사전 점검 SQL 불필요.
-- Railway start.sh가 prisma migrate deploy로 자동 적용 → 사용자 액션 +0.

ALTER TABLE "ChecklistItem" ADD COLUMN "actorId" TEXT;

ALTER TABLE "ChecklistItem"
  ADD CONSTRAINT "ChecklistItem_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "ChecklistItem_actorId_idx" ON "ChecklistItem"("actorId");
```

### Schema 동시 갱신

```prisma
model ChecklistItem {
  // ... 기존 필드 ...
  /** 사이클 TT (ADR-045) — 작성자 user.id. OAuth 활성 후 매핑. NULL = legacy/DEMO/미인증. */
  actorId    String?
  actor      User?    @relation(fields: [actorId], references: [id], onDelete: SetNull)

  @@index([actorId])
}

model User {
  // ... 기존 ...
  checklistItems ChecklistItem[]
}
```

## 코드 wiring 범위

### lib/repositories/checklist.repository.ts
- `CreateChecklistInput`에 `actorId?: string | null` 추가
- `createChecklistItem` Prisma create.data에 `actorId` 전달
- `bulkCreateChecklistItems` 시그니처에 actorId 받아서 전달
- `toggleChecklistItem`/`moveChecklistItem`/`deleteChecklistItem`/`bulkToggle`/`bulkDelete` — **actorId 변경 불가** (생성 시점 actorId 보존)

### actions/checklist.ts
- `addChecklistItem` → `getActorId()` 호출 후 input에 주입
- `addFromTemplate` → `getActorId()` 호출 후 bulkCreate에 전달
- 다른 mutation은 변경 X (actorId는 생성 시점만 stamp, 이후 mutation은 audit log actorId만 사용)

### lib/types.ts
- `ChecklistItem` 인터페이스에 `actorId?: string | null` 추가

## 회귀 방어

| 시나리오 | 기대 동작 |
|---|---|
| 인증 사용자 addChecklistItem (일반 trip) | `row.actorId === user.id` + `audit.actorId === user.id` |
| 미인증 addChecklistItem | `row.actorId === null` + `audit.actorId === null` |
| **DEMO_TRIP_ID + 인증 사용자** | **`row.actorId === null` 강제 (시드 오염 차단, T12 STEP 4 발견)** + `audit.actorId === user.id` (감사 추적 보존) |
| DEMO_TRIP_ID + 미인증 | `row.actorId === null` + `audit.actorId === null` |
| addFromTemplate (인증, 일반 trip) | 모든 row `actorId === user.id` |
| addFromTemplate (DEMO_TRIP_ID + 인증) | 모든 row `actorId === null` (resolveActorIdForTrip 가드) |
| addFromTemplate (미인증) | 모든 row `actorId === null` |
| toggleChecklist 후 actorId | 변경 X (생성 시점 보존) |
| User 삭제 → ON DELETE SET NULL | row 보존 + actorId=null |

> **D5 가드 구현 — `lib/auth/actor-resolution.ts:resolveActorIdForTrip`** (별도 모듈 — Server Actions 파일은 async export만 허용):
> ```ts
> if (DEMO_TRIP_IDS.includes(tripId)) return null;
> return actorId;
> ```
> XX(ADR-044) 도입 후 DEMO trip이 DB에 영속화되므로 인증 사용자의 add 호출 시 시드 row가 user.id로 stamp되는 오염을 차단한다.
> audit log의 actorId는 sessionActorId 그대로 — 감사 추적은 시드 오염과 별개.

## 트리거 — 언제 TT-2 (CostEntry/Vote 확장) 작성?

**모두 충족 시**:
1. 사용자가 카카오 OAuth 활성 (`docs/12-user-actions.md` §B 7단계 완료)
2. 라이브에서 첫 카카오 사용자가 `addChecklistItem` 실행 → DB row의 `actorId === user.id` 매핑 확인
3. `SELECT COUNT(*) FROM "ChecklistItem" WHERE "actorId" IS NOT NULL AND "actorId" NOT IN (SELECT id FROM "User") = 0` (사전 점검 통과)

## 결과 (사이클 TT, 2026-05-03)

- 마이그 0013 적용 — ChecklistItem.actorId 컬럼 + FK + INDEX
- `lib/repositories/checklist.repository.ts` 시그니처 진화 (`feedback_helper_evolution_options_pattern` 답습)
- `actions/checklist.ts` 2 함수에 `getActorId()` 주입 (addChecklistItem, addFromTemplate)
- `lib/types.ts` ChecklistItem 인터페이스 확장
- 회귀 테스트 +N건 (actorId stamp 정확성 + NULL 호환성 + 격리 위반 차단)
- 사용자 액션 +0 (Railway start.sh 자동 마이그, `feedback_railway_auto_migration` 답습)

## 후속 사이클 백로그

- **TT-2**: CostEntry.actorId + Vote.actorId 확장 (3 모델 동형화). 트리거 충족 시
- **TT-3**: row-level 격리 게이트 (`canWriteTripResource(tripId, resource)` 시그니처 변경 + actorId === user OR Trip.ownerId 패턴). OAuth GA 후
- **단일 사용자 모드 fallback 제거 ADR**: `canWriteTrip`의 "actorId null이면 통과" 분기 제거. OAuth GA 사이클 동시 진행 (T16 백로그)
