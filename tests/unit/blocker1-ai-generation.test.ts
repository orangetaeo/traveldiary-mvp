/**
 * BLOCKER1 — M1 AI 일정 생성 구조 검증.
 *
 * Claude API 실호출은 테스트하지 않음 (외부 의존).
 * 구조·타입·fallback 경로를 검증.
 */

import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

// ═══════════════════════════════════════════
// 1. itinerary-generator.ts 구조
// ═══════════════════════════════════════════

describe("BLOCKER1 — itinerary-generator 모듈 구조", () => {
  const src = fs.readFileSync(
    path.resolve("lib/services/itinerary-generator.ts"),
    "utf-8",
  );

  it("server-only import", () => {
    expect(src).toContain('"server-only"');
  });

  it("Claude API URL 정의", () => {
    expect(src).toContain("https://api.anthropic.com/v1/messages");
  });

  it("모델은 claude-haiku", () => {
    expect(src).toContain("claude-haiku-4-5-20251001");
  });

  it("export generateItinerary 함수", () => {
    expect(src).toContain("export async function generateItinerary");
  });

  it("export aiGenerationAvailable 함수", () => {
    expect(src).toContain("export function aiGenerationAvailable");
  });

  it("assertQuota + assertBudget 비용 가드", () => {
    expect(src).toContain("assertQuota");
    expect(src).toContain("assertBudget");
  });

  it("recordExternalCall 호출", () => {
    expect(src).toContain('recordExternalCall("anthropic")');
  });

  it("recordSpend 토큰 비용 기록", () => {
    expect(src).toContain("recordSpend");
  });

  it("discriminated union 반환 타입 (ok/demo/error)", () => {
    expect(src).toContain('mode: "ok"');
    expect(src).toContain('mode: "demo"');
    expect(src).toContain('mode: "error"');
  });

  it("프롬프트에 베트남 전문 플래너 명시", () => {
    expect(src).toContain("베트남 전문 여행 플래너");
  });

  it("JSON 스키마 가이드 포함", () => {
    expect(src).toContain("dayIndex");
    expect(src).toContain("durationMinutes");
    expect(src).toContain("reason");
  });

  it("LLM 응답 JSON 추출 (첫 { ~ 마지막 })", () => {
    expect(src).toContain('text.indexOf("{")');
    expect(src).toContain('text.lastIndexOf("}")');
  });

  it("API 키 없으면 demo fallback", () => {
    // getApiKey() null → mode: "demo"
    expect(src).toContain('reason: "no_api_key"');
  });

  it("quota 초과 시 demo fallback", () => {
    expect(src).toContain('reason: "quota_exceeded"');
  });

  it("budget 초과 시 demo fallback", () => {
    expect(src).toContain('reason: "budget_exceeded"');
  });
});

// ═══════════════════════════════════════════
// 2. actions/trip.ts — AI 생성 통합
// ═══════════════════════════════════════════

describe("BLOCKER1 — trip.ts 서버 액션 AI 통합", () => {
  const src = fs.readFileSync(
    path.resolve("actions/trip.ts"),
    "utf-8",
  );

  it("generateItinerary import", () => {
    expect(src).toContain("generateItinerary");
  });

  it("aiGenerationAvailable import", () => {
    expect(src).toContain("aiGenerationAvailable");
  });

  it("createTripWithAiItems import", () => {
    expect(src).toContain("createTripWithAiItems");
  });

  it("AI 성공 시 generatedBy: ai audit 메타데이터", () => {
    expect(src).toContain('generatedBy: "ai"');
  });

  it("시드 fallback 시 generatedBy: seed audit 메타데이터", () => {
    expect(src).toContain('generatedBy: "seed"');
  });

  it("writeAuditLog 호출 (S-13 절대 규칙)", () => {
    expect(src).toContain("writeAuditLog");
  });
});

// ═══════════════════════════════════════════
// 3. trip.repository — createTripWithAiItems
// ═══════════════════════════════════════════

describe("BLOCKER1 — repository createTripWithAiItems", () => {
  const src = fs.readFileSync(
    path.resolve("lib/repositories/trip.repository.ts"),
    "utf-8",
  );

  it("createTripWithAiItems export", () => {
    expect(src).toContain("export async function createTripWithAiItems");
  });

  it("트랜잭션 사용", () => {
    // createTripWithAiItems 내에서 $transaction 사용
    const fnStart = src.indexOf("createTripWithAiItems");
    const fnBlock = src.slice(fnStart, fnStart + 2000);
    expect(fnBlock).toContain("$transaction");
  });

  it("User upsert (11b 패턴)", () => {
    const fnStart = src.indexOf("createTripWithAiItems");
    const fnBlock = src.slice(fnStart, fnStart + 2000);
    expect(fnBlock).toContain("user.upsert");
  });

  it("itineraryItem.create per item", () => {
    const fnStart = src.indexOf("createTripWithAiItems");
    const fnBlock = src.slice(fnStart, fnStart + 2000);
    expect(fnBlock).toContain("itineraryItem.create");
  });
});

// ═══════════════════════════════════════════
// 4. creating 페이지 — 동적 destination
// ═══════════════════════════════════════════

describe("BLOCKER1 — creating 페이지 동적 표시", () => {
  const src = fs.readFileSync(
    path.resolve("app/itinerary/creating/page.tsx"),
    "utf-8",
  );

  it("searchParams에서 dest 추출", () => {
    expect(src).toContain('searchParams.get("dest")');
  });

  it("동적 destination 표시", () => {
    expect(src).toContain("{destination} 여행을 그리고 있어요");
  });

  it("AI 일정 생성 단계 포함", () => {
    expect(src).toContain("AI 일정 생성");
  });

  it("인기 장소 검토 단계에 destination 반영", () => {
    expect(src).toContain("인기 장소 검토");
  });
});

// ═══════════════════════════════════════════
// 5. onboarding — dest 파라미터 전달
// ═══════════════════════════════════════════

describe("BLOCKER1 — onboarding dest 파라미터", () => {
  const src = fs.readFileSync(
    path.resolve("app/onboarding/page.tsx"),
    "utf-8",
  );

  it("creating 페이지로 dest 파라미터 전달", () => {
    expect(src).toContain("dest=");
    expect(src).toContain("encodeURIComponent");
  });
});
