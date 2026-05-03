/**
 * 사이클 W — /api/share/lookup IP rate limit 단위 테스트.
 * lib/share/lookupRateLimit.ts 단위 검증.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  checkIpRate,
  _resetIpRate,
  RATE_LIMIT_PER_MINUTE,
} from "@/lib/share/lookupRateLimit";

describe("lookup IP rate limit", () => {
  beforeEach(() => {
    _resetIpRate();
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
});
