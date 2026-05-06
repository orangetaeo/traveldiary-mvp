/**
 * 미테스트 컴포넌트 스모크 테스트 — Batch 7.
 *
 * renderToStaticMarkup 정적 마크업 검증.
 * 대상: BentoSummary, EvidencePanel.
 */

import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

// ─── Mocks ────────────────────────────────────────────────

vi.mock("server-only", () => ({}));

// ─── Imports ──────────────────────────────────────────────

import { BentoSummary } from "@/components/dashboard/BentoSummary";
import { EvidencePanel } from "@/components/ui/EvidencePanel";
import type { TripDashboardData } from "@/lib/services/trip-dashboard";

/* ════════════════════════════════════════════
 * BentoSummary
 * ════════════════════════════════════════════ */

describe("BentoSummary", () => {
  const baseData: TripDashboardData = {
    itinerary: { count: 12, verifiedCount: 8, allVerified: false },
    cost: { totalKrw: 850000, perPersonKrw: 283333 },
    checklist: { doneCount: 5, totalCount: 10, percent: 50 },
    vote: { totalCount: 3, pendingCount: 1 },
    party: { size: 3 },
  };

  it("section 태그 + aria-label 여행 요약", () => {
    const html = renderToStaticMarkup(<BentoSummary data={baseData} />);
    expect(html).toMatch(/^<section/);
    expect(html).toContain('aria-label="여행 요약"');
  });

  it("일정 카드 — N곳 표시", () => {
    const html = renderToStaticMarkup(<BentoSummary data={baseData} />);
    expect(html).toContain("일정 12곳");
  });

  it("일정 카드 — 부분 검증 (8/12)", () => {
    const html = renderToStaticMarkup(<BentoSummary data={baseData} />);
    expect(html).toContain("검증 8/12곳");
  });

  it("일정 카드 — allVerified → AI 검증 완료 배지", () => {
    const allVerified = {
      ...baseData,
      itinerary: { count: 5, verifiedCount: 5, allVerified: true },
    };
    const html = renderToStaticMarkup(<BentoSummary data={allVerified} />);
    expect(html).toContain("AI 검증 완료");
    expect(html).toContain("verified_user");
  });

  it("일정 카드 — count=0 → 미설정", () => {
    const empty = {
      ...baseData,
      itinerary: { count: 0, verifiedCount: 0, allVerified: false },
    };
    const html = renderToStaticMarkup(<BentoSummary data={empty} />);
    expect(html).toContain("일정 미설정");
  });

  it("예산 카드 — 금액 표시", () => {
    const html = renderToStaticMarkup(<BentoSummary data={baseData} />);
    expect(html).toContain("₩850,000");
    expect(html).toContain("1인");
  });

  it("예산 카드 — totalKrw=0 → 기록 없음", () => {
    const noCost = {
      ...baseData,
      cost: { totalKrw: 0, perPersonKrw: 0 },
    };
    const html = renderToStaticMarkup(<BentoSummary data={noCost} />);
    expect(html).toContain("기록 없음");
    expect(html).toContain("아직 입력된 비용 없음");
  });

  it("체크리스트 카드 — N/M + percent", () => {
    const html = renderToStaticMarkup(<BentoSummary data={baseData} />);
    expect(html).toContain("준비물 5/10");
    expect(html).toContain("50% 완료");
  });

  it("체크리스트 카드 — progressbar role", () => {
    const html = renderToStaticMarkup(<BentoSummary data={baseData} />);
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-valuenow="50"');
  });

  it("체크리스트 카드 — totalCount=0 → 미설정", () => {
    const noChecklist = {
      ...baseData,
      checklist: { doneCount: 0, totalCount: 0, percent: 0 },
    };
    const html = renderToStaticMarkup(<BentoSummary data={noChecklist} />);
    expect(html).toContain("준비물 미설정");
  });

  it("투표 카드 — N건 + 미응답", () => {
    const html = renderToStaticMarkup(<BentoSummary data={baseData} />);
    expect(html).toContain("투표 3건");
    expect(html).toContain("미응답 1건");
  });

  it("투표 카드 — pendingCount=0 → 전부 응답 완료", () => {
    const allVoted = {
      ...baseData,
      vote: { totalCount: 3, pendingCount: 0 },
    };
    const html = renderToStaticMarkup(<BentoSummary data={allVoted} />);
    expect(html).toContain("전부 응답 완료");
  });

  it("투표 카드 — totalCount=0 → 투표 없음", () => {
    const noVote = {
      ...baseData,
      vote: { totalCount: 0, pendingCount: 0 },
    };
    const html = renderToStaticMarkup(<BentoSummary data={noVote} />);
    expect(html).toContain("투표 없음");
  });

  it("4 카드 aria-label 모두 존재", () => {
    const html = renderToStaticMarkup(<BentoSummary data={baseData} />);
    expect(html).toContain('aria-label="일정 요약"');
    expect(html).toContain('aria-label="예산 요약"');
    expect(html).toContain('aria-label="체크리스트 요약"');
    expect(html).toContain('aria-label="투표 요약"');
  });
});

