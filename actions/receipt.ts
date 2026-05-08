"use server";

/**
 * Receipt OCR Server Action — 영수증 스캔 → 구조화 파싱.
 *
 * Claude Vision 멀티모달 단일 파이프라인. audit log "receipt.scanned".
 */

import { writeAuditLog } from "@/lib/audit-log";
import { getActorId } from "@/lib/auth/session";
import {
  scanReceipt,
  type ReceiptOcrOutcome,
} from "@/lib/services/receipt-ocr";

export interface ScanReceiptInput {
  imageBase64: string;
  tripId: string;
}

export async function scanReceiptAction(
  input: ScanReceiptInput,
): Promise<ReceiptOcrOutcome> {
  let result: ReceiptOcrOutcome;
  try {
    result = await scanReceipt(input.imageBase64);
  } catch (err) {
    console.error("[scanReceiptAction] scanReceipt threw", err);
    return {
      mode: "error",
      stage: "vision",
      code: "network",
      message: err instanceof Error ? err.message : "알 수 없는 오류",
      totalMs: 0,
    };
  }

  try {
    const shouldAudit =
      (result.mode === "ok" && !result.cached) ||
      result.mode === "error" ||
      result.mode === "no_text";

    if (shouldAudit) {
      await writeAuditLog({
        actorId: await getActorId(),
        action: "receipt.scanned",
        resource: "CostEntry",
        resourceId: input.tripId,
        after:
          result.mode === "ok"
            ? {
                vendor: result.receipt.vendor,
                total: result.receipt.total,
                currency: result.receipt.currency,
                category: result.receipt.category,
              }
            : null,
        metadata: {
          source: "claude-vision",
          mode: result.mode,
          cached: "cached" in result ? result.cached : undefined,
          totalMs: "totalMs" in result ? result.totalMs : undefined,
          stage: "stage" in result ? result.stage : undefined,
          errorCode: "code" in result && result.mode === "error" ? result.code : undefined,
        },
      });
    }
  } catch (auditErr) {
    console.error("[scanReceiptAction] audit log failed", auditErr);
  }

  return result;
}
