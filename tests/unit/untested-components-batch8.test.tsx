/**
 * 미테스트 컴포넌트 스모크 테스트 — Batch 8.
 *
 * renderToStaticMarkup 정적 마크업 검증.
 * 대상: LegalPlaceholderShell, ModeTransitionWelcome, ModeTransitionSkipSheet.
 */

import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

// ─── Mocks ────────────────────────────────────────────────

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    [k: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/actions/trip", () => ({
  recordModeTransitionSkip: vi.fn(),
}));

// ─── Imports ──────────────────────────────────────────────

import { LegalPlaceholderShell } from "@/components/legal/LegalPlaceholderShell";
import { ModeTransitionWelcome } from "@/components/travel/ModeTransitionWelcome";
import { ModeTransitionSkipSheet } from "@/components/travel/ModeTransitionSkipSheet";
import type { Trip } from "@/lib/types";

/* ════════════════════════════════════════════
 * LegalPlaceholderShell
 * ════════════════════════════════════════════ */

describe("LegalPlaceholderShell", () => {
  const baseProps = {
    title: "이용약관",
    description: "서비스 이용 규칙",
    highlights: ["데이터 수집 최소화", "위치 서버 전송 금지", "로컬 처리 원칙"],
  };

  it("title 표시", () => {
    const html = renderToStaticMarkup(<LegalPlaceholderShell {...baseProps} />);
    expect(html).toContain("이용약관");
  });

  it("description 표시", () => {
    const html = renderToStaticMarkup(<LegalPlaceholderShell {...baseProps} />);
    expect(html).toContain("서비스 이용 규칙");
  });

  it("highlights 항목 모두 렌더", () => {
    const html = renderToStaticMarkup(<LegalPlaceholderShell {...baseProps} />);
    expect(html).toContain("데이터 수집 최소화");
    expect(html).toContain("위치 서버 전송 금지");
    expect(html).toContain("로컬 처리 원칙");
  });

  it("주요 항목 섹션 aria-labelledby", () => {
    const html = renderToStaticMarkup(<LegalPlaceholderShell {...baseProps} />);
    expect(html).toContain('aria-labelledby="legal-highlights-heading"');
    expect(html).toContain("주요 항목");
  });

  it("정식 문서 준비 중 안내", () => {
    const html = renderToStaticMarkup(<LegalPlaceholderShell {...baseProps} />);
    expect(html).toContain("정식 문서 준비 중");
    expect(html).toContain("bg-amber-soft");
    expect(html).toContain('role="note"');
  });

  it("gavel 아이콘", () => {
    const html = renderToStaticMarkup(<LegalPlaceholderShell {...baseProps} />);
    expect(html).toContain("gavel");
  });

  it("설정으로 돌아가기 링크", () => {
    const html = renderToStaticMarkup(<LegalPlaceholderShell {...baseProps} />);
    expect(html).toContain('href="/settings"');
    expect(html).toContain('aria-label="설정으로 돌아가기"');
  });

  it("이용약관 + 개인정보 처리방침 링크", () => {
    const html = renderToStaticMarkup(<LegalPlaceholderShell {...baseProps} />);
    expect(html).toContain('href="/legal/terms"');
    expect(html).toContain('href="/legal/privacy"');
  });

  it("lastUpdated 있으면 표시", () => {
    const html = renderToStaticMarkup(
      <LegalPlaceholderShell {...baseProps} lastUpdated="2026-05-01" />,
    );
    expect(html).toContain("마지막 갱신: 2026-05-01");
  });

  it("lastUpdated 없으면 미표시", () => {
    const html = renderToStaticMarkup(<LegalPlaceholderShell {...baseProps} />);
    expect(html).not.toContain("마지막 갱신");
  });

  it("arrow_back 아이콘", () => {
    const html = renderToStaticMarkup(<LegalPlaceholderShell {...baseProps} />);
    expect(html).toContain("arrow_back");
  });

  it("check 아이콘 (highlights 항목마다)", () => {
    const html = renderToStaticMarkup(<LegalPlaceholderShell {...baseProps} />);
    // highlights 3개 → check 아이콘 3개
    const checkCount = (html.match(/>check</g) || []).length;
    expect(checkCount).toBe(3);
  });
});

