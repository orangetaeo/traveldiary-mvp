/**
 * itinerary-generator 순수 함수 테스트 — llmItemsToItinerary + buildUserPrompt.
 *
 * generateItinerary 오케스트레이션은 itinerary-generator.test.ts에서 검증.
 * 여기서는 @internal export된 변환 순수 함수의 엣지 케이스만 직접 검증.
 */

import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

// 전이 의존성 mock (itinerary-generator → usage-quota → budget → audit-log → prisma)
vi.mock("@/lib/usage-quota", () => ({
  assertQuota: vi.fn(),
  recordExternalCall: vi.fn(),
  QuotaExceededError: class extends Error {},
}));
vi.mock("@/lib/autonomy/budget", () => ({
  assertBudget: vi.fn(),
  recordSpend: vi.fn(),
  BudgetExceededError: class extends Error {},
  AutonomyPausedError: class extends Error {},
}));
vi.mock("@/lib/autonomy/model-pricing", () => ({
  calculateCostUsd: () => 0,
}));

// LlmItem 타입은 export 되었으므로 직접 import
import {
  llmItemsToItinerary,
  buildUserPrompt,
  type LlmItem,
  type GenerateItineraryInput,
} from "@/lib/services/itinerary-generator";

/* ════════════════════════════════════════════
 * Fixture
 * ════════════════════════════════════════════ */

function makeInput(overrides?: Partial<GenerateItineraryInput>): GenerateItineraryInput {
  return {
    destination: "다낭",
    destinationCode: "DAD",
    startDate: "2026-05-10",
    nights: 3,
    companion: "friends",
    preferences: {
      vibes: ["food", "photo"],
      pace: "balanced",
      excludes: [],
    },
    ...overrides,
  };
}

function makeLlmItem(overrides?: Partial<LlmItem>): LlmItem {
  return {
    dayIndex: 0,
    time: "09:00",
    name: "미케비치 (My Khe Beach)",
    category: "spot",
    lat: 16.05,
    lng: 108.24,
    address: "다낭 미케비치",
    durationMinutes: 90,
    reason: "한국인에게 인기 있는 해변",
    ...overrides,
  };
}

/* ════════════════════════════════════════════
 * llmItemsToItinerary
 * ════════════════════════════════════════════ */

