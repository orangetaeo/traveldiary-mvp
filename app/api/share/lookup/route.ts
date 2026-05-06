/**
 * Share lookup API — 사이클 W (M7 미니).
 *
 * POST { keys: string[] } → 각 syncKey의 메타(만료/revoke 상태) 반환.
 * trip 본문은 절대 안 보냄 — view 페이지 /share/[key]에서만 노출.
 *
 * 권한: syncKey를 이미 가진 사람 = 받아간 사람. /share/[key]와 동일 권한 모델.
 * Rate limit: ip당 분당 30회 (read-only) — lib/share/lookupRateLimit.ts.
 */

import { NextResponse, type NextRequest } from "next/server";
import { prisma, isDbConnected } from "@/lib/prisma";
import { checkIpRate } from "@/lib/share/lookupRateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface LookupItem {
  key: string;
  found: boolean;
  status: "active" | "revoked" | "expired" | "not_found";
  destination?: string;
  nights?: number;
  startDate?: string;
  expiresAt?: string;
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  if (!checkIpRate(ip)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: { keys?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!Array.isArray(body.keys) || body.keys.length === 0) {
    return NextResponse.json({ error: "keys_required" }, { status: 400 });
  }
  if (body.keys.length > 50) {
    return NextResponse.json({ error: "too_many_keys" }, { status: 400 });
  }

  const keys = body.keys
    .filter((k): k is string => typeof k === "string" && k.length > 0 && k.length < 200)
    .slice(0, 50);

  if (!isDbConnected || !prisma) {
    const items: LookupItem[] = keys.map((k) => ({
      key: k,
      found: false,
      status: "not_found",
    }));
    return NextResponse.json({ items });
  }

  const rows = await prisma.shareLink.findMany({
    where: { syncKey: { in: keys } },
    include: { trip: { select: { destination: true, nights: true, startDate: true } } },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const byKey = new Map<string, any>(rows.map((r: any) => [r.syncKey, r]));
  const now = Date.now();

  const items: LookupItem[] = keys.map((k) => {
    const row = byKey.get(k);
    if (!row) return { key: k, found: false, status: "not_found" };
    if (row.revokedAt) return { key: k, found: true, status: "revoked" };
    if (row.expiresAt && row.expiresAt.getTime() < now) {
      return { key: k, found: true, status: "expired" };
    }
    return {
      key: k,
      found: true,
      status: "active",
      destination: row.trip?.destination ?? undefined,
      nights: row.trip?.nights ?? undefined,
      startDate: row.trip?.startDate.toISOString() ?? undefined,
      expiresAt: row.expiresAt?.toISOString() ?? undefined,
    };
  });

  return NextResponse.json({ items });
}
