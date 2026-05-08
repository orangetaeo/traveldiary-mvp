"use server";

/**
 * Translate Server Action — Claude Vision 멀티모달 단일 파이프라인.
 *
 * 클라이언트가 Base64 이미지를 보내면 Claude Vision으로 OCR + 번역 + 알레르기 분석.
 * audit log "evidence.gathered" + metadata.source.
 */

import { writeAuditLog } from "@/lib/audit-log";
import { getActorId } from "@/lib/auth/session";
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
  let result: MenuTranslationOutcome;
  try {
    result = await translateMenuPhoto(input.imageBase64);
  } catch (err) {
    console.error("[translateMenuPhotoAction] translateMenuPhoto threw", err);
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
        action: "evidence.gathered",
        resource: "MenuTranslation",
        resourceId: input.contextId ?? "unknown",
        after:
          result.mode === "ok"
            ? { itemCount: result.items.length }
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
    console.error("[translateMenuPhotoAction] audit log failed", auditErr);
  }

  return result;
}
