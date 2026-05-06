/**
 * 사이클 W — /api/share/lookup IP rate limit 단위 테스트.
 * lib/share/lookupRateLimit.ts 단위 검증.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  checkIpRate,
  _resetIpRate,
  RATE_LIMIT_PER_MINUTE,
} from "@/lib/share/lookupRateLimit";

const realDateNow = Date.now;

describe("lookup IP rate limit", () => {
  beforeEach(() => {
    _resetIpRate();
  });

  afterEach(() => {
    Date.now = realDateNow;
  });

  it(`동일 ip 분당 ${RATE_LIMIT_PER_MINUTE}회까지 허용`, () => {
    for (let i = 0; i < RATE_LIMIT_PER_MINUTE; i++) {
      expect(checkIpRate("1.2.3.4")).toBe(true);
    }
    expect(checkIpRate("1.2.3.4")).toBe(false);
  });

  it("다른 ip는 독립 버킷", () => {
    for (let i = 0; i < RATE_LIMIT_PER_MINUTE; i++) {
      checkIpRate("1.1.1.1");
    }
    expect(checkIpRate("1.1.1.1")).toBe(false);
    expect(checkIpRate("2.2.2.2")).toBe(true);
  });

  it("reset 후 다시 허용", () => {
    for (let i = 0; i < RATE_LIMIT_PER_MINUTE; i++) {
      checkIpRate("3.3.3.3");
    }
    expect(checkIpRate("3.3.3.3")).toBe(false);
    _resetIpRate();
    expect(checkIpRate("3.3.3.3")).toBe(true);
  });

  it("첫 요청 허용", () => {
    expect(checkIpRate("9.9.9.9")).toBe(true);
  });

  it("차단 후 연속 차단", () => {
    for (let i = 0; i < RATE_LIMIT_PER_MINUTE; i++) {
      checkIpRate("4.4.4.4");
    }
    expect(checkIpRate("4.4.4.4")).toBe(false);
    expect(checkIpRate("4.4.4.4")).toBe(false);
    expect(checkIpRate("4.4.4.4")).toBe(false);
  });

  it("RATE_LIMIT_PER_MINUTE = 30", () => {
    expect(RATE_LIMIT_PER_MINUTE).toBe(30);
  });

  /* ── 슬라이딩 윈도우 만료 ── */

  it("60초 경과 후 다시 허용", () => {
    let fakeNow = 1_000_000;
    Date.now = () => fakeNow;

    for (let i = 0; i < 30; i++) {
      checkIpRate("5.5.5.5");
    }
    expect(checkIpRate("5.5.5.5")).toBe(false);

    // 61초 후
    fakeNow += 61_000;
    expect(checkIpRate("5.5.5.5")).toBe(true);
  });

  it("59초 경과 → 아직 차단", () => {
    let fakeNow = 1_000_000;
    Date.now = () => fakeNow;

    for (let i = 0; i < 30; i++) {
      checkIpRate("6.6.6.6");
    }

    fakeNow += 59_000;
    expect(checkIpRate("6.6.6.6")).toBe(false);
  });

  it("윈도우 경과 후 새 30회 허용", () => {
    let fakeNow = 1_000_000;
    Date.now = () => fakeNow;

    // 첫 30회 소진
    for (let i = 0; i < 30; i++) {
      checkIpRate("7.7.7.7");
    }
    expect(checkIpRate("7.7.7.7")).toBe(false);

    // 윈도우 만료
    fakeNow += 61_000;

    // 새 30회 다시 허용
    for (let i = 0; i < 30; i++) {
      expect(checkIpRate("7.7.7.7")).toBe(true);
    }
    expect(checkIpRate("7.7.7.7")).toBe(false);
  });
});
