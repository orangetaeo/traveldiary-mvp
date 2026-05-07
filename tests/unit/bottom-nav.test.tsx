/**
 * BottomNav 컴포넌트 단위 테스트 — 사이클 O + BLOCKER5a 확장.
 *
 * 추출 후 행위 보존 검증:
 *  - 4슬롯 (home/trips/itinerary/profile) 모두 렌더
 *  - active prop별 aria-current="page" 정확히 1개
 *  - href 매핑 정확 (DEMO_TRIP_ID 내부 import)
 *  - aria-label "주요 메뉴" 보존
 *
 * BLOCKER5a 추가:
 *  - 11 페이지 (2 기존 + 9 신규) BottomNav import + active 슬롯 매핑 구조 검증
 *
 * status-badge 패턴 답습 — renderToStaticMarkup으로 HTML 문자열 검증.
 */

import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import * as fs from "node:fs";
import * as path from "node:path";
import { BottomNav, type BottomNavSlot } from "@/components/ui/BottomNav";
import { DEMO_TRIP_ID } from "@/lib/seed";

function render(node: React.ReactElement): string {
  return renderToStaticMarkup(node);
}

describe("BottomNav — 슬롯 렌더링", () => {
  it("4슬롯 모두 노출 + nav aria-label", () => {
    const html = render(<BottomNav active="home" />);
    expect(html).toContain('aria-label="주요 메뉴"');
    expect(html).toContain(">홈<");
    expect(html).toContain(">여행<");
    expect(html).toContain(">일정<");
    expect(html).toContain(">마이<");
  });

  it("href 매핑 — / / /trips / /itinerary/{DEMO_TRIP_ID} / /profile", () => {
    const html = render(<BottomNav active="home" />);
    expect(html).toContain('href="/"');
    expect(html).toContain('href="/trips"');
    expect(html).toContain(`href="/itinerary/${DEMO_TRIP_ID}"`);
    expect(html).toContain('href="/profile"');
  });
});

describe("BottomNav — active prop 분기", () => {
  const slots: BottomNavSlot[] = ["home", "trips", "itinerary", "profile"];

  it.each(slots)("active=%s — aria-current='page' 정확히 1개", (active) => {
    const html = render(<BottomNav active={active} />);
    const matches = html.match(/aria-current="page"/g) ?? [];
    expect(matches.length).toBe(1);
  });

  it("active=trips — explore 아이콘 filled, home 아이콘 unfilled", () => {
    const html = render(<BottomNav active="trips" />);
    // explore 옆에 'filled' 클래스
    expect(html).toMatch(/material-symbols-outlined filled[^>]*>explore/);
    // home은 filled 아님
    expect(html).not.toMatch(/material-symbols-outlined filled[^>]*>home/);
  });
});

describe("BottomNav — 시각 무회귀 (사이클 I 토큰 보존)", () => {
  it("max-w-[420px] / fixed bottom-0 / h-16", () => {
    const html = render(<BottomNav active="home" />);
    expect(html).toContain("max-w-[420px]");
    expect(html).toContain("fixed bottom-0");
    expect(html).toContain("h-16");
    expect(html).toContain("z-50");
  });

  it("active 색상은 text-purple, 비활성은 text-ink-mute", () => {
    const html = render(<BottomNav active="home" />);
    expect(html).toContain("text-purple");
    expect(html).toContain("text-ink-mute");
  });
});

/**
 * BLOCKER5a — 11 페이지 BottomNav 구조 커버리지.
 *
 * 각 페이지 소스 파일을 읽어 BottomNav import + active 슬롯 매핑 검증.
 * 새 페이지가 BottomNav를 빠뜨리면 이 테스트가 잡아줌.
 */
describe("BottomNav — 페이지 커버리지 (BLOCKER5a)", () => {
  const root = path.resolve(__dirname, "../../app");

  const EXPECTED_PAGES: Array<{
    pagePath: string;
    expectedActive: BottomNavSlot;
    label: string;
  }> = [
    { pagePath: "page.tsx", expectedActive: "home", label: "/" },
    { pagePath: "trips/page.tsx", expectedActive: "trips", label: "/trips" },
    { pagePath: "itinerary/[id]/page.tsx", expectedActive: "itinerary", label: "/itinerary/[id]" },
    { pagePath: "cost/[tripId]/page.tsx", expectedActive: "itinerary", label: "/cost/[tripId]" },
    { pagePath: "checklist/[tripId]/page.tsx", expectedActive: "itinerary", label: "/checklist/[tripId]" },
    { pagePath: "city/[slug]/page.tsx", expectedActive: "trips", label: "/city/[slug]" },
    { pagePath: "city/[slug]/emergency/page.tsx", expectedActive: "trips", label: "/city/[slug]/emergency" },
    { pagePath: "translate/page.tsx", expectedActive: "itinerary", label: "/translate" },
    { pagePath: "share/[key]/page.tsx", expectedActive: "trips", label: "/share/[key]" },
    { pagePath: "vote/[tripId]/page.tsx", expectedActive: "itinerary", label: "/vote/[tripId]" },
    { pagePath: "shared/page.tsx", expectedActive: "trips", label: "/shared" },
  ];

  it.each(EXPECTED_PAGES)(
    "$label — BottomNav import + active='$expectedActive'",
    ({ pagePath, expectedActive }) => {
      const filePath = path.join(root, pagePath);
      const src = fs.readFileSync(filePath, "utf-8");
      expect(src).toContain("BottomNav");
      expect(src).toContain(`active="${expectedActive}"`);
    },
  );

  it("총 11 페이지 커버 (2 기존 + 9 신규)", () => {
    expect(EXPECTED_PAGES.length).toBe(11);
  });
});
