/**
 * Menu Translation — Claude Vision 멀티모달 단일 파이프라인.
 *
 * 이미지를 Claude에 직접 전송하여 메뉴 OCR + 한국어 번역 + 알레르기 분석을 한번에 처리.
 * Google Vision 의존성 제거 — ANTHROPIC_API_KEY만 있으면 동작.
 */

import "server-only";

import {
  assertQuota,
  recordExternalCall,
  QuotaExceededError,
} from "@/lib/usage-quota";
import { calculateCostUsd } from "@/lib/autonomy/model-pricing";
import {
  assertBudget,
  AutonomyPausedError,
  BudgetExceededError,
  recordSpend,
} from "@/lib/autonomy/budget";
import { getEnvKey } from "@/lib/utils/env";

export type { MenuItemTranslation } from "./anthropic-claude";

export type MenuTranslationOutcome =
  | { mode: "demo" }
  | {
      mode: "ok";
      items: MenuItemTranslation[];
      cached: boolean;
      totalMs: number;
    }
  | { mode: "no_text"; totalMs: number }
  | {
      mode: "error";
      stage: "vision";
      code: string;
      message?: string;
      totalMs: number;
    };

// re-import type locally for use in this file
import type { MenuItemTranslation } from "./anthropic-claude";

const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";

const SYSTEM_PROMPT = `당신은 베트남 메뉴 번역 전문가입니다. 메뉴판 이미지를 보고 메뉴 항목을 한국어로 번역하고, 알레르기 재료를 추출합니다.

알레르기 코드 (모두 영어 소문자):
- shrimp (새우)
- crustacean (게·랍스터·바닷가재 등 갑각류)
- peanut (땅콩)
- nut (견과류 일반)
- milk (우유·치즈·버터·요거트)
- gluten (밀가루·국수·빵)
- egg (계란)
- soy (콩·간장·된장)

중요:
- 메뉴 항목이 아닌 텍스트(주소·가게명·전화번호 등)는 무시하세요.
- 메뉴판 이미지에서 텍스트가 전혀 보이지 않으면 {"no_text":true} 만 반환.
- 응답은 반드시 다음 JSON만 (다른 텍스트 X):
{"items":[{"vn":"원문","ko":"한국어 번역","allergens":["shrimp"]}]}`;

export function translateAvailable(): boolean {
  return getEnvKey("ANTHROPIC_API_KEY") !== null;
}

export async function translateMenuPhoto(
  imageBase64: string,
): Promise<MenuTranslationOutcome> {
  const apiKey = getEnvKey("ANTHROPIC_API_KEY");
  if (!apiKey) return { mode: "demo" };
  const startedAt = Date.now();

  // 쿼터/예산 확인
  try {
    assertQuota("anthropic");
    assertBudget();
  } catch (err) {
    if (err instanceof QuotaExceededError) {
      recordExternalCall("anthropic", { blockedBy: "quota" });
      return { mode: "error", stage: "vision", code: "quota_exceeded", message: `cap=${err.cap}`, totalMs: Date.now() - startedAt };
    }
    if (err instanceof BudgetExceededError) {
      recordExternalCall("anthropic", { blockedBy: "budget" });
      return { mode: "error", stage: "vision", code: "budget_exceeded", message: `${err.tier} $${err.thresholdUsd}`, totalMs: Date.now() - startedAt };
    }
    if (err instanceof AutonomyPausedError) {
      recordExternalCall("anthropic", { blockedBy: "emergency" });
      return { mode: "error", stage: "vision", code: "autonomy_paused", message: err.reason, totalMs: Date.now() - startedAt };
    }
    throw err;
  }

  try {
    const mediaType = inferMediaType(imageBase64);

    const resp = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      cache: "no-store",
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mediaType,
                  data: imageBase64,
                },
              },
              {
                type: "text",
                text: "이 메뉴판을 번역하고 알레르기 분석해주세요.",
              },
            ],
          },
        ],
      }),
    });

    recordExternalCall("anthropic");

    if (!resp.ok) {
      return { mode: "error", stage: "vision", code: "claude_api_error", message: `HTTP ${resp.status}`, totalMs: Date.now() - startedAt };
    }

    const json = (await resp.json()) as {
      content?: Array<{ type: string; text?: string }>;
      error?: { message?: string };
      usage?: { input_tokens?: number; output_tokens?: number };
    };

    const inputTokens = json.usage?.input_tokens ?? 0;
    const outputTokens = json.usage?.output_tokens ?? 0;
    if (inputTokens > 0 || outputTokens > 0) {
      recordSpend({
        provider: "anthropic",
        model: MODEL,
        inputTokens,
        outputTokens,
        costUsd: calculateCostUsd(MODEL, inputTokens, outputTokens),
      });
    }

    if (json.error?.message) {
      return { mode: "error", stage: "vision", code: "claude_api_error", message: json.error.message, totalMs: Date.now() - startedAt };
    }

    const text = json.content?.find((c) => c.type === "text")?.text ?? "";

    if (text.includes('"no_text"') && text.includes("true")) {
      return { mode: "no_text", totalMs: Date.now() - startedAt };
    }

    let parsed: { items: MenuItemTranslation[] };
    try {
      const start = text.indexOf("{");
      const end = text.lastIndexOf("}");
      if (start === -1 || end === -1) throw new Error("JSON 미발견");
      parsed = JSON.parse(text.slice(start, end + 1));
    } catch (err) {
      return { mode: "error", stage: "vision", code: "parse_error", message: err instanceof Error ? err.message : "unknown", totalMs: Date.now() - startedAt };
    }

    if (!Array.isArray(parsed.items)) {
      return { mode: "error", stage: "vision", code: "parse_error", message: "items not array", totalMs: Date.now() - startedAt };
    }

    return {
      mode: "ok",
      items: parsed.items,
      cached: false,
      totalMs: Date.now() - startedAt,
    };
  } catch (err) {
    return { mode: "error", stage: "vision", code: "network", message: err instanceof Error ? err.message : "unknown", totalMs: Date.now() - startedAt };
  }
}

function inferMediaType(base64: string): "image/jpeg" | "image/png" | "image/webp" | "image/gif" {
  if (base64.startsWith("/9j/")) return "image/jpeg";
  if (base64.startsWith("iVBOR")) return "image/png";
  if (base64.startsWith("UklGR")) return "image/webp";
  if (base64.startsWith("R0lGO")) return "image/gif";
  return "image/jpeg";
}
