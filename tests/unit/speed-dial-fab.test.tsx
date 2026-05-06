/**
 * SpeedDialFab — 초기 SSR 상태 회귀.
 *
 * 검증 (SSR 초기 expanded=false):
 *  - 메인 FAB 렌더 + aria-expanded="false" + aria-controls 매칭
 *  - 자식 컨테이너 id가 aria-controls와 일치 + aria-hidden="true"
 *  - 자식 컨테이너 초기 클래스 opacity-0 + pointer-events-none
 *  - children prop 정상 렌더 (검색 + 카메라)
 *  - 외곽 fixed 컨테이너에 centered phone frame 클래스
 *
 * 인터랙션(클릭/ESC/외부 클릭) 검증은 @testing-library/react 도입 후 별도 사이클.
 */

import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SpeedDialFab } from "@/components/ui/SpeedDialFab";

describe("SpeedDialFab — 초기 SSR", () => {
  it("메인 FAB이 aria-expanded=false + aria-controls 매칭", () => {
    const html = renderToStaticMarkup(
      <SpeedDialFab>
        <button data-speed-dial-action="true" aria-label="검색">
          search
        </button>
      </SpeedDialFab>,
    );

    expect(html).toMatch(/aria-expanded="false"/);
    const controlsMatch = html.match(/aria-controls="([^"]+)"/);
    expect(controlsMatch).not.toBeNull();
    const actionsId = controlsMatch![1];
    expect(html).toContain(`id="${actionsId}"`);
  });

  it("자식 컨테이너 초기에 opacity-0 + pointer-events-none + aria-hidden=true", () => {
    const html = renderToStaticMarkup(
      <SpeedDialFab>
        <button data-speed-dial-action="true">test</button>
      </SpeedDialFab>,
    );

    expect(html).toContain("opacity-0");
    expect(html).toContain("pointer-events-none");
    expect(html).toMatch(/aria-hidden="true"/);
  });

  it("children prop 정상 렌더 (검색 + 카메라)", () => {
    const html = renderToStaticMarkup(
      <SpeedDialFab>
        <button data-speed-dial-action="true" aria-label="주변 검색">
          <span>search</span>
        </button>
        <a href="/translate" data-speed-dial-action="true" aria-label="카메라 번역">
          <span>photo_camera</span>
        </a>
      </SpeedDialFab>,
    );

    expect(html).toContain('aria-label="주변 검색"');
    expect(html).toContain('aria-label="카메라 번역"');
    expect(html).toContain('href="/translate"');
  });

  it("외곽 컨테이너에 centered phone frame 클래스 (left-1/2 + max-w-[420px])", () => {
    const html = renderToStaticMarkup(
      <SpeedDialFab>
        <button data-speed-dial-action="true">test</button>
      </SpeedDialFab>,
    );

    expect(html).toContain("left-1/2");
    expect(html).toContain("-translate-x-1/2");
    expect(html).toContain("max-w-[420px]");
    expect(html).toContain("w-full");
  });

  it("기본 메인 FAB aria-label '빠른 메뉴' + 커스텀 ariaLabel 적용", () => {
    const defaultHtml = renderToStaticMarkup(
      <SpeedDialFab>
        <button data-speed-dial-action="true">test</button>
      </SpeedDialFab>,
    );
    expect(defaultHtml).toContain('aria-label="빠른 메뉴"');

    const customHtml = renderToStaticMarkup(
      <SpeedDialFab ariaLabel="액션 메뉴">
        <button data-speed-dial-action="true">test</button>
      </SpeedDialFab>,
    );
    expect(customHtml).toContain('aria-label="액션 메뉴"');
  });

  it("bottomClassName + zIndex prop 반영", () => {
    const html = renderToStaticMarkup(
      <SpeedDialFab bottomClassName="bottom-20" zIndex="z-50">
        <button data-speed-dial-action="true">test</button>
      </SpeedDialFab>,
    );
    expect(html).toContain("bottom-20");
    expect(html).toContain("z-50");
  });

  it("메인 FAB add 아이콘 (rotate 클래스 초기 미적용)", () => {
    const html = renderToStaticMarkup(
      <SpeedDialFab>
        <button data-speed-dial-action="true">test</button>
      </SpeedDialFab>,
    );
    expect(html).toContain(">add<");
    expect(html).not.toContain("rotate-45");
  });
});
