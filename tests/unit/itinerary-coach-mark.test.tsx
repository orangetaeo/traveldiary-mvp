/**
 * 사이클 3 (G4) — itinerary coach mark Overlay 프레젠테이션 테스트.
 *
 * 컴포넌트 분할 (orchestrator + overlay) 덕에 useEffect 의존성 없이
 * renderToStaticMarkup으로 ARIA + 핵심 카피 단언 가능.
 */

import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ItineraryCoachMarkOverlay } from "@/components/itinerary/ItineraryCoachMark";

describe("ItineraryCoachMarkOverlay — 첫 진입 M1 차별화 축 안내", () => {
  it("role=dialog + aria-modal + aria-labelledby 접근성 속성", () => {
    const html = renderToStaticMarkup(
      <ItineraryCoachMarkOverlay onDismiss={() => {}} />,
    );
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('aria-labelledby="itinerary-coach-title"');
    expect(html).toContain('id="itinerary-coach-title"');
  });

  it("핵심 카피 — '왜 이 장소를 골랐는지 알려드려요'", () => {
    const html = renderToStaticMarkup(
      <ItineraryCoachMarkOverlay onDismiss={() => {}} />,
    );
    expect(html).toContain("왜 이 장소를 골랐는지 알려드려요");
  });

  it("M1 차별화 축 본문 — 네이버 후기·거리·취향·출처 4 키워드 모두 포함", () => {
    const html = renderToStaticMarkup(
      <ItineraryCoachMarkOverlay onDismiss={() => {}} />,
    );
    expect(html).toContain("네이버 후기");
    expect(html).toContain("거리");
    expect(html).toContain("취향");
    expect(html).toContain("출처");
  });

  it("정체성 카피 — '추천 근거를 숨기지 않아요' (M1 차별화)", () => {
    const html = renderToStaticMarkup(
      <ItineraryCoachMarkOverlay onDismiss={() => {}} />,
    );
    expect(html).toContain("추천 근거를 숨기지 않아요");
  });

  it("CTA 버튼은 '확인했어요' 단일 (다음에 안 보기 체크박스 X — 1회 박제 자동)", () => {
    const html = renderToStaticMarkup(
      <ItineraryCoachMarkOverlay onDismiss={() => {}} />,
    );
    expect(html).toContain("확인했어요");
    expect(html).not.toContain("다음에 안 보기");
    expect(html).not.toContain("checkbox");
  });

  it("EvidencePanel 라벨 인용 — '왜 이걸 골랐나' (사용자 발견 단서)", () => {
    const html = renderToStaticMarkup(
      <ItineraryCoachMarkOverlay onDismiss={() => {}} />,
    );
    // 따옴표는 &ldquo;/&rdquo; 엔티티 또는 일반 문자로 출력될 수 있음
    expect(html).toMatch(/왜 이걸 골랐나/);
  });

  it("lightbulb 아이콘 — EvidencePanel과 시각 일관성", () => {
    const html = renderToStaticMarkup(
      <ItineraryCoachMarkOverlay onDismiss={() => {}} />,
    );
    expect(html).toContain("lightbulb");
  });
});
