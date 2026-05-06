/**
 * VoteListView + TranslateView + SharedPageCards 렌더 스모크 테스트.
 *
 * renderToStaticMarkup 정적 마크업 검증 (testing-library 미도입 정책).
 * "use client" 컴포넌트의 초기 렌더 출력만 확인.
 */

import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

// ─── Mocks ────────────────────────────────────────────────

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

vi.mock("@/lib/hooks/useToast", () => ({
  useToast: () => ({ toast: null, show: vi.fn() }),
}));

vi.mock("@/actions/vote", () => ({
  castVote: vi.fn(),
  createVote: vi.fn(),
}));

vi.mock("@/actions/translate", () => ({
  translateMenuPhotoAction: vi.fn(),
}));

// ─── Imports ──────────────────────────────────────────────

import { VoteListView } from "@/components/vote/VoteListView";
import { TranslateView } from "@/components/translate/TranslateView";
import {
  EmptyGuide,
  FilteredEmptyCard,
  ActiveCard,
  InactiveCard,
  type SharedLookupItem,
} from "@/components/share/SharedPageCards";
import type { Trip, Vote } from "@/lib/types";

// ─── Fixtures ─────────────────────────────────────────────

const TRIP_FIXTURE: Trip = {
  id: "test-trip-1",
  destination: "다낭",
  destinationCode: "DAD",
  startDate: "2026-05-15",
  nights: 3,
  mode: "pre-travel",
  partySize: 2,
  updatedAt: new Date().toISOString(),
};

const VOTE_FIXTURE: Vote = {
  id: "vote-1",
  tripId: "test-trip-1",
  question: "둘째날 저녁 어디로?",
  status: "open",
  createdAt: new Date().toISOString(),
  options: [
    { label: "미케비치 해산물", voters: ["user-1"] },
    { label: "한시장 쌀국수", voters: ["user-2", "user-3"] },
  ],
};

const VOTE_ZERO: Vote = {
  id: "vote-2",
  tripId: "test-trip-1",
  question: "아침 일찍 출발?",
  status: "open",
  createdAt: new Date().toISOString(),
  options: [
    { label: "7시", voters: [] },
    { label: "9시", voters: [] },
  ],
};

const ACTIVE_ITEM: SharedLookupItem = {
  key: "abc123",
  found: true,
  status: "active",
  destination: "푸꾸옥",
  nights: 4,
  startDate: "2026-05-10",
  addedAt: Date.now(),
};

const REVOKED_ITEM: SharedLookupItem = {
  key: "def456",
  found: false,
  status: "revoked",
  destination: "다낭",
  addedAt: Date.now(),
};

const EXPIRED_ITEM: SharedLookupItem = {
  key: "ghi789",
  found: false,
  status: "expired",
  addedAt: Date.now(),
};

const NOT_FOUND_ITEM: SharedLookupItem = {
  key: "jkl012",
  found: false,
  status: "not_found",
  addedAt: Date.now(),
};

// ═══════════════════════════════════════════════════════════
// VoteListView
// ═══════════════════════════════════════════════════════════

