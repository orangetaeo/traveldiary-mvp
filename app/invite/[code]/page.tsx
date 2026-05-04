/**
 * 베타 초대 랜딩 — 시나리오 C Phase C2.
 *
 * `/invite/[code]` → 초대 사용 기록 + 온보딩으로 리다이렉트.
 * 초대 코드는 AuditLog로 추적 (스키마 변경 없음).
 */

import { redirect } from "next/navigation";
import { writeAuditLog } from "@/lib/audit-log";

export default async function InvitePage({
  params,
}: {
  params: { code: string };
}) {
  const code = params.code.slice(0, 32); // 길이 제한

  // 초대 사용 기록 (fire-and-forget 아님 — 리다이렉트 전 기록)
  await writeAuditLog({
    action: "invite.use",
    resource: "invite",
    resourceId: code,
    actorId: null,
    metadata: { code },
  });

  redirect(`/onboarding?ref=${encodeURIComponent(code)}`);
}
