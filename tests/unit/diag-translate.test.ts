/**
 * 사이클 Y — /api/diag/translate 진단 endpoint 회귀.
 *
 * 키 노출 방지 + available boolean 정확성.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { GET } from "@/app/api/diag/translate/route";

const SAVED = {
  claude: process.env.ANTHROPIC_API_KEY,
};

function restoreEnv() {
  if (SAVED.claude === undefined) delete process.env.ANTHROPIC_API_KEY;
  else process.env.ANTHROPIC_API_KEY = SAVED.claude;
}

describe("/api/diag/translate", () => {
  beforeEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
  });

  afterEach(restoreEnv);

  it("키 미설정 → available=false, keyMask=null", async () => {
    const res = GET();
    const body = await res.json();
    expect(body.services.claudeVision.available).toBe(false);
    expect(body.services.claudeVision.keyMask).toBeNull();
    expect(body.services.claudeText.available).toBe(false);
    expect(body.services.claudeText.keyMask).toBeNull();
  });

  it("키 설정 → available=true, keyMask=마지막 4자만", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-LoNgKeYabcd";
    const res = GET();
    const body = await res.json();
    expect(body.services.claudeVision.available).toBe(true);
    expect(body.services.claudeVision.keyMask).toBe("****abcd");
    expect(body.services.claudeText.available).toBe(true);
    expect(body.services.claudeText.keyMask).toBe("****abcd");
  });

  it("응답에 키 자체가 절대 노출되지 않음", async () => {
    const secret = "ULTRA_SECRET_KEY_DO_NOT_LEAK";
    process.env.ANTHROPIC_API_KEY = secret;
    const res = GET();
    const text = JSON.stringify(await res.json());
    expect(text).not.toContain(secret);
    expect(text).not.toContain("ULTRA_SECRET");
  });

  it("짧은 키도 마스킹", async () => {
    process.env.ANTHROPIC_API_KEY = "abc";
    const res = GET();
    const body = await res.json();
    expect(body.services.claudeText.keyMask).toBe("****");
  });

  it("feature 식별자 + fallback 안내 포함", async () => {
    const res = GET();
    const body = await res.json();
    expect(body.feature).toBe("M4 Camera Translate (Claude Vision)");
    expect(body.fallback.mode).toBe("demo");
    expect(typeof body.timestamp).toBe("string");
  });
});
