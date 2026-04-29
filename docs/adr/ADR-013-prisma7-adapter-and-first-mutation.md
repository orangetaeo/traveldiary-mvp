---
id: ADR-013
title: Prisma 7 driver adapter (@prisma/adapter-pg) + 첫 mutation Server Action
status: Accepted
date: 2026-04-29
decider: R1 CTO
proposer: T14 DB Architect + R4 BE
supersedes: ADR-011 (보강)
---

# ADR-013: Prisma 7 driver adapter + prisma.config.ts + 첫 mutation

## 컨텍스트

- 사이클 5a까지는 ADR-009/011/012의 **데모 모드**로 동작 (DATABASE_URL 미설정, mutation 0건).
- 사용자 결정(사이클 6): "**5b 인프라를 먼저 튼튼히** → 7+ v2 기능".
- Prisma 7부터 `datasource.url` 미지원 → driver adapter 또는 `prisma.config.ts` 필수 (ADR-011에서 부분 결정 — schema에서만 url 제거).
- 첫 mutation을 도입해야 `writeAuditLog` 실호출 검증 가능.

## 결정

### A. 의존성 추가 (3개 — CTO 자동 승인 — 보안 패치 외 첫 의존성 확장)

```
@prisma/adapter-pg  ^7.8.0   (runtime — Prisma 7 PostgreSQL adapter)
pg                  ^8.20.0  (runtime — node-postgres 클라이언트)
@types/pg           ^8.20.0  (dev — 타입)
```

ADR-010 "사이클 1 의존성 0개"는 사이클 1 한정 정책. 5b부터는 명시적 ADR로 추가.

### B. `prisma.config.ts` 도입

Prisma migrate CLI가 connection을 사용할 때 URL을 읽는 진입점. schema.prisma는 provider만 보유.

```typescript
// prisma.config.ts
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
});
```

(별도 url 필드는 환경변수 `DATABASE_URL`에서 자동 인식)

### C. `lib/prisma.ts` 실 인스턴스화

```typescript
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

declare global { var __prisma: PrismaClient | undefined; }

function createClient(): PrismaClient | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null; // ADR-009 데모 모드 폴백 유지
  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma: PrismaClient | null =
  globalThis.__prisma ?? (globalThis.__prisma = createClient() ?? undefined) ?? null;
export const isDbConnected = prisma !== null;
```

→ `DATABASE_URL` 미설정 시 여전히 `null` → 시드 fallback. 라이브 환경에서만 실 인스턴스.

### D. 첫 마이그레이션

```
prisma/migrations/0001_init_pqc/migration.sql
```

사이클 1의 schema 그대로 PostgreSQL DDL로 변환. **데이터 손실 없음** (테이블 생성만).

### E. 첫 mutation Server Action

`actions/trip.ts`:
```typescript
"use server";

export async function createTripFromOnboarding(input): Promise<{ id: string }> {
  // 1. zod 검증 (사이클 5b-1 zod 도입 X — 사이클 5b-2에서. 지금은 타입만)
  // 2. prisma.trip.create — DB 미연결 시 demo trip ID 반환
  // 3. writeAuditLog({ action: "trip.create", ... }) 실호출
  // 4. revalidatePath / 리다이렉트
}
```

### F. 페이지 Server Component에서 DB-우선 조회

```typescript
// app/itinerary/[id]/page.tsx
const bundle = (await fetchTripFromDb(id)) ?? getDemoTrip(id);
if (!bundle) notFound();
```

→ DB에 있으면 DB 데이터, 없으면 시드 fallback. 데모 trip(`demo-trip-phu-quoc`)은 영구 시드 fallback 유지.

### G. /api/health 갱신

```typescript
db: prisma ? (await prisma.$queryRaw`SELECT 1` ? "ok" : "fail") : "demo"
```

DB 연결 실측 → degraded 시 503 반환 (Railway healthcheck 자동 재시작).

## 대안

### 대안 1 — driver adapter 미채택, datasourceUrl만 사용 (비채택)
- Prisma 7는 `datasourceUrl` 옵션을 지원하지 않음(ADR-011 발견).

### 대안 2 — Prisma 6으로 다운그레이드 (비채택)
- ADR-004 위반. Prisma 7가 표준.

### 대안 3 — Drizzle 또는 Kysely로 변경 (비채택)
- ADR-004 통째로 뒤집음. 사이클 5b-1 범위 폭증.

### 대안 4 — 첫 mutation은 더 큰 것(예: replan.commit) (비채택)
- M3 Replan 클라이언트 시뮬과 결합 시 ADR-012 변경 필요. trip.create가 가장 단순.

## 영향

### 긍정
- 라이브 URL에서 사용자가 만든 여행이 DB에 저장됨 (M1~M4 시연을 사용자별로 분리 가능).
- writeAuditLog 실호출 — S-13 절대 규칙이 처음으로 실 동작.
- 사이클 5b-2(Geolocation·M2 자동), 5b-3(Vision·Claude·Naver), 7~12 기능들이 모두 이 인프라 위에 구축.

### 부정
- 신규 의존성 3개 — bundle size 증가(서버 측만, 클라이언트 미영향).
- 마이그레이션 운영 부담(롤백·다운타임) — 사이클 5b-1엔 init 1건만 → 부담 최소.

### 트레이드오프
- DB 연결 실패 시 페이지가 시드 fallback으로 돌아가 "데모"로 보임 — 사용자 멘탈 모델 보호용으로 `/api/health` `degraded` 분리.

## 사용자 직접 액션

```
1. Railway 대시보드 → divine-tranquility 프로젝트
2. + New → Database → Add PostgreSQL
3. (자동) Postgres 인스턴스 생성 + DATABASE_URL이 web 서비스에 reference로 주입
4. (자동) web 서비스 재배포 트리거
5. 첫 배포에서 `prisma migrate deploy`가 0001_init_pqc 마이그레이션 적용
   → start 명령에 `prisma migrate deploy && next start` 포함되도록 갱신 (이 ADR의 §H)
```

### H. 시작 명령 변경

`package.json` 또는 `railway.json`의 start command:

```diff
- "start": "next start"
+ "start": "prisma migrate deploy && next start"
```

→ 매 배포마다 미적용 마이그레이션이 자동 반영. 새 마이그레이션이 없으면 즉시 통과(no-op).

## 검증 통과 기준 (STEP 4)

- [ ] `npx tsc --noEmit` 0
- [ ] `npx prisma generate` 통과 (adapter 인식)
- [ ] `npx next build` 성공
- [ ] 로컬: `DATABASE_URL=` 빈 채 빌드/실행 → 데모 모드 정상 (회귀 0)
- [ ] 라이브: PostgreSQL 추가 후 자동 마이그레이션 → /api/health `database: "ok"`
- [ ] 첫 mutation: 온보딩 → "일정 만들기" → DB에 새 Trip + ItineraryItem 12개 + AuditLog 13개(trip 1 + itinerary 12) 적재 검증
- [ ] 데모 trip(`demo-trip-phu-quoc`) URL 회귀 0

## 사인오프

R1 ✅ · T14 ✅ · T15 ✅ · R4 ✅ · T16 ✅ · T13 ✅
