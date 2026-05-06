/**
 * 미테스트 컴포넌트 스모크 테스트 — Batch 6.
 *
 * renderToStaticMarkup 정적 마크업 검증.
 * 대상: ErrorState, ValidationBadges, StatusBadge.
 */

import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

// ─── Mocks ────────────────────────────────────────────────

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [k: string]: unknown }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));

// ─── Imports ──────────────────────────────────────────────

import { ErrorState } from "@/components/ui/ErrorState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { BadgeTone } from "@/components/ui/StatusBadge";

/* ════════════════════════════════════════════
 * StatusBadge
 * ════════════════════════════════════════════ */

describe("StatusBadge", () => {
  it("기본 렌더 — role=status + ariaLabel", () => {
    const html = renderToStaticMarkup(
      <StatusBadge tone="success" icon="check" title="검증 완료" ariaLabel="검증 완료" />,
    );
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-label="검증 완료"');
    expect(html).toContain("check");
    expect(html).toContain("검증 완료");
  });

  it("success 톤 — success-soft 배경", () => {
    const html = renderToStaticMarkup(
      <StatusBadge tone="success" icon="check" title="완료" ariaLabel="완료" />,
    );
    expect(html).toContain("bg-success-soft");
    expect(html).toContain("text-success-deep");
  });

  it("warn 톤 — amber-soft 배경", () => {
    const html = renderToStaticMarkup(
      <StatusBadge tone="warn" icon="warning" title="주의" ariaLabel="주의" />,
    );
    expect(html).toContain("bg-amber-soft");
    expect(html).toContain("text-amber-deep");
  });

  it("danger 톤 — danger-soft 배경", () => {
    const html = renderToStaticMarkup(
      <StatusBadge tone="danger" icon="error" title="위험" ariaLabel="위험" />,
    );
    expect(html).toContain("bg-danger-soft");
    expect(html).toContain("text-danger");
  });

  it("meta 톤 — surface-soft 배경 + text-td-meta", () => {
    const html = renderToStaticMarkup(
      <StatusBadge tone="meta" icon="info" title="참고" ariaLabel="참고" />,
    );
    expect(html).toContain("bg-surface-soft");
    expect(html).toContain("text-ink-mute");
    expect(html).toContain("text-td-meta");
  });

  it("subtitle 있으면 표시", () => {
    const html = renderToStaticMarkup(
      <StatusBadge tone="success" icon="check" title="완료" subtitle="24시간 캐시" ariaLabel="완료" />,
    );
    expect(html).toContain("24시간 캐시");
    expect(html).toContain("text-td-caption");
  });

  it("subtitle 없으면 미표시", () => {
    const html = renderToStaticMarkup(
      <StatusBadge tone="success" icon="check" title="완료" ariaLabel="완료" />,
    );
    expect(html).not.toContain("text-td-caption");
  });

  it("emphasized=true → ring-2 + border-l-4", () => {
    const html = renderToStaticMarkup(
      <StatusBadge tone="danger" icon="error" title="불일치" emphasized={true} ariaLabel="불일치" />,
    );
    expect(html).toContain("ring-2");
    expect(html).toContain("border-l-4");
  });

  it("emphasized=false → ring/border-l 없음", () => {
    const html = renderToStaticMarkup(
      <StatusBadge tone="danger" icon="error" title="위험" ariaLabel="위험" />,
    );
    expect(html).not.toContain("ring-2");
    expect(html).not.toContain("border-l-4");
  });

  it("icon filled (success/warn/danger) vs outlined (meta)", () => {
    const successHtml = renderToStaticMarkup(
      <StatusBadge tone="success" icon="check" title="t" ariaLabel="t" />,
    );
    expect(successHtml).toContain("filled");

    const metaHtml = renderToStaticMarkup(
      <StatusBadge tone="meta" icon="info" title="t" ariaLabel="t" />,
    );
    expect(metaHtml).not.toContain("filled");
  });

  it("4 톤 모두 렌더 성공", () => {
    const tones: BadgeTone[] = ["success", "warn", "danger", "meta"];
    for (const tone of tones) {
      const html = renderToStaticMarkup(
        <StatusBadge tone={tone} icon="check" title="t" ariaLabel="t" />,
      );
      expect(html).toContain('role="status"');
    }
  });
});

/* ════════════════════════════════════════════
 * ErrorState
 * ════════════════════════════════════════════ */

