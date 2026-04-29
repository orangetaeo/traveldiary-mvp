import { NextResponse } from "next/server";
import { isDbConnected } from "@/lib/prisma";

/**
 * Railway 헬스체크 엔드포인트 (S-10 / ADR-016).
 *
 * 사이클 5a: DB 미연결 = 데모 모드 = 정상 운영 상태로 간주 (200).
 * 사이클 5b: prisma.$queryRaw로 DB 연결 검증 + degraded 시 503.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const checks = {
    server: "ok" as const,
    database: isDbConnected ? "ok" : "demo",
  };

  return NextResponse.json(
    {
      status: isDbConnected ? "healthy" : "demo",
      checks,
      timestamp: new Date().toISOString(),
      cycle: "5a",
      app: "traveldiary-mvp",
    },
    { status: 200 },
  );
}
