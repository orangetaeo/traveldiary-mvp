/**
 * 사이클 (Session F) — /shared FilteredEmptyCard 빈 상태 EmptyState 마이그레이션 회귀.
 *
 * 답습: PR #149 vote-list-empty + ChecklistEmptyState 단위 테스트 패턴 (정적 마크업만).
 * @testing-library/react 미도입 정책 준수 — onClick 거동은 호스트(/shared 페이지) 책임.
 *
 * 검증:
 *  - filter_alt_off 아이콘 + 신규 카피
 *  - role=status + aria-live=polite (스크린리더 안내)
 *  - secondaryButton "전체 보기" 라벨 + 버튼 클래스 렌더 (호스트 onReset wiring)
 *  - primaryButton 미렌더 (위 검색/정렬 폼이 1차 CTA)
 *  - 옛 평면 wrapper 클래스("text-td-body text-ink-mute text-center py-8 bg-white") 부재
 */

import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { FilteredEmptyCard } from "@/components/share/SharedPageCards";

const NOOP = () => {};

describe("Session F — /shared FilteredEmptyCard 빈 상태 EmptyState", () => {
  it("filter_alt_off 아이콘 + 신규 카피", () => {
    const html = renderToStaticMarkup(<FilteredEmptyCard onReset={NOOP} />);
    expect(html).toContain("filter_alt_off");
    expect(html).toContain("조건에 맞는 여행이 없어요");
    expect(html).toContain("필터를 바꿔 다른 여행을 찾아보세요");
  });

  it("role=status + aria-live=polite (EmptyState 보존)", () => {
    const html = renderToStaticMarkup(<FilteredEmptyCard onReset={NOOP} />);
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
  });

  it("secondaryButton '전체 보기' 라벨 + outline 클래스 렌더", () => {
    const html = renderToStaticMarkup(<FilteredEmptyCard onReset={NOOP} />);
    expect(html).toContain("전체 보기");
    // EmptyState SecondaryAction outline 클래스 시그니처
    expect(html).toContain("border-purple/40");
  });

  it("primaryButton 미렌더 (위 검색/정렬 폼이 1차 CTA)", () => {
    const html = renderToStaticMarkup(<FilteredEmptyCard onReset={NOOP} />);
    // EmptyState PrimaryAction 클래스가 등장하면 안 됨
    expect(html).not.toContain("py-td-sm px-td-md bg-purple text-white");
  });

  it("옛 평면 wrapper 클래스 부재 (마이그 회귀)", () => {
    const html = renderToStaticMarkup(<FilteredEmptyCard onReset={NOOP} />);
    expect(html).not.toContain(
      "text-td-body text-ink-mute text-center py-8 bg-white",
    );
  });
});
