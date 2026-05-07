/**
 * 옵션 N — dashboard ?focus=<key> 진입점 4개 통합 회귀.
 *
 * CostView / ChecklistView / VoteListView 헤더 우상단 dashboard 아이콘 + ?focus= URL,
 * MorningBriefing 하단 "오늘의 진행 상황" CTA + ?focus=itinerary URL.
 *
 * page.tsx async 컴포넌트는 mock 부담이 커서 source grep으로 분리 검증
 * (Session N 박제: "next/link mock 차이로 분리 검증 layer 정착").
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const CWD = process.cwd();
function read(p: string): string {
  return readFileSync(resolve(CWD, p), "utf-8");
}

describe("CostView 헤더 — dashboard ?focus=cost 진입", () => {
  const SRC = read("components/cost/CostView.tsx");

  it("우상단 dashboard 링크 + ?focus=cost", () => {
    expect(SRC).toContain("/trips/${trip.id}?focus=cost");
    expect(SRC).toContain("비용 카드 강조");
  });

  it("dashboard material symbol icon", () => {
    expect(SRC).toMatch(/material-symbols-outlined[^>]*>dashboard</);
  });

  it("기존 뒤로가기 링크 보존 (회귀)", () => {
    expect(SRC).toContain("/itinerary/${trip.id}${dayParam}");
  });
});

describe("ChecklistView 헤더 — dashboard ?focus=checklist 진입", () => {
  const SRC = read("components/checklist/ChecklistView.tsx");

  it("우상단 dashboard 링크 + ?focus=checklist", () => {
    expect(SRC).toContain("/trips/${trip.id}?focus=checklist");
    expect(SRC).toContain("체크리스트 카드 강조");
  });

  it("선택 모드 토글 버튼 보존 (회귀 — 두 버튼 공존)", () => {
    expect(SRC).toContain("toggleSelectionMode");
    expect(SRC).toMatch(/selectionMode \? "취소" : "선택"/);
  });
});

describe("VoteListView 헤더 — dashboard ?focus=vote 진입", () => {
  const SRC = read("components/vote/VoteListView.tsx");

  it("우상단 dashboard 링크 + ?focus=vote", () => {
    expect(SRC).toContain("/trips/${trip.id}?focus=vote");
    expect(SRC).toContain("투표 카드 강조");
  });

  it("기존 뒤로가기 링크 보존 (회귀)", () => {
    expect(SRC).toContain("/itinerary/${trip.id}");
  });
});

describe("MorningBriefing CTA — dashboard ?focus=itinerary 진입", () => {
  const SRC = read("components/morning/MorningBriefing.tsx");

  it("새 CTA — 오늘의 진행 상황 + ?focus=itinerary", () => {
    expect(SRC).toContain("/trips/${trip.id}?focus=itinerary");
    expect(SRC).toContain("오늘의 진행 상황");
    expect(SRC).toContain("일정 카드 강조");
  });

  it("기존 전체 일정 보기 CTA 보존 (회귀)", () => {
    expect(SRC).toContain("/itinerary/${trip.id}");
    expect(SRC).toContain("전체 일정 보기");
  });

  it("두 CTA grid-cols-2 레이아웃", () => {
    expect(SRC).toMatch(/grid grid-cols-2/);
  });
});

describe("진입점 4개 모두 알려진 focus key 화이트리스트 준수", () => {
  it("focus-key.ts 화이트리스트와 일치", () => {
    const FOCUS_KEY_SRC = read("lib/utils/focus-key.ts");
    // FOCUS_KEYS = ["itinerary", "cost", "checklist", "vote"]
    for (const key of ["itinerary", "cost", "checklist", "vote"]) {
      expect(FOCUS_KEY_SRC).toContain(`"${key}"`);
    }
  });

  it("진입점 4 파일 모두 알려진 key만 사용", () => {
    const usages = [
      { file: "components/cost/CostView.tsx", key: "cost" },
      { file: "components/checklist/ChecklistView.tsx", key: "checklist" },
      { file: "components/vote/VoteListView.tsx", key: "vote" },
      { file: "components/morning/MorningBriefing.tsx", key: "itinerary" },
    ];
    for (const { file, key } of usages) {
      expect(read(file)).toContain(`?focus=${key}`);
    }
  });
});
