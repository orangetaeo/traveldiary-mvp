"use server";

/**
 * Share Server Actions — 사이클 11a (ADR-024).
 */

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit-log";
import {
  createShareLinkRow,
} from "@/lib/repositories/share.repository";
import { isDbConnected } from "@/lib/prisma";
import { DEMO_TRIP_ID } from "@/lib/seed";
import type { ShareLink } from "@/lib/types";

export interface CreateShareLinkInput {
  tripId: string;
  expiresInDays?: number; // 기본 30
}

export type CreateShareLinkResult =
  | { ok: true; demo: true; syncKey: string }
  | { ok: true; demo: false; data: ShareLink }
  | { ok: false; code: "internal" };

/** unguessable syncKey 생성 — 24바이트 base64url. cuid보다 짧지만 충분 */
function generateSyncKey(): string {
  return randomBytes(24).toString("base64url");
}

export async function createShareLinkAction(
  input: CreateShareLinkInput,
): Promise<CreateShareLinkResult> {
  const syncKey = generateSyncKey();

  if (!isDbConnected || input.tripId === DEMO_TRIP_ID) {
    // 데모 시뮬 — 클라이언트가 URL만 보여주고 실제는 저장 X
    return { ok: true, demo: true, syncKey };
  }

  const expiresInDays = input.expiresInDays ?? 30;
  const expiresAt = new Date(
    Date.now() + expiresInDays * 24 * 60 * 60 * 1000,
  );

  const link = await createShareLinkRow({
    tripId: input.tripId,
    syncKey,
    permission: "view",
    expiresAt,
  });
  if (!link) return { ok: false, code: "internal" };

  await writeAuditLog({
    actorId: null,
    action: "share.create",
    resource: "ShareLink",
    resourceId: link.id,
    after: {
      tripId: link.tripId,
      permission: link.permission,
      expiresAt: link.expiresAt,
    },
    metadata: { source: "web" },
  });

  revalidatePath(`/itinerary/${input.tripId}`);
  return { ok: true, demo: false, data: link };
}
