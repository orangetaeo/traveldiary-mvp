/**
 * Receipt OCR — Vision OCR + Claude 영수증 파싱 파이프라인.
 *
 * M4 menu-translation.ts 패턴 답습.
 * Stage 1: Google Vision TEXT_DETECTION (기존 google-vision.ts 재사용)
 * Stage 2: Claude Haiku로 영수증 구조화 (가게명/금액/통화/날짜/카테고리)
 */

import "server-only";

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
import { getEnvKey } from "@/lib/utils/env";
import { hashCacheKey } from "@/lib/utils/cache-key";
import { ocrFromBase64Image } from "./google-vision";

// ── 타입 ─────────────────────────────────────────────────────────

export interface ParsedReceipt {
  vendor: string;
  date: string; // YYYY-MM-DD or ""
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  currency: string; // "VND" | "KRW" | "THB" | "USD" ...
  category: "food" | "transport" | "accommodation" | "shopping" | "activity" | "other";
}

export type ReceiptOcrOutcome =
  | { mode: "demo" }
  | {
      mode: "ok";
      receipt: ParsedReceipt;
      ocrCached: boolean;
      parseCached: boolean;
      totalMs: number;
    }
  | { mode: "no_text"; ocrCached: boolean; totalMs: number }
  | {
      mode: "error";
      stage: "ocr" | "parse";
      code: string;
      message?: string;
      totalMs: number;
    };

// ── Claude 영수증 파싱 ──────────────────────────────────────────

const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30일
const PLATFORM = "claude.receipt";

const SYSTEM_PROMPT = `당신은 여행자용 영수증 파싱 전문가입니다. OCR 텍스트에서 비용 정보를 추출합니다.

규칙:
- 통화 자동 감지: VND(베트남동), THB(태국바트), JPY(엔), USD(달러), KRW(원) 등
- 날짜 형식: YYYY-MM-DD (추출 불가 시 빈 문자열)
- 카테고리 자동 분류: food(음식), transport(교통), accommodation(숙박), shopping(쇼핑), activity(액티비티), other(기타)
- 가게명이 불분명하면 "알 수 없음"
- 총액(total)은 반드시 숫자 (소수점 없이 정수)
- 개별 항목(items)이 불분명하면 빈 배열 []

응답은 반드시 다음 JSON만 (다른 텍스트 X):
{"vendor":"가게명","date":"YYYY-MM-DD","items":[{"name":"항목명","quantity":1,"price":50000}],"total":50000,"currency":"VND","category":"food"}`;

type ClaudeReceiptOutcome =
  | { mode: "demo" }
  | { mode: "ok"; receipt: ParsedReceipt; cached: boolean; fetchDurationMs: number }
  | {
      mode: "error";
      code: "claude_api_error" | "parse_error" | "network" | "quota_exceeded" | "budget_exceeded" | "autonomy_paused";
      message?: string;
    };

async function parseReceiptWithClaude(ocrText: string): Promise<ClaudeReceiptOutcome> {
  const apiKey = getEnvKey("ANTHROPIC_API_KEY");
  if (!apiKey) return { mode: "demo" };
  const startedAt = Date.now();

  const cacheKey = hashCacheKey(`receipt:${ocrText.trim()}`);
  const cached = await getEvidenceCache<ParsedReceipt>(cacheKey, PLATFORM);
  if (cached) {
    return {
      mode: "ok",
      receipt: cached.data,
      cached: true,
      fetchDurationMs: Date.now() - startedAt,
    };
  }

  try {
    assertQuota("anthropic");
    assertBudget();
  } catch (err) {
    if (err instanceof QuotaExceededError) {
      recordExternalCall("anthropic", { blockedBy: "quota" });
      return { mode: "error", code: "quota_exceeded", message: `cap=${err.cap}` };
    }
    if (err instanceof BudgetExceededError) {
      recordExternalCall("anthropic", { blockedBy: "budget" });
      return { mode: "error", code: "budget_exceeded", message: `${err.tier} $${err.thresholdUsd}` };
    }
    if (err instanceof AutonomyPausedError) {
      recordExternalCall("anthropic", { blockedBy: "emergency" });
      return { mode: "error", code: "autonomy_paused", message: err.reason };
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
          { role: "user", content: `다음 영수증 OCR 텍스트를 파싱하세요:\n\n${ocrText}` },
        ],
      }),
    });

    recordExternalCall("anthropic");

    if (!resp.ok) {
      return { mode: "error", code: "claude_api_error", message: `HTTP ${resp.status}` };
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
      return { mode: "error", code: "claude_api_error", message: json.error.message };
    }

    const text = json.content?.find((c) => c.type === "text")?.text ?? "";
    let parsed: ParsedReceipt;
    try {
      const start = text.indexOf("{");
      const end = text.lastIndexOf("}");
      if (start === -1 || end === -1) throw new Error("JSON 미발견");
      parsed = JSON.parse(text.slice(start, end + 1));
    } catch (err) {
      return { mode: "error", code: "parse_error", message: err instanceof Error ? err.message : "unknown" };
    }

    // 필수 필드 검증
    if (typeof parsed.total !== "number" || !parsed.currency) {
      return { mode: "error", code: "parse_error", message: "total 또는 currency 누락" };
    }

    // 기본값 보정
    parsed.vendor = parsed.vendor || "알 수 없음";
    parsed.date = parsed.date || "";
    parsed.items = Array.isArray(parsed.items) ? parsed.items : [];
    parsed.category = parsed.category || "other";

    await setEvidenceCache({
      placeId: cacheKey,
      platform: PLATFORM,
      data: parsed,
      ttlMs: TTL_MS,
    });

    return {
      mode: "ok",
      receipt: parsed,
      cached: false,
      fetchDurationMs: Date.now() - startedAt,
    };
  } catch (err) {
    return { mode: "error", code: "network", message: err instanceof Error ? err.message : "unknown" };
  }
}

// ── 통합 파이프라인 ─────────────────────────────────────────────

export async function scanReceipt(imageBase64: string): Promise<ReceiptOcrOutcome> {
  const startedAt = Date.now();

  // Stage 1: Vision OCR
  const ocr = await ocrFromBase64Image(imageBase64);
  if (ocr.mode === "demo") return { mode: "demo" };
  if (ocr.mode === "error") {
    return { mode: "error", stage: "ocr", code: ocr.code, message: ocr.message, totalMs: Date.now() - startedAt };
  }
  if (ocr.mode === "no_text") {
    return { mode: "no_text", ocrCached: ocr.cached, totalMs: Date.now() - startedAt };
  }

  // Stage 2: Claude 영수증 파싱
  const parsed = await parseReceiptWithClaude(ocr.text);
  if (parsed.mode === "demo") return { mode: "demo" };
  if (parsed.mode === "error") {
    return { mode: "error", stage: "parse", code: parsed.code, message: parsed.message, totalMs: Date.now() - startedAt };
  }

  return {
    mode: "ok",
    receipt: parsed.receipt,
    ocrCached: ocr.cached,
    parseCached: parsed.cached,
    totalMs: Date.now() - startedAt,
  };
}
