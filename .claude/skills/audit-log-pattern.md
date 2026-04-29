# Skill S-13: Audit Log Pattern (감사 로그 패턴) ⭐ 절대 규칙

> **스킬 유형**: 운영·품질 (절대 규칙)
> **핵심**: 모든 데이터 변경 API에 `writeAuditLog()`를 동시 구현
> **사용 에이전트**: 모든 변경 API 작성자 (T10, T14, R4, T13 검증)

## 절대 원칙

```
1. POST/PUT/PATCH/DELETE API는 반드시 writeAuditLog() 호출.
2. "나중에 추가"는 금지 — 동시 구현.
3. 누락은 T13 코드 리뷰에서 즉시 반려.
4. 새 API 추가 시 T12 QA Lead 체크리스트에 자동 포함.
```

## AuditLog 모델 (T14 정의 참조)

```prisma
model AuditLog {
  id         String   @id @default(cuid())
  actorId    String?  // 사용자 ID (시스템 액션 시 null)
  action     String   // "trip.create" | "itinerary.update" | "replan.commit"
  resource   String   // "Trip" | "ItineraryItem" | ...
  resourceId String
  before     Json?
  after      Json?
  metadata   Json?
  createdAt  DateTime @default(now())
  
  @@index([resource, resourceId])
  @@index([actorId, createdAt])
  @@index([action, createdAt])
}
```

## writeAuditLog 유틸

```typescript
// lib/audit-log.ts

import { prisma } from './prisma';

export interface AuditLogInput {
  actorId?: string;
  action: string;        // "도메인.동작" — 예: "trip.create"
  resource: string;      // 모델명 — 예: "Trip"
  resourceId: string;
  before?: unknown;
  after?: unknown;
  metadata?: Record<string, unknown>;
}

export async function writeAuditLog(input: AuditLogInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: input.actorId,
        action: input.action,
        resource: input.resource,
        resourceId: input.resourceId,
        before: input.before as any,
        after: input.after as any,
        metadata: input.metadata as any,
      },
    });
  } catch (err) {
    // 감사 로그 실패는 비즈니스 로직을 막지 않는다 — but 알림은 보낸다
    console.error('[AuditLog] write failed', err, input);
    // 모니터링 채널로 전송 (T15)
  }
}
```

## 적용 패턴

### 1. CREATE

```typescript
async function createTrip(input: CreateTripInput, userId: string) {
  const trip = await prisma.trip.create({ data: input });
  
  await writeAuditLog({
    actorId: userId,
    action: 'trip.create',
    resource: 'Trip',
    resourceId: trip.id,
    after: trip,
  });
  
  return trip;
}
```

### 2. UPDATE

```typescript
async function updateTrip(id: string, patch: UpdateTripInput, userId: string) {
  const before = await prisma.trip.findUniqueOrThrow({ where: { id } });
  const after = await prisma.trip.update({ where: { id }, data: patch });
  
  await writeAuditLog({
    actorId: userId,
    action: 'trip.update',
    resource: 'Trip',
    resourceId: id,
    before,
    after,
  });
  
  return after;
}
```

### 3. DELETE (Soft Delete 권장)

```typescript
async function deleteTrip(id: string, userId: string) {
  const before = await prisma.trip.findUniqueOrThrow({ where: { id } });
  
  // soft delete — 실제로는 status='deleted'
  const after = await prisma.trip.update({
    where: { id },
    data: { status: 'deleted', deletedAt: new Date() },
  });
  
  await writeAuditLog({
    actorId: userId,
    action: 'trip.delete',
    resource: 'Trip',
    resourceId: id,
    before,
    after,
  });
}
```

### 4. 시스템 액션 (모드 전환 등)

```typescript
async function autoTransitionMode(tripId: string, newMode: TravelMode) {
  const before = await prisma.trip.findUniqueOrThrow({ where: { id: tripId } });
  const after = await prisma.trip.update({
    where: { id: tripId },
    data: { currentMode: newMode },
  });
  
  await writeAuditLog({
    actorId: null, // 시스템
    action: 'trip.mode_transition',
    resource: 'Trip',
    resourceId: tripId,
    before: { mode: before.currentMode },
    after: { mode: newMode },
    metadata: { trigger: 'auto', detectedBy: 'd-day-and-location' },
  });
}
```

### 5. Live Replan 커밋

```typescript
async function commitReplan(tripId: string, optionId: string, userId: string) {
  const before = await loadDAG(tripId);
  const after = await applyReplanOption(tripId, optionId);
  
  await writeAuditLog({
    actorId: userId,
    action: 'replan.commit',
    resource: 'Trip',
    resourceId: tripId,
    before: { dag: before },
    after: { dag: after },
    metadata: { optionId, optionType: 'recommend' },
  });
}
```

## 액션 명명 규칙

```
형식: <리소스>.<동작>[.<상세>]

예시:
- trip.create
- trip.update
- trip.delete
- trip.mode_transition
- itinerary.create
- itinerary.update
- itinerary.reorder
- replan.options_generated
- replan.commit
- evidence.gathered
- validation.completed
- auth.login
- auth.logout
```

## 메타데이터 표준 필드

```typescript
metadata: {
  // 항상 포함
  ip?: string;            // 사용자 IP (해시화 권장)
  userAgent?: string;
  
  // 액션별
  trigger?: string;       // 'manual' | 'auto' | 'webhook'
  source?: string;        // 'web' | 'api' | 'cron'
  duration?: number;      // 처리 시간 (ms)
  
  // 도메인별
  optionId?: string;      // Live Replan
  reason?: string;        // 변경 사유
}
```

## 점검 체크리스트 (T13 코드 리뷰)

새 API/Server Action 작성 시:

- [ ] 변경 동작인가? (POST/PUT/PATCH/DELETE)
- [ ] `writeAuditLog()` 호출됨
- [ ] action 이름 규칙 준수
- [ ] before/after 적절히 캡처
- [ ] actorId 또는 명시적 null
- [ ] metadata에 trigger 표시
- [ ] try/catch로 감사 로그 실패가 비즈니스 로직 막지 않음

## 조회 패턴 (디버깅 시)

```typescript
// 특정 Trip의 모든 변경 이력
const logs = await prisma.auditLog.findMany({
  where: { resource: 'Trip', resourceId: tripId },
  orderBy: { createdAt: 'desc' },
});

// 사용자 활동 추적
const userLogs = await prisma.auditLog.findMany({
  where: { actorId: userId },
  orderBy: { createdAt: 'desc' },
  take: 100,
});
```

## 보존 정책

| 액션 카테고리 | 보존 기간 |
|--------------|----------|
| 일반 CRUD | 1년 |
| 인증/보안 | 3년 |
| 모드 전환·Replan | 1년 |
| 시스템 액션 | 6개월 |

## 파일 위치

`c:\Projects\traveldiary-mvp\.claude\skills\audit-log-pattern.md`
