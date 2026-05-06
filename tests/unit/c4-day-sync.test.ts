/**
 * C4 — Day 동기화 구조 검증.
 *
 * Itinerary↔Cost↔Checklist 간 ?day= URL 파라미터 전달 검증.
 * 스키마 변경 없음 — URL 파라미터 연동만.
 */

import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

// ═══════════════════════════════════════════
// 1. Itinerary 페이지 — searchParams 수신
// ═══════════════════════════════════════════

describe("C4 — Itinerary 페이지 day 파라미터 수신", () => {
  const src = fs.readFileSync(
    path.resolve("app/itinerary/[id]/page.tsx"),
    "utf-8",
  );

  it("searchParams에서 day 추출", () => {
    expect(src).toContain("searchParams");
    expect(src).toContain("day?:");
  });

  it("parseDayParam import", () => {
    expect(src).toContain("parseDayParam");
  });

  it("ItineraryView에 initialDay props 전달", () => {
    expect(src).toContain("initialDay=");
    expect(src).toContain("parseDayParam(searchParams.day");
  });
});

// ═══════════════════════════════════════════
// 2. ItineraryView — initialDay 수신
// ═══════════════════════════════════════════

describe("C4 — ItineraryView initialDay 수신", () => {
  const src = fs.readFileSync(
    path.resolve("components/itinerary/ItineraryView.tsx"),
    "utf-8",
  );

  it("initialDay props 선언", () => {
    expect(src).toContain("initialDay?:");
  });

  it("activeDay 초기값으로 initialDay 사용", () => {
    expect(src).toContain("useState(initialDay");
  });

  it("TripSecondaryActions에 activeDay 전달", () => {
    expect(src).toContain("activeDay={activeDay}");
  });
});

// ═══════════════════════════════════════════
// 3. TripSecondaryActions — ?day= 전달
// ═══════════════════════════════════════════

describe("C4 — TripSecondaryActions day 파라미터 전달", () => {
  const src = fs.readFileSync(
    path.resolve("components/itinerary/TripSecondaryActions.tsx"),
    "utf-8",
  );

  it("activeDay props 선언", () => {
    expect(src).toContain("activeDay?:");
  });

  it("dayParam 계산", () => {
    expect(src).toContain("dayParam");
    expect(src).toContain("?day=");
  });

  it("체크리스트 링크에 dayParam 추가", () => {
    expect(src).toContain("/checklist/${tripId}${dayParam}");
  });

  it("비용 관리 링크에 dayParam 추가", () => {
    expect(src).toContain("/cost/${tripId}${dayParam}");
  });
});

// ═══════════════════════════════════════════
// 4. Cost 페이지 — searchParams 수신
// ═══════════════════════════════════════════

describe("C4 — Cost 페이지 day 파라미터 수신", () => {
  const src = fs.readFileSync(
    path.resolve("app/cost/[tripId]/page.tsx"),
    "utf-8",
  );

  it("searchParams에서 day 추출", () => {
    expect(src).toContain("searchParams");
    expect(src).toContain("day?:");
  });

  it("parseDayParam import", () => {
    expect(src).toContain("parseDayParam");
  });

  it("CostView에 initialDay props 전달", () => {
    expect(src).toContain("initialDay=");
    expect(src).toContain("parseDayParam(searchParams.day");
  });
});

// ═══════════════════════════════════════════
// 5. CostView — day 파라미터 뒤로가기 보존
// ═══════════════════════════════════════════

describe("C4 — CostView day 파라미터 보존", () => {
  const src = fs.readFileSync(
    path.resolve("components/cost/CostView.tsx"),
    "utf-8",
  );

  it("initialDay props 선언", () => {
    expect(src).toContain("initialDay?:");
  });

  it("뒤로가기 링크에 dayParam 포함", () => {
    expect(src).toContain("/itinerary/${trip.id}${dayParam}");
  });
});

// ═══════════════════════════════════════════
// 6. Checklist 페이지 — searchParams 수신
// ═══════════════════════════════════════════

describe("C4 — Checklist 페이지 day 파라미터 수신", () => {
  const src = fs.readFileSync(
    path.resolve("app/checklist/[tripId]/page.tsx"),
    "utf-8",
  );

  it("searchParams에서 day 추출", () => {
    expect(src).toContain("searchParams");
    expect(src).toContain("day?:");
  });

  it("parseDayParam import", () => {
    expect(src).toContain("parseDayParam");
  });

  it("ChecklistView에 initialDay props 전달", () => {
    expect(src).toContain("initialDay=");
    expect(src).toContain("parseDayParam(searchParams.day");
  });
});

// ═══════════════════════════════════════════
// 7. ChecklistView — day 파라미터 뒤로가기 보존
// ═══════════════════════════════════════════

describe("C4 — ChecklistView day 파라미터 보존", () => {
  const src = fs.readFileSync(
    path.resolve("components/checklist/ChecklistView.tsx"),
    "utf-8",
  );

  it("initialDay props 선언", () => {
    expect(src).toContain("initialDay?:");
  });

  it("뒤로가기 링크에 dayParam 포함", () => {
    expect(src).toContain("/itinerary/${trip.id}${dayParam}");
  });
});

// ═══════════════════════════════════════════
// 8. 양방향 완전성 — 모든 크로스 링크에 day 파라미터
// ═══════════════════════════════════════════

describe("C4 — 양방향 day 파라미터 전달 완전성", () => {
  it("Home → Itinerary (기존 ?day= 전달)", () => {
    const src = fs.readFileSync(path.resolve("app/page.tsx"), "utf-8");
    expect(src).toContain("?day=");
  });

  it("Itinerary → Cost (TripSecondaryActions)", () => {
    const src = fs.readFileSync(
      path.resolve("components/itinerary/TripSecondaryActions.tsx"),
      "utf-8",
    );
    expect(src).toContain("/cost/");
    expect(src).toContain("dayParam");
  });

  it("Itinerary → Checklist (TripSecondaryActions)", () => {
    const src = fs.readFileSync(
      path.resolve("components/itinerary/TripSecondaryActions.tsx"),
      "utf-8",
    );
    expect(src).toContain("/checklist/");
    expect(src).toContain("dayParam");
  });

  it("Cost → Itinerary (back link)", () => {
    const src = fs.readFileSync(
      path.resolve("components/cost/CostView.tsx"),
      "utf-8",
    );
    expect(src).toContain("/itinerary/");
    expect(src).toContain("dayParam");
  });

  it("Checklist → Itinerary (back link)", () => {
    const src = fs.readFileSync(
      path.resolve("components/checklist/ChecklistView.tsx"),
      "utf-8",
    );
    expect(src).toContain("/itinerary/");
    expect(src).toContain("dayParam");
  });
});
