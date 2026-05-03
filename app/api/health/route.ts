import { NextResponse } from "next/server";
import { prisma, isDbConnected } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function getDeploymentMeta() {
  const sha = process.env.RAILWAY_GIT_COMMIT_SHA;
  return {
    commit: sha ? sha.slice(0, 7) : "local",
    commitFull: sha ?? null,
    deploymentId: process.env.RAILWAY_DEPLOYMENT_ID ?? null,
    branch: process.env.RAILWAY_GIT_BRANCH ?? null,
  };
}

export async function GET() {
  const meta = getDeploymentMeta();

  if (!isDbConnected || !prisma) {
    return NextResponse.json(
      {
        status: "demo",
        checks: { server: "ok", database: "demo" },
        timestamp: new Date().toISOString(),
        app: "traveldiary-mvp",
        ...meta,
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
        app: "traveldiary-mvp",
        ...meta,
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
        app: "traveldiary-mvp",
        ...meta,
      },
      { status: 503 },
    );
  }
}
