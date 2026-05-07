/**
 * Server Action 횡단 패턴 검증.
 *
 * 모든 mutation action이 일관된 패턴을 따르는지 구조적으로 확인:
 * - "use server" 지시문
 * - writeAuditLog 호출 (S-13 절대 규칙)
 * - 인증/권한 함수 import
 * - 데모 모드 fallback
 */

import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

const ACTION_DIR = path.resolve("actions");
const ACTION_FILES = fs
  .readdirSync(ACTION_DIR)
  .filter((f) => f.endsWith(".ts") && !f.includes("cache-utils"))
  .map((f) => ({
    name: f,
    src: fs.readFileSync(path.join(ACTION_DIR, f), "utf-8"),
  }));

/* ════════════════════════════════════════════
 * "use server" 지시문
 * ════════════════════════════════════════════ */

describe("모든 action 파일 — 'use server' 지시문", () => {
  it.each(ACTION_FILES.map((f) => [f.name, f.src]))(
    "%s — 'use server' 포함",
    (_name, src) => {
      expect(src).toContain('"use server"');
    },
  );
});

/* ════════════════════════════════════════════
 * S-13 감사 로그 (writeAuditLog)
 * ════════════════════════════════════════════ */

describe("mutation action — writeAuditLog 호출 (S-13)", () => {
  // mutation: POST/PUT/PATCH/DELETE 동시 구현 의무
  const MUTATION_ACTIONS = ACTION_FILES.filter((f) =>
    // 모든 action 파일은 mutation (read-only action 없음)
    !f.name.includes("cache-utils"),
  );

  it.each(MUTATION_ACTIONS.map((f) => [f.name, f.src]))(
    "%s — writeAuditLog import 존재",
    (_name, src) => {
      expect(src).toContain("writeAuditLog");
    },
  );
});

/* ════════════════════════════════════════════
 * 인증/권한 함수 import
 * ════════════════════════════════════════════ */

describe("action 인증/권한 패턴", () => {
  it.each(ACTION_FILES.map((f) => [f.name, f.src]))(
    "%s — getActorId 또는 getOwnerId import",
    (_name, src) => {
      const hasAuth = src.includes("getActorId") || src.includes("getOwnerId");
      expect(hasAuth).toBe(true);
    },
  );

  // canWriteTrip는 데이터 변경 action에서 사용
  // 외부 API 전용 / audit-only action은 면제 (DB 의존 0)
  const WRITE_ACTIONS = ACTION_FILES.filter(
    (f) =>
      !["evidence.ts", "affiliate.ts", "translate.ts", "ota-booking-confirm.ts"].includes(f.name),
  );

  it.each(WRITE_ACTIONS.map((f) => [f.name, f.src]))(
    "%s — canWriteTrip 또는 canReadTrip 또는 canValidateItem 권한 검사",
    (_name, src) => {
      const hasAuthz =
        src.includes("canWriteTrip") ||
        src.includes("canReadTrip") ||
        src.includes("canValidateItem") ||
        // share/vote는 별도 권한 체계 (syncKey 기반)
        src.includes("syncKey") ||
        src.includes("clientUuid");
      expect(hasAuthz).toBe(true);
    },
  );
});

/* ════════════════════════════════════════════
 * 데모 모드 fallback
 * ════════════════════════════════════════════ */

describe("action 데모 모드 fallback", () => {
  // affiliate/evidence/translate/ota-booking-confirm: 외부 API 또는 audit-only —
  // DB 의존 없이 동작하므로 데모 가드 불필요
  const DEMO_GUARD_ACTIONS = ACTION_FILES.filter(
    (f) =>
      !["affiliate.ts", "evidence.ts", "translate.ts", "ota-booking-confirm.ts"].includes(f.name),
  );

  it.each(DEMO_GUARD_ACTIONS.map((f) => [f.name, f.src]))(
    "%s — isDbConnected 또는 DEMO_TRIP_ID 데모 가드",
    (_name, src) => {
      const hasDemoGuard =
        src.includes("isDbConnected") || src.includes("DEMO_TRIP_ID");
      expect(hasDemoGuard).toBe(true);
    },
  );
});

/* ════════════════════════════════════════════
 * action 파일 수 불변성 (새 action 추가 시 감지)
 * ════════════════════════════════════════════ */

describe("action 파일 목록", () => {
  it("15개 action 파일 존재 (추가 시 패턴 검증 대상)", () => {
    expect(ACTION_FILES.length).toBe(15);
  });

  it("알려진 action 파일 전체 등록", () => {
    const names = ACTION_FILES.map((f) => f.name).sort();
    expect(names).toEqual([
      "affiliate.ts",
      "checklist.ts",
      "cost.ts",
      "evidence.ts",
      "itinerary.ts",
      "ota-booking-confirm.ts",
      "photo.ts",
      "place.ts",
      "replan.ts",
      "review.ts",
      "share.ts",
      "shareComment.ts",
      "translate.ts",
      "trip.ts",
      "vote.ts",
    ]);
  });
});