describe("ErrorState", () => {
  it("not_found 변형 — explore_off 아이콘 + 404 라벨", () => {
    const html = renderToStaticMarkup(
      <ErrorState variant="not_found" title="페이지를 찾을 수 없어요" />,
    );
    expect(html).toContain("explore_off");
    expect(html).toContain("404");
    expect(html).toContain("페이지를 찾을 수 없어요");
  });

  it("forbidden 변형 — lock_person 아이콘 + 권한 없음", () => {
    const html = renderToStaticMarkup(
      <ErrorState variant="forbidden" title="접근할 수 없어요" />,
    );
    expect(html).toContain("lock_person");
    expect(html).toContain("권한 없음");
  });

  it("demo_mode 변형 — cloud_off 아이콘 + 데모 모드", () => {
    const html = renderToStaticMarkup(
      <ErrorState variant="demo_mode" title="데모 환경입니다" />,
    );
    expect(html).toContain("cloud_off");
    expect(html).toContain("데모 모드");
  });

  it("role=alert 접근성", () => {
    const html = renderToStaticMarkup(
      <ErrorState variant="not_found" title="없음" />,
    );
    expect(html).toContain('role="alert"');
  });

  it("section 태그", () => {
    const html = renderToStaticMarkup(
      <ErrorState variant="not_found" title="테스트" />,
    );
    expect(html).toMatch(/^<section/);
  });

  it("description 있으면 표시", () => {
    const html = renderToStaticMarkup(
      <ErrorState variant="not_found" title="없음" description="상세 설명입니다" />,
    );
    expect(html).toContain("상세 설명입니다");
  });

  it("description 없으면 미표시", () => {
    const html = renderToStaticMarkup(
      <ErrorState variant="not_found" title="없음" />,
    );
    expect(html).not.toContain("whitespace-pre-line");
  });

  it("label override", () => {
    const html = renderToStaticMarkup(
      <ErrorState variant="not_found" title="없음" label="커스텀 라벨" />,
    );
    expect(html).toContain("커스텀 라벨");
    expect(html).not.toContain("404");
  });

  it("primaryAction — href → Link 렌더", () => {
    const html = renderToStaticMarkup(
      <ErrorState
        variant="not_found"
        title="없음"
        primaryAction={{ label: "홈으로", href: "/" }}
      />,
    );
    expect(html).toContain("홈으로");
    expect(html).toContain('href="/"');
    expect(html).toContain("bg-ink");
  });

  it("primaryAction — onClick → button 렌더", () => {
    const html = renderToStaticMarkup(
      <ErrorState
        variant="not_found"
        title="없음"
        primaryAction={{ label: "다시 시도", onClick: () => {} }}
      />,
    );
    expect(html).toContain("다시 시도");
    expect(html).toContain("<button");
  });

  it("secondaryAction — arrow_forward 아이콘", () => {
    const html = renderToStaticMarkup(
      <ErrorState
        variant="forbidden"
        title="권한"
        secondaryAction={{ label: "로그인하기", href: "/login" }}
      />,
    );
    expect(html).toContain("로그인하기");
    expect(html).toContain("arrow_forward");
    expect(html).toContain("text-purple-deep");
  });

  it("children 슬롯", () => {
    const html = renderToStaticMarkup(
      <ErrorState variant="demo_mode" title="데모">
        <div data-testid="child">추가 콘텐츠</div>
      </ErrorState>,
    );
    expect(html).toContain("추가 콘텐츠");
    expect(html).toContain('data-testid="child"');
  });

  it("className prop", () => {
    const html = renderToStaticMarkup(
      <ErrorState variant="not_found" title="없음" className="my-custom" />,
    );
    expect(html).toContain("my-custom");
  });

  it("demo_mode — amber-soft 아이콘 배경", () => {
    const html = renderToStaticMarkup(
      <ErrorState variant="demo_mode" title="데모" />,
    );
    expect(html).toContain("bg-amber-soft");
  });

  it("not_found — divider/40 아이콘 배경", () => {
    const html = renderToStaticMarkup(
      <ErrorState variant="not_found" title="없음" />,
    );
    expect(html).toContain("bg-divider/40");
  });

  it("action 없으면 action 영역 미렌더", () => {
    const html = renderToStaticMarkup(
      <ErrorState variant="not_found" title="없음" />,
    );
    expect(html).not.toContain("bg-ink");
    expect(html).not.toContain("arrow_forward");
  });
});
