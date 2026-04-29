---
id: ADR-011
title: Prisma 7 — datasource URL을 PrismaClient 생성자로 이전
status: Accepted
date: 2026-04-29
decider: R1 CTO
proposer: T14 DB Architect (사이클 1 STEP 4 검증 중 발견)
supersedes: ADR-004 (부분 — 기술 스택 결정은 유지, schema 표기 변경)
---

# ADR-011: Prisma 7 — datasource URL을 PrismaClient 생성자로 이전

## 컨텍스트

Prisma 7부터 `datasource db` 블록의 `url = env("DATABASE_URL")` 표기가 더 이상 지원되지 않는다 (P1012):

> The datasource property `url` is no longer supported in schema files.
> Move connection URLs for Migrate to `prisma.config.ts` and pass either
> `adapter` for a direct database connection or `accelerateUrl` for Accelerate
> to the `PrismaClient` constructor.

도서관의 S-09(prisma-schema-design.md)는 Prisma 6 패턴으로 작성되어 있어 사이클 1 generate 단계에서 검증 실패했다.

## 결정

1. `prisma/schema.prisma`의 datasource 블록에서 `url` 라인 제거.
2. `lib/prisma.ts`의 `new PrismaClient()` 호출에 `datasourceUrl: process.env.DATABASE_URL` 옵션 추가.
3. Prisma migrate를 사용하는 시점(사이클 2 이후)에는 `prisma.config.ts`를 추가하여 migrate CLI가 URL을 인식하도록 한다.
4. S-09 스킬 문서 갱신 (사이클 1 STEP 5 자가 진화에서 처리).

## 대안

### 대안 A — Prisma 6으로 다운그레이드
- 비채택. `package.json`은 이미 7.8.0이며 ADR-004가 Prisma 7을 채택했음.

### 대안 B — `prisma.config.ts` 즉시 도입
- 비채택. 사이클 1엔 migrate를 실행하지 않으므로 불필요. 사이클 2에서 mutation·migrate 도입 시 함께 결정.

### 대안 C — Driver Adapter 사용
- 비채택. PostgreSQL 직결만 필요한 사이클이라 과도한 결합.

## 영향

- 긍정: `prisma generate` 통과, lib/prisma.ts 타입 인식, 사이클 1 검증 진행 가능.
- 부정: migrate CLI는 `prisma.config.ts` 도입 전까진 별도 설정 필요. 사이클 2에 ADR 한 건 추가 예정.

## 검증

```bash
$ npx prisma generate
✔ Generated Prisma Client (v7.8.0) to .\node_modules\@prisma\client
```

## 사인오프

- R1 CTO ✅
- T14 DB Architect ✅ (S-09 갱신 책임)
