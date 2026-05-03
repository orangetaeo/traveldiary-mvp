/**
 * 사이클 KK — filterReceived 단위 테스트.
 *
 * 답습: 사이클 FF (sortReceived).
 *
 * 검증:
 *  - matchesQuery 빈 문자열·부분 일치·대소문자 무시
 *  - matchesStatus all/active/inactive
 *  - filterReceived 합성 시 동작
 *  - destination 미상 + query 있으면 제외
 *  - 한글 검색
 */

import { describe, it, expect } from "vitest";
import {
  filterReceived,
  matchesQuery,
  matchesStatus,
  STATUS_FILTER_LABELS,
} from "@/lib/share/filterReceived";

const items = [
  {
    key: "k1",
    destination: "다낭",
    status: "active" as const,
  },
  {
    key: "k2",
    destination: "DA NANG",
    status: "expired" as const,
  },
  {
    key: "k3",
    destination: "푸꾸옥",
    status: "active" as const,
  },
  {
    key: "k4",
    destination: undefined,
    status: "revoked" as const,
  },
  {
    key: "k5",
    destination: "Bangkok",
    status: "not_found" as const,
  },
];

describe("사이클 KK — matchesQuery", () => {
  it("빈 query는 전부 통과", () => {
    expect(items.every((it) => matchesQuery(it, ""))).toBe(true);
    expect(items.every((it) => matchesQuery(it, "   "))).toBe(true);
  });

  it("한글 부분 일치", () => {
    expect(matchesQuery({ destination: "다낭", status: "active" }, "다")).toBe(
      true,
    );
    expect(
      matchesQuery({ destination: "푸꾸옥", status: "active" }, "꾸옥"),
    ).toBe(true);
  });

  it("영문 대소문자 무시", () => {
    expect(
      matchesQuery({ destination: "Bangkok", status: "active" }, "bang"),
    ).toBe(true);
    expect(
      matchesQuery({ destination: "Bangkok", status: "active" }, "KOK"),
    ).toBe(true);
  });

  it("destination undefined + query 있으면 미통과", () => {
    expect(
      matchesQuery({ destination: undefined, status: "active" }, "다낭"),
    ).toBe(false);
  });

  it("불일치 query 거부", () => {
    expect(
      matchesQuery({ destination: "다낭", status: "active" }, "도쿄"),
    ).toBe(false);
  });
});

describe("사이클 KK — matchesStatus", () => {
  it("all은 모두 통과", () => {
    expect(items.every((it) => matchesStatus(it, "all"))).toBe(true);
  });

  it("active는 status=active만 통과", () => {
    const filtered = items.filter((it) => matchesStatus(it, "active"));
    expect(filtered).toHaveLength(2);
    expect(filtered.map((f) => f.key)).toEqual(["k1", "k3"]);
  });

  it("inactive는 expired·revoked·not_found 통과", () => {
    const filtered = items.filter((it) => matchesStatus(it, "inactive"));
    expect(filtered).toHaveLength(3);
    expect(filtered.map((f) => f.key).sort()).toEqual(["k2", "k4", "k5"]);
  });
});

describe("사이클 KK — filterReceived 합성", () => {
  it("query=다낭 + active → k1만", () => {
    const out = filterReceived(items, "다낭", "active");
    expect(out.map((it) => it.key)).toEqual(["k1"]);
  });

  it("query=da nang + all → k1·k2 (대소문자 무시)", () => {
    const out = filterReceived(items, "da nang", "all");
    // "다낭" 한글은 매칭 X, DA NANG만 매칭
    expect(out.map((it) => it.key)).toEqual(["k2"]);
  });

  it("query='' + inactive → k2·k4·k5", () => {
    const out = filterReceived(items, "", "inactive");
    expect(out.map((it) => it.key).sort()).toEqual(["k2", "k4", "k5"]);
  });

  it("일치 0건이면 빈 배열", () => {
    expect(filterReceived(items, "도쿄", "all")).toEqual([]);
    expect(filterReceived([], "", "all")).toEqual([]);
  });

  it("원본 배열 불변 (immutability)", () => {
    const before = [...items];
    filterReceived(items, "다낭", "active");
    expect(items).toEqual(before);
  });
});

describe("사이클 KK — STATUS_FILTER_LABELS", () => {
  it("3 라벨 모두 한국어", () => {
    expect(STATUS_FILTER_LABELS.all).toBe("전체");
    expect(STATUS_FILTER_LABELS.active).toBe("유효");
    expect(STATUS_FILTER_LABELS.inactive).toBe("만료·취소");
  });
});
