/**
 * 자율 진행 (2026-05-08) — /permission/location denied state 갭 해소.
 *
 * camera 페이지 (사이클 4 / G9) → notification (PR #402, 1번째 답습) → location (2번째 답습).
 * Geolocation 특화: PERMISSION_DENIED(1) 에러 코드로 denied 분기 정밀화.
 * POSITION_UNAVAILABLE(2) / TIMEOUT(3)은 일시 오류 — denied 알림 띄우지 않고 retry 허용.
 *
 * source-grep으로 검증.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const SRC = readFileSync(
  resolve(process.cwd(), "app/permission/location/page.tsx"),
  "utf-8",
);

describe("/permission/location — denied state (camera·notification 답습)", () => {
  it("denied state useState 추가", () => {
    expect(SRC).toMatch(/const \[denied, setDenied\] = useState\(false\)/);
  });

  it("재시도 시 setDenied(false) 초기화", () => {
    const idx = SRC.indexOf("handleAllow");
    const block = SRC.slice(idx, idx + 1200);
    expect(block).toMatch(/setDenied\(false\)/);
  });

  it("permissions.query result.state === 'granted' → router.back()", () => {
    expect(SRC).toMatch(/result\.state === "granted"[\s\S]{0,80}router\.back\(\)/);
  });

  it("permissions.query result.state === 'denied' → setDenied(true) (early return)", () => {
    const idx = SRC.indexOf("handleAllow");
    const block = SRC.slice(idx, idx + 1200);
    expect(block).toMatch(/result\.state === "denied"[\s\S]{0,120}setDenied\(true\)/);
  });

  it("getCurrentPosition onError에서 PERMISSION_DENIED → setDenied(true)", () => {
    expect(SRC).toMatch(/err\.code === err\.PERMISSION_DENIED[\s\S]{0,120}setDenied\(true\)/);
  });

  it("PERMISSION_DENIED 외 에러(POSITION_UNAVAILABLE/TIMEOUT)는 setDenied(true) 안 함 — else 분기에서 setRequesting(false)만", () => {
    expect(SRC).toMatch(/PERMISSION_DENIED[\s\S]{0,200}else[\s\S]{0,80}setRequesting\(false\)/);
  });

  it("catch 블록에서도 동일한 onError fallback 사용 (Permissions API 미지원)", () => {
    const idx = SRC.indexOf("handleAllow");
    const block = SRC.slice(idx, idx + 1500);
    const catchIdx = block.indexOf("catch");
    expect(catchIdx).toBeGreaterThan(0);
    const catchBlock = block.slice(catchIdx);
    expect(catchBlock).toMatch(/getCurrentPosition\(onSuccess, onError/);
  });
});

describe("/permission/location — denied amber alert UI (camera·notification 답습)", () => {
  it("conditional `{denied && ...}` 블록 존재", () => {
    expect(SRC).toMatch(/\{denied\s*&&\s*\(/);
  });

  it("role='alert' aria-live='polite' (스크린 리더 안내)", () => {
    expect(SRC).toContain('role="alert"');
    expect(SRC).toContain('aria-live="polite"');
  });

  it("amber-soft 톤 배경 + amber/30 border (camera·notification 답습)", () => {
    expect(SRC).toContain("bg-amber-soft");
    expect(SRC).toContain("border-amber/30");
  });

  it("'위치 정보가 차단됐어요' 헤드라인 (location 특화)", () => {
    expect(SRC).toContain("위치 정보가 차단됐어요");
  });

  it("OS 설정 가이드 — iOS Safari 절차", () => {
    expect(SRC).toContain("iOS Safari");
    expect(SRC).toMatch(/설정 앱[\s\S]{0,30}Safari[\s\S]{0,30}위치/);
  });

  it("OS 설정 가이드 — Android Chrome 절차", () => {
    expect(SRC).toContain("Android Chrome");
    expect(SRC).toMatch(/주소창 자물쇠[\s\S]{0,30}사이트 설정[\s\S]{0,30}위치/);
  });
});

describe("/permission/location — 기존 BC 100% 보존", () => {
  it("navigator.permissions.query({ name: 'geolocation' }) 호출 BC", () => {
    expect(SRC).toMatch(/navigator\.permissions\.query\(\{\s*name:\s*"geolocation"/);
  });

  it("navigator.geolocation.getCurrentPosition 호출 BC", () => {
    expect(SRC).toContain("navigator.geolocation.getCurrentPosition");
  });

  it("timeout: 10000 옵션 BC", () => {
    expect(SRC).toContain("timeout: 10000");
  });

  it("'위치 허용하기' button 라벨 BC", () => {
    expect(SRC).toContain("위치 허용하기");
  });

  it("'나중에 할게요' button 라벨 BC", () => {
    expect(SRC).toContain("나중에 할게요");
  });

  it("requesting state + '요청 중...' 라벨 BC", () => {
    expect(SRC).toContain("requesting");
    expect(SRC).toContain("요청 중...");
  });

  it("3 benefits (D-Day 자동 모드 전환 / 실시간 주변 정보 / 프라이버시 보호) BC", () => {
    expect(SRC).toContain("D-Day 자동 모드 전환");
    expect(SRC).toContain("실시간 주변 정보");
    expect(SRC).toContain("프라이버시 보호");
  });

  it("location_on 아이콘 BC", () => {
    expect(SRC).toContain("location_on");
  });

  it("ADR-017 프라이버시 명시 BC", () => {
    expect(SRC).toContain("ADR-017");
  });

  it("handleSkip → router.back() BC", () => {
    expect(SRC).toMatch(/handleSkip[\s\S]{0,80}router\.back\(\)/);
  });

  it("button 두 개 모두 type='button' (form submit 차단 강화)", () => {
    const matches = SRC.match(/type="button"/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });

  it("purple 톤(allow button) BC — bg-purple text-white", () => {
    expect(SRC).toMatch(/bg-purple text-white/);
  });
});
