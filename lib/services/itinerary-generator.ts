/**
 * AI 일정 생성기 — BLOCKER1 (M1 핵심).
 *
 * Claude API로 베트남 도시 일정을 생성하고 구조화된 ItineraryItem[]로 반환.
 * 데모 fallback: ANTHROPIC_API_KEY 없으면 시드 일정 반환.
 *
 * 비용 가드: assertQuota + assertBudget 선행 (AAAA2 패턴).
 * 모델: claude-haiku-4-5-20251001 (빠르고 저렴, 구조화 JSON 충분).
 */

import "server-only";

import {
  assertQuota,
  recordExternalCall,
  QuotaExceededError,
} from "@/lib/usage-quota";
import {
  assertBudget,
  AutonomyPausedError,
  BudgetExceededError,
  recordSpend,
} from "@/lib/autonomy/budget";
import { calculateCostUsd } from "@/lib/autonomy/model-pricing";
import type { ItineraryItem } from "@/lib/types";
import { getEnvKey } from "@/lib/utils/env";

const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";

// ═══════════════════════════════════════════
// 입출력 타입
// ═══════════════════════════════════════════

export interface GenerateItineraryInput {
  destination: string;
  destinationCode: string;
  startDate: string;       // ISO date (YYYY-MM-DD)
  nights: number;
  companion: string;       // "solo" | "friends" | "family" | "group"
  preferences: {
    vibes: string[];       // ["food", "photo", "culture", ...]
    pace: string;          // "relaxed" | "balanced" | "packed"
    excludes: string[];    // 알레르기/제외 항목
  };
}

/** LLM이 반환하는 단일 일정 항목 (JSON 스키마) */
interface LlmItem {
  dayIndex: number;
  time: string;            // "HH:MM"
  name: string;            // "즈엉동 야시장 (Dinh Cau Night Market)"
  category: "food" | "spot" | "shopping" | "rest";
  lat: number;
  lng: number;
  address: string;
  durationMinutes: number;
  reason: string;          // 추천 근거 (evidence.reasons[0])
}

export type GenerateItineraryOutcome =
  | { mode: "ok"; items: ItineraryItem[]; model: string; cached: false }
  | { mode: "demo"; reason: string }
  | { mode: "error"; code: string; message?: string };

// ═══════════════════════════════════════════
// 프롬프트
// ═══════════════════════════════════════════

function buildSystemPrompt(): string {
  return `당신은 베트남 전문 여행 플래너입니다. 한국인 자유여행자를 위한 일정을 생성합니다.

## 규칙
1. 반드시 JSON만 응답하세요 (다른 텍스트 X).
2. 실제 존재하는 장소만 추천하세요. 가상의 장소 금지.
3. 각 장소의 실제 위도/경도를 정확하게 제공하세요.
4. 동선을 고려해 가까운 장소끼리 묶으세요.
5. 한국어 이름 (영어/베트남어 원명) 형식으로 작성하세요.
6. 하루 일정은 오전 8시~밤 9시 사이에 배치하세요.
7. 식사 시간대를 고려하세요: 아침 7-9시, 점심 11:30-13시, 저녁 17:30-19:30.
8. category는 food/spot/shopping/rest 중 하나만.
9. reason은 한국어로 1문장 — 왜 이 장소를 추천하는지.

## 응답 JSON 스키마
{"items":[{"dayIndex":0,"time":"08:00","name":"장소명 (원명)","category":"food","lat":10.123,"lng":103.456,"address":"주소","durationMinutes":60,"reason":"추천 근거"}]}`;
}

function buildUserPrompt(input: GenerateItineraryInput): string {
  const days = input.nights + 1;
  const vibesKo = input.preferences.vibes.length > 0
    ? input.preferences.vibes.join(", ")
    : "균형";
  const paceKo = { relaxed: "여유롭게", balanced: "균형", packed: "빡빡하게" }[
    input.preferences.pace
  ] ?? "균형";
  const companionKo = {
    solo: "혼자",
    friends: "친구와",
    family: "가족과",
    group: "단체",
  }[input.companion] ?? input.companion;
  const excludes = input.preferences.excludes.length > 0
    ? `제외: ${input.preferences.excludes.join(", ")}`
    : "";

  const itemsPerDay = input.preferences.pace === "packed" ? 5
    : input.preferences.pace === "relaxed" ? 3 : 4;

  return `${input.destination} ${input.nights}박 ${days}일 여행 일정을 만들어주세요.

- 여행 스타일: ${vibesKo}
- 페이스: ${paceKo} (하루 약 ${itemsPerDay}곳)
- 동행: ${companionKo}
${excludes ? `- ${excludes}` : ""}
- 총 일정 항목: ${days * itemsPerDay}개 (Day 0 ~ Day ${days - 1})

실제 존재하는 ${input.destination}의 인기 장소, 맛집, 관광지를 추천해주세요.`;
}