/* ════════════════════════════════════════════
 * EvidencePanel
 * ════════════════════════════════════════════ */

describe("EvidencePanel", () => {
  it("reasons 0 + sources 0 → null (미렌더)", () => {
    const html = renderToStaticMarkup(
      <EvidencePanel reasons={[]} />,
    );
    expect(html).toBe("");
  });

  it("reasons만 있으면 렌더", () => {
    const html = renderToStaticMarkup(
      <EvidencePanel reasons={["맛집 추천 1위"]} defaultOpen={true} />,
    );
    expect(html).toContain("맛집 추천 1위");
  });

  it("기본 label — 왜 이걸 골랐나", () => {
    const html = renderToStaticMarkup(
      <EvidencePanel reasons={["이유"]} />,
    );
    expect(html).toContain("왜 이걸 골랐나");
  });

  it("label override", () => {
    const html = renderToStaticMarkup(
      <EvidencePanel reasons={["이유"]} label="추천 근거" />,
    );
    expect(html).toContain("추천 근거");
  });

  it("lightbulb 아이콘", () => {
    const html = renderToStaticMarkup(
      <EvidencePanel reasons={["이유"]} />,
    );
    expect(html).toContain("lightbulb");
  });

  it("aria-expanded 속성", () => {
    const html = renderToStaticMarkup(
      <EvidencePanel reasons={["이유"]} />,
    );
    expect(html).toContain("aria-expanded");
  });

  it("defaultOpen=false → 접힘 상태 (expand_more)", () => {
    const html = renderToStaticMarkup(
      <EvidencePanel reasons={["이유"]} defaultOpen={false} />,
    );
    expect(html).toContain("expand_more");
    expect(html).toContain('aria-expanded="false"');
  });

  it("defaultOpen=true → 펼침 상태 (expand_less + 본문)", () => {
    const html = renderToStaticMarkup(
      <EvidencePanel reasons={["이유 A", "이유 B"]} defaultOpen={true} />,
    );
    expect(html).toContain("expand_less");
    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain("이유 A");
    expect(html).toContain("이유 B");
  });

  it("접힘 상태에서 근거 N건 배지 표시", () => {
    const html = renderToStaticMarkup(
      <EvidencePanel reasons={["이유 1", "이유 2", "이유 3"]} defaultOpen={false} />,
    );
    expect(html).toContain("근거 3건");
  });

  it("evidence 객체 — sources 렌더", () => {
    const html = renderToStaticMarkup(
      <EvidencePanel
        evidence={{
          reasons: [],
          sources: [
            { platform: "naver", reviewCount: 1234, positiveRate: 92 },
          ],
        }}
        defaultOpen={true}
      />,
    );
    expect(html).toContain("네이버");
    expect(html).toContain("1,234건");
    expect(html).toContain("92% 긍정");
  });

  it("evidence — platform label 매핑 (google/kakao/ota)", () => {
    const html = renderToStaticMarkup(
      <EvidencePanel
        evidence={{
          reasons: ["test"],
          sources: [
            { platform: "google" },
            { platform: "kakao" },
            { platform: "ota" },
          ],
        }}
        defaultOpen={true}
      />,
    );
    expect(html).toContain("구글");
    expect(html).toContain("카카오");
    expect(html).toContain("OTA");
  });

  it("evidence — source url → 보러가기 링크", () => {
    const html = renderToStaticMarkup(
      <EvidencePanel
        evidence={{
          reasons: ["test"],
          sources: [
            { platform: "naver", url: "https://naver.com/review" },
          ],
        }}
        defaultOpen={true}
      />,
    );
    expect(html).toContain('href="https://naver.com/review"');
    expect(html).toContain("보러가기");
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it("evidence — warnings 표시 (amber-soft 배경)", () => {
    const html = renderToStaticMarkup(
      <EvidencePanel
        evidence={{
          reasons: ["test"],
          sources: [],
          warnings: ["가격 변동 가능"],
        }}
        defaultOpen={true}
      />,
    );
    expect(html).toContain("가격 변동 가능");
    expect(html).toContain("bg-amber-soft");
  });

  it("evidence — verifiedAt 날짜 표시", () => {
    const html = renderToStaticMarkup(
      <EvidencePanel
        evidence={{
          reasons: ["test"],
          sources: [],
          verifiedAt: "2026-06-01T12:00:00Z",
        }}
        defaultOpen={true}
      />,
    );
    expect(html).toContain("마지막 검증");
    expect(html).toContain("2026-06-01");
  });

  it("evidence 우선 (reasons prop 무시)", () => {
    const html = renderToStaticMarkup(
      <EvidencePanel
        reasons={["외부 이유"]}
        evidence={{
          reasons: ["내부 이유"],
          sources: [],
        }}
        defaultOpen={true}
      />,
    );
    expect(html).toContain("내부 이유");
    expect(html).not.toContain("외부 이유");
  });
});
