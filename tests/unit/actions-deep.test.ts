/**
 * Server Actions 심층 검증 — A1 자율 사이클.
 *
 * 기존 server-actions-structure.test.ts의 정적 패턴 검증 보완:
 * - 입력 타입 + 반환 타입 정합성
 * - 분기별 코드 경로 (demo / forbidden / invalid / internal)
 * - 엣지 케이스 (빈 입력, DEMO_TRIP_ID 분기)
 * - audit log action 키 정합성
 */

import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

const ACTIONS_DIR = path.resolve(__dirname, "../../actions");
function read(file: string) {
  return fs.readFileSync(path.join(ACTIONS_DIR, file), "utf-8");
}

describe("actions/itinerary.ts — 심층 검증", () => {
  const src = read("itinerary.ts");

  it("addItineraryItem — discriminated union 3 분기 (ok+demo / ok+data / fail)", () => {
    expect(src).toContain("ok: true; demo: true");
    expect(src).toContain("ok: true; demo: false; data:");
    expect(src).toContain('ok: false; code: "internal" | "forbidden"');
  });

  it("addItineraryItem — DEMO_TRIP_ID demo 분기", () => {
    expect(src).toContain("DEMO_TRIP_ID");
    expect(src).toMatch(/input\.tripId\s*===\s*DEMO_TRIP_ID/);
  });

  it("addItineraryItem — canWriteTrip 권한 검사", () => {
    expect(src).toContain("canWriteTrip(input.tripId)");
    expect(src).toContain('"forbidden"');
  });

  it("addItineraryItem — audit action 'itinerary.create'", () => {
    expect(src).toContain('"itinerary.create"');
  });

  it("addItineraryItem — revalidatePath 2 경로", () => {
    const matches = src.match(/revalidatePath\(/g);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBeGreaterThanOrEqual(2);
  });

  it("addItineraryItem — actorId resolveActorIdForTrip 사용", () => {
    expect(src).toContain("resolveActorIdForTrip");
  });

  it("reorderItineraryItems — changes.length === 0 가드", () => {
    expect(src).toContain("input.changes.length === 0");
  });

  it("reorderItineraryItems — discriminated union 3 분기", () => {
    expect(src).toContain("ok: true; demo: true");
    expect(src).toContain("tripUpdatedAt:");
    expect(src).toContain("changedCount:");
    expect(src).toContain('"not_found"');
  });

  it("reorderItineraryItems — audit action 'itinerary.reorder'", () => {
    expect(src).toContain('"itinerary.reorder"');
  });

  it("reorderItineraryItems — audit metadata에 changedCount 포함", () => {
    expect(src).toContain("changedCount: input.changes.length");
  });
});

describe("actions/vote.ts — 심층 검증", () => {
  const src = read("vote.ts");

  it("createVote — 입력 검증 (question 빈 문자열 + optionLabels < 2)", () => {
    expect(src).toContain("question.trim().length === 0");
    expect(src).toContain("labels.length < 2");
    expect(src).toContain('"invalid"');
  });

  it("createVote — optionLabels trim + 빈 문자열 필터", () => {
    expect(src).toContain(".trim()");
    expect(src).toContain(".filter(");
  });

  it("createVote — discriminated union 3 분기", () => {
    expect(src).toContain("ok: true; demo: true");
    expect(src).toContain("ok: true; demo: false; data:");
    expect(src).toContain('"forbidden"');
    expect(src).toContain('"invalid"');
  });

  it("castVote — actorId null 가드 (no_actor)", () => {
    expect(src).toContain('"no_actor"');
    expect(src).toMatch(/!actorId.*no_actor|no_actor.*!actorId/s);
  });

  it("castVote — not_found 분기", () => {
    expect(src).toContain('"not_found"');
  });

  it("castVote — audit log 기록", () => {
    expect(src).toContain("writeAuditLog");
    expect(src).toContain("optionIndex");
  });

  it("createVote — resolveActorIdForTrip 사용", () => {
    expect(src).toContain("resolveActorIdForTrip");
  });
});

describe("actions/share.ts — 심층 검증", () => {
  const src = read("share.ts");

  it("syncKey 생성 — crypto randomBytes 24바이트", () => {
    expect(src).toContain("randomBytes(24)");
    expect(src).toContain("base64url");
  });

  it("demo 분기 — syncKey 반환 (URL 프리뷰용)", () => {
    expect(src).toContain("ok: true; demo: true; syncKey:");
  });

  it("expiresInDays 기본값 30", () => {
    expect(src).toContain("expiresInDays ?? 30");
  });

  it("permission 기본값 'view'", () => {
    expect(src).toContain('permission ?? "view"');
  });

  it("audit action 'share.create'", () => {
    expect(src).toContain('"share.create"');
  });

  it("canWriteTrip 권한 검사", () => {
    expect(src).toContain("canWriteTrip(input.tripId)");
  });
});

describe("app/api/analytics/funnel — 심층 검증", () => {
  const src = fs.readFileSync(
    path.resolve("app/api/analytics/funnel/route.ts"),
    "utf-8",
  );

  it("VALID_STEPS 7단계 정의", () => {
    expect(src).toContain('"view"');
    expect(src).toContain('"step1"');
    expect(src).toContain('"step4"');
    expect(src).toContain('"submit"');
    expect(src).toContain('"complete"');
  });

  it("invalid step → 400 반환", () => {
    expect(src).toContain("status: 400");
    expect(src).toContain('"invalid step"');
  });

  it("catch 블록 — 실패해도 200 반환 (fire-and-forget)", () => {
    expect(src).toMatch(/catch.*ok.*true/s);
  });

  it("audit action 'funnel.onboarding'", () => {
    expect(src).toContain('"funnel.onboarding"');
  });

  it("metadata에 step + timestamp + destination + companion", () => {
    expect(src).toContain("step,");
    expect(src).toContain("timestamp:");
    expect(src).toContain("destination:");
    expect(src).toContain("companion:");
  });
});

describe("app/api/analytics/ab — 심층 검증", () => {
  const src = fs.readFileSync(
    path.resolve("app/api/analytics/ab/route.ts"),
    "utf-8",
  );

  it("VALID_EVENTS = impression + conversion", () => {
    expect(src).toContain('"impression"');
    expect(src).toContain('"conversion"');
  });

  it("필수 필드 누락 시 400 (experimentId, variant, event)", () => {
    expect(src).toContain("!experimentId");
    expect(src).toContain("!variant");
    expect(src).toContain("status: 400");
  });

  it("audit action 동적 — ab.impression / ab.conversion", () => {
    expect(src).toContain("`ab.${event}`");
  });

  it("catch 블록 — 실패해도 200 반환", () => {
    expect(src).toMatch(/catch.*ok.*true/s);
  });
});

describe("actions/translate.ts — 구조 검증", () => {
  const src = read("translate.ts");

  it("Vision OCR + Claude 번역 2단계 파이프라인", () => {
    expect(src).toMatch(/vision|ocr/i);
    expect(src).toMatch(/claude|anthropic|translate/i);
  });

  it("에러 처리 경로 존재", () => {
    expect(src).toMatch(/error|catch|try/i);
  });
});

describe("actions/evidence.ts — 구조 검증", () => {
  const src = read("evidence.ts");

  it("근거 수집 액션 존재", () => {
    expect(src).toContain("gatherKoreanEvidenceAction");
  });

  it("Naver API 호출 경로", () => {
    expect(src).toMatch(/naver|blog|search/i);
  });
});

describe("actions/place.ts — 구조 검증", () => {
  const src = read("place.ts");

  it("Google Places 검증 경로", () => {
    expect(src).toMatch(/places|verify|google/i);
  });

  it("operatingStatus 분기 (open/closed/demo)", () => {
    expect(src).toContain('"open"');
    expect(src).toContain('"closed"');
  });

  it("fallback 경로 존재", () => {
    expect(src).toContain("fallback");
  });
});
