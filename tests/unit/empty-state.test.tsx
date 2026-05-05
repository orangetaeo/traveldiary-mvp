/**
 * EmptyState 단위 테스트 — Stitch 시안 9ea27f2d0ef84ec8852527b8933f57ed.
 *
 * renderToStaticMarkup — 4 artboard 변종 + 액션/링크/visual slot 검증.
 */

import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { EmptyState } from "@/components/ui/EmptyState";

describe("EmptyState — 기본 구조", () => {
  it("아이콘 + 제목 노출", () => {
    const html = renderToStaticMarkup(
      <EmptyState icon="explore" title="아직 만든 여행이 없어요" />,
    );
    expect(html).toContain("explore");
    expect(html).toContain("아직 만든 여행이 없어요");
    expect(html).toContain("material-symbols-outlined");
  });

  it("description optional — 미제공 시 미렌더", () => {
    const html = renderToStaticMarkup(
      <EmptyState icon="checklist" title="비어있어요" />,
    );
    expect(html).not.toContain("max-w-[280px]");
  });

  it("description 제공 시 max-width 단락 노출", () => {
    const html = renderToStaticMarkup(
      <EmptyState
        icon="checklist"
        title="비어있어요"
        description="출발 전 챙길 것을 한 곳에 모아두세요."
      />,
    );
    expect(html).toContain("출발 전 챙길 것");
    expect(html).toContain("max-w-[280px]");
  });

  it("aria-live=polite + role=status (스크린리더 안내)", () => {
    const html = renderToStaticMarkup(
      <EmptyState icon="explore" title="X" />,
    );
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
  });

  it("원형 아이콘 컨테이너 (bg-purple-soft + rounded-full)", () => {
    const html = renderToStaticMarkup(
      <EmptyState icon="explore" title="X" />,
    );
    expect(html).toContain("bg-purple-soft");
    expect(html).toContain("rounded-full");
  });
});

describe("EmptyState — 4 artboard 변종", () => {
  it("A: Empty Trips — explore + 도시 chips", () => {
    const html = renderToStaticMarkup(
      <EmptyState
        icon="explore"
        title="아직 만든 여행이 없어요"
        description="베트남 6개 도시 중 한 곳을 골라 3분만에 일정을 만들어보세요."
        primaryButton={{ label: "새 여행 만들기", href: "/onboarding" }}
        link={{ label: "데모 일정 둘러보기", href: "/" }}
      >
        <div className="flex flex-wrap justify-center gap-1">
          <span>푸꾸옥</span>
          <span>다낭</span>
        </div>
      </EmptyState>,
    );
    expect(html).toContain("explore");
    expect(html).toContain("새 여행 만들기");
    expect(html).toContain("푸꾸옥");
    expect(html).toContain("데모 일정 둘러보기");
  });

  it("B: Empty Checklist — checklist + primary/secondary 버튼", () => {
    const html = renderToStaticMarkup(
      <EmptyState
        icon="checklist"
        title="체크리스트가 비어있어요"
        primaryButton={{ label: "기본 템플릿 추가", onClick: () => {} }}
        secondaryButton={{ label: "직접 추가", onClick: () => {} }}
      />,
    );
    expect(html).toContain("checklist");
    expect(html).toContain("기본 템플릿 추가");
    expect(html).toContain("직접 추가");
  });

  it("C: Empty Cost — payments + 차트 자식 + 환율 링크", () => {
    const html = renderToStaticMarkup(
      <EmptyState
        icon="payments"
        title="기록된 지출이 없어요"
        link={{ label: "VND ↔ KRW 환율 보기", href: "/exchange" }}
      >
        <div data-testid="chart">CHART</div>
      </EmptyState>,
    );
    expect(html).toContain("payments");
    expect(html).toContain("CHART");
    expect(html).toContain("환율 보기");
  });

  it("D: Empty Vote — how_to_vote + 예시 카드", () => {
    const html = renderToStaticMarkup(
      <EmptyState
        icon="how_to_vote"
        title="아직 투표가 없어요"
        primaryButton={{ label: "첫 투표 만들기", onClick: () => {} }}
      >
        <div data-testid="example">예시 카드</div>
      </EmptyState>,
    );
    expect(html).toContain("how_to_vote");
    expect(html).toContain("예시 카드");
    expect(html).toContain("첫 투표 만들기");
  });
});

describe("EmptyState — 액션 패턴", () => {
  it("primaryButton href — Link로 렌더 (anchor)", () => {
    const html = renderToStaticMarkup(
      <EmptyState
        icon="explore"
        title="X"
        primaryButton={{ label: "이동", href: "/somewhere" }}
      />,
    );
    expect(html).toContain('href="/somewhere"');
    expect(html).toContain("이동");
  });

  it("primaryButton onClick — button[type=button]로 렌더", () => {
    const html = renderToStaticMarkup(
      <EmptyState
        icon="explore"
        title="X"
        primaryButton={{ label: "클릭", onClick: () => {} }}
      />,
    );
    expect(html).toContain('type="button"');
    expect(html).toContain("클릭");
  });

  it("primaryButton disabled — disabled attribute", () => {
    const html = renderToStaticMarkup(
      <EmptyState
        icon="explore"
        title="X"
        primaryButton={{ label: "처리중", onClick: () => {}, disabled: true }}
      />,
    );
    expect(html).toContain("disabled");
  });

  it("primary는 bg-purple + secondary는 border outline", () => {
    const html = renderToStaticMarkup(
      <EmptyState
        icon="X"
        title="X"
        primaryButton={{ label: "P", onClick: () => {} }}
        secondaryButton={{ label: "S", onClick: () => {} }}
      />,
    );
    expect(html).toContain("bg-purple");
    expect(html).toContain("border-purple");
  });

  it("link 우측 화살표 → 자동 추가", () => {
    const html = renderToStaticMarkup(
      <EmptyState
        icon="X"
        title="X"
        link={{ label: "더 보기", href: "/x" }}
      />,
    );
    expect(html).toContain("더 보기 →");
  });

  it("buttons/link 없으면 액션 영역 미렌더", () => {
    const html = renderToStaticMarkup(<EmptyState icon="X" title="X" />);
    expect(html).not.toContain("py-td-sm px-td-md bg-purple");
    expect(html).not.toContain("→");
  });
});
