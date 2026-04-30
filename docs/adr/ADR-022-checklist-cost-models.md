---
id: ADR-022
title: ChecklistItem + CostEntry Prisma 모델 + 마이그레이션 0002
status: Accepted
date: 2026-04-30
decider: R1 CTO
proposer: T14 DB Architect + T8 Product Planner
related: ADR-013 (Prisma adapter + 마이그레이션 운영), v2 §4 신규 모델, S-13 audit log
---

# ADR-022: ChecklistItem + CostEntry 모델 + 마이그레이션 0002 (M6)

## 컨텍스트

- 사이클 6 합의 결과: M6 D-Day 체크리스트 + 비용 관리는 v2 신규 매직 모먼트.
- 사이클 1 init 마이그레이션 (0001_init_pqc) 이후 첫 마이그레이션.
- 5b-2 mutation 표준 패턴 + 5b-1 마이그레이션 운영 (start.sh `prisma migrate deploy && next start`) 인프라 위에 모델 추가.
- v2 비전 §4에 모델 정의 있음 — 그대로 채택.

## 결정

### A. 신규 의존성 0개

기존 Prisma 7 + adapter-pg 그대로 활용. 마이그레이션 SQL 수동 작성 (0001 답습).

### B. ChecklistItem 모델

```prisma
model ChecklistItem {
  id          String   @id @default(cuid())
  tripId      String
  trip        Trip     @relation(fields: [tripId], references: [id], onDelete: Cascade)

  category    String   // "documents" | "clothing" | "electronics" | "forbidden" | "declarable" | "custom"
  text        String
  dDayBucket  String   // "D-30" | "D-14" | "D-7" | "D-1" | "during" | "after"
  done        Boolean  @default(false)
  cityNote    String?  // 도시별 특이사항 (시드 City와 결합 시 표시)
  sortOrder   Int      @default(0)  // 같은 dDayBucket 내 정렬

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([tripId, dDayBucket])
  @@index([tripId, done])
}
```

**선택 결정**:
- `cityNote` 추가 (v2 §4 그대로) — 시드 City 데이터에서 컨텍스트 주입 시 사용
- `sortOrder` 추가 — 같은 버킷 내 사용자 정렬 가능
- Cascade onDelete — Trip 삭제 시 자동 정리

### C. CostEntry 모델

```prisma
model CostEntry {
  id              String   @id @default(cuid())
  tripId          String
  trip            Trip     @relation(fields: [tripId], references: [id], onDelete: Cascade)

  date            DateTime  // 결제 일자
  label           String

  amountKrw       Int       // 한국 원 — 사용자 멘탈 모델
  amountLocal     Json?     // { value: number, currency: string }
  // 환율은 city.payment.approxKrwRate 사용해 산출, fixed_rate 컬럼 X (분기 가치 약함)

  status          String    @default("planned")  // "paid" | "booked" | "planned"
  category        String?   // "food" | "transport" | "accommodation" | "shopping" | "activity" | "other"
  splitWith       Json?     // ["userId-1", ...] — 사이클 11 OAuth 후 활성

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([tripId, date])
  @@index([tripId, status])
}
```

**선택 결정**:
- `amountLocal`은 Json (동적 currency) — 별 컬럼화 시 currency normalize 부담
- `splitWith`은 사이클 11 OAuth 도입 후 활성. 9에선 single user 데모로 빈 배열
- `category`는 자유 입력 + 기본 enum 가이드 (UI에서 chip 추천)

### D. Trip 모델 양방향 relation 추가

```prisma
model Trip {
  // ... 기존
  checklistItems ChecklistItem[]
  costEntries    CostEntry[]
}
```

### E. 마이그레이션 0002_checklist_cost

```sql
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
    FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
    FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

라이브 배포 시 `start.sh`의 `prisma migrate deploy`로 자동 적용 (ADR-013 §H).

### F. AuditLog 액션 추가

`lib/audit-log.ts` AuditAction enum:
```
+ "checklist.add"
+ "checklist.update"
+ "checklist.delete"
+ "checklist.toggle"
+ "cost.add"
+ "cost.update"
+ "cost.delete"
```

### G. 데모 fallback (5b 답습)

```
isDbConnected === false || tripId === DEMO_TRIP_ID
  → action 결과 { ok:true, demo:true } 반환
  → 클라이언트 상태로만 시뮬 (ADR-012 Replan 패턴 답습 — 새로고침 시 시드 템플릿으로 리셋)
