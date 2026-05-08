"use server";

/**
 * User Profile Server Actions — 프로필 편집.
 * review.ts 패턴 답습. 감사 로그 절대 규칙 준수.
 */

import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit-log";
import { updateUser, type UserRow } from "@/lib/repositories/user.repository";
import { isDbConnected } from "@/lib/prisma";
import { getActorId, getCurrentUserId } from "@/lib/auth/session";

export type UserActionResult<T = unknown> =
  | { ok: true; demo: true }
  | { ok: true; demo: false; data: T }
  | { ok: false; code: "forbidden" | "internal" | "invalid" };

// ═══════════════════════════════════════════════════════════════════
// updateUserProfile — 닉네임 변경
// ═══════════════════════════════════════════════════════════════════

export async function updateUserProfile(input: {
  name: string;
}): Promise<UserActionResult<UserRow>> {
  // 입력 검증
  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (name.length < 1 || name.length > 80) {
    return { ok: false, code: "invalid" };
  }

  if (!isDbConnected) {
    return { ok: true, demo: true };
  }

  // 인증 확인 — 본인만 프로필 수정 가능
  const userId = await getCurrentUserId();
  if (!userId) {
    return { ok: false, code: "forbidden" };
  }

  const user = await updateUser({ userId, name });
  if (!user) return { ok: false, code: "internal" };

  const actorId = await getActorId();
  await writeAuditLog({
    actorId,
    action: "user.update_profile",
    resource: "User",
    resourceId: user.id,
    after: { name: user.name },
    metadata: { source: "web" },
  });

  revalidatePath("/profile");
  revalidatePath("/settings");
  return { ok: true, demo: false, data: user };
}
