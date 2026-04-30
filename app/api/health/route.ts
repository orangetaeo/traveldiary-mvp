import { NextResponse } from "next/server";
import { prisma, isDbConnected } from "@/lib/prisma";

/**
 * Railway 헬스체크 엔드포인트 (S-10 / ADR-013/016).
 *
 * 상태:
 *   - DB 연결됨 + 쿼리 OK → 200 healthy
 *   - DB 연결됨 + 쿼리 실패 → 503 degraded (Railway 자동 재시작)
 *   - DB 미연결 (DATABASE_URL 빈 칸) → 200 demo (사이클 5a 호환)
 */
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDbConnected || !prisma) {
    return NextResponse.json(
      {
        status: "demo",
        checks: { server: "ok", database: "demo" },
        timestamp: new Date().toISOString(),
        cycle: "5a",
        app: "traveldiary-mvp",
      },
      { status: 200 },
    );
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(
      {
        status: "healthy",
        checks: { server: "ok", database: "ok" },
        timestamp: new Date().toISOString(),
        cycle: "9-m6",
        app: "traveldiary-mvp",
      },
      { status: 200 },
    );
  } catch (err) {
    return NextResponse.json(
      {
        status: "degraded",
        checks: {
          server: "ok",
          database: "fail",
          error: err instanceof Error ? err.message : "unknown",
        },
        timestamp: new Date().toISOString(),
        cycle: "9-m6",
        app: "traveldiary-mvp",
      },
      { status: 503 },
    );
  }
}
