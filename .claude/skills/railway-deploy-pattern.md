# Skill S-10: Railway Deploy Pattern (Railway 배포 패턴)

> **스킬 유형**: 인프라
> **핵심**: Railway에서 Next.js + Prisma + PostgreSQL 안전 배포
> **사용 에이전트**: T15 DevOps Engineer

## 결정 (ADR-005)

| 결정 | 값 |
|------|------|
| 호스팅 | Railway |
| Web 서비스 | Next.js 14 (Node 20) |
| DB | PostgreSQL 16 |
| 캐시 (선택) | Redis |
| 배포 트리거 | GitHub main 머지 |
| 마이그레이션 | `prisma migrate deploy` (start 명령에서) |

## 프로젝트 구성

```
Railway Project: traveldiary-mvp
├── Service: web
│   ├── Build: npm install && npx prisma generate && npm run build
│   ├── Start: npx prisma migrate deploy && npm start
│   ├── Healthcheck: GET /api/health
│   ├── Port: $PORT (Railway 자동)
│   └── Auto Deploy: on (main 브랜치)
├── Service: postgres
│   ├── Image: postgres:16
│   ├── Volume: pgdata (persistent)
│   └── Backup: Railway 자동 (일일)
└── (선택) Service: redis
    ├── Image: redis:7
    └── Volume: redisdata
```

## package.json 스크립트

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "postinstall": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:deploy": "prisma migrate deploy",
    "db:studio": "prisma studio"
  }
}
```

> **`postinstall`로 prisma generate 자동화** — Railway 빌드 안정화.

## 환경변수 (Railway Variables)

### 필수

```
DATABASE_URL=                # postgres 서비스에서 자동 주입 (Reference)
NODE_ENV=production
NEXT_PUBLIC_APP_URL=
```

### 외부 API (T16 Security와 협업)

```
GOOGLE_PLACES_API_KEY=
GOOGLE_DIRECTIONS_API_KEY=
GOOGLE_VISION_CREDENTIALS=   # Base64 JSON
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=
KLOOK_API_KEY=
KLOOK_SECRET=
ANTHROPIC_API_KEY=
```

### 인증

```
JWT_SECRET=                  # 32자+ 랜덤
SESSION_SECRET=
```

> `.env.example`과 항상 동기화. 추가 시 양쪽 모두 갱신.

## 헬스체크

```typescript
// app/api/health/route.ts
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const checks: Record<string, 'ok' | 'fail'> = {};
  
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'ok';
  } catch {
    checks.database = 'fail';
  }
  
  // 외부 API는 옵션 (의존성 너무 강하면 위험)
  
  const allOk = Object.values(checks).every(v => v === 'ok');
  return NextResponse.json(
    { status: allOk ? 'healthy' : 'degraded', checks, timestamp: new Date().toISOString() },
    { status: allOk ? 200 : 503 }
  );
}
```

> Railway healthcheck로 등록 → 503 시 자동 재시작.

## CI/CD (.github/workflows/ci.yml)

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npx prisma generate
      - run: npx tsc --noEmit
      - run: npx eslint .
      - run: npm test
      - run: npm run build
        env:
          DATABASE_URL: postgresql://test:test@localhost/test  # build-time only
```

> Railway는 main push 시 자동 배포. CI는 검증만.

## 마이그레이션 배포 절차

```
1. PR에서 마이그레이션 SQL 검토 (T14 + T13)
2. CTO 사인오프 (S-18)
3. PR 머지 → CI 통과
4. Railway 자동 배포 시작:
   - Build: npm install (postinstall: prisma generate)
   - Start: prisma migrate deploy && npm start
5. Healthcheck 모니터링 (5분)
6. 이상 시 롤백
```

### 롤백 전략

```bash
# 1. 코드 롤백 (Git revert)
git revert <commit-sha>
git push origin main          # Railway 재배포

# 2. 마이그레이션 롤백 (필요 시)
# Prisma는 자동 down 마이그레이션 생성 안 함
# → 새 "revert" 마이그레이션 작성
npx prisma migrate dev --create-only --name revert_<original>
# (수동으로 reverse SQL 작성)
```

> **데이터 손실 가능 롤백은 R1 CTO 사인오프 필수.**

## 커스텀 도메인

```
1. Railway Dashboard → Custom Domain 추가
2. CNAME 또는 A 레코드 등록 (도메인 등록 사이트)
3. Railway가 자동으로 SSL 인증서 발급 (Let's Encrypt)
4. NEXT_PUBLIC_APP_URL 갱신
```

## 모니터링 설정

| 항목 | Railway 기본 | 추가 도구 |
|------|-------------|----------|
| Logs | Railway Logs | (스트리밍 보관 시 별도) |
| Metrics | CPU/메모리/네트워크 | (자체 메트릭 도입 시 자체) |
| Errors | (별도) | Sentry |
| Uptime | Healthcheck | UptimeRobot |
| 비용 | Railway Billing | (월 예산 알림) |

## 비용 최적화

```
1. 인스턴스 크기 적정화 (시작은 Hobby Plan)
2. Auto Sleep 비활성화 (사용자 경험 우선)
3. DB 백업 보존 30일 (기본)
4. 외부 API 캐시 적극 활용 (S-11 + EvidenceCache)
5. 빌드 캐시 활용 (npm ci 자동)
```

## 안티 패턴

```
❌ Railway에서 직접 npm 명령어 실행 (CLI 의존)
✅ package.json 스크립트로 추상화

❌ DATABASE_URL 하드코딩
✅ Reference Variable 사용 (Railway가 자동 주입)

❌ prisma db push 사용
✅ prisma migrate deploy

❌ build에서 마이그레이션
✅ start에서 마이그레이션 (롤백 가능성)

❌ 환경변수를 .env.production에 커밋
✅ Railway Variables에만 (Repo는 .env.example만)
```

## 배포 체크리스트 (T15)

```
□ CI 통과
□ T13 코드 리뷰 통과
□ T12 QA 통과
□ R1 CTO 사인오프 (변경 트리거 시)
□ 환경변수 동기화 (.env.example ↔ Railway)
□ 마이그레이션 SQL 검토 완료
□ Healthcheck 검증
□ 배포 후 5분 모니터링
□ AuditLog 정상 기록 확인
```

## 파일 위치

`c:\Projects\traveldiary-mvp\.claude\skills\railway-deploy-pattern.md`
