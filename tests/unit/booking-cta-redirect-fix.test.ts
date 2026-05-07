/**
 * 옵션 V (자율 발견 — Session AB cap 5) — booking 페이지 redirect 정합 + dead share 활성화 회귀.
 *
 * 검증:
 *   1. 헤더 close → /trips (기존 "/" 홈에서 변경)
 *   2. "내 일정에서 확인" Link → /trips (카피·타깃 정합)
 *   3. "일행에게 공유" button → Link href="/trips" (dead button 활성화)
 *   4. 기존 BLOCKER 7 stub 데이터 BC 보존
 *
 * source-grep으로 검증 (Session N 박제 답습).
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const SRC = readFileSync(
  resolve(process.cwd(), "app/booking/[bookingId]/page.tsx"),
  "utf-8",
);

describe("옵션 V — booking redirect 정합", () => {
  it("헤더 close → /trips (기존 '/' 미스매치 해소)", () => {
    expect(SRC).toContain('href="/trips"');
    expect(SRC).toContain('aria-label="내 여행 목록으로"');
  });

  it("'내 일정에서 확인' Link → /trips", () => {
    expect(SRC).toContain('aria-label="내 여행 목록에서 일정 확인"');
    // 기존 "/" 직접 href 패턴 부재 (헤더와 액션 모두 /trips로 통일)
    expect(SRC).not.toMatch(/href="\/"\s/);
  });

  it("'일행에게 공유' button → Link href=\"/trips\" (dead button 활성화)", () => {
    expect(SRC).toContain("일행에게 공유");
    expect(SRC).toContain('aria-label="일행에게 공유 — 내 여행 목록에서 일정 선택 후 공유"');
    // <button>이 아닌 <Link>로 진화 — '일행에게 공유' 텍스트 직전에 button 부재
    expect(SRC).not.toMatch(/<button[^>]*>\s*<span[^>]*>share<\/span>\s*일행에게 공유/);
  });
});

describe("옵션 V — 기존 BC 보존", () => {
  it("BLOCKER 7 stub 데모 안내 보존", () => {
    expect(SRC).toContain("데모 예약");
    expect(SRC).toContain("BLOCKER 7");
  });

  it("Klook 예약 정보 + Stitch #33 매핑 보존", () => {
    expect(SRC).toContain("Klook");
    expect(SRC).toContain("다낭 바나힐");
    expect(SRC).toContain("예약이 완료되었어요!");
  });

  it("'내 일정에서 확인' + '일행에게 공유' 카피 100% 보존", () => {
    expect(SRC).toContain("내 일정에서 확인");
    expect(SRC).toContain("일행에게 공유");
  });

  it("share material symbol 아이콘 보존", () => {
    expect(SRC).toMatch(/material-symbols-outlined[^>]*>share</);
  });
});
