/**
 * EmergencyHeaderButton 컴포넌트 단위 테스트.
 * 사이클 P (ADR-035) — 응급 빠른 액세스 버튼.
 *
 * 위치: components/city/EmergencyHeader.tsx
 */

import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { EmergencyHeaderButton } from "@/components/city/EmergencyHeader";

describe("EmergencyHeaderButton", () => {
  it("citySlug 기반 /city/{slug}/emergency 링크", () => {
    const html = renderToStaticMarkup(
      <EmergencyHeaderButton citySlug="phu-quoc" />,
    );
    expect(html).toContain('href="/city/phu-quoc/emergency"');
  });

  it("'응급' 텍스트 + emergency icon 노출", () => {
    const html = renderToStaticMarkup(
      <EmergencyHeaderButton citySlug="da-nang" />,
    );
    expect(html).toContain("응급");
    expect(html).toContain("emergency");
  });

  it("aria-label로 스크린리더 안내", () => {
    const html = renderToStaticMarkup(
      <EmergencyHeaderButton citySlug="hoi-an" />,
    );
    expect(html).toContain('aria-label="응급 정보 빠른 보기"');
  });

  it("emphasized=false (기본) → soft 배경", () => {
    const html = renderToStaticMarkup(
      <EmergencyHeaderButton citySlug="phu-quoc" />,
    );
    expect(html).toContain("bg-danger-soft");
  });

  it("emphasized=true → 강조 배경 + filled icon", () => {
    const html = renderToStaticMarkup(
      <EmergencyHeaderButton citySlug="phu-quoc" emphasized />,
    );
    expect(html).toContain("bg-danger");
    expect(html).toContain("filled");
    expect(html).not.toContain("bg-danger-soft");
  });
});
