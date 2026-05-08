/**
 * 자율 진행 (2026-05-08) — /permission/notification denied state 갭 해소.
 *
 * camera 페이지 (사이클 4 / G9) 답습 — 거부 후 OS 설정 가이드 fallback amber 알림.
 * 기존 notification 페이지는 거부 시 router.back()으로 빠져나가 사용자가 "왜 안 되지?"
 * 모르는 dead-end였음.
 *
 * source-grep으로 검증.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const SRC = readFileSync(
  resolve(process.cwd(), "app/permission/notification/page.tsx"),
  "utf-8",
);

describe("/permission/notification — denied state (camera 답습)", () => {
  it("denied state useState 추가", () => {
    expect(SRC).toMatch(/const \[denied, setDenied\] = useState\(false\)/);
  });

  it("handleAllow에서 'granted' → router.back() (성공만)", () => {
    expect(SRC).toMatch(/result === "granted"[\s\S]{0,80}router\.back\(\)/);
  });

  it("handleAllow에서 'denied' → setDenied(true) (router.back 안 함)", () => {
    const idx = SRC.indexOf("handleAllow");
    const block = SRC.slice(idx, idx + 800);
    expect(block).toMatch(/result === "denied"[\s\S]{0,120}setDenied\(true\)/);
  });

  it("handleAllow catch 블록에서도 setDenied(true)", () => {
    const idx = SRC.indexOf("handleAllow");
    const block = SRC.slice(idx, idx + 800);
    expect(block).toMatch(/catch[\s\S]{0,120}setDenied\(true\)/);
  });

  it("재시도 시 setDenied(false) 초기화", () => {
    const idx = SRC.indexOf("handleAllow");
    const block = SRC.slice(idx, idx + 800);
    expect(block).toMatch(/setDenied\(false\)/);
  });
});

describe("/permission/notification — denied amber alert UI (camera 답습)", () => {
  it("conditional `{denied && ...}` 블록 존재", () => {
    expect(SRC).toMatch(/\{denied\s*&&\s*\(/);
  });

  it("role='alert' aria-live='polite' (스크린 리더 안내)", () => {
    expect(SRC).toContain('role="alert"');
    expect(SRC).toContain('aria-live="polite"');
  });

  it("amber-soft 톤 배경 + amber/30 border (camera 답습)", () => {
    expect(SRC).toContain("bg-amber-soft");
    expect(SRC).toContain("border-amber/30");
  });

  it("'알림이 차단됐어요' 헤드라인 (notification 특화)", () => {
    expect(SRC).toContain("알림이 차단됐어요");
  });

  it("OS 설정 가이드 — iOS Safari 절차", () => {
    expect(SRC).toContain("iOS Safari");
    expect(SRC).toMatch(/설정 앱[\s\S]{0,30}알림[\s\S]{0,30}Safari/);
  });

  it("OS 설정 가이드 — Android Chrome 절차", () => {
    expect(SRC).toContain("Android Chrome");
    expect(SRC).toMatch(/주소창 자물쇠[\s\S]{0,30}사이트 설정[\s\S]{0,30}알림/);
  });
});

describe("/permission/notification — 기존 BC 100% 보존", () => {
  it("Notification.requestPermission() 호출 BC", () => {
    expect(SRC).toContain("Notification.requestPermission()");
  });

  it("'알림 허용하기' button 라벨 BC", () => {
    expect(SRC).toContain("알림 허용하기");
  });

  it("'나중에 할게요' button 라벨 BC", () => {
    expect(SRC).toContain("나중에 할게요");
  });

  it("requesting state + '요청 중...' 라벨 BC", () => {
    expect(SRC).toContain("requesting");
    expect(SRC).toContain("요청 중...");
  });

  it("3 benefits (일정 리마인더 / Live Replan / D-Day 카운트다운) BC", () => {
    expect(SRC).toContain("일정 리마인더");
    expect(SRC).toContain("Live Replan");
    expect(SRC).toContain("D-Day 카운트다운");
  });

  it("notifications_active 아이콘 BC", () => {
    expect(SRC).toContain("notifications_active");
  });

  it("handleSkip → router.back() BC", () => {
    expect(SRC).toMatch(/handleSkip[\s\S]{0,80}router\.back\(\)/);
  });

  it("button 두 개 모두 type='button' (form submit 차단 강화)", () => {
    const matches = SRC.match(/type="button"/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });
});
