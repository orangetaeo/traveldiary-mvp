/**
 * ErrorState 단위 테스트 — Stitch 시안 e5c5453a01f44dea9f30d2e2a3b3e24d.
 *
 * variant: not_found / forbidden / demo_mode
 */

import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ErrorState } from "@/components/ui/ErrorState";

describe("ErrorState — variant 시각", () => {
  it("not_found — explore_off + 404 라벨", () => {
    const html = renderToStaticMarkup(
      <ErrorState variant="not_found" title="찾을 수 없어요" />,
    );
    expect(html).toContain("explore_off");
    expect(html).toContain("404");
    expect(html).toContain("text-ink-soft");
    expect(html).toContain('tracking-[0.2em]');
  });

  it("forbidden — lock_person + 권한 없음 라벨 (amber)", () => {
    const html = renderToStaticMarkup(
      <ErrorState variant="forbidden" title="접근할 수 없어요" />,
    );
    expect(html).toContain("lock_person");
    expect(html).toContain("권한 없음");
    expect(html).toContain("text-amber-deep");
  });

  it("demo_mode — cloud_off + 데모 모드 배지 (amber-soft)", () => {
    const html = renderToStaticMarkup(
      <ErrorState variant="demo_mode" title="시연용 데이터" />,
    );
    expect(html).toContain("cloud_off");
    expect(html).toContain("데모 모드");
    expect(html).toContain("bg-amber-soft");
    expect(html).toContain("border-amber");
  });

  it("label override — variant default 대신 사용자 라벨", () => {
    const html = renderToStaticMarkup(
      <ErrorState variant="not_found" title="X" label="여행 #123" />,
    );
    expect(html).toContain("여행 #123");
    expect(html).not.toContain("404");
  });
});

describe("ErrorState — 기본 구조", () => {
  it("role=alert (스크린리더 즉시 안내)", () => {
    const html = renderToStaticMarkup(
      <ErrorState variant="not_found" title="X" />,
    );
    expect(html).toContain('role="alert"');
  });

  it("title bold 제목", () => {
    const html = renderToStaticMarkup(
      <ErrorState variant="not_found" title="찾을 수 없어요" />,
    );
    expect(html).toContain("찾을 수 없어요");
    expect(html).toContain("font-bold");
  });

  it("description 옵셔널 + whitespace-pre-line (멀티 라인 보존)", () => {
    const html = renderToStaticMarkup(
      <ErrorState
        variant="not_found"
        title="X"
        description="첫 줄\n둘째 줄"
      />,
    );
    expect(html).toContain("첫 줄");
    expect(html).toContain("whitespace-pre-line");
  });

  it("children — info card / feature list 슬롯", () => {
    const html = renderToStaticMarkup(
      <ErrorState variant="forbidden" title="X">
        <div data-testid="info-card">잠긴 콘텐츠 안내</div>
      </ErrorState>,
    );
    expect(html).toContain("잠긴 콘텐츠 안내");
  });

  it("아이콘 컨테이너 + 48px 사이즈", () => {
    const html = renderToStaticMarkup(
      <ErrorState variant="not_found" title="X" />,
    );
    expect(html).toContain("rounded-full");
    expect(html).toContain("text-[48px]");
  });
});

describe("ErrorState — 액션", () => {
  it("primaryAction href — bg-ink Link", () => {
    const html = renderToStaticMarkup(
      <ErrorState
        variant="not_found"
        title="X"
        primaryAction={{ label: "홈으로", href: "/" }}
      />,
    );
    expect(html).toContain('href="/"');
    expect(html).toContain("홈으로");
    expect(html).toContain("bg-ink");
    expect(html).toContain("text-white");
  });

  it("primaryAction onClick — button[type=button]", () => {
    const html = renderToStaticMarkup(
      <ErrorState
        variant="not_found"
        title="X"
        primaryAction={{ label: "다시 시도", onClick: () => {} }}
      />,
    );
    expect(html).toContain('type="button"');
    expect(html).toContain("다시 시도");
  });

  it("secondaryAction — 보라 + arrow_forward 아이콘", () => {
    const html = renderToStaticMarkup(
      <ErrorState
        variant="not_found"
        title="X"
        secondaryAction={{ label: "내 여행 둘러보기", href: "/trips" }}
      />,
    );
    expect(html).toContain("내 여행 둘러보기");
    expect(html).toContain("arrow_forward");
    expect(html).toContain("text-purple-deep");
  });

  it("primary + secondary 둘 다 노출", () => {
    const html = renderToStaticMarkup(
      <ErrorState
        variant="forbidden"
        title="X"
        primaryAction={{ label: "P", onClick: () => {} }}
        secondaryAction={{ label: "S", href: "/x" }}
      />,
    );
    expect(html).toContain(">P<");
    expect(html).toContain(">S<");
  });

  it("액션 둘 다 없으면 액션 영역 미렌더", () => {
    const html = renderToStaticMarkup(
      <ErrorState variant="not_found" title="X" />,
    );
    expect(html).not.toContain("bg-ink text-white");
    expect(html).not.toContain("arrow_forward");
  });
});

describe("ErrorState — 시안 3 artboard 통합 시연", () => {
  it("A: 404 — 시안 호출 그대로", () => {
    const html = renderToStaticMarkup(
      <ErrorState
        variant="not_found"
        title="찾으시는 여행이 없어요"
        description={"링크가 만료되었거나 삭제된 여행일 수 있어요."}
        primaryAction={{ label: "홈으로 돌아가기", href: "/" }}
        secondaryAction={{ label: "내 여행 둘러보기", href: "/trips" }}
      />,
    );
    expect(html).toContain("404");
    expect(html).toContain("찾으시는 여행이 없어요");
    expect(html).toContain("홈으로 돌아가기");
    expect(html).toContain("내 여행 둘러보기");
  });

  it("B: 403 — info card + 두 버튼", () => {
    const html = renderToStaticMarkup(
      <ErrorState
        variant="forbidden"
        title="이 여행에 접근할 수 없어요"
        primaryAction={{ label: "홈으로", href: "/" }}
        secondaryAction={{ label: "받은 여행 목록", href: "/shared" }}
      >
        <div>잠긴 안내 카드</div>
      </ErrorState>,
    );
    expect(html).toContain("권한 없음");
    expect(html).toContain("잠긴 안내 카드");
  });

  it("C: demo_mode — feature list + 두 버튼", () => {
    const html = renderToStaticMarkup(
      <ErrorState
        variant="demo_mode"
        title="지금은 시연용 데이터로 보여드려요"
        primaryAction={{ label: "데모 둘러보기", href: "/" }}
        secondaryAction={{ label: "DB 연결 안내", href: "/help" }}
      >
        <ul>
          <li>✓ AI 일정 미리보기</li>
          <li>✗ 저장·공유 비활성</li>
        </ul>
      </ErrorState>,
    );
    expect(html).toContain("데모 모드");
    expect(html).toContain("AI 일정 미리보기");
    expect(html).toContain("DB 연결 안내");
  });
});
