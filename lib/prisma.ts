/**
 * Prisma Client — Prisma 7 driver adapter (ADR-013).
 *
 * 정책:
 *   - DATABASE_URL 있음 → PrismaPg adapter로 실 인스턴스 생성.
 *   - DATABASE_URL 없음 → null. 페이지·Server Action은 시드 fallback (ADR-009).
 *
 * Next.js dev hot-reload 안전성 위해 globalThis에 캐싱.
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | null | undefined;
}

function createClient(): PrismaClient | null {
  const url = process.env.DATABASE_URL;
  if (!url) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[prisma] DATABASE_URL 미설정 — 데모 모드");
    }
    return null;
  }

  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

const cached = globalThis.__prisma;
export const prisma: PrismaClient | null =
  cached !== undefined ? cached : (globalThis.__prisma = createClient());

export const isDbConnected: boolean = prisma !== null;
