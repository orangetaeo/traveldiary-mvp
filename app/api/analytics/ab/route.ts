/**
 * A/B 테스트 이벤트 수신 — 시나리오 C Phase C4.
 *
 * POST /api/analytics/ab
 * 클라이언트 sendBeacon/fetch → AuditLog 기록.
 */

import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit-log";

const VALID_EVENTS = new Set(["impression", "conversion"]);

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const experimentId = String(body.experimentId ?? "");
    const variant = String(body.variant ?? "");
    const event = String(body.event ?? "");

    if (!experimentId || !variant || !VALID_EVENTS.has(event)) {
      return NextResponse.json({ error: "invalid payload" }, { status: 400 });
    }

    await writeAuditLog({
      action: `ab.${event}`,
      resource: "experiment",
      resourceId: experimentId,
      actorId: null,
      metadata: {
        experimentId,
        variant,
        event,
        timestamp: body.timestamp ?? new Date().toISOString(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    // 트래킹 실패는 200 반환 — 클라이언트 동작에 영향 X
    return NextResponse.json({ ok: true });
  }
}
