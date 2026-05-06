/**
 * 사이클 5 (G8) — OtaReentryConfirmOverlay 프레젠테이션 테스트.
 *
 * 분할 패턴 (사이클 3 답습) — Overlay만 props로 받아 정적 단언 가능.
 * Orchestrator(visibilitychange/focus 감지)는 useEffect 의존이라 vitest
 * node 환경에서 직접 테스트 불가 → source-level 회귀는 별도 layer.
 */

import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { OtaReentryConfirmOverlay } from "@/components/itinerary/OtaReentryConfirmBar";

describe("OtaReentryConfirmOverlay — OTA reentry 자가 보고 카드", () => {
  it("role=region + aria-label 접근성 속성", () => {
    const html = renderToStaticMarkup(
      <OtaReentryConfirmOverlay
        ota="agoda"
        priceKrw={89000}
        isPending={false}
        onConfirm={vi.fn()}
        onDecline={vi.fn()}
      />,
    );
    expect(html).toContain('role="region"');
    expect(html).toContain('aria-label="OTA 예약 확인"');
  });

  it("OTA 이름 라벨 노출 (constants 매핑 또는 fallback uppercase)", () => {
    const html = renderToStaticMarkup(
      <OtaReentryConfirmOverlay
        ota="agoda"
        priceKrw={89000}
        isPending={false}
        onConfirm={vi.fn()}
        onDecline={vi.fn()}
      />,
    );
    // OTA_LABEL["agoda"] = "Agoda" — 정확한 라벨 노출
    expect(html).toContain("Agoda");
  });

  it("핵심 카피 — '예약을 마치셨나요?'", () => {
    const html = renderToStaticMarkup(
      <OtaReentryConfirmOverlay
        ota="klook"
        priceKrw={50000}
        isPending={false}
        onConfirm={vi.fn()}
        onDecline={vi.fn()}
      />,
    );
    expect(html).toContain("예약을 마치셨나요");
  });

  it("priceKrw 포맷 (toLocaleString 천단위)", () => {
    const html = renderToStaticMarkup(
      <OtaReentryConfirmOverlay
        ota="agoda"
        priceKrw={1234567}
        isPending={false}
        onConfirm={vi.fn()}
        onDecline={vi.fn()}
      />,
    );
    expect(html).toContain("1,234,567");
  });

  it("두 CTA 버튼 — '예, 예약했어요' + '아니요'", () => {
    const html = renderToStaticMarkup(
      <OtaReentryConfirmOverlay
        ota="agoda"
        priceKrw={89000}
        isPending={false}
        onConfirm={vi.fn()}
        onDecline={vi.fn()}
      />,
    );
    expect(html).toContain("예, 예약했어요");
    expect(html).toContain("아니요");
  });

  it("isPending=true 시 두 버튼 모두 disabled", () => {
    const html = renderToStaticMarkup(
      <OtaReentryConfirmOverlay
        ota="agoda"
        priceKrw={89000}
        isPending={true}
        onConfirm={vi.fn()}
        onDecline={vi.fn()}
      />,
    );
    // 두 버튼 모두 disabled 속성이 박혀야 함
    const matches = html.match(/disabled/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });
});
