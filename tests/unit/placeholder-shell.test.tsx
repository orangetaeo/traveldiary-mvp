/**
 * PlaceholderShell 단위 테스트 — chrome 정체성 + slot 분기.
 *
 * 검증:
 *  - 정체성 amber 노트 (info icon + role=note + aria-live)
 *  - 헤더 + Hero 단일 타이틀 (이중 표기 제거)
 *  - iconVariant 분기 (soft-purple / solid-purple)
 *  - description ReactNode 허용
 *  - back link default (/settings) + custom 분기
 *  - children 위치 (Hero 뒤 + amber 노트 앞)
 *  - footerExtra 위치 (amber 노트 뒤 + backHref Link 앞)
 */

import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => <a href={href} {...rest}>{children}</a>,
}));

import { PlaceholderShell } from "@/components/common/PlaceholderShell";

const NOTE = { title: "준비 중", body: "정식 기능은 R1 사인오프 후 활성됩니다." };

describe("PlaceholderShell — 정체성 + chrome", () => {
  it("amber 정체성 노트 (role=note + aria-live + info icon)", () => {
    const html = renderToStaticMarkup(
      <PlaceholderShell
        title="테스트"
        description="설명"
        iconName="info"
        note={NOTE}
      >
        <p>본문</p>
      </PlaceholderShell>,
    );
    expect(html).toContain('role="note"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain("bg-amber-soft");
    expect(html).toContain("준비 중");
    expect(html).toContain("정식 기능은 R1 사인오프");
  });

  it("헤더 + Hero 단일 타이틀 (이중 표기 제거)", () => {
    const html = renderToStaticMarkup(
      <PlaceholderShell
        title="테스트 타이틀"
        description="설명"
        iconName="info"
        note={NOTE}
      >
        <p>본문</p>
      </PlaceholderShell>,
    );
    // h1(헤더) + h2(Hero) 모두 같은 title 사용 — 두 번 등장
    const occurrences = html.split("테스트 타이틀").length - 1;
    expect(occurrences).toBe(2);
  });

  it("iconVariant=soft-purple (default) — bg-purple-soft + text-purple-deep", () => {
    const html = renderToStaticMarkup(
      <PlaceholderShell
        title="t"
        description="d"
        iconName="info"
        note={NOTE}
      >
        <p />
      </PlaceholderShell>,
    );
    expect(html).toContain("bg-purple-soft");
    expect(html).toContain("text-purple-deep");
    expect(html).not.toContain("bg-purple text-white"); // solid 아님
  });

  it("iconVariant=solid-purple — bg-purple + text-white", () => {
    const html = renderToStaticMarkup(
      <PlaceholderShell
        title="t"
        description="d"
        iconName="download"
        iconVariant="solid-purple"
        note={NOTE}
      >
        <p />
      </PlaceholderShell>,
    );
    // Hero 원형 안에 bg-purple과 text-white가 함께 등장
    expect(html).toMatch(/bg-purple[^-]/);
    expect(html).toContain("text-white");
  });

  it("iconName이 Material Symbols로 렌더 (Hero 원형)", () => {
    const html = renderToStaticMarkup(
      <PlaceholderShell
        title="t"
        description="d"
        iconName="schedule"
        note={NOTE}
      >
        <p />
      </PlaceholderShell>,
    );
    expect(html).toContain("schedule");
    expect(html).toContain("material-symbols-outlined");
  });

  it("description ReactNode 허용 (string + JSX)", () => {
    const html = renderToStaticMarkup(
      <PlaceholderShell
        title="t"
        description={
          <>
            <p>첫 줄</p>
            <span>두 번째 캡션</span>
          </>
        }
        iconName="info"
        note={NOTE}
      >
        <p />
      </PlaceholderShell>,
    );
    expect(html).toContain("첫 줄");
    expect(html).toContain("두 번째 캡션");
  });

  it("back link default = /settings + 텍스트 '← 설정으로'", () => {
    const html = renderToStaticMarkup(
      <PlaceholderShell
        title="t"
        description="d"
        iconName="info"
        note={NOTE}
      >
        <p />
      </PlaceholderShell>,
    );
    expect(html).toContain('href="/settings"');
    expect(html).toContain("← 설정으로");
    expect(html).toContain('aria-label="설정으로 돌아가기"');
  });

  it("backHref + backLabel custom 분기", () => {
    const html = renderToStaticMarkup(
      <PlaceholderShell
        title="t"
        description="d"
        iconName="info"
        note={NOTE}
        backHref="/profile"
        backLabel="← 마이페이지로"
        backAriaLabel="마이페이지로"
      >
        <p />
      </PlaceholderShell>,
    );
    expect(html).toContain('href="/profile"');
    expect(html).toContain("← 마이페이지로");
    expect(html).toContain('aria-label="마이페이지로"');
  });

  it("children 렌더 (본문 위치 = Hero 뒤 + amber 노트 앞)", () => {
    const html = renderToStaticMarkup(
      <PlaceholderShell
        title="t"
        description="설명문"
        iconName="info"
        note={NOTE}
      >
        <div data-testid="custom-section">고유 본문 내용</div>
      </PlaceholderShell>,
    );
    expect(html).toContain('data-testid="custom-section"');
    expect(html).toContain("고유 본문 내용");
    // Hero(설명문) 뒤 + amber(준비 중) 앞 위치 검증
    const desc = html.indexOf("설명문");
    const child = html.indexOf("고유 본문 내용");
    const noteIdx = html.indexOf("준비 중");
    expect(desc).toBeLessThan(child);
    expect(child).toBeLessThan(noteIdx);
  });

  it("note.body ReactNode 허용", () => {
    const html = renderToStaticMarkup(
      <PlaceholderShell
        title="t"
        description="d"
        iconName="info"
        note={{
          title: "타이틀",
          body: (
            <>
              <strong>강조</strong>된 본문
            </>
          ),
        }}
      >
        <p />
      </PlaceholderShell>,
    );
    expect(html).toContain("<strong>강조</strong>");
    expect(html).toContain("본문");
  });

  it("footerExtra slot — amber 노트 뒤 + backHref Link 앞에 렌더", () => {
    const html = renderToStaticMarkup(
      <PlaceholderShell
        title="t"
        description="d"
        iconName="info"
        note={NOTE}
        footerExtra={<div data-testid="extra-slot">추가 정보 슬롯</div>}
      >
        <p />
      </PlaceholderShell>,
    );
    expect(html).toContain('data-testid="extra-slot"');
    expect(html).toContain("추가 정보 슬롯");
    const noteIdx = html.indexOf("준비 중");
    const extra = html.indexOf("추가 정보 슬롯");
    const back = html.indexOf("← 설정으로");
    expect(noteIdx).toBeLessThan(extra);
    expect(extra).toBeLessThan(back);
  });

  it("footerExtra 미전달 시 추가 마크업 0 (외부 호출처 무영향)", () => {
    const without = renderToStaticMarkup(
      <PlaceholderShell
        title="t"
        description="d"
        iconName="info"
        note={NOTE}
      >
        <p />
      </PlaceholderShell>,
    );
    // amber 노트 닫는 </section> 직후 backHref Link <a 시작
    expect(without).toMatch(/<\/section>\s*<a[^>]+href="\/settings"/);
  });

  it("server component (no 'use client')", () => {
    // 컴파일된 출력에는 'use client'가 markup에 없어야 함
    const html = renderToStaticMarkup(
      <PlaceholderShell
        title="t"
        description="d"
        iconName="info"
        note={NOTE}
      >
        <p />
      </PlaceholderShell>,
    );
    expect(html).not.toContain("use client");
  });
});