// ═══════════════════════════════════════════
// API 호출
// ═══════════════════════════════════════════

function getApiKey(): string | null {
  return getEnvKey("ANTHROPIC_API_KEY");
}

export function aiGenerationAvailable(): boolean {
  return getApiKey() !== null;
}

export async function generateItinerary(
  input: GenerateItineraryInput,
): Promise<GenerateItineraryOutcome> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return { mode: "demo", reason: "no_api_key" };
  }

  // 비용 가드
  try {
    assertQuota("anthropic");
    assertBudget();
  } catch (err) {
    if (err instanceof QuotaExceededError) {
      recordExternalCall("anthropic", { blockedBy: "quota" });
      return { mode: "demo", reason: "quota_exceeded" };
    }
    if (err instanceof BudgetExceededError) {
      recordExternalCall("anthropic", { blockedBy: "budget" });
      return { mode: "demo", reason: "budget_exceeded" };
    }
    if (err instanceof AutonomyPausedError) {
      recordExternalCall("anthropic", { blockedBy: "emergency" });
      return { mode: "demo", reason: "autonomy_paused" };
    }
    throw err;
  }

  // API 호출
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
        max_tokens: 4096,
        system: buildSystemPrompt(),
        messages: [
          { role: "user", content: buildUserPrompt(input) },
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

    // 토큰 비용 기록
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

    // JSON 추출 (모델이 JSON 외 텍스트 섞을 수 있음)
    const text = json.content?.find((c) => c.type === "text")?.text ?? "";
    let parsed: { items: LlmItem[] };
    try {
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

    if (!Array.isArray(parsed.items) || parsed.items.length === 0) {
      return { mode: "error", code: "parse_error", message: "items empty" };
    }

    // LlmItem[] → ItineraryItem[] 변환
    const items = llmItemsToItinerary(parsed.items, input);

    return { mode: "ok", items, model: MODEL, cached: false };
  } catch (err) {
    return {
      mode: "error",
      code: "network",
      message: err instanceof Error ? err.message : "unknown",
    };
  }
}

// ═══════════════════════════════════════════
// 변환 헬퍼
// ═══════════════════════════════════════════

function llmItemsToItinerary(
  llmItems: LlmItem[],
  input: GenerateItineraryInput,
): ItineraryItem[] {
  const tripStartMs = new Date(`${input.startDate}T00:00:00Z`).getTime();
  let counter = 0;

  return llmItems.map((item) => {
    counter++;
    const [hours, minutes] = (item.time ?? "09:00").split(":").map(Number);
    const dayOffsetMs = (item.dayIndex ?? 0) * 24 * 60 * 60 * 1000;
    const timeMs = ((hours || 9) * 60 + (minutes || 0)) * 60_000;
    const scheduledAt = new Date(tripStartMs + dayOffsetMs + timeMs);

    return {
      id: `ai-gen-${counter}`,
      tripId: "",   // 호출처에서 할당
      dayIndex: item.dayIndex ?? 0,
      scheduledAt: scheduledAt.toISOString(),
      durationMinutes: item.durationMinutes ?? 60,
      flexibility: "flexible" as const,
      priority: 3 as const,
      flexMinutes: 30,
      name: item.name ?? `장소 ${counter}`,
      category: (["food", "spot", "shopping", "rest"].includes(item.category)
        ? item.category
        : "spot") as ItineraryItem["category"],
      location: {
        lat: item.lat ?? 0,
        lng: item.lng ?? 0,
        address: item.address ?? "",
      },
      evidence: {
        reasons: [item.reason ?? "AI가 추천한 일정입니다"],
        sources: [],
        verifiedAt: new Date().toISOString(),
      },
      dependencies: [],
    };
  });
}
