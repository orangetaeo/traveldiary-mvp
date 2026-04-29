/**
 * Prisma Client 핸들 — 사이클 1 한정 데모 모드.
 *
 * Prisma 7은 schema의 datasource.url을 더 이상 지원하지 않고
 * driver adapter(@prisma/adapter-pg 등)를 통한 인스턴스화를 요구한다 — ADR-011.
 *
 * 사이클 1은 ADR-010(의존성 무추가) 정책을 지키기 위해
 *   - 타입만 import,
 *   - 인스턴스는 null,
 *   - 변경 API는 시드 read-only 시연이라 mutation 0건
 * 으로 운영한다.
 *
 * 사이클 2(첫 mutation)에서 adapter ADR과 함께 정식 인스턴스화한다.
 */

import type { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma: PrismaClient | null = globalThis.__prisma ?? null;

export const isDbConnected: boolean = prisma !== null;
