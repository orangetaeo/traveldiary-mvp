/**
 * Menu Translation 통합 — Vision OCR + Claude API 파이프라인.
 * 사이클 5b-5 (ADR-019).
 */

import "server-only";

import { ocrFromBase64Image } from "./google-vision";
import { translateMenuOcr, type MenuItemTranslation } from "./anthropic-claude";

export type MenuTranslationOutcome =
  | { mode: "demo" }
  | {
      mode: "ok";
      items: MenuItemTranslation[];
      ocrCached: boolean;
      claudeCached: boolean;
      totalMs: number;
    }
  | { mode: "no_text"; ocrCached: boolean; totalMs: number }
  | {
      mode: "error";
      stage: "ocr" | "claude";
      code: string;
      message?: string;
      totalMs: number;
    };

export async function translateMenuPhoto(
  imageBase64: string,
): Promise<MenuTranslationOutcome> {
  const startedAt = Date.now();

  const ocr = await ocrFromBase64Image(imageBase64);
  if (ocr.mode === "demo") return { mode: "demo" };
  if (ocr.mode === "error") {
    return {
      mode: "error",
      stage: "ocr",
      code: ocr.code,
      message: ocr.message,
      totalMs: Date.now() - startedAt,
    };
  }
  if (ocr.mode === "no_text") {
    return {
      mode: "no_text",
      ocrCached: ocr.cached,
      totalMs: Date.now() - startedAt,
    };
  }

  const claude = await translateMenuOcr(ocr.text);
  if (claude.mode === "demo") {
    // OCR은 성공했지만 Claude 키 없음 → 데모 fallback
    return { mode: "demo" };
  }
  if (claude.mode === "error") {
    return {
      mode: "error",
      stage: "claude",
      code: claude.code,
      message: claude.message,
      totalMs: Date.now() - startedAt,
    };
  }

  return {
    mode: "ok",
    items: claude.items,
    ocrCached: ocr.cached,
    claudeCached: claude.cached,
    totalMs: Date.now() - startedAt,
  };
}
