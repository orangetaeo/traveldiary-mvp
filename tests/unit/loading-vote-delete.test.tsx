/**
 * loading.tsx 추가 + 투표 삭제 기능 검증.
 */

import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

/* ═══════ loading.tsx 존재 검증 ═══════ */

describe("loading.tsx — 주요 비동기 라우트", () => {
  const routes = [
    { label: "아이템 상세", path: "app/itinerary/[id]/item/[itemId]/loading.tsx" },
    { label: "wrap-up", path: "app/wrap-up/[tripId]/loading.tsx" },
    { label: "여행 대시보드", path: "app/trips/[tripId]/loading.tsx" },
  ];

  for (const route of routes) {
    it(`${route.label} — loading.tsx 존재`, () => {
      const fullPath = path.resolve(route.path);
      expect(fs.existsSync(fullPath)).toBe(true);
    });
  }

  it("아이템 상세 loading — hero gradient 스켈레톤", () => {
    const src = fs.readFileSync(
      path.resolve("app/itinerary/[id]/item/[itemId]/loading.tsx"),
      "utf-8",
    );
    expect(src).toContain("animate-pulse");
    expect(src).toContain("purple");
  });

  it("아이템 상세 loading — Bottom Action Bar 스켈레톤", () => {
    const src = fs.readFileSync(
      path.resolve("app/itinerary/[id]/item/[itemId]/loading.tsx"),
      "utf-8",
    );
    expect(src).toContain("fixed bottom-0");
  });

  it("여행 대시보드 loading — BottomNav 포함", () => {
    const src = fs.readFileSync(
      path.resolve("app/trips/[tripId]/loading.tsx"),
      "utf-8",
    );
    expect(src).toContain("BottomNav");
    expect(src).toContain('active="trips"');
  });

  it("wrap-up loading — 3개 섹션 스켈레톤", () => {
    const src = fs.readFileSync(
      path.resolve("app/wrap-up/[tripId]/loading.tsx"),
      "utf-8",
    );
    expect(src).toContain("animate-pulse");
    // 최소 3개 카드 스켈레톤
    expect(src).toContain("[1, 2, 3]");
  });
});

/* ═══════ 투표 삭제 — Repository ═══════ */

const repoSrc = fs.readFileSync(
  path.resolve("lib/repositories/vote.repository.ts"),
  "utf-8",
);

describe("vote.repository — deleteVoteRow", () => {
  it("함수 export 존재", () => {
    expect(repoSrc).toContain("export async function deleteVoteRow");
  });

  it("tripId 체크 (cross-trip 방어)", () => {
    expect(repoSrc).toContain("where: { id: voteId, tripId }");
  });

  it("not_found 반환", () => {
    expect(repoSrc).toContain('"not_found"');
  });

  it("before 스냅샷 반환 (audit용)", () => {
    expect(repoSrc).toContain("before: rowToVote(before)");
  });

  it("트랜잭션 사용", () => {
    // deleteVoteRow 함수 내에서 $transaction 사용
    const fnStart = repoSrc.indexOf("async function deleteVoteRow");
    const fnEnd = repoSrc.indexOf("/** 사용자 토글");
    const fnBody = repoSrc.slice(fnStart, fnEnd);
    expect(fnBody).toContain("$transaction");
  });
});

/* ═══════ 투표 삭제 — Action ═══════ */

const actionSrc = fs.readFileSync(
  path.resolve("actions/vote.ts"),
  "utf-8",
);

describe("actions/vote — deleteVote", () => {
  it("함수 export 존재", () => {
    expect(actionSrc).toContain("export async function deleteVote");
  });

  it("canWriteTripOrViaShareLink 권한 체크", () => {
    // deleteVote 함수 내에서 권한 체크
    const fnStart = actionSrc.indexOf("async function deleteVote");
    const fnBody = actionSrc.slice(fnStart);
    expect(fnBody).toContain("canWriteTripOrViaShareLink");
  });

  it('audit log action: "vote.delete"', () => {
    expect(actionSrc).toContain('action: "vote.delete"');
  });

  it("DEMO_TRIP_ID 가드", () => {
    const fnStart = actionSrc.indexOf("async function deleteVote");
    const fnBody = actionSrc.slice(fnStart);
    expect(fnBody).toContain("DEMO_TRIP_ID");
  });

  it("before snapshot을 audit에 기록", () => {
    expect(actionSrc).toContain("result.before.question");
  });

  it("삭제 결과 deletedId 반환", () => {
    expect(actionSrc).toContain("deletedId: input.voteId");
  });
});

/* ═══════ 투표 삭제 — UI ═══════ */

const viewSrc = fs.readFileSync(
  path.resolve("components/vote/VoteListView.tsx"),
  "utf-8",
);

describe("VoteListView — 삭제 기능", () => {
  it("deleteVote import", () => {
    expect(viewSrc).toContain("deleteVote");
  });

  it("handleDelete 함수 존재", () => {
    expect(viewSrc).toContain("function handleDelete");
  });

  it("삭제 확인 다이얼로그 (ConfirmDialog)", () => {
    expect(viewSrc).toContain("ConfirmDialog");
  });

  it("낙관적 삭제 (filter)", () => {
    expect(viewSrc).toContain("prev.filter");
  });

  it("실패 시 롤백", () => {
    expect(viewSrc).toContain("setVotes(prevVotes)");
  });

  it("삭제 버튼 aria-label", () => {
    expect(viewSrc).toContain('aria-label="투표 삭제"');
  });

  it("delete 아이콘", () => {
    expect(viewSrc).toMatch(/aria-hidden>\s*delete\s*<\/span>/);
  });

  it("삭제 성공 시 toast", () => {
    expect(viewSrc).toContain("투표 삭제됨");
  });
});
