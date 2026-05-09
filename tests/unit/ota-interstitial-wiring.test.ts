/**
 * #35 OTA Affiliate Interstitial wiring 회귀 가드.
 *
 * Stitch #35 (904155d409d0425680539808c160df06) — 외부 redirect 직전 안내 모달.
 * 사이클 12a M8(ADR-025)에서 컴포넌트는 작성되었으나 wiring 미완 → D 카테고리 잔여 1.
 *
 * 변경 (2026-05-09):
 *  - OtaInterstitialModal에 onProceed 옵셔널 prop 추가 (BC 유지: 부재 시 기존 window.open fallback)
 *  - OtaCompareSection에서 import + render + handleClick에서 모달 트리거
 *  - setOtaOutgoing은 사용자가 "예약하기" 누른 시점에만 호출(취소 시 외부 이동 X)
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

const MODAL_PATH = path.resolve(
  __dirname,
  "../../components/modals/OtaInterstitialModal.tsx",
);
const SECTION_PATH = path.resolve(
  __dirname,
  "../../components/itinerary/OtaCompareSection.tsx",
);

const modalSource = readFileSync(MODAL_PATH, "utf-8");
const sectionSource = readFileSync(SECTION_PATH, "utf-8");

describe("#35 OtaInterstitialModal — onProceed BC", () => {
  it("interface에 onProceed 옵셔널 prop 노출", () => {
    expect(modalSource).toMatch(/onProceed\?:\s*\(\)\s*=>\s*void/);
  });

  it("handleProceed가 onProceed 우선, 부재 시 window.open으로 fallback", () => {
    expect(modalSource).toMatch(/if\s*\(\s*onProceed\s*\)/);
    expect(modalSource).toMatch(/window\.open\(affiliateUrl/);
  });

  it("handleProceed dependency에 onProceed 포함", () => {
    expect(modalSource).toMatch(/\[affiliateUrl,\s*onClose,\s*onProceed\]/);
  });
});

describe("#35 OtaCompareSection — interstitial wiring", () => {
  it("OtaInterstitialModal을 components/modals에서 import", () => {
    expect(sectionSource).toMatch(
      /import\s*\{\s*OtaInterstitialModal\s*\}\s*from\s*["']@\/components\/modals["']/,
    );
  });

  it("interstitial 상태 useState로 관리", () => {
    expect(sectionSource).toMatch(/setInterstitial/);
    expect(sectionSource).toMatch(/PendingInterstitial/);
  });

  it("handleClick이 setOtaOutgoing/window.open 직접 호출 안 함 (interstitial로 위임)", () => {
    // handleClick 시작부터 다음 함수 정의(handleProceed) 직전까지 추출
    const handleClickBlock = sectionSource.match(
      /function handleClick[\s\S]*?(?=\n\s+function handleProceed)/,
    );
    expect(handleClickBlock).toBeTruthy();
    if (!handleClickBlock) return;
    expect(handleClickBlock[0]).not.toMatch(/setOtaOutgoing\(/);
    expect(handleClickBlock[0]).not.toMatch(/window\.open\(/);
    expect(handleClickBlock[0]).toMatch(/setInterstitial\(/);
  });

  it("handleProceed에서 setOtaOutgoing + window.open 호출", () => {
    // handleProceed 시작부터 다음 함수 정의(buildInterstitialProps) 직전까지 추출
    const handleProceedBlock = sectionSource.match(
      /function handleProceed[\s\S]*?(?=\n\s+function buildInterstitialProps)/,
    );
    expect(handleProceedBlock).toBeTruthy();
    if (!handleProceedBlock) return;
    expect(handleProceedBlock[0]).toMatch(/setOtaOutgoing\(/);
    expect(handleProceedBlock[0]).toMatch(/window\.open\(redirectUrl/);
  });

  it("OtaInterstitialModal이 onProceed={handleProceed}로 마운트", () => {
    expect(sectionSource).toMatch(/<OtaInterstitialModal[\s\S]*?onProceed=\{handleProceed\}/);
  });

  it("interstitialProps가 provider/productName/price/affiliateUrl 모두 채움", () => {
    expect(sectionSource).toMatch(/provider:\s*OTA_LABEL\[offer\.ota\]/);
    expect(sectionSource).toMatch(/productName:\s*offer\.title/);
    expect(sectionSource).toMatch(/price:\s*`\$\{offer\.priceKrw\.toLocaleString\(\)\}원`/);
    expect(sectionSource).toMatch(/affiliateUrl:\s*redirectUrl/);
  });

  it("discountLabel은 originalPriceKrw 있을 때만 -N% 형식", () => {
    expect(sectionSource).toMatch(/discountLabel:\s*discount\s*\?\s*`-\$\{discount\}%`\s*:\s*undefined/);
  });
});
