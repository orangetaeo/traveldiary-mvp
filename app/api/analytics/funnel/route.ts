/**
 * 온보딩 퍼널 이벤트 수신 — 시나리오 C Phase C2.
 *
 * POST /api/analytics/funnel
 * 클라이언트 sendBeacon/fetch → AuditLog 기록.
 */

import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit-log";

const VALID_STEPS = new Set(["view", "step1", "step2", "step3", "step4", "submit", "complete"]);

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const step = String(body.step ?? "");

    if (!VALID_STEPS.has(step)) {
      return NextResponse.json({ error: "invalid step" }, { status: 400 });
    }

    await writeAuditLog({
      action: "funnel.onboarding",
      resource: "analytics",
      resourceId: `onboarding-${step}`,
      actorId: null,
      metadata: {
        step,
        timestamp: body.timestamp ?? new Date().toISOString(),
        destination: body.destination ?? null,
        companion: body.companion ?? null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    // 트래킹 실패는 200 반환 — 클라이언트 동작에 영향 X
    return NextResponse.json({ ok: true });
  }
}
