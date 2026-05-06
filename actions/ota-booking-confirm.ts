"use server";

/**
 * OTA Booking Confirm/Decline Server Action — 사이클 5 (G8).
 *
 * 외부 OTA 결제 후 reentry 시 사용자 self-report:
 *  - 사용자 "예약했어요" 클릭 → ota.booking.confirmed audit
 *  - 사용자 "아니요" 클릭 → ota.booking.declined audit
 *
 * BLOCKER 7 OTA webhook 부재 → 신호는 self-report 한정. 실 webhook 도입 시
 * 자동 마킹으로 진화. 일정 mutation은 BLOCKER 7 후 별도 사이클.
 *
 * affiliate.ts 답습 — 외부 API 전용 패턴 (DB 의존 0, canWriteTrip 면제 카테고리).
 */

import { writeAuditLog } from "@/lib/audit-log";
import { getActorId } from "@/lib/auth/session";

export interface ConfirmOtaBookingInput {
  offerId: string;
  itemId: string;
  ota: string;
  priceKrw: number;
  /** 클릭 시각(ms) — outgoing.clickedAt 인용. 외부 체류 시간 audit. */
  clickedAt: number;
  decision: "confirmed" | "declined";
}

export interface ConfirmOtaBookingResult {
  ok: true;
}

export async function confirmOtaBookingAction(
  input: ConfirmOtaBookingInput,
): Promise<ConfirmOtaBookingResult> {
  const dwellMs = Math.max(0, Date.now() - input.clickedAt);
  const actorId = await getActorId();
  const sharedMetadata = {
    source: "web" as const,
    ota: input.ota,
    itemId: input.itemId,
    priceKrw: input.priceKrw,
    dwellMs,
  };

  if (input.decision === "confirmed") {
    await writeAuditLog({
      actorId,
      action: "affiliate.confirmed",
      resource: "OtaOffer",
      resourceId: input.offerId,
      after: { decision: "confirmed" },
      metadata: sharedMetadata,
    });
  } else {
    await writeAuditLog({
      actorId,
      action: "affiliate.declined",
      resource: "OtaOffer",
      resourceId: input.offerId,
      after: { decision: "declined" },
      metadata: sharedMetadata,
    });
  }

  return { ok: true };
}
