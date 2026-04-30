# Skill S-09: Prisma Schema Design (Prisma 7 스키마 설계)

> **스킬 유형**: 도메인·인프라
> **핵심**: Prisma 7 + PostgreSQL + DAG 영속화 패턴
> **사용 에이전트**: T14 DB Architect

## 핵심 결정 (CTO 게이트 통과 — ADR-006, ADR-011)

| 결정 | 값 | 이유 |
|------|------|------|
| ID | `cuid()` | 분산 환경 안전, 정렬 가능 |
| 시간 | `DateTime` (UTC 저장) | 다중 시간대 |
| JSON | `Json` (Evidence, ValidationResult) | 스키마 진화 유연성 |
| Soft delete | `deletedAt DateTime?` + 인덱스 | 복원 가능 |
| 관계 | 명시적 외래키 | 무결성 |
| 마이그레이션 | `prisma migrate dev/deploy` | (db push 금지) |
| **datasource URL** | **schema 밖** (PrismaClient 생성자 / `prisma.config.ts`) | **Prisma 7부터 schema 내 url 미지원 — ADR-011** |

## 전체 스키마 (초안 v1)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  // Prisma 7부터 url은 여기서 지정하지 않는다 — ADR-011.
  // PrismaClient 생성자에 datasourceUrl 또는 driver adapter로 주입한다.
}

// ═══════════════════════════════════════════
// USER
// ═══════════════════════════════════════════

model User {
  id          String   @id @default(cuid())
  
  email       String?  @unique
  kakaoId     String?  @unique
  name        String?
  
  preferences Json?    // UserPreferences 직렬화
  
  trips       Trip[]
  members     TripMember[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?
  
  @@index([deletedAt])
}

// ═══════════════════════════════════════════
// TRIP
// ═══════════════════════════════════════════

model Trip {
  id              String   @id @default(cuid())
  ownerId         String
  owner           User     @relation(fields: [ownerId], references: [id])
  
  destination     String
  destinationCode String   // "TYO" | "OSA" | "KYO"
  startDate       DateTime
  nights          Int
  
  companion       String   // "solo" | "friends" | "family" | "group"
  preferences     Json     // UserPreferences
  
  status          String   @default("draft") // "draft" | "confirmed" | "in-progress" | "completed"
  currentMode     String   @default("pre-travel")
  
  items           ItineraryItem[]
  members         TripMember[]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  deletedAt       DateTime?
  
  @@index([ownerId, status])
  @@index([startDate])
  @@index([deletedAt])
}

// ═══════════════════════════════════════════
// ITINERARY ITEM (DAG 노드)
// ═══════════════════════════════════════════

model ItineraryItem {
  id              String   @id @default(cuid())
  tripId          String
  trip            Trip     @relation(fields: [tripId], references: [id], onDelete: Cascade)
  
  dayIndex        Int
  scheduledAt     DateTime
  durationMinutes Int
  
  flexibility     String   // "fixed" | "flexible" | "booked"
  priority        Int      // 1~5
  flexMinutes     Int      @default(0)
  
  name            String
  category        String   // "food" | "spot" | "shopping" | "rest"
  
  locationLat     Float
  locationLng     Float
  locationAddress String
  
  estimatedPrice  Json?    // { amount, currency }
  bookingStatus   Json?    // { provider, bookingId, refundable }
  
  evidence        Json     // Evidence 직렬화
  
  // DAG 의존성 (인접 리스트)
  dependents      ItineraryDependency[] @relation("dependency")
  dependencies    ItineraryDependency[] @relation("dependent")
  
  validations     ValidationResult[]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([tripId, dayIndex])
  @@index([tripId, scheduledAt])
  @@index([category])
}

model ItineraryDependency {
  id           String        @id @default(cuid())
  dependentId  String
  dependencyId String
  dependent    ItineraryItem @relation("dependent", fields: [dependentId], references: [id], onDelete: Cascade)
  dependency   ItineraryItem @relation("dependency", fields: [dependencyId], references: [id], onDelete: Cascade)
  
  @@unique([dependentId, dependencyId])
  @@index([dependencyId])
}

// ═══════════════════════════════════════════
// VALIDATION (5단계 검증 결과)
// ═══════════════════════════════════════════

model ValidationResult {
  id                String        @id @default(cuid())
  itemId            String
  item              ItineraryItem @relation(fields: [itemId], references: [id], onDelete: Cascade)
  
  placeExists       Boolean
  operatingStatus   String        // "open" | "closed" | "temporary" | "unknown"
  bookingRequired   Boolean
  distanceVerified  Boolean
  priceVerified     Boolean
  
  validatedAt       DateTime      @default(now())
  
  @@index([itemId, validatedAt])
}

// ═══════════════════════════════════════════
// COLLABORATION
// ═══════════════════════════════════════════

model TripMember {
  id        String   @id @default(cuid())
  tripId    String
  userId    String
  trip      Trip     @relation(fields: [tripId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id])
  
  role      String   // "owner" | "editor" | "viewer"
  joinedAt  DateTime @default(now())
  
  @@unique([tripId, userId])
  @@index([userId])
}

// ═══════════════════════════════════════════
// AUDIT LOG (S-13 절대 규칙)
// ═══════════════════════════════════════════

model AuditLog {
  id         String   @id @default(cuid())
  
  actorId    String?
  action     String   // "trip.create" | "itinerary.update" | ...
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

// ═══════════════════════════════════════════
// EVIDENCE CACHE (외부 API 호출 비용 절감)
// ═══════════════════════════════════════════

model EvidenceCache {
  id           String   @id @default(cuid())
  placeId      String
  platform     String   // "naver" | "google" | "kakao" | "ota"
  
  data         Json     // 원본 응답
  
  fetchedAt    DateTime @default(now())
  expiresAt    DateTime
  
  @@unique([placeId, platform])
  @@index([expiresAt])
}
```

## DAG 영속화 패턴 (인접 리스트 채택)

### 왜 인접 리스트?

| 패턴 | 장점 | 단점 |
|------|------|------|
| **인접 리스트** (채택) | 무결성, 부분 조회, 외래키 제약 | 조인 비용 |
| 인접 JSON 배열 | 단일 row 조회 빠름 | 무결성 깨짐, 조회 어려움 |
| Recursive CTE | DB 네이티브 그래프 | 복잡, 캐시 어려움 |

### 의존성 조회

```typescript
// 한 일정의 모든 의존성 (선행 노드)
const item = await prisma.itineraryItem.findUnique({
  where: { id: itemId },
  include: { dependencies: { include: { dependency: true } } },
});

const dependencies = item.dependencies.map(d => d.dependency);
```

### 의존성 추가

```typescript
await prisma.itineraryDependency.create({
  data: { dependentId: 'B', dependencyId: 'A' }, // B depends on A
});
```

## Prisma 7 datasource 위치 변경 (ADR-011 + 사이클 5b-1)

> **Prisma 6 → 7 핵심 차이**: schema의 `datasource db { url }`이 미지원. **두 곳에 적어야 함**:
> 1. **`prisma.config.ts`** — migrate / introspect CLI용 (없으면 P0?? 에러)
> 2. **PrismaClient 생성자 (driver adapter)** — 런타임용

### prisma.config.ts (CLI용)

```typescript
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
```

→ 빠지면 `prisma migrate deploy` 시 **"The datasource.url property is required in your Prisma config file"** 에러.

### lib/prisma.ts (런타임용)



```typescript
// lib/prisma.ts (사이클 2 mutation 도입 시점)
import type { PrismaClient } from "@prisma/client";
// adapter 패턴 (driver adapter 사용 시)
//   import { PrismaClient } from "@prisma/client";
//   import { PrismaPg } from "@prisma/adapter-pg";
//   const prisma = new PrismaClient({
//     adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
//   });
```

Migrate CLI는 `prisma.config.ts`에서 url을 읽는다:

```typescript
// prisma.config.ts (사이클 2부터)
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  // migrate가 connection을 사용하는 시점부터 추가
});
```

## 마이그레이션 절차

```bash
# 1. 스키마 변경
# (schema.prisma 수정)

