import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Prisma 7 config (ADR-013).
 *
 * Prisma 7는 schema.prisma의 datasource.url을 더 이상 지원하지 않고,
 * prisma migrate / introspect CLI는 이 파일에서 url을 읽어야 한다.
 * 런타임 PrismaClient 인스턴스화는 lib/prisma.ts에서 driver adapter로 처리.
 *
 * 사이클 5b-1 진단 (Deploy Logs):
 *   "Error: The datasource.url property is required in your Prisma config file
 *    when using prisma migrate deploy."
 * → 아래 datasource 블록으로 해결.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
