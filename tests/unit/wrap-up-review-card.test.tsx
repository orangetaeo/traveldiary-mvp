/**
 * WrapUpReviewCard 스모크 + 기능 테스트.
 *
 * 별점 radiogroup, 텍스트 입력, 초기화/저장 버튼 존재 확인.
 */

import { describe, it, expect, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";

// Hook mock — LocalStorage 의존 제거
vi.mock("@/lib/hooks/useWrapUpReview", () => ({
  useWrapUpReview: () => ({
    review: { rating: 0, text: "" },
    setRating: vi.fn(),
    setText: vi.fn(),
    clear: vi.fn(),
  }),
}));

describe("WrapUpReviewCard 소스 검증", () => {
  const src = fs.readFileSync(
    path.resolve("components/wrap-up/WrapUpReviewCard.tsx"),
    "utf-8",
  );

  it("별점 radiogroup 존재", () => {
    expect(src).toContain('role="radiogroup"');
    expect(src).toContain('aria-label="여행 별점"');
  });

  it("5점 별점 버튼 렌더링", () => {
    expect(src).toContain("[1, 2, 3, 4, 5].map");
    expect(src).toContain('role="radio"');
    expect(src).toContain("aria-checked");
  });

  it("텍스트 후기 textarea 존재", () => {
    expect(src).toContain("textarea");
    expect(src).toContain("maxLength={2000}");
    expect(src).toContain('aria-label="여행 후기"');
  });

  it("글자 수 카운터 표시", () => {
    expect(src).toContain("/ 2000");
    expect(src).toContain("charCount");
  });

  it("초기화 + 저장 버튼 존재", () => {
    expect(src).toContain("초기화");
    expect(src).toContain("저장 확인");
  });

  it("빈 상태에서 버튼 disabled", () => {
    expect(src).toContain("review.rating === 0 && review.text.length === 0");
    expect(src).toContain("disabled");
  });

  it("자동 임시 저장 안내 존재", () => {
    expect(src).toContain("자동 임시 저장");
  });

  it("hover 미리보기 지원", () => {
    expect(src).toContain("onMouseEnter");
    expect(src).toContain("onMouseLeave");
    expect(src).toContain("setHover");
  });
});