describe("VoteListView", () => {
  it("렌더 성공 + 헤더 '일행 투표'", () => {
    const html = renderToStaticMarkup(
      <VoteListView trip={TRIP_FIXTURE} initialVotes={[]} currentUserId={null} />,
    );
    expect(html).toContain("일행 투표");
  });

  it("빈 투표 → EmptyState 렌더", () => {
    const html = renderToStaticMarkup(
      <VoteListView trip={TRIP_FIXTURE} initialVotes={[]} currentUserId={null} />,
    );
    expect(html).toContain("아직 진행 중인 투표가 없어요");
  });

  it("투표 목록 렌더 — 질문 + 옵션 레이블", () => {
    const html = renderToStaticMarkup(
      <VoteListView
        trip={TRIP_FIXTURE}
        initialVotes={[VOTE_FIXTURE]}
        currentUserId="user-1"
      />,
    );
    expect(html).toContain("둘째날 저녁 어디로?");
    expect(html).toContain("미케비치 해산물");
    expect(html).toContain("한시장 쌀국수");
  });

  it("투표 퍼센트 계산 (2/3 = 67%)", () => {
    const html = renderToStaticMarkup(
      <VoteListView
        trip={TRIP_FIXTURE}
        initialVotes={[VOTE_FIXTURE]}
        currentUserId="user-1"
      />,
    );
    // 한시장 쌀국수: 2/3 = 67%
    expect(html).toContain("67%");
    // 미케비치 해산물: 1/3 = 33%
    expect(html).toContain("33%");
  });

  it("투표 0표 → 0% 렌더", () => {
    const html = renderToStaticMarkup(
      <VoteListView
        trip={TRIP_FIXTURE}
        initialVotes={[VOTE_ZERO]}
        currentUserId={null}
      />,
    );
    expect(html).toContain("0표");
    expect(html).toContain("0%");
  });

  it("내 투표 옵션에 ✓ 표시", () => {
    const html = renderToStaticMarkup(
      <VoteListView
        trip={TRIP_FIXTURE}
        initialVotes={[VOTE_FIXTURE]}
        currentUserId="user-1"
      />,
    );
    // user-1은 "미케비치 해산물"에 투표 → ✓ 마크
    expect(html).toContain("✓");
  });

  it("새 투표 폼 렌더 — 입력 + 버튼", () => {
    const html = renderToStaticMarkup(
      <VoteListView trip={TRIP_FIXTURE} initialVotes={[]} currentUserId="user-1" />,
    );
    expect(html).toContain("새 투표");
    expect(html).toContain("투표 생성");
    expect(html).toContain("+ 옵션 추가");
  });

  it("뒤로 링크 → /itinerary/{tripId}", () => {
    const html = renderToStaticMarkup(
      <VoteListView trip={TRIP_FIXTURE} initialVotes={[]} currentUserId={null} />,
    );
    expect(html).toContain(`/itinerary/${TRIP_FIXTURE.id}`);
  });

  it("다중 투표 렌더", () => {
    const html = renderToStaticMarkup(
      <VoteListView
        trip={TRIP_FIXTURE}
        initialVotes={[VOTE_FIXTURE, VOTE_ZERO]}
        currentUserId={null}
      />,
    );
    expect(html).toContain("둘째날 저녁 어디로?");
    expect(html).toContain("아침 일찍 출발?");
  });
});

// ═══════════════════════════════════════════════════════════
// TranslateView
// ═══════════════════════════════════════════════════════════

describe("TranslateView", () => {
  it("초기 렌더 → capturing 단계 (Camera Translator)", () => {
    const html = renderToStaticMarkup(<TranslateView tripId="test-trip-1" />);
    expect(html).toContain("Camera Translator");
  });

  it("촬영 버튼 + 갤러리 버튼 렌더", () => {
    const html = renderToStaticMarkup(<TranslateView tripId="test-trip-1" />);
    expect(html).toContain("갤러리에서 사진 선택");
    // 촬영 aria-label
    expect(html).toContain("촬영");
  });

  it("설정 버튼 렌더", () => {
    const html = renderToStaticMarkup(<TranslateView tripId="test-trip-1" />);
    expect(html).toContain("설정");
  });

  it("메뉴판 안내 메시지 렌더", () => {
    const html = renderToStaticMarkup(<TranslateView tripId="test-trip-1" />);
    expect(html).toContain("메뉴판을 비춰보세요");
  });

  it("tripId 없이도 렌더 가능", () => {
    const html = renderToStaticMarkup(<TranslateView />);
    expect(html).toContain("Camera Translator");
    // tripId 없으면 닫기 링크 → /
    expect(html).toContain('href="/"');
  });

  it("tripId 있으면 닫기 → /travel/{tripId}", () => {
    const html = renderToStaticMarkup(<TranslateView tripId="test-trip-1" />);
    expect(html).toContain('href="/travel/test-trip-1"');
  });

  it("파일 input hidden 렌더 (accept=image/*)", () => {
    const html = renderToStaticMarkup(<TranslateView tripId="test-trip-1" />);
    expect(html).toContain('accept="image/*"');
    expect(html).toContain("메뉴 사진 업로드");
  });
});

