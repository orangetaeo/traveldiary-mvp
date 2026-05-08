/**
 * 투표 폼 실시간 검증 테스트.
 *
 * VoteListView 소스 코드 검증: isFormValid, 글자 수 카운터, 옵션 삭제.
 */

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const viewSrc = fs.readFileSync(
  path.resolve("components/vote/VoteListView.tsx"),
  "utf-8",
);

/* ═══════ 1. isFormValid 실시간 검증 ═══════ */

describe("투표 폼 — isFormValid 실시간 검증", () => {
  it("isFormValid 파생 상태 존재", () => {
    expect(viewSrc).toContain("isFormValid");
  });

  it("질문 비어있으면 유효하지 않음 (trim 검사)", () => {
    expect(viewSrc).toContain("draftQuestion.trim().length > 0");
  });

  it("유효 옵션 2개 이상 필요", () => {
    expect(viewSrc).toContain("validOptionCount >= 2");
  });

  it("validOptionCount — trim 후 빈 문자열 제외", () => {
    expect(viewSrc).toContain('filter((l) => l.trim().length > 0)');
  });

  it("제출 버튼에 !isFormValid 조건 적용", () => {
    expect(viewSrc).toContain("disabled={isPending || !isFormValid}");
  });
});

/* ═══════ 2. 글자 수 카운터 ═══════ */

describe("투표 폼 — 글자 수 카운터", () => {
  it("질문 입력 글자 수 표시 (120)", () => {
    expect(viewSrc).toContain("/120");
  });

  it("옵션 입력 글자 수 표시 (80)", () => {
    expect(viewSrc).toContain("/80");
  });

  it("질문 90% 이상(108자)에서 경고 색상", () => {
    expect(viewSrc).toContain("draftQuestion.length >= 108");
    expect(viewSrc).toContain("text-danger");
  });

  it("옵션 90% 이상(72자)에서 경고 색상", () => {
    expect(viewSrc).toContain("opt.length >= 72");
  });

  it("질문 글자 수 aria-label 존재", () => {
    expect(viewSrc).toContain('aria-label="질문 글자 수"');
  });
});

/* ═══════ 3. 옵션 제거 ═══════ */

describe("투표 폼 — 옵션 제거", () => {
  it("handleRemoveOption 함수 존재", () => {
    expect(viewSrc).toContain("handleRemoveOption");
  });

  it("옵션 3개 이상일 때만 삭제 버튼 표시", () => {
    expect(viewSrc).toContain("draftOptions.length > 2");
  });

  it("옵션 삭제 aria-label 존재", () => {
    expect(viewSrc).toMatch(/aria-label={`옵션 \$\{i \+ 1\} 삭제`}/);
  });

  it("close 아이콘 사용", () => {
    // 삭제 버튼 내 close material icon
    const removeSection = viewSrc.slice(viewSrc.indexOf("handleRemoveOption"));
    expect(removeSection).toContain("close</span>");
  });
});

/* ═══════ 4. 접근성 ═══════ */

describe("투표 폼 — 접근성", () => {
  it("질문 입력 aria-label 존재", () => {
    expect(viewSrc).toContain('aria-label="투표 질문"');
  });

  it("옵션 입력 aria-label 존재", () => {
    expect(viewSrc).toMatch(/aria-label={`옵션 \$\{i \+ 1\}`}/);
  });
});
