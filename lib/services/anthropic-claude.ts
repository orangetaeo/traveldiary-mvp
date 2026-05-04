/**
 * Anthropic Claude API (Messages) — 번역 + 알레르기 분석.
 * 사이클 5b-5 (ADR-019).
 *
 * 모델: claude-haiku-4-5-20251001 (가장 저렴/빠름).
 * 5b-3 외부 API 표준 패턴 답습.
 */

import "server-only";

import { createHash } from "crypto";
import {
  getEvidenceCache,
  setEvidenceCache,
} from "@/lib/repositories/evidence-cache.repository";
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

const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30일
const PLATFORM_MENU = "claude.menu";

export interface MenuItemTranslation {
  vn: string;
  ko: string;
  allergens: string[]; // ["shrimp"|"peanut"|"milk"|"gluten"|"crustacean"|"egg"|"soy"|"nut"]
}

export type ClaudeMenuOutcome =
  | { mode: "demo" }
  | {
      mode: "ok";
      items: MenuItemTranslation[];
      cached: boolean;
      fetchDurationMs: number;
    }
  | {
      mode: "error";
      code:
        | "claude_api_error"
        | "parse_error"
        | "network"
        | "quota_exceeded"
        | "budget_exceeded"
        | "autonomy_paused";
      message?: string;
    };

function getApiKey(): string | null {
  const k = process.env.ANTHROPIC_API_KEY;
  return k && k.length > 0 ? k : null;
}

export const claudeAvailable = (): boolean => getApiKey() !== null;

const SYSTEM_PROMPT = `당신은 베트남 메뉴 번역가입니다. OCR 결과의 베트남어 메뉴 항목을 한국어로 번역하고,
한국인이 흔히 알레르기 있는 재료를 추출합니다.

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
- 응답은 반드시 다음 JSON만 (다른 텍스트 X):
{"items":[{"vn":"...","ko":"...","allergens":[...]}]}`;

export async function translateMenuOcr(
  ocrText: string,
): Promise<ClaudeMenuOutcome> {
  const apiKey = getApiKey();
  if (!apiKey) return { mode: "demo" };
  const startedAt = Date.now();

  const cacheKey = createHash("sha256")
    .update(ocrText.trim())
    .digest("hex")
    .slice(0, 32);

  const cached = await getEvidenceCache<{ items: MenuItemTranslation[] }>(
    cacheKey,
    PLATFORM_MENU,
  );
  if (cached) {
    return {
      mode: "ok",
      items: cached.data.items,
      cached: true,
      fetchDurationMs: Date.now() - startedAt,
    };
  }

  try {
    assertQuota("anthropic");
    assertBudget();
  } catch (err) {
    if (err instanceof QuotaExceededError) {
      return {
        mode: "error",
        code: "quota_exceeded",
        message: `cap=${err.cap}, resetAt=${new Date(err.resetAt).toISOString()}`,
      };
    }
    if (err instanceof BudgetExceededError) {
      return {
        mode: "error",
        code: "budget_exceeded",
        message: `${err.tier} threshold $${err.thresholdUsd} reached (current $${err.currentUsd.toFixed(4)})`,
      };
    }
    if (err instanceof AutonomyPausedError) {
      return {
        mode: "error",
        code: "autonomy_paused",
        message: `paused at ${err.pausedAt} (${err.reason})`,
      };
    }
    throw err;
  }

  try {
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
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `다음 OCR 결과를 번역+알레르기 분석:\n\n${ocrText}`,
          },
        ],
      }),
    });

    recordExternalCall("anthropic");

    if (!resp.ok) {
      return {
        mode: "error",
        code: "claude_api_error",
        message: `HTTP ${resp.status}`,
      };
    }

    const json = (await resp.json()) as {
      content?: Array<{ type: string; text?: string }>;
      error?: { message?: string };
      usage?: { input_tokens?: number; output_tokens?: number };
    };

    // 사이클 AAAA2: 성공 응답에 한해 토큰/$ 누적 (budget.ts)
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
      return {
        mode: "error",
        code: "claude_api_error",
        message: json.error.message,
      };
    }

    const text = json.content?.find((c) => c.type === "text")?.text ?? "";
    let parsed: { items: MenuItemTranslation[] };
    try {
      // 모델이 JSON 외 텍스트 섞을 수 있음 — 첫 { 부터 마지막 } 까지 추출
      const start = text.indexOf("{");
      const end = text.lastIndexOf("}");
      if (start === -1 || end === -1) throw new Error("JSON 미발견");
      parsed = JSON.parse(text.slice(start, end + 1));
    } catch (err) {
      return {
        mode: "error",
        code: "parse_error",
        message: err instanceof Error ? err.message : "unknown",
      };
    }

    if (!Array.isArray(parsed.items)) {
      return { mode: "error", code: "parse_error", message: "items not array" };
    }

    await setEvidenceCache({
      placeId: cacheKey,
      platform: PLATFORM_MENU,
      data: { items: parsed.items },
      ttlMs: TTL_MS,
    });

    return {
      mode: "ok",
      items: parsed.items,
      cached: false,
      fetchDurationMs: Date.now() - startedAt,
    };
  } catch (err) {
    return {
      mode: "error",
      code: "network",
      message: err instanceof Error ? err.message : "unknown",
    };
  }
}
