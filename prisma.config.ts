import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Prisma 7 config (ADR-013).
 *
 * Prisma 7는 schema.prisma의 datasource.url을 더 이상 지원하지 않는다.
 * 이 파일은 prisma migrate / generate CLI가 환경변수 DATABASE_URL을 인식하는 진입점.
 * 런타임 PrismaClient 인스턴스화는 lib/prisma.ts에서 driver adapter로 처리.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
});
