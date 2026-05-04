/**
 * 상수 무결성 + 공유 유틸 테스트 — Batch 5.
 *
 * countries.ts: COUNTRIES / GLOBAL_EMERGENCY_CONTACTS 데이터 무결성.
 * share/sortReceived: 3 정렬 모드 (addedAtDesc / startDateAsc / destinationAsc).
 * share/filterReceived: 검색 + 상태 필터 합성.
 */

import { describe, it, expect } from "vitest";
import {
  COUNTRIES,
  GLOBAL_EMERGENCY_CONTACTS,
} from "@/lib/constants/countries";
import {
  sortReceived,
  SORT_LABELS,
  type SortableReceivedItem,
} from "@/lib/share/sortReceived";
import {
  matchesQuery,
  matchesStatus,
  filterReceived,
  STATUS_FILTER_LABELS,
  type FilterableReceivedItem,
} from "@/lib/share/filterReceived";

/* ────────── COUNTRIES ────────── */

describe("constants — COUNTRIES", () => {
  const codes = Object.keys(COUNTRIES);

  it("3개국 이상 (VN, TH, JP)", () => {
    expect(codes.length).toBeGreaterThanOrEqual(3);
    expect(codes).toContain("VN");
    expect(codes).toContain("TH");
    expect(codes).toContain("JP");
  });

  it.each(codes)("%s — 필수 필드 존재", (code) => {
    const c = COUNTRIES[code];
    expect(c.code).toBe(code);
    expect(c.name).toBeTruthy();
    expect(c.defaultPhrases.length).toBeGreaterThanOrEqual(3);
    expect(c.paymentDefaults.currency).toBeTruthy();
    expect(c.paymentDefaults.currencySymbol).toBeTruthy();
    expect(c.utilities).toBeDefined();
    expect(c.visa).toBeDefined();
  });

  it("VN — 무비자 45일", () => {
    expect(COUNTRIES["VN"].visa.visaFreeDays).toBe(45);
  });

  it("각 국가 phrases에 greeting + thanks 포함", () => {
    for (const code of codes) {
      const phrases = COUNTRIES[code].defaultPhrases;
      const situations = phrases.map((p) => p.situation);
      expect(situations).toContain("greeting");
      expect(situations).toContain("thanks");
    }
  });

  it("각 국가 countryEmergencyContacts 1개 이상", () => {
    for (const code of codes) {
      expect(COUNTRIES[code].countryEmergencyContacts.length).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("constants — GLOBAL_EMERGENCY_CONTACTS", () => {
  it("2개 이상 (영사 콜센터, 카드 분실)", () => {
    expect(GLOBAL_EMERGENCY_CONTACTS.length).toBeGreaterThanOrEqual(2);
  });

  it("영사 콜센터 포함", () => {
    const consul = GLOBAL_EMERGENCY_CONTACTS.find((c) =>
      c.label.includes("영사") || c.label.includes("통역"),
    );
    expect(consul).toBeDefined();
    expect(consul!.phone).toContain("0404");
  });

  it("카드 분실 포함", () => {
    const card = GLOBAL_EMERGENCY_CONTACTS.find((c) =>
      c.category === "card_lost" || c.label.includes("카드"),
    );
    expect(card).toBeDefined();
  });
});

/* ────────── sortReceived ────────── */

describe("share — sortReceived", () => {
  const items: SortableReceivedItem[] = [
    { destination: "다낭", startDate: "2026-06-15", addedAt: 100 },
    { destination: "푸꾸옥", startDate: "2026-05-20", addedAt: 300 },
    { destination: "하노이", startDate: "2026-07-01", addedAt: 200 },
  ];

  it("addedAtDesc — 최신 추가 순", () => {
    const sorted = sortReceived(items, "addedAtDesc");
    expect(sorted[0].destination).toBe("푸꾸옥"); // addedAt 300
    expect(sorted[2].destination).toBe("다낭");   // addedAt 100
  });

  it("startDateAsc — 출발일 가까운 순", () => {
    const sorted = sortReceived(items, "startDateAsc");
    expect(sorted[0].destination).toBe("푸꾸옥"); // 2026-05-20
    expect(sorted[2].destination).toBe("하노이"); // 2026-07-01
  });

  it("startDateAsc — startDate 없는 항목 맨 뒤", () => {
    const withMissing = [...items, { destination: "미정", addedAt: 400 }];
    const sorted = sortReceived(withMissing, "startDateAsc");
    expect(sorted[sorted.length - 1].destination).toBe("미정");
  });

  it("destinationAsc — 도시명 가나다 순", () => {
    const sorted = sortReceived(items, "destinationAsc");
    expect(sorted[0].destination).toBe("다낭");
    expect(sorted[2].destination).toBe("하노이");
  });

  it("원본 배열 불변", () => {
    const original = [...items];
    sortReceived(items, "addedAtDesc");
    expect(items).toEqual(original);
  });

  it("SORT_LABELS 3개 한국어 라벨", () => {
    expect(Object.keys(SORT_LABELS).length).toBe(3);
    for (const label of Object.values(SORT_LABELS)) {
      expect(label).toBeTruthy();
    }
  });
});

/* ────────── filterReceived ────────── */

describe("share — filterReceived", () => {
  const items: (FilterableReceivedItem & { id: string })[] = [
    { id: "1", destination: "다낭", status: "active" },
    { id: "2", destination: "푸꾸옥", status: "revoked" },
    { id: "3", destination: "하노이", status: "active" },
    { id: "4", destination: "호치민", status: "expired" },
  ];

  describe("matchesQuery", () => {
    it("빈 쿼리 → 전체 통과", () => {
      expect(matchesQuery(items[0], "")).toBe(true);
      expect(matchesQuery(items[0], "  ")).toBe(true);
    });

    it("부분 일치 — '낭' → 다낭 매칭", () => {
      expect(matchesQuery(items[0], "낭")).toBe(true);
      expect(matchesQuery(items[1], "낭")).toBe(false);
    });

    it("대소문자 무시", () => {
      const item = { destination: "Da Nang", status: "active" as const };
      expect(matchesQuery(item, "da")).toBe(true);
      expect(matchesQuery(item, "DA")).toBe(true);
    });
  });

  describe("matchesStatus", () => {
    it("all → 모두 통과", () => {
      for (const item of items) {
        expect(matchesStatus(item, "all")).toBe(true);
      }
    });

    it("active → active만 통과", () => {
      expect(matchesStatus(items[0], "active")).toBe(true);
      expect(matchesStatus(items[1], "active")).toBe(false);
    });

    it("inactive → revoked/expired 통과", () => {
      expect(matchesStatus(items[1], "inactive")).toBe(true); // revoked
      expect(matchesStatus(items[3], "inactive")).toBe(true); // expired
      expect(matchesStatus(items[0], "inactive")).toBe(false); // active
    });
  });

  describe("filterReceived (합성)", () => {
    it("전체 쿼리 + 전체 필터 → 4건", () => {
      expect(filterReceived(items, "", "all").length).toBe(4);
    });

    it("'낭' + active → 다낭만", () => {
      const result = filterReceived(items, "낭", "active");
      expect(result.length).toBe(1);
      expect(result[0].id).toBe("1");
    });

    it("빈 쿼리 + inactive → 2건", () => {
      expect(filterReceived(items, "", "inactive").length).toBe(2);
    });
  });

  it("STATUS_FILTER_LABELS 3개 한국어 라벨", () => {
    expect(Object.keys(STATUS_FILTER_LABELS).length).toBe(3);
  });
});
