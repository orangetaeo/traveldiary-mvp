/**
 * 사이클 QQ — ChecklistEmptyState 단위 테스트.
 *
 * 답습: 사이클 LL/NN.
 *
 * 검증:
 *  - 안내 메시지 + 템플릿 건수 표시
 *  - isPending=true → "추가 중…" + disabled
 *  - isPending=false → "기본 템플릿 추가" 버튼 활성
 */

import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ChecklistEmptyState } from "@/components/checklist/ChecklistEmptyState";

const NOOP = () => {};

describe("사이클 QQ — ChecklistEmptyState", () => {
  it("안내 메시지 + 템플릿 건수 표시", () => {
    const html = renderToStaticMarkup(
      <ChecklistEmptyState
        templateSize={42}
        isPending={false}
        onAddTemplate={NOOP}
      />,
    );
    expect(html).toContain("아직 체크리스트가 비어있어요");
    expect(html).toContain("42건의 기본 템플릿");
  });

  it("isPending=true → '추가 중…' + disabled", () => {
    const html = renderToStaticMarkup(
      <ChecklistEmptyState
        templateSize={20}
        isPending={true}
        onAddTemplate={NOOP}
      />,
    );
    expect(html).toContain("추가 중…");
    expect(html).toContain("disabled");
  });

  it("isPending=false → '기본 템플릿 추가' 활성", () => {
    const html = renderToStaticMarkup(
      <ChecklistEmptyState
        templateSize={20}
        isPending={false}
        onAddTemplate={NOOP}
      />,
    );
    expect(html).toContain("기본 템플릿 추가");
    expect(html).not.toContain("추가 중…");
  });
});
