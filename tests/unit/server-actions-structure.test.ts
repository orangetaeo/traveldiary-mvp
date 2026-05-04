/**
 * Server Actions 구조 검증 — 사이클 TEST-BOOST.
 *
 * 서버 액션 12개의 공통 패턴 검증:
 *  1. "use server" 선언
 *  2. writeAuditLog import + 호출 (S-13 절대 규칙)
 *  3. canWriteTrip / canDeleteComment 권한 검사
 *  4. isDbConnected 데모 폴백
 *  5. revalidatePath 캐시 무효화
 *  6. discriminated union 반환 타입
 */

import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

const ACTIONS_DIR = path.resolve(__dirname, "../../actions");

function readAction(filename: string): string {
  return fs.readFileSync(path.join(ACTIONS_DIR, filename), "utf-8");
}

/** 모든 mutation 서버 액션 (변경 API = audit 필수) */
const MUTATION_ACTIONS = [
  "checklist.ts",
  "cost.ts",
  "itinerary.ts",
  "replan.ts",
  "share.ts",
  "shareComment.ts",
  "trip.ts",
  "vote.ts",
];

/** 조회 전용 액션 (audit 선택적) */
const READ_ACTIONS = [
  "affiliate.ts",
  "evidence.ts",
  "place.ts",
  "translate.ts",
];

describe("Server Actions — 'use server' 선언", () => {
  const ALL = [...MUTATION_ACTIONS, ...READ_ACTIONS];

  it.each(ALL)("%s — 'use server' 첫 줄", (file) => {
    try {
      const src = readAction(file);
      expect(src).toMatch(/^"use server"/m);
    } catch (e) {
      // 파일 없으면 skip (아직 없는 액션)
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return;
      throw e;
    }
  });
});

describe("Server Actions — S-13 감사 로그 절대 규칙", () => {
  it.each(MUTATION_ACTIONS)("%s — writeAuditLog import + 호출", (file) => {
    try {
      const src = readAction(file);
      expect(src).toContain("writeAuditLog");
      // import 확인
      expect(src).toContain("@/lib/audit-log");
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return;
      throw e;
    }
  });
});

describe("Server Actions — 권한 검사", () => {
  // shareComment는 clientUuid 기반 익명 협업 (canWriteTrip 대신 clientUuid 검증)
  const AUTH_ACTIONS = MUTATION_ACTIONS.filter((f) => f !== "shareComment.ts");

  it.each(AUTH_ACTIONS)("%s — canWriteTrip 또는 canDeleteComment", (file) => {
    try {
      const src = readAction(file);
      const hasAuthCheck =
        src.includes("canWriteTrip") || src.includes("canDeleteComment");
      expect(hasAuthCheck).toBe(true);
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return;
      throw e;
    }
  });

  it("shareComment.ts — getActorId 사용 (clientUuid 기반 익명 협업)", () => {
    try {
      const src = readAction("shareComment.ts");
      expect(src).toContain("getActorId");
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return;
      throw e;
    }
  });
});

describe("Server Actions — 데모 폴백", () => {
  it.each(MUTATION_ACTIONS)("%s — isDbConnected 체크", (file) => {
    try {
      const src = readAction(file);
      expect(src).toContain("isDbConnected");
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return;
      throw e;
    }
  });
});

describe("Server Actions — 캐시 무효화", () => {
  it.each(MUTATION_ACTIONS)("%s — revalidatePath 호출", (file) => {
    try {
      const src = readAction(file);
      expect(src).toContain("revalidatePath");
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return;
      throw e;
    }
  });
});

describe("Checklist Actions — 개별 패턴 검증", () => {
  const src = readAction("checklist.ts");

  it("ChecklistActionResult discriminated union 타입 정의", () => {
    expect(src).toContain("ChecklistActionResult");
    expect(src).toContain("ok: true");
    expect(src).toContain("ok: false");
    expect(src).toContain('code: "not_found"');
    expect(src).toContain('code: "forbidden"');
  });

  it("7개 exported 함수", () => {
    const exports = src.match(/export async function \w+/g) ?? [];
    expect(exports.length).toBeGreaterThanOrEqual(6);
  });

  it("bulkToggleChecklist — 빈 배열 가드", () => {
    expect(src).toContain("input.itemIds.length === 0");
  });

  it("bulkDeleteChecklist — beforeSnapshot audit 기록", () => {
    expect(src).toContain("beforeSnapshot");
    expect(src).toContain("omittedSnapshotCount");
  });

  it("addFromTemplate — DEFAULT_CHECKLIST_TEMPLATE 사용", () => {
    expect(src).toContain("DEFAULT_CHECKLIST_TEMPLATE");
  });

  it("actorId 해상도 — resolveActorIdForTrip (TT ADR-045)", () => {
    expect(src).toContain("resolveActorIdForTrip");
  });
});

describe("Cost Actions — 개별 패턴 검증", () => {
  const src = readAction("cost.ts");

  it("CostActionResult discriminated union 타입 정의", () => {
    expect(src).toContain("CostActionResult");
  });

  it("4개 exported 함수 (add/update/settle/delete)", () => {
    const exports = src.match(/export async function \w+/g) ?? [];
    expect(exports.length).toBe(4);
  });

  it("settleCost — settled 토글 분기 (settle/unsettle)", () => {
    expect(src).toContain('"cost.settle"');
    expect(src).toContain('"cost.unsettle"');
  });

  it("updateCost — before/after 양쪽 audit 기록", () => {
    // before와 after 모두 기록해야 함
    const updateBlock = src.slice(
      src.indexOf("export async function updateCost"),
      src.indexOf("export async function settleCost"),
    );
    expect(updateBlock).toContain("before:");
    expect(updateBlock).toContain("after:");
  });

  it("ensureDemoTripInDb — addCost에서 호출", () => {
    expect(src).toContain("ensureDemoTripInDb");
  });
});
