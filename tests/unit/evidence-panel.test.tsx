/**
 * EvidencePanel 단위 테스트 — Stitch 시안 톤 매칭 후 회귀 보호.
 *
 * renderToStaticMarkup 으로 collapsed 상태 HTML 검증 (defaultOpen=false 기본).
 * defaultOpen=true 케이스로 expanded 영역 검증.
 */

import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { EvidencePanel } from "@/components/ui/EvidencePanel";
import type { Evidence } from "@/lib/types";

describe("EvidencePanel", () => {
  it("reasons 0 + sources 0이면 null 반환 (T3 규칙)", () => {
    const html = renderToStaticMarkup(<EvidencePanel reasons={[]} />);
    expect(html).toBe("");
  });

  it("collapsed 기본 — lightbulb 아이콘 + 근거 N건 배지 + expand_more", () => {
    const html = renderToStaticMarkup(
      <EvidencePanel reasons={["네이버 후기 387건", "도보 8분", "현지인 60%"]} />,
    );
    expect(html).toContain("lightbulb");
    expect(html).toContain("근거 3건");
    expect(html).toContain("expand_more");
    expect(html).toContain('aria-expanded="false"');
  });

  it("defaultOpen=true — reasons li + expand_less + 배지 숨김", () => {
    const html = renderToStaticMarkup(
      <EvidencePanel
        reasons={["근거 A", "근거 B"]}
        defaultOpen
      />,
    );
    expect(html).toContain("근거 A");
    expect(html).toContain("근거 B");
    expect(html).toContain("expand_less");
    expect(html).toContain('aria-expanded="true"');
    expect(html).not.toContain("근거 2건");
  });

  it("evidence 객체가 reasons prop보다 우선", () => {
    const evidence: Evidence = {
      reasons: ["우선 근거"],
      sources: [],
      verifiedAt: "2026-05-04T00:00:00.000Z",
    };
    const html = renderToStaticMarkup(
      <EvidencePanel reasons={["fallback"]} evidence={evidence} defaultOpen />,
    );
    expect(html).toContain("우선 근거");
    expect(html).not.toContain("fallback");
  });

  it("sources만 있고 reasons 0 — 출처 영역 노출", () => {
    const evidence: Evidence = {
      reasons: [],
      sources: [
        { platform: "naver", reviewCount: 387, positiveRate: 92 },
        { platform: "google", url: "https://example.com" },
      ],
      verifiedAt: "2026-05-04T00:00:00.000Z",
    };
    const html = renderToStaticMarkup(<EvidencePanel evidence={evidence} defaultOpen />);
    expect(html).toContain("네이버");
    expect(html).toContain("387");
    expect(html).toContain("92% 긍정");
    expect(html).toContain("구글");
  });

  it("warnings 있으면 info 아이콘 + amber 워닝 배너", () => {
    const evidence: Evidence = {
      reasons: ["X"],
      sources: [],
      verifiedAt: "2026-05-04T00:00:00.000Z",
      warnings: ["예약 불가 · 워크인만 가능"],
    };
    const html = renderToStaticMarkup(<EvidencePanel evidence={evidence} defaultOpen />);
    expect(html).toContain("info");
    expect(html).toContain("예약 불가");
    expect(html).toContain("amber");
  });

  it("verifiedAt 표시", () => {
    const evidence: Evidence = {
      reasons: ["X"],
      sources: [],
      verifiedAt: "2026-05-04T12:00:00.000Z",
    };
    const html = renderToStaticMarkup(<EvidencePanel evidence={evidence} defaultOpen />);
    expect(html).toContain("2026-05-04");
  });

  it("button type=button + aria-controls", () => {
    const html = renderToStaticMarkup(<EvidencePanel reasons={["X"]} />);
    expect(html).toContain('type="button"');
    expect(html).toContain('aria-controls="evidence-panel-body"');
  });

  it("커스텀 label", () => {
    const html = renderToStaticMarkup(
      <EvidencePanel reasons={["X"]} label="추천 이유" />,
    );
    expect(html).toContain("추천 이유");
  });
});
