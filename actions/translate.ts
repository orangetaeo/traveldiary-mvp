"use server";

/**
 * Translate Server Action — 사이클 5b-5 (ADR-019).
 *
 * 클라이언트가 Base64 이미지를 보내면 Vision OCR + Claude 번역 → MenuItem 배열 반환.
 * audit log "evidence.gathered" + metadata.source.
 */

import { writeAuditLog } from "@/lib/audit-log";
import {
  translateMenuPhoto,
  type MenuTranslationOutcome,
} from "@/lib/services/menu-translation";

export interface TranslateMenuPhotoInput {
  imageBase64: string;
  /** 디버깅·audit용 (ItineraryItem id 또는 trip id) */
  contextId?: string;
}

export async function translateMenuPhotoAction(
  input: TranslateMenuPhotoInput,
): Promise<MenuTranslationOutcome> {
  const result = await translateMenuPhoto(input.imageBase64);

  // audit log: 진짜 호출(fresh fetch)일 때만 기록
  const shouldAudit =
    (result.mode === "ok" && (!result.ocrCached || !result.claudeCached)) ||
    result.mode === "error" ||
    result.mode === "no_text";

  if (shouldAudit) {
    await writeAuditLog({
      actorId: null,
      action: "evidence.gathered",
      resource: "MenuTranslation",
      resourceId: input.contextId ?? "unknown",
      after:
        result.mode === "ok"
          ? { itemCount: result.items.length }
          : null,
      metadata: {
        source: "vision+claude",
        mode: result.mode,
        ocrCached: "ocrCached" in result ? result.ocrCached : undefined,
        claudeCached: "claudeCached" in result ? result.claudeCached : undefined,
        totalMs: "totalMs" in result ? result.totalMs : undefined,
        stage: "stage" in result ? result.stage : undefined,
        errorCode: "code" in result && result.mode === "error" ? result.code : undefined,
      },
    });
  }

  return result;
}
