/**
 * 자율 진행 (2026-05-08) — TranslateView ResultsView 하단 dead share button 활성화.
 *
 * "친구에게 카카오톡으로 보내기" button이 onClick 0 dead button → KakaoShareButton
 * (사이클 R / ADR-036) Web Share API + 카카오 sharer URL fallback 패턴 답습으로
 * 인라인 wiring. trip 컨텍스트 인식 (tripId → /trips/{id}, 부재 → window.location.href).
 *
 * source-grep으로 검증 (인라인 패턴 — 의존성 0).
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const SRC = readFileSync(
  resolve(process.cwd(), "components/translate/TranslateView.tsx"),
  "utf-8",
);

describe("TranslateView ResultsView — dead share button 활성화", () => {
  it("handleKakaoShare 함수 ResultsView 내부에 정의됨", () => {
    expect(SRC).toMatch(/async function handleKakaoShare\(\)/);
  });

  it("button onClick={handleKakaoShare} 연결됨 (이전 dead 상태 해소)", () => {
    expect(SRC).toMatch(/onClick=\{handleKakaoShare\}/);
  });

  it("aria-label '카카오톡으로 메뉴 번역 공유' 명시", () => {
    expect(SRC).toContain('aria-label="카카오톡으로 메뉴 번역 공유"');
  });

  it("button '친구에게 카카오톡으로 보내기' 라벨 BC 보존", () => {
    expect(SRC).toContain("친구에게 카카오톡으로 보내기");
  });

  it("share 아이콘 + amber 톤 BC 보존", () => {
    expect(SRC).toMatch(/material-symbols-outlined text-amber">share</);
  });
});

describe("TranslateView handleKakaoShare — Web Share API + sharer fallback (KakaoShareButton 답습)", () => {
  it("typeof window === 'undefined' SSR 가드", () => {
    const idx = SRC.indexOf("async function handleKakaoShare");
    const block = SRC.slice(idx, idx + 1200);
    expect(block).toContain('typeof window === "undefined"');
  });

  it("Web Share API 우선 (navigator.share 분기)", () => {
    const idx = SRC.indexOf("async function handleKakaoShare");
    const block = SRC.slice(idx, idx + 1200);
    expect(block).toContain("navigator.share");
    expect(block).toContain("await navigator.share({ url, text })");
  });

  it("AbortError 사용자 취소 → fallback 안 함 (KakaoShareButton 답습)", () => {
    const idx = SRC.indexOf("async function handleKakaoShare");
    const block = SRC.slice(idx, idx + 1200);
    expect(block).toMatch(/AbortError.*return/s);
  });

  it("카카오 sharer URL fallback (Web Share 미지원 시)", () => {
    const idx = SRC.indexOf("async function handleKakaoShare");
    const block = SRC.slice(idx, idx + 1200);
    expect(block).toContain("https://sharer.kakao.com/talk/friends/picker/link");
    expect(block).toContain("encodeURIComponent");
  });

  it("window.open noopener,noreferrer 보안 옵션 (KakaoShareButton 답습)", () => {
    const idx = SRC.indexOf("async function handleKakaoShare");
    const block = SRC.slice(idx, idx + 1200);
    expect(block).toMatch(/window\.open\([^)]+,\s*"_blank",\s*"noopener,noreferrer"\)/);
  });
});

describe("TranslateView handleKakaoShare — trip 컨텍스트 인식 + 메뉴 요약 텍스트", () => {
  it("tripId 있을 때 /trips/{id} URL 공유", () => {
    const idx = SRC.indexOf("async function handleKakaoShare");
    const block = SRC.slice(idx, idx + 1200);
    expect(block).toMatch(/tripId\s*\?\s*`\$\{window\.location\.origin\}\/trips\/\$\{tripId\}`/);
  });

  it("tripId 부재 시 현재 페이지 URL fallback", () => {
    const idx = SRC.indexOf("async function handleKakaoShare");
    const block = SRC.slice(idx, idx + 1200);
    expect(block).toContain("window.location.href");
  });

  it("liveItems 있을 때 항목 수 + 위험 건수 텍스트", () => {
    const idx = SRC.indexOf("async function handleKakaoShare");
    const block = SRC.slice(idx, idx + 1200);
    expect(block).toContain("메뉴 번역 결과");
    expect(block).toContain("annotated.length");
    expect(block).toContain("dangerCount");
    expect(block).toContain("알레르기 위험");
  });

  it("liveItems 부재 시 데모 친근 텍스트", () => {
    const idx = SRC.indexOf("async function handleKakaoShare");
    const block = SRC.slice(idx, idx + 1200);
    expect(block).toContain("메뉴 번역 데모 — 베트남 여행 함께 가요?");
  });
});

describe("TranslateView ResultsView — 기존 기능 BC 100% 보존", () => {
  it("CapturingView/ResultsView step 토글 BC", () => {
    expect(SRC).toContain("CapturingView");
    expect(SRC).toContain("ResultsView");
    expect(SRC).toMatch(/setStep\("results"\)/);
    expect(SRC).toMatch(/setStep\("capturing"\)/);
  });

  it("handleRetake (sessionStorage 청소 + onRetake) BC", () => {
    expect(SRC).toContain("handleRetake");
    expect(SRC).toContain('sessionStorage.removeItem("td-menu-translation")');
  });

  it("AllergenFilterChips 통합 BC", () => {
    expect(SRC).toContain("AllergenFilterChips");
    expect(SRC).toContain('ariaLabel="알레르기·식이 필터"');
  });

  it("liveItems sessionStorage 로드 + phuQuocMenu fallback BC", () => {
    expect(SRC).toContain("td-menu-translation");
    expect(SRC).toContain("liveItems ?? phuQuocMenu");
  });

  it("dangerCount 알레르기 알림 배너 BC", () => {
    expect(SRC).toContain("알레르기 위험");
    expect(SRC).toContain("bg-danger-soft");
  });
});