/* ════════════════════════════════════════════
 * ModeTransitionWelcome
 * ════════════════════════════════════════════ */

describe("ModeTransitionWelcome", () => {
  const baseTrip: Trip = {
    id: "trip-1",
    destination: "푸꾸옥",
    destinationCode: "PQC",
    countryCode: "VN",
    nights: 4,
    startDate: "2026-06-01",
    currentMode: "in-travel",
    updatedAt: "2026-06-01T00:00:00Z",
  };

  const noop = () => {};

  it("dialog role + aria-modal", () => {
    const html = renderToStaticMarkup(
      <ModeTransitionWelcome trip={baseTrip} travelDay={1} onClose={noop} onSkipRequest={noop} />,
    );
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
  });

  it("여행 시작! 제목", () => {
    const html = renderToStaticMarkup(
      <ModeTransitionWelcome trip={baseTrip} travelDay={1} onClose={noop} onSkipRequest={noop} />,
    );
    expect(html).toContain("여행 시작!");
  });

  it("destination + Day N / totalDays 표시", () => {
    const html = renderToStaticMarkup(
      <ModeTransitionWelcome trip={baseTrip} travelDay={2} onClose={noop} onSkipRequest={noop} />,
    );
    expect(html).toContain("푸꾸옥");
    expect(html).toContain("Day 2 / 5"); // nights 4 → totalDays 5
  });

  it("베트남 도시 → 🇻🇳 플래그", () => {
    const html = renderToStaticMarkup(
      <ModeTransitionWelcome trip={baseTrip} travelDay={1} onClose={noop} onSkipRequest={noop} />,
    );
    expect(html).toContain("🇻🇳");
  });

  it("비베트남 도시 → ✈️ 플래그", () => {
    const nonVnTrip = { ...baseTrip, destinationCode: "BKK", countryCode: "TH" };
    const html = renderToStaticMarkup(
      <ModeTransitionWelcome trip={nonVnTrip} travelDay={1} onClose={noop} onSkipRequest={noop} />,
    );
    expect(html).toContain("✈️");
  });

  it("3 FeatureCard 표시 (색이 바뀐 이유 / 카메라 번역 / 주변 검색)", () => {
    const html = renderToStaticMarkup(
      <ModeTransitionWelcome trip={baseTrip} travelDay={1} onClose={noop} onSkipRequest={noop} />,
    );
    expect(html).toContain("색이 바뀐 이유");
    expect(html).toContain("카메라 번역");
    expect(html).toContain("주변 검색");
  });

  it("시작하기 버튼", () => {
    const html = renderToStaticMarkup(
      <ModeTransitionWelcome trip={baseTrip} travelDay={1} onClose={noop} onSkipRequest={noop} />,
    );
    expect(html).toContain("시작하기");
  });

  it("지금은 안 보기 버튼", () => {
    const html = renderToStaticMarkup(
      <ModeTransitionWelcome trip={baseTrip} travelDay={1} onClose={noop} onSkipRequest={noop} />,
    );
    expect(html).toContain("지금은 안 보기");
  });

  it("다음 여행에는 이 안내를 보지 않기 체크박스", () => {
    const html = renderToStaticMarkup(
      <ModeTransitionWelcome trip={baseTrip} travelDay={1} onClose={noop} onSkipRequest={noop} />,
    );
    expect(html).toContain("다음 여행에는 이 안내를 보지 않기");
    expect(html).toContain('type="checkbox"');
  });

  it("flight_takeoff + auto_awesome 아이콘", () => {
    const html = renderToStaticMarkup(
      <ModeTransitionWelcome trip={baseTrip} travelDay={1} onClose={noop} onSkipRequest={noop} />,
    );
    expect(html).toContain("flight_takeoff");
    expect(html).toContain("auto_awesome");
  });

  it("data-travel-mode='in-travel'", () => {
    const html = renderToStaticMarkup(
      <ModeTransitionWelcome trip={baseTrip} travelDay={1} onClose={noop} onSkipRequest={noop} />,
    );
    expect(html).toContain('data-travel-mode="in-travel"');
  });

  it("palette / photo_camera / explore 아이콘", () => {
    const html = renderToStaticMarkup(
      <ModeTransitionWelcome trip={baseTrip} travelDay={1} onClose={noop} onSkipRequest={noop} />,
    );
    expect(html).toContain("palette");
    expect(html).toContain("photo_camera");
    expect(html).toContain("explore");
  });
});