# 2. 마이그레이션 생성 (검토만)
npx prisma migrate dev --create-only --name <name>

# 3. SQL 검토 (T14 + T13)
cat prisma/migrations/<timestamp>_<name>/migration.sql

# 4. CTO 사인오프 (S-18)

# 5. 로컬 적용
npx prisma migrate dev

# 6. 스테이징/프로덕션은 자동 (T15)
npx prisma migrate deploy
```

## 인덱스 전략

| 인덱스 | 사용 쿼리 |
|--------|----------|
| `Trip[ownerId, status]` | 사용자 일정 목록 |
| `Trip[startDate]` | 다가오는 여행 |
| `ItineraryItem[tripId, dayIndex]` | 일자별 일정 |
| `ItineraryItem[tripId, scheduledAt]` | 시간순 조회 |
| `ItineraryDependency[dependencyId]` | 역방향 의존성 (영향 범위) |
| `AuditLog[resource, resourceId]` | 엔티티 변경 이력 |
| `EvidenceCache[expiresAt]` | 만료 캐시 정리 |

## 안티 패턴 (T13 리뷰에서 잡음)

```
❌ findMany().forEach(async ...) → N+1
✅ findMany({ include: { ... } })

❌ raw SQL 직접 실행 (`prisma.$queryRaw`)
✅ Prisma Client API 우선

❌ JSON 컬럼에 핵심 쿼리 조건 저장
✅ 자주 쿼리되는 필드는 컬럼으로 추출

❌ `deletedAt`만 있고 인덱스 없음
✅ deletedAt 인덱스 + 모든 쿼리에 `where deletedAt: null`

❌ Cascade 없이 부모 삭제 → 고아 row
✅ `onDelete: Cascade` 또는 명시적 정리
```

## Repository 패턴 (선택)

복잡한 쿼리는 별도 함수로:

```typescript
// lib/repositories/trip.repository.ts

export const tripRepo = {
  async findActiveByOwner(ownerId: string) {
    return prisma.trip.findMany({
      where: { ownerId, deletedAt: null, status: { not: 'completed' } },
      include: { items: { orderBy: { scheduledAt: 'asc' } } },
      orderBy: { startDate: 'asc' },
    });
  },
  
  async createWithItems(input: CreateTripInput) {
    return prisma.$transaction(async tx => {
      const trip = await tx.trip.create({ data: { /* ... */ } });
      // items 일괄 생성
      // dependencies 추가
      // AuditLog 작성
      return trip;
    });
  },
};
```

## 파일 위치

`c:\Projects\traveldiary-mvp\.claude\skills\prisma-schema-design.md`
