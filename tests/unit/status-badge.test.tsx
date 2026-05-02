/**
 * StatusBadge 단위 테스트 — 사이클 E (ADR-031).
 *
 * 톤맵 분기 + emphasized + a11y label.
 * vitest jsdom + @testing-library/react 도입 회피 — 단순 렌더 출력 문자열 검사로 충분.
 */

import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { StatusBadge } from "@/components/ui/StatusBadge";

function render(node: React.ReactElement): string {
  return renderToStaticMarkup(node);
}

describe("StatusBadge — 톤맵 분기", () => {
  it("success — paid 아이콘 + success-deep title", () => {
    const html = render(
      <StatusBadge
        tone="success"
        icon="paid"
        title="가격 검증 완료"
        ariaLabel="가격 검증: 일치"
      />,
    );
    expect(html).toContain("bg-success-soft");
    expect(html).toContain("text-success-deep");
    expect(html).toContain("paid");
    expect(html).toContain("가격 검증 완료");
    expect(html).toContain("aria-label=\"가격 검증: 일치\"");
  });

  it("warn — amber-soft 톤", () => {
    const html = render(
      <StatusBadge
        tone="warn"
        icon="schedule"
        title="이동시간 빠듯"
        ariaLabel="이동: 빠듯"
      />,
    );
    expect(html).toContain("bg-amber-soft");
    expect(html).toContain("text-amber-deep");
    expect(html).not.toContain("border-l-4");
  });

  it("danger + emphasized=true → border-l-4 + ring-2 추가", () => {
    const html = render(
      <StatusBadge
        tone="danger"
        icon="price_change"
        title="가격 불일치"
        emphasized={true}
        ariaLabel="가격: 불일치"
      />,
    );
    expect(html).toContain("bg-danger-soft");
    expect(html).toContain("border-l-4");
    expect(html).toContain("ring-2");
    expect(html).toContain("ring-danger");
  });

  it("danger + emphasized=false → border-l-4 ❌", () => {
    const html = render(
      <StatusBadge
        tone="danger"
        icon="price_change"
        title="가격 불일치 (강조 미적용)"
        ariaLabel="test"
      />,
    );
    expect(html).not.toContain("border-l-4");
    expect(html).not.toContain("ring-2");
  });

  it("meta — surface-soft 톤 + 작은 위계", () => {
    const html = render(
      <StatusBadge
        tone="meta"
        icon="info"
        title="단일 출처"
        ariaLabel="가격: 단일"
      />,
    );
    expect(html).toContain("bg-surface-soft");
    expect(html).toContain("text-ink-soft");
    // meta 톤은 title 작게 (text-td-meta)
    expect(html).toContain("text-td-meta");
  });

  it("subtitle 렌더링", () => {
    const html = render(
      <StatusBadge
        tone="success"
        icon="check"
        title="OK"
        subtitle="추가 설명"
        ariaLabel="test"
      />,
    );
    expect(html).toContain("추가 설명");
    expect(html).toContain("text-td-caption");
  });

  it("subtitle 없으면 안 그림", () => {
    const html = render(
      <StatusBadge
        tone="meta"
        icon="info"
        title="제목만"
        ariaLabel="test"
      />,
    );
    expect(html).not.toContain("text-td-caption");
  });
});