/* ════════════════════════════════════════════
 * ModeTransitionSkipSheet
 * ════════════════════════════════════════════ */

describe("ModeTransitionSkipSheet", () => {
  const baseTrip: Trip = {
    id: "trip-1",
    destination: "다낭",
    destinationCode: "DAD",
    countryCode: "VN",
    nights: 3,
    startDate: "2026-06-01",
    currentMode: "in-travel",
    updatedAt: "2026-06-01T00:00:00Z",
  };

  const noop = () => {};

  it("dialog role + aria-modal", () => {
    const html = renderToStaticMarkup(
      <ModeTransitionSkipSheet trip={baseTrip} currentMode="in-travel" onDismiss={noop} onSubmitted={noop} />,
    );
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
  });

  it("왜 모드 전환을 미루시나요? 제목", () => {
    const html = renderToStaticMarkup(
      <ModeTransitionSkipSheet trip={baseTrip} currentMode="in-travel" onDismiss={noop} onSubmitted={noop} />,
    );
    expect(html).toContain("왜 모드 전환을 미루시나요?");
  });

  it("5 라디오 옵션 표시", () => {
    const html = renderToStaticMarkup(
      <ModeTransitionSkipSheet trip={baseTrip} currentMode="in-travel" onDismiss={noop} onSubmitted={noop} />,
    );
    expect(html).toContain("아직 출발하지 않았어요");
    expect(html).toContain("다른 도시에 있어요");
    expect(html).toContain("앱을 잠깐만 켰어요");
    expect(html).toContain("UI가 헷갈려요");
    expect(html).toContain("기타");
  });

  it("radio input — name 통일", () => {
    const html = renderToStaticMarkup(
      <ModeTransitionSkipSheet trip={baseTrip} currentMode="in-travel" onDismiss={noop} onSubmitted={noop} />,
    );
    expect(html).toContain('name="td-mode-transition-skip-reason"');
    const radioCount = (html.match(/type="radio"/g) || []).length;
    expect(radioCount).toBe(5);
  });

  it("미루기 버튼 (disabled 기본)", () => {
    const html = renderToStaticMarkup(
      <ModeTransitionSkipSheet trip={baseTrip} currentMode="in-travel" onDismiss={noop} onSubmitted={noop} />,
    );
    expect(html).toContain("미루기");
    expect(html).toContain("disabled");
  });

  it("취소 — 모드 전환 그대로 진행 버튼", () => {
    const html = renderToStaticMarkup(
      <ModeTransitionSkipSheet trip={baseTrip} currentMode="in-travel" onDismiss={noop} onSubmitted={noop} />,
    );
    expect(html).toContain("취소 — 모드 전환 그대로 진행");
  });

  it("익명 수집 안내 문구", () => {
    const html = renderToStaticMarkup(
      <ModeTransitionSkipSheet trip={baseTrip} currentMode="in-travel" onDismiss={noop} onSubmitted={noop} />,
    );
    expect(html).toContain("익명으로 수집");
  });

  it("fieldset + legend 거부 사유 선택", () => {
    const html = renderToStaticMarkup(
      <ModeTransitionSkipSheet trip={baseTrip} currentMode="in-travel" onDismiss={noop} onSubmitted={noop} />,
    );
    expect(html).toContain("<fieldset");
    expect(html).toContain("거부 사유 선택");
  });
});
