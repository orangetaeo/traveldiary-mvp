/**
 * lib/share/filterReceived.ts 단위 테스트.
 *
 * matchesQuery, matchesStatus, filterReceived — 순수 함수.
 */

import { describe, it, expect } from "vitest";
import {
  matchesQuery,
  matchesStatus,
  filterReceived,
  STATUS_FILTER_LABELS,
} from "@/lib/share/filterReceived";

describe("matchesQuery", () => {
  const item = { destination: "다낭", status: "active" as const };

  it("빈 query → 항상 true", () => {
    expect(matchesQuery(item, "")).toBe(true);
    expect(matchesQuery(item, "   ")).toBe(true);
  });

  it("부분 일치 → true", () => {
    expect(matchesQuery(item, "다")).toBe(true);
    expect(matchesQuery(item, "낭")).toBe(true);
  });

  it("전체 일치 → true", () => {
    expect(matchesQuery(item, "다낭")).toBe(true);
  });

  it("불일치 → false", () => {
    expect(matchesQuery(item, "호치민")).toBe(false);
  });

  it("대소문자 무시 (영문)", () => {
    const en = { destination: "Da Nang", status: "active" as const };
    expect(matchesQuery(en, "da nang")).toBe(true);
    expect(matchesQuery(en, "DA NANG")).toBe(true);
  });

  it("destination 없음 → 빈 query만 통과", () => {
    const noCity = { status: "active" as const };
    expect(matchesQuery(noCity, "")).toBe(true);
    expect(matchesQuery(noCity, "다낭")).toBe(false);
  });
});

describe("matchesStatus", () => {
  it("all → 항상 true", () => {
    expect(matchesStatus({ status: "active" }, "all")).toBe(true);
    expect(matchesStatus({ status: "revoked" }, "all")).toBe(true);
    expect(matchesStatus({ status: "expired" }, "all")).toBe(true);
    expect(matchesStatus({ status: "not_found" }, "all")).toBe(true);
  });

  it("active 필터 → active만 true", () => {
    expect(matchesStatus({ status: "active" }, "active")).toBe(true);
    expect(matchesStatus({ status: "revoked" }, "active")).toBe(false);
    expect(matchesStatus({ status: "expired" }, "active")).toBe(false);
    expect(matchesStatus({ status: "not_found" }, "active")).toBe(false);
  });

  it("inactive 필터 → revoked/expired/not_found true", () => {
    expect(matchesStatus({ status: "active" }, "inactive")).toBe(false);
    expect(matchesStatus({ status: "revoked" }, "inactive")).toBe(true);
    expect(matchesStatus({ status: "expired" }, "inactive")).toBe(true);
    expect(matchesStatus({ status: "not_found" }, "inactive")).toBe(true);
  });
});

describe("filterReceived", () => {
  const items = [
    { destination: "다낭", status: "active" as const },
    { destination: "호치민", status: "revoked" as const },
    { destination: "하노이", status: "active" as const },
    { destination: "나트랑", status: "expired" as const },
  ];

  it("query + status 조합 필터링", () => {
    const r = filterReceived(items, "나", "inactive");
    expect(r).toHaveLength(1);
    expect(r[0].destination).toBe("나트랑");
  });

  it("빈 query + all → 전체", () => {
    expect(filterReceived(items, "", "all")).toHaveLength(4);
  });

  it("query만 적용", () => {
    const r = filterReceived(items, "낭", "all");
    expect(r).toHaveLength(1); // 다낭만 ("나트랑"에는 "낭" 없음)
    expect(r[0].destination).toBe("다낭");
  });

  it("status만 적용", () => {
    const r = filterReceived(items, "", "active");
    expect(r).toHaveLength(2); // 다낭 + 하노이
  });
});

describe("STATUS_FILTER_LABELS", () => {
  it("3개 레이블 존재", () => {
    expect(STATUS_FILTER_LABELS.all).toBe("전체");
    expect(STATUS_FILTER_LABELS.active).toBe("유효");
    expect(STATUS_FILTER_LABELS.inactive).toBe("만료·취소");
  });
});