```

### H. 시드 정책

- **ChecklistItem 시드**: lib/seed/checklist-template.ts에 *읽기 전용 템플릿* 20+건. Trip 생성 시 자동 복제 X (사용자가 UI에서 "기본 템플릿 추가" 클릭 시 ChecklistItem 행 생성)
- **CostEntry 시드**: 0건. 모두 사용자 입력

이유: 체크리스트는 사용자별 반응이 다름 (이미 가지고 있는 짐, 사전 준비 등). 자동 복제 시 부담.

### I. mutation Server Action 표준 — 5b-2 답습

```typescript
// actions/checklist.ts
toggleChecklistItem({ itemId }) → DB 토글 + audit "checklist.toggle"
addChecklistItem({ tripId, category, text, dDayBucket, cityNote? }) → DB 생성 + audit "checklist.add"
deleteChecklistItem({ itemId }) → DB 삭제 + audit
addFromTemplate({ tripId }) → 템플릿 일괄 복제 + audit (각 1건)

// actions/cost.ts
addCostEntry({ tripId, label, amountKrw, amountLocal, ... }) → audit "cost.add"
updateCostEntry({ id, ... }) → audit "cost.update"
deleteCostEntry({ id }) → audit "cost.delete"
```

낙관적 동시성은 사이클 9에선 **미도입** (단일 사용자, 충돌 거의 없음). 사이클 11 OAuth 후 도입 검토.

## 대안

### 대안 1 — Prisma 미사용, localStorage만 (비채택)
- Trip별 격리 약함 (브라우저 저장)
- 멀티 디바이스 X
- 사이클 11 OAuth 후 마이그레이션 비용 큼

### 대안 2 — ChecklistItem 시드 자동 복제 (비채택)
- 사용자 부담 (이미 가진 짐도 체크리스트로 등장)
- "기본 템플릿 추가" 버튼이 멘탈 모델 좋음

### 대안 3 — splitWith 사이클 9에서 활성 (비채택)
- 단일 사용자 시점에 의미 X
- 사이클 11 OAuth 도입 후가 자연스러움

### 대안 4 — Stitch 화면 generate 먼저 (비채택)
- 미설계 + 시간 부담. 코드 직접 디자인 우선, Stitch 매핑은 9.5+ 후속

## 영향

### 긍정
- M6 매직 모먼트 활성 — 자유여행자 핵심 페인 (체크리스트 + 비용)
- 5b-2 mutation 표준 패턴 검증 (4번째 적용 사례)
- 마이그레이션 0002 — 5b-1 ADR-013 운영 정책 첫 후속 마이그레이션

### 부정
- 신규 마이그레이션 — Railway 배포 시 자동 적용. 다운타임 0 예상 (CREATE TABLE만)
- 시드 템플릿 콘텐츠 큐레이션 부담 (T8) — 약 20~25건

### 트레이드오프
- 자동 합계 미도입 — 사용자가 비용 입력 부담. 9.5+ 이후 itinerary.estimatedPrice 자동 import 검토.

## 사용자 직접 액션

```
없음 — Railway 자동 배포 + 자동 마이그레이션. 라이브 즉시 사용 가능.
```

## 검증 통과 기준 (STEP 4)

- [ ] `npx tsc --noEmit` 0
- [ ] `npx prisma generate` 통과 (모델 인식)
- [ ] `npx next build` 성공
- [ ] 로컬: DATABASE_URL 빈 칸 → /checklist/[demo-id] 시드 템플릿 노출, 토글 시 demo:true (회귀 0)
- [ ] 라이브: /api/health 후 마이그레이션 0002 자동 적용 → ChecklistItem/CostEntry 테이블 존재
- [ ] 라이브: /checklist/[trip-id]에서 "기본 템플릿 추가" → AuditLog "checklist.add" 적재 (each item)
- [ ] 라이브: 체크 토글 → AuditLog "checklist.toggle" 행
- [ ] 라이브: /cost에서 항목 추가 → AuditLog "cost.add" 행
- [ ] 라이브: Trip 삭제 시 ChecklistItem/CostEntry 자동 cascade 삭제 (별도 검증)

## 사인오프

R1 ✅ · T8 ✅ · T14 ✅ · T17 ✅ · T13 ✅
