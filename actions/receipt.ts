"use server";

/**
 * Receipt OCR Server Action — 영수증 스캔 → 구조화 파싱.
 *
 * M4 translate.ts 패턴 답습. audit log "receipt.scanned".
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
  const result = await scanReceipt(input.imageBase64);

  const shouldAudit =
    (result.mode === "ok" && (!result.ocrCached || !result.parseCached)) ||
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
        source: "vision+claude",
        mode: result.mode,
        ocrCached: "ocrCached" in result ? result.ocrCached : undefined,
        parseCached: "parseCached" in result ? result.parseCached : undefined,
        totalMs: "totalMs" in result ? result.totalMs : undefined,
        stage: "stage" in result ? result.stage : undefined,
        errorCode: "code" in result && result.mode === "error" ? result.code : undefined,
      },
    });
  }

  return result;
}
