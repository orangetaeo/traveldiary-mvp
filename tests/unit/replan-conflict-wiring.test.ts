/**
 * #36 ReplanConflictModal wiring 회귀 가드 (ADR-045).
 *
 * Stitch #36 (196f55b628d142989234edb8fb0ce602) — Live Replan 시간대 충돌 모달.
 * Phase 7 세션 C에서 컴포넌트는 작성되었으나 wiring 미완 → D 카테고리 잔여 2.
 *
 * 변경 (2026-05-09):
 *  - lib/replan.ts: ReplanResult export + conflicts: ItineraryItem[] 필드 추가.
 *    추천/안전은 빈 배열, 강행만 booked > fixed 우선 정렬로 채움.
 *  - components/itinerary/ReplanModal.tsx: 강행 옵션 클릭 + conflicts.length > 0 시
 *    ReplanConflictModal 마운트. onKeepA(트리거)→강행 / onKeepB(예약)→추천 / onKeepBoth(시간조정)→안전 매핑.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { generateReplanOptions } from "@/lib/replan";
import type { ItineraryItem } from "@/lib/types";

const REPLAN_LIB_PATH = path.resolve(__dirname, "../../lib/replan.ts");
const REPLAN_MODAL_PATH = path.resolve(
  __dirname,
  "../../components/itinerary/ReplanModal.tsx",
);

const replanLibSource = readFileSync(REPLAN_LIB_PATH, "utf-8");
const replanModalSource = readFileSync(REPLAN_MODAL_PATH, "utf-8");

// ── 픽스처 ──────────────────────────────────────────────────────────
function mkItem(
  id: string,
  scheduledAt: string,
  flexibility: "fixed" | "flexible" | "booked",
  category: "food" | "spot" | "shopping" | "rest" = "spot",
): ItineraryItem {
  return {
    id,
    tripId: "t1",
    name: `Item ${id}`,
    scheduledAt,
    durationMinutes: 60,
    flexibility,
    priority: 3,
    flexMinutes: 0,
    dependencies: [],
    category,
    location: { lat: 0, lng: 0, address: "" },
    evidence: { reasons: [], sources: [], verifiedAt: "2026-07-01T00:00:00Z" },
    dayIndex: 0,
  };
}

// ═══════════════════════════════════════════════════════════════════
// lib/replan.ts — ReplanResult.conflicts 채움 로직
// ═══════════════════════════════════════════════════════════════════

describe("#36 lib/replan — ReplanResult.conflicts 필드", () => {
  it("ReplanResult interface가 export로 노출", () => {
    expect(replanLibSource).toMatch(/export\s+interface\s+ReplanResult\s*\{/);
  });

  it("conflicts: ItineraryItem[] 필드 선언", () => {
    expect(replanLibSource).toMatch(/conflicts:\s*ItineraryItem\[\]/);
  });

  it("추천(buildRecommendOption) — conflicts 빈 배열로 채움", () => {
    const recommendBlock = replanLibSource.match(
      /function buildRecommendOption[\s\S]*?(?=\n\/\/ ── 안전)/,
    );
    expect(recommendBlock).toBeTruthy();
    expect(recommendBlock?.[0]).toMatch(/conflicts:\s*\[\]/);
  });

  it("안전(buildSafeOption) — conflicts 빈 배열로 채움", () => {
    const safeBlock = replanLibSource.match(
      /function buildSafeOption[\s\S]*?(?=\n\/\/ ── 강행)/,
    );
    expect(safeBlock).toBeTruthy();
    expect(safeBlock?.[0]).toMatch(/conflicts:\s*\[\]/);
  });

  it("강행(buildForceOption) — booked > fixed 우선 정렬로 conflicts 채움", () => {
    const forceBlock = replanLibSource.match(
      /function buildForceOption[\s\S]*?(?=\n\/\/ ═{3,})/,
    );
    expect(forceBlock).toBeTruthy();
    expect(forceBlock?.[0]).toMatch(/const conflicts:\s*ItineraryItem\[\]\s*=\s*\[\.\.\.bookedConflicts,\s*\.\.\.fixedConflicts\]/);
    expect(forceBlock?.[0]).toMatch(/conflicts,/);
  });
});

describe("#36 generateReplanOptions — conflicts 런타임 검증", () => {
  it("trigger 이후 booked 항목 있으면 강행 conflicts에 포함", () => {
    const items = [
      mkItem("a", "2026-07-01T10:00:00Z", "flexible"),
      mkItem("b", "2026-07-01T11:00:00Z", "booked"),
      mkItem("c", "2026-07-01T12:00:00Z", "flexible"),
    ];
    const results = generateReplanOptions(items, {
      type: "delay",
      itemId: "a",
      minutes: 60,
    });
    const force = results.find((r) => r.option.id === "option-force");
    expect(force).toBeTruthy();
    expect(force?.conflicts.map((c) => c.id)).toContain("b");
  });

  it("trigger 이후 fixed 항목 있으면 강행 conflicts에 포함", () => {
    const items = [
      mkItem("a", "2026-07-01T10:00:00Z", "flexible"),
      mkItem("b", "2026-07-01T11:00:00Z", "fixed"),
    ];
    const results = generateReplanOptions(items, {
      type: "delay",
      itemId: "a",
      minutes: 30,
    });
    const force = results.find((r) => r.option.id === "option-force");
    expect(force?.conflicts.map((c) => c.id)).toContain("b");
  });

  it("booked가 fixed보다 먼저 정렬", () => {
    const items = [
      mkItem("a", "2026-07-01T10:00:00Z", "flexible"),
      mkItem("b-fixed", "2026-07-01T11:00:00Z", "fixed"),
      mkItem("c-booked", "2026-07-01T12:00:00Z", "booked"),
    ];
    const results = generateReplanOptions(items, {
      type: "delay",
      itemId: "a",
      minutes: 30,
    });
    const force = results.find((r) => r.option.id === "option-force");
    expect(force?.conflicts.map((c) => c.id)).toEqual(["c-booked", "b-fixed"]);
  });

  it("trigger 이후 모두 flexible이면 conflicts 빈 배열", () => {
    const items = [
      mkItem("a", "2026-07-01T10:00:00Z", "flexible"),
      mkItem("b", "2026-07-01T11:00:00Z", "flexible"),
    ];
    const results = generateReplanOptions(items, {
      type: "delay",
      itemId: "a",
      minutes: 30,
    });
    const force = results.find((r) => r.option.id === "option-force");
    expect(force?.conflicts).toEqual([]);
  });

  it("추천/안전은 항상 conflicts 빈 배열", () => {
    const items = [
      mkItem("a", "2026-07-01T10:00:00Z", "flexible"),
      mkItem("b", "2026-07-01T11:00:00Z", "booked"),
    ];
    const results = generateReplanOptions(items, {
      type: "delay",
      itemId: "a",
      minutes: 30,
    });
    const recommend = results.find((r) => r.option.id === "option-recommend");
    const safe = results.find((r) => r.option.id === "option-safe");
    expect(recommend?.conflicts).toEqual([]);
    expect(safe?.conflicts).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════
// components/itinerary/ReplanModal.tsx — wiring 가드
// ═══════════════════════════════════════════════════════════════════

describe("#36 ReplanModal — ReplanConflictModal wiring", () => {
  it("ReplanConflictModal을 components/modals에서 import", () => {
    expect(replanModalSource).toMatch(
      /import\s+ReplanConflictModal\s+from\s+["']@\/components\/modals\/ReplanConflictModal["']/,
    );
  });

  it("ReplanResult 타입 import 추가", () => {
    expect(replanModalSource).toMatch(/ReplanResult/);
    expect(replanModalSource).toMatch(/import\s+type\s+\{[^}]*ReplanResult[^}]*\}\s+from\s+["']@\/lib\/replan["']/);
  });

  it("results props 타입이 ReplanResult[]로 변경", () => {
    expect(replanModalSource).toMatch(/results:\s*ReplanResult\[\]/);
  });

  it("pendingForceResult state로 충돌 모달 트리거 관리", () => {
    expect(replanModalSource).toMatch(/setPendingForceResult/);
    expect(replanModalSource).toMatch(/useState<ReplanResult\s*\|\s*null>/);
  });

  it("handleOptionClick: 강행 + conflicts.length > 0 시 setPendingForceResult, 아니면 onApply", () => {
    expect(replanModalSource).toMatch(/handleOptionClick/);
    expect(replanModalSource).toMatch(/option\.id\s*===\s*["']option-force["']/);
    expect(replanModalSource).toMatch(/result\.conflicts\.length\s*>\s*0/);
  });

  it("handleKeepTrigger — 강행 itemsAfter 그대로 적용 (트리거 항목 유지)", () => {
    expect(replanModalSource).toMatch(/handleKeepTrigger/);
    const block = replanModalSource.match(
      /handleKeepTrigger[\s\S]*?(?=const handleKeepBooked)/,
    );
    expect(block?.[0]).toMatch(/onApply\(pendingForceResult\.itemsAfter,\s*pendingForceResult\.option\)/);
  });

  it("handleKeepBooked — 추천 옵션으로 전환 (예약 보호)", () => {
    expect(replanModalSource).toMatch(/handleKeepBooked/);
    const block = replanModalSource.match(
      /handleKeepBooked[\s\S]*?(?=const handleKeepBoth)/,
    );
    expect(block?.[0]).toMatch(/option\.id\s*===\s*["']option-recommend["']/);
  });

  it("handleKeepBoth — 안전 옵션으로 전환 (+30분 buffer)", () => {
    expect(replanModalSource).toMatch(/handleKeepBoth/);
    const block = replanModalSource.match(
      /handleKeepBoth[\s\S]*?(?=if \(!open)/,
    );
    expect(block?.[0]).toMatch(/option\.id\s*===\s*["']option-safe["']/);
  });

  it("ReplanConflictModal이 onKeepA/onKeepB/onKeepBoth 핸들러로 마운트", () => {
    expect(replanModalSource).toMatch(/<ReplanConflictModal[\s\S]*?onKeepA=\{handleKeepTrigger\}[\s\S]*?onKeepB=\{handleKeepBooked\}[\s\S]*?onKeepBoth=\{handleKeepBoth\}/);
  });

  it("onClose 시 setPendingForceResult(null) 호출 (취소 시 강행 안 함)", () => {
    expect(replanModalSource).toMatch(/handleConflictClose/);
    expect(replanModalSource).toMatch(/setPendingForceResult\(null\)/);
  });

  it("formatItemTime — UTC HH:MM 포맷", () => {
    expect(replanModalSource).toMatch(/function formatItemTime/);
    expect(replanModalSource).toMatch(/getUTCHours\(\)/);
    expect(replanModalSource).toMatch(/getUTCMinutes\(\)/);
  });

  it("CATEGORY_ICON / CATEGORY_LABEL 매핑 (food/spot/shopping/rest)", () => {
    expect(replanModalSource).toMatch(/CATEGORY_ICON/);
    expect(replanModalSource).toMatch(/CATEGORY_LABEL/);
    expect(replanModalSource).toMatch(/food:\s*["']restaurant["']/);
    expect(replanModalSource).toMatch(/spot:\s*["']place["']/);
  });
});