describe("llmItemsToItinerary — 정상 변환", () => {
  it("기본 필드 매핑 (name, category, location, evidence)", () => {
    const items = llmItemsToItinerary([makeLlmItem()], makeInput());
    expect(items).toHaveLength(1);
    const item = items[0];
    expect(item.name).toBe("미케비치 (My Khe Beach)");
    expect(item.category).toBe("spot");
    expect(item.location.lat).toBe(16.05);
    expect(item.location.lng).toBe(108.24);
    expect(item.location.address).toBe("다낭 미케비치");
    expect(item.durationMinutes).toBe(90);
    expect(item.evidence.reasons[0]).toBe("한국인에게 인기 있는 해변");
  });

  it("scheduledAt 타임스탬프 — Day 0, 09:00 → startDate T09:00:00.000Z", () => {
    const items = llmItemsToItinerary(
      [makeLlmItem({ dayIndex: 0, time: "09:00" })],
      makeInput({ startDate: "2026-05-10" }),
    );
    expect(items[0].scheduledAt).toBe("2026-05-10T09:00:00.000Z");
  });

  it("scheduledAt — Day 1, 14:30 → startDate+1 T14:30", () => {
    const items = llmItemsToItinerary(
      [makeLlmItem({ dayIndex: 1, time: "14:30" })],
      makeInput({ startDate: "2026-05-10" }),
    );
    expect(items[0].scheduledAt).toBe("2026-05-11T14:30:00.000Z");
  });

  it("scheduledAt — Day 3, 19:00 (마지막 날 저녁)", () => {
    const items = llmItemsToItinerary(
      [makeLlmItem({ dayIndex: 3, time: "19:00" })],
      makeInput({ startDate: "2026-05-10", nights: 3 }),
    );
    expect(items[0].scheduledAt).toBe("2026-05-13T19:00:00.000Z");
  });

  it("id 카운터 — 복수 아이템 ai-gen-1, ai-gen-2, ai-gen-3", () => {
    const items = llmItemsToItinerary(
      [makeLlmItem(), makeLlmItem(), makeLlmItem()],
      makeInput(),
    );
    expect(items.map((i) => i.id)).toEqual(["ai-gen-1", "ai-gen-2", "ai-gen-3"]);
  });

  it("고정 기본값 — flexibility, priority, flexMinutes, tripId, dependencies", () => {
    const items = llmItemsToItinerary([makeLlmItem()], makeInput());
    const item = items[0];
    expect(item.flexibility).toBe("flexible");
    expect(item.priority).toBe(3);
    expect(item.flexMinutes).toBe(30);
    expect(item.tripId).toBe("");
    expect(item.dependencies).toEqual([]);
  });

  it("evidence.sources는 빈 배열, verifiedAt은 ISO 문자열", () => {
    const items = llmItemsToItinerary([makeLlmItem()], makeInput());
    expect(items[0].evidence.sources).toEqual([]);
    expect(items[0].evidence.verifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

describe("llmItemsToItinerary — 누락 필드 fallback", () => {
  it("time 누락 → 09:00 기본값", () => {
    const raw = makeLlmItem({ time: undefined as unknown as string });
    const items = llmItemsToItinerary([raw], makeInput({ startDate: "2026-05-10" }));
    expect(items[0].scheduledAt).toBe("2026-05-10T09:00:00.000Z");
  });

  it("dayIndex 누락 → 0 기본값", () => {
    const raw = makeLlmItem({ dayIndex: undefined as unknown as number });
    const items = llmItemsToItinerary([raw], makeInput({ startDate: "2026-05-10" }));
    expect(items[0].dayIndex).toBe(0);
    expect(items[0].scheduledAt).toContain("2026-05-10");
  });

  it("durationMinutes 누락 → 60 기본값", () => {
    const raw = makeLlmItem({ durationMinutes: undefined as unknown as number });
    const items = llmItemsToItinerary([raw], makeInput());
    expect(items[0].durationMinutes).toBe(60);
  });

  it("name 누락 → '장소 N' 기본값", () => {
    const raw = makeLlmItem({ name: undefined as unknown as string });
    const items = llmItemsToItinerary([raw], makeInput());
    expect(items[0].name).toBe("장소 1");
  });

  it("lat/lng 누락 → 0 기본값", () => {
    const raw = makeLlmItem({
      lat: undefined as unknown as number,
      lng: undefined as unknown as number,
    });
    const items = llmItemsToItinerary([raw], makeInput());
    expect(items[0].location.lat).toBe(0);
    expect(items[0].location.lng).toBe(0);
  });

  it("address 누락 → 빈 문자열", () => {
    const raw = makeLlmItem({ address: undefined as unknown as string });
    const items = llmItemsToItinerary([raw], makeInput());
    expect(items[0].location.address).toBe("");
  });

  it("reason 누락 → 'AI가 추천한 일정입니다' 기본값", () => {
    const raw = makeLlmItem({ reason: undefined as unknown as string });
    const items = llmItemsToItinerary([raw], makeInput());
    expect(items[0].evidence.reasons[0]).toBe("AI가 추천한 일정입니다");
  });
});

describe("llmItemsToItinerary — 잘못된 category fallback", () => {
  it("유효하지 않은 category → 'spot' 기본값", () => {
    const raw = makeLlmItem({ category: "invalid" as LlmItem["category"] });
    const items = llmItemsToItinerary([raw], makeInput());
    expect(items[0].category).toBe("spot");
  });

  it("food → food (유효)", () => {
    const items = llmItemsToItinerary(
      [makeLlmItem({ category: "food" })],
      makeInput(),
    );
    expect(items[0].category).toBe("food");
  });

  it("shopping → shopping (유효)", () => {
    const items = llmItemsToItinerary(
      [makeLlmItem({ category: "shopping" })],
      makeInput(),
    );
    expect(items[0].category).toBe("shopping");
  });

  it("rest → rest (유효)", () => {
    const items = llmItemsToItinerary(
      [makeLlmItem({ category: "rest" })],
      makeInput(),
    );
    expect(items[0].category).toBe("rest");
  });
});

describe("llmItemsToItinerary — 시간 파싱 엣지", () => {
  it("자정 '00:00' → hours||9 fallback으로 T09:00 (0은 falsy)", () => {
    // hours=0, hours||9 → 9 (JavaScript falsy 특성)
    const items = llmItemsToItinerary(
      [makeLlmItem({ time: "00:00" })],
      makeInput({ startDate: "2026-05-10" }),
    );
    expect(items[0].scheduledAt).toBe("2026-05-10T09:00:00.000Z");
  });

  it("23:59 → T23:59:00.000Z", () => {
    const items = llmItemsToItinerary(
      [makeLlmItem({ time: "23:59" })],
      makeInput({ startDate: "2026-05-10" }),
    );
    expect(items[0].scheduledAt).toBe("2026-05-10T23:59:00.000Z");
  });

  it("빈 items 배열 → 빈 결과", () => {
    const items = llmItemsToItinerary([], makeInput());
    expect(items).toEqual([]);
  });
});

/* ════════════════════════════════════════════
 * buildUserPrompt
 * ════════════════════════════════════════════ */

describe("buildUserPrompt — pace 분기", () => {
  it("balanced → '균형' + 하루 약 4곳", () => {
    const prompt = buildUserPrompt(makeInput({ nights: 2 }));
    expect(prompt).toContain("균형");
    expect(prompt).toContain("하루 약 4곳");
    // 2박 3일 → 총 12개
    expect(prompt).toContain("총 일정 항목: 12개");
  });

  it("relaxed → '여유롭게' + 하루 약 3곳", () => {
    const prompt = buildUserPrompt(makeInput({
      nights: 1,
      preferences: { vibes: [], pace: "relaxed", excludes: [] },
    }));
    expect(prompt).toContain("여유롭게");
    expect(prompt).toContain("하루 약 3곳");
    // 1박 2일 → 총 6개
    expect(prompt).toContain("총 일정 항목: 6개");
  });

  it("packed → '빡빡하게' + 하루 약 5곳", () => {
    const prompt = buildUserPrompt(makeInput({
      nights: 0,
      preferences: { vibes: [], pace: "packed", excludes: [] },
    }));
    expect(prompt).toContain("빡빡하게");
    expect(prompt).toContain("하루 약 5곳");
    // 0박 1일 → 총 5개
    expect(prompt).toContain("총 일정 항목: 5개");
  });

  it("미지원 pace → '균형' 기본값", () => {
    const prompt = buildUserPrompt(makeInput({
      preferences: { vibes: [], pace: "unknown" as string, excludes: [] },
    }));
    expect(prompt).toContain("균형");
  });
});

describe("buildUserPrompt — vibes / excludes", () => {
  it("vibes 복수 → 쉼표로 합침", () => {
    const prompt = buildUserPrompt(makeInput({
      preferences: { vibes: ["food", "photo", "culture"], pace: "balanced", excludes: [] },
    }));
    expect(prompt).toContain("food, photo, culture");
  });

  it("vibes 비어있음 → '균형'", () => {
    const prompt = buildUserPrompt(makeInput({
      preferences: { vibes: [], pace: "balanced", excludes: [] },
    }));
    expect(prompt).toContain("여행 스타일: 균형");
  });

  it("excludes 있으면 → '제외: X, Y' 포함", () => {
    const prompt = buildUserPrompt(makeInput({
      preferences: { vibes: [], pace: "balanced", excludes: ["해산물", "견과류"] },
    }));
    expect(prompt).toContain("제외: 해산물, 견과류");
  });

  it("excludes 비어있으면 → '제외' 텍스트 미포함", () => {
    const prompt = buildUserPrompt(makeInput({
      preferences: { vibes: [], pace: "balanced", excludes: [] },
    }));
    expect(prompt).not.toContain("제외");
  });
});

describe("buildUserPrompt — companion 매핑", () => {
  it("solo → '혼자'", () => {
    const prompt = buildUserPrompt(makeInput({ companion: "solo" }));
    expect(prompt).toContain("동행: 혼자");
  });

  it("friends → '친구와'", () => {
    const prompt = buildUserPrompt(makeInput({ companion: "friends" }));
    expect(prompt).toContain("동행: 친구와");
  });

  it("family → '가족과'", () => {
    const prompt = buildUserPrompt(makeInput({ companion: "family" }));
    expect(prompt).toContain("동행: 가족과");
  });

  it("group → '단체'", () => {
    const prompt = buildUserPrompt(makeInput({ companion: "group" }));
    expect(prompt).toContain("동행: 단체");
  });

  it("미지원 companion → 원문 그대로", () => {
    const prompt = buildUserPrompt(makeInput({ companion: "couple" }));
    expect(prompt).toContain("동행: couple");
  });
});

describe("buildUserPrompt — destination / nights 반영", () => {
  it("destination + nights → 'N박 M일 여행' 포함", () => {
    const prompt = buildUserPrompt(makeInput({
      destination: "호이안",
      nights: 2,
    }));
    expect(prompt).toContain("호이안 2박 3일 여행");
  });

  it("nights=0 당일여행 → '0박 1일'", () => {
    const prompt = buildUserPrompt(makeInput({
      destination: "다낭",
      nights: 0,
    }));
    expect(prompt).toContain("다낭 0박 1일 여행");
  });

  it("Day 범위 — Day 0 ~ Day N", () => {
    const prompt = buildUserPrompt(makeInput({ nights: 4 }));
    // 4박 5일 → Day 0 ~ Day 4
    expect(prompt).toContain("Day 0 ~ Day 4");
  });

  it("destination 이름이 프롬프트에 반복됨 (실제 장소 추천 문맥)", () => {
    const prompt = buildUserPrompt(makeInput({ destination: "나트랑" }));
    // "나트랑"이 최소 2회 등장 (제목 + 마지막 문장)
    const count = (prompt.match(/나트랑/g) ?? []).length;
    expect(count).toBeGreaterThanOrEqual(2);
  });
});
