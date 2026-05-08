/**
 * Receipt OCR — Claude Vision 단일 파이프라인.
 *
 * Claude Haiku 멀티모달로 영수증 이미지를 직접 읽어 구조화 파싱.
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

// ── 설정 ─────────────────────────────────────────────────────────

const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";

const SYSTEM_PROMPT = `당신은 여행자용 영수증 파싱 전문가입니다. 영수증 이미지를 정확히 읽어 비용 정보를 추출합니다.

중요 — 항목(items) 파싱 규칙:
- 영수증에 실제로 인쇄된 항목만 추출. 절대 추측하거나 지어내지 마세요.
- 각 항목의 name은 영수증에 적힌 그대로 사용 (번역하지 말 것).
- quantity는 영수증에 수량이 명시된 경우만 반영, 없으면 1.
- price는 해당 항목의 단가 × 수량 = 소계 금액 (정수).
- 할인/세금/서비스차지 등 별도 행이 있으면 별도 항목으로 추출.
- 항목을 읽을 수 없거나 불분명하면 빈 배열 []로. 추측 금지.

기타 규칙:
- 통화 자동 감지: VND(베트남동), THB(태국바트), JPY(엔), USD(달러), KRW(원) 등
- 날짜 형식: YYYY-MM-DD (추출 불가 시 빈 문자열)
- 카테고리: food(음식), transport(교통), accommodation(숙박), shopping(쇼핑), activity(액티비티), other(기타)
- 가게명이 불분명하면 "알 수 없음"
- total은 영수증의 최종 합계 금액 (정수)
- 이미지에서 텍스트가 전혀 없거나 영수증이 아닌 경우 {"no_text":true} 만 반환

응답은 반드시 다음 JSON만 (다른 텍스트 X):
{"vendor":"가게명","date":"YYYY-MM-DD","items":[{"name":"항목명","quantity":1,"price":50000}],"total":50000,"currency":"VND","category":"food"}`;

// ── 스캔 가능 여부 (서버 컴포넌트에서 호출) ──────────────────────

export function scanAvailable(): boolean {
  return getEnvKey("ANTHROPIC_API_KEY") !== null;
}

// ── 단일 파이프라인: Claude Vision → 구조화 파싱 ─────────────────

export async function scanReceipt(imageBase64: string): Promise<ReceiptOcrOutcome> {
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

  // Claude Vision API 호출 — 이미지 직접 전송
  try {
    // base64 데이터에서 media_type 추론
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
        max_tokens: 1024,
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
                text: "이 영수증 이미지를 파싱하세요.",
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

    // 비용 기록
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

    // 텍스트 없음 응답 처리
    if (text.includes('"no_text"') && text.includes("true")) {
      return { mode: "no_text", totalMs: Date.now() - startedAt };
    }

    let parsed: ParsedReceipt;
    try {
      const start = text.indexOf("{");
      const end = text.lastIndexOf("}");
      if (start === -1 || end === -1) throw new Error("JSON 미발견");
      parsed = JSON.parse(text.slice(start, end + 1));
    } catch (err) {
      return { mode: "error", stage: "vision", code: "parse_error", message: err instanceof Error ? err.message : "unknown", totalMs: Date.now() - startedAt };
    }

    // 필수 필드 검증
    if (typeof parsed.total !== "number" || !parsed.currency) {
      return { mode: "error", stage: "vision", code: "parse_error", message: "total 또는 currency 누락", totalMs: Date.now() - startedAt };
    }

    // 기본값 보정
    parsed.vendor = parsed.vendor || "알 수 없음";
    parsed.date = parsed.date || "";
    parsed.items = Array.isArray(parsed.items) ? parsed.items : [];
    parsed.category = parsed.category || "other";

    return {
      mode: "ok",
      receipt: parsed,
      cached: false,
      totalMs: Date.now() - startedAt,
    };
  } catch (err) {
    return { mode: "error", stage: "vision", code: "network", message: err instanceof Error ? err.message : "unknown", totalMs: Date.now() - startedAt };
  }
}

// ── 유틸 ─────────────────────────────────────────────────────────

function inferMediaType(base64: string): "image/jpeg" | "image/png" | "image/webp" | "image/gif" {
  if (base64.startsWith("/9j/")) return "image/jpeg";
  if (base64.startsWith("iVBOR")) return "image/png";
  if (base64.startsWith("UklGR")) return "image/webp";
  if (base64.startsWith("R0lGO")) return "image/gif";
  return "image/jpeg"; // 기본값
}
