/**
 * 갭 #4 — "받은 여행" 용어 모호 정리 회귀 가드.
 *
 * 두 컴포넌트의 컨텍스트가 다른데 라벨이 모호해 사용자 혼동:
 *   - TripClaimBanner = 인계 (익명 게스트 모드 → 본인 계정으로 옮기기)
 *   - ReceivedTripBanner = 수신 (다른 사용자 공유 → 본인 목록 추가)
 *
 * 변경:
 *   - TripClaimBanner: "이전에 만든 여행" → "익명으로 만든 여행"
 *                       "가져오면 어디서든 접근" → "옮기면 다른 기기에서도 이어서 작업"
 *   - ReceivedTripBanner: "내 목록에 추가됐어요" → "공유 받은 여행이 추가됐어요"
 *                          "받은 여행 목록" → "공유 받은 여행 목록" (본문)
 *
 * source-grep으로 검증.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const CLAIM_SRC = readFileSync(
  resolve(process.cwd(), "components/auth/TripClaimBanner.tsx"),
  "utf-8",
);
const RECEIVED_SRC = readFileSync(
  resolve(process.cwd(), "components/share/ReceivedTripBanner.tsx"),
  "utf-8",
);

describe("갭 #4 — TripClaimBanner 인계 컨텍스트 명료화", () => {
  it("'익명으로 만든 여행' 키워드 — 인계 컨텍스트 명확", () => {
    expect(CLAIM_SRC).toContain("익명으로 만든 여행");
  });

  it("'이전에 만든 여행' 모호 표현 제거", () => {
    expect(CLAIM_SRC).not.toContain("이전에 만든 여행");
  });

  it("부제 '다른 기기에서도 이어서 작업' — 인계 가치 명시", () => {
    expect(CLAIM_SRC).toContain("다른 기기에서도 이어서 작업할 수 있어요");
  });

  it("기존 'sync_alt' 아이콘 + 보라 톤 className 보존 (시각 BC)", () => {
    expect(CLAIM_SRC).toContain("sync_alt");
    expect(CLAIM_SRC).toContain("bg-purple-soft/40 border border-purple/20");
  });
});

describe("갭 #4 — ReceivedTripBanner 수신 컨텍스트 명료화", () => {
  it("'공유 받은 여행이 추가됐어요' — 출처 명시", () => {
    expect(RECEIVED_SRC).toContain("공유 받은 여행이 추가됐어요");
  });

  it("'내 목록에 추가됐어요' 모호 표현 제거", () => {
    expect(RECEIVED_SRC).not.toMatch(/^[^/].*내 목록에 추가됐어요/m);
  });

  it("부제 '공유 받은 여행 목록' — 동일 출처 일관", () => {
    expect(RECEIVED_SRC).toContain("공유 받은 여행 목록에서 찾을 수 있어요");
  });

  it("'받은 여행 보기' 라벨 + /shared 링크 보존 (BC)", () => {
    expect(RECEIVED_SRC).toContain("받은 여행 보기");
    expect(RECEIVED_SRC).toContain('href="/shared"');
  });

  it("기존 check_circle 아이콘 + 보라 톤 className 보존 (시각 BC)", () => {
    expect(RECEIVED_SRC).toContain("check_circle");
    expect(RECEIVED_SRC).toContain("bg-purple-soft border-b border-purple/20");
  });
});