// ═══════════════════════════════════════════════════════════
// SharedPageCards
// ═══════════════════════════════════════════════════════════

describe("EmptyGuide", () => {
  it("렌더 성공 + 3단계 가이드", () => {
    const html = renderToStaticMarkup(<EmptyGuide />);
    expect(html).toContain("받은 여행이 없습니다");
    expect(html).toContain("일행에게 링크 받기");
    expect(html).toContain("링크 한 번 열기");
    expect(html).toContain("여기서 다시 찾기");
  });

  it("내 여행 링크 → /trips", () => {
    const html = renderToStaticMarkup(<EmptyGuide />);
    expect(html).toContain('href="/trips"');
    expect(html).toContain("내 여행");
  });

  it("가이드 번호 1~3 렌더", () => {
    const html = renderToStaticMarkup(<EmptyGuide />);
    expect(html).toContain(">1<");
    expect(html).toContain(">2<");
    expect(html).toContain(">3<");
  });

  it("aria-label 공유 받기 가이드", () => {
    const html = renderToStaticMarkup(<EmptyGuide />);
    expect(html).toContain('aria-label="공유 받기 가이드"');
  });
});

describe("FilteredEmptyCard", () => {
  it("렌더 성공 + 필터 안내 메시지", () => {
    const html = renderToStaticMarkup(
      <FilteredEmptyCard onReset={vi.fn()} />,
    );
    expect(html).toContain("조건에 맞는 여행이 없어요");
    expect(html).toContain("전체 보기");
  });
});

describe("ActiveCard", () => {
  it("destination + nights 렌더", () => {
    const html = renderToStaticMarkup(<ActiveCard item={ACTIVE_ITEM} />);
    expect(html).toContain("푸꾸옥");
    expect(html).toContain("4박 5일");
  });

  it("startDate 슬라이스 렌더", () => {
    const html = renderToStaticMarkup(<ActiveCard item={ACTIVE_ITEM} />);
    expect(html).toContain("2026-05-10");
  });

  it("활성 뱃지 렌더", () => {
    const html = renderToStaticMarkup(<ActiveCard item={ACTIVE_ITEM} />);
    expect(html).toContain("활성");
  });

  it("destination 미설정 → fallback '여행'", () => {
    const noDestItem: SharedLookupItem = { ...ACTIVE_ITEM, destination: undefined };
    const html = renderToStaticMarkup(<ActiveCard item={noDestItem} />);
    expect(html).toContain("여행");
  });
});

describe("InactiveCard", () => {
  it("revoked → '공유 취소됨'", () => {
    const html = renderToStaticMarkup(<InactiveCard item={REVOKED_ITEM} />);
    expect(html).toContain("공유 취소됨");
    expect(html).toContain("다낭");
  });

  it("expired → '만료됨'", () => {
    const html = renderToStaticMarkup(<InactiveCard item={EXPIRED_ITEM} />);
    expect(html).toContain("만료됨");
  });

  it("not_found → '더 이상 찾을 수 없음'", () => {
    const html = renderToStaticMarkup(<InactiveCard item={NOT_FOUND_ITEM} />);
    expect(html).toContain("더 이상 찾을 수 없음");
  });

  it("destination 미설정 → fallback '여행'", () => {
    const html = renderToStaticMarkup(<InactiveCard item={NOT_FOUND_ITEM} />);
    expect(html).toContain("여행");
  });
});
