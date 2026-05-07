/**
 * Audit action 코드 일관성 검증.
 *
 * 모든 action 파일의 writeAuditLog 호출에서 사용하는 action 코드가
 * 알려진 화이트리스트에 포함되는지 확인. 오타/비표준 코드 방지.
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

/** action: "xxx.yyy" 패턴 추출 */
function extractActionCodes(src: string): string[] {
  const regex = /action:\s*"([^"]+)"/g;
  const codes: string[] = [];
  let match;
  while ((match = regex.exec(src)) !== null) {
    codes.push(match[1]);
  }
  return codes;
}

// 알려진 audit action 코드 화이트리스트
const KNOWN_ACTION_CODES = new Set([
  // trip
  "trip.create",
  "trip.mode_transition",
  "trip.claim",
  // itinerary
  "itinerary.create",
  "itinerary.reorder",
  // checklist
  "checklist.add",
  "checklist.toggle",
  "checklist.reorder",
  "checklist.bulk_toggle",
  "checklist.bulk_delete",
  "checklist.delete",
  // cost
  "cost.add",
  "cost.update",
  "cost.delete",
  // evidence / validation
  "evidence.gathered",
  "validation.completed",
  // share
  "share.create",
  "share.access",
  // comment
  "comment.create",
  "comment.delete",
  // replan
  "replan.commit",
  // affiliate
  "affiliate.click",
  // 사이클 5 (G8) — OTA 결제 후 self-report (BLOCKER 7 webhook 부재 시 수동 신호)
  "affiliate.confirmed",
  "affiliate.declined",
]);

/* ════════════════════════════════════════════
 * action 코드 화이트리스트 검증
 * ════════════════════════════════════════════ */

describe("audit action 코드 화이트리스트", () => {
  it.each(ACTION_FILES.map((f) => [f.name, f.src]))(
    "%s — 모든 action 코드가 화이트리스트에 포함",
    (_name, src) => {
      const codes = extractActionCodes(src);
      for (const code of codes) {
        expect(
          KNOWN_ACTION_CODES.has(code),
          `알 수 없는 action 코드: "${code}" — 화이트리스트에 추가 필요`,
        ).toBe(true);
      }
    },
  );
});

/* ════════════════════════════════════════════
 * action 코드 네이밍 규칙: "resource.verb" 형식
 * ════════════════════════════════════════════ */

describe("audit action 코드 네이밍 규칙", () => {
  it("모든 코드가 resource.verb 형식 (dot-separated)", () => {
    for (const code of KNOWN_ACTION_CODES) {
      expect(code).toMatch(/^[a-z]+\.[a-z_]+$/);
    }
  });

  it("화이트리스트에 20개 이상 코드 등록", () => {
    expect(KNOWN_ACTION_CODES.size).toBeGreaterThanOrEqual(20);
  });
});

/* ════════════════════════════════════════════
 * mutation action에 audit log 호출 존재 (S-13 재확인)
 * ════════════════════════════════════════════ */

describe("mutation action — audit log 호출 수 검증", () => {
  it.each(ACTION_FILES.map((f) => [f.name, f.src]))(
    "%s — writeAuditLog 호출 1회 이상",
    (_name, src) => {
      const codes = extractActionCodes(src);
      expect(codes.length).toBeGreaterThanOrEqual(1);
    },
  );

  it("전체 action 파일에서 사용되는 코드가 화이트리스트를 모두 커버", () => {
    const allUsedCodes = new Set<string>();
    for (const file of ACTION_FILES) {
      for (const code of extractActionCodes(file.src)) {
        allUsedCodes.add(code);
      }
    }
    // 화이트리스트의 모든 코드가 실제 사용됨
    for (const code of KNOWN_ACTION_CODES) {
      expect(
        allUsedCodes.has(code),
        `화이트리스트 코드 "${code}"가 어떤 action 파일에서도 사용되지 않음`,
      ).toBe(true);
    }
  });

  it("실제 사용 코드가 화이트리스트에 모두 등록됨 (양방향)", () => {
    const allUsedCodes = new Set<string>();
    for (const file of ACTION_FILES) {
      for (const code of extractActionCodes(file.src)) {
        allUsedCodes.add(code);
      }
    }
    for (const code of allUsedCodes) {
      expect(
        KNOWN_ACTION_CODES.has(code),
        `사용 중인 코드 "${code}"가 화이트리스트에 미등록`,
      ).toBe(true);
    }
  });
});

/* ════════════════════════════════════════════
 * 리소스별 action 코드 분류
 * ════════════════════════════════════════════ */

describe("audit action 코드 리소스 분류", () => {
  const codesByResource = new Map<string, string[]>();
  for (const code of KNOWN_ACTION_CODES) {
    const [resource] = code.split(".");
    if (!codesByResource.has(resource)) codesByResource.set(resource, []);
    codesByResource.get(resource)!.push(code);
  }

  it("10개 리소스 그룹 존재", () => {
    expect(codesByResource.size).toBe(10);
  });

  it("checklist 리소스에 5개 이상 action", () => {
    expect(codesByResource.get("checklist")!.length).toBeGreaterThanOrEqual(5);
  });

  it("cost 리소스에 3개 action", () => {
    expect(codesByResource.get("cost")!.length).toBe(3);
  });

  it("trip 리소스에 3개 action", () => {
    expect(codesByResource.get("trip")!.length).toBe(3);
  });
});
