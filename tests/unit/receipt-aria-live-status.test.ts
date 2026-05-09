/**
 * 회귀 가드 — 영수증 OCR 흐름 status/error 메시지 aria-live + role.
 *
 * 동적으로 표시/숨김되는 status/error 메시지가 시각 의존이면
 * 스크린리더가 OCR 진행 + 에러 알림을 인식 못함. WCAG 2.1 SC 4.1.3
 * (Status Messages) 권장 패턴: role="status" + aria-live="polite"
 * 또는 role="alert" (조건부 자동 assertive).
 *
 * 정정 대상 3건:
 *   ReceiptCaptureStep — statusMsg + error (2)
 *   ReceiptResultStep — 성공 배지 (1)
 *
 * vitest cwd 우회: import.meta.url 절대 경로 (feedback_bash_cd_workaround).
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "../..");

function read(rel: string): string {
  return readFileSync(resolve(REPO_ROOT, rel), "utf-8");
}

describe("ReceiptCaptureStep — status/error aria-live", () => {
  const FILE = "components/cost/ReceiptCaptureStep.tsx";

  it("statusMsg div: role=\"status\" + aria-live=\"polite\"", () => {
    const src = read(FILE);
    // statusMsg 블록 안에 role="status" + aria-live="polite" 페어
    expect(src).toMatch(/statusMsg && \([\s\S]*?role="status"/);
    expect(src).toMatch(/statusMsg && \([\s\S]*?aria-live="polite"/);
  });

  it("error div: role=\"alert\"", () => {
    const src = read(FILE);
    expect(src).toMatch(/\{error && \([\s\S]*?role="alert"/);
  });

  it("기존 클래스(bg-purple-soft, bg-danger-soft) 보존", () => {
    const src = read(FILE);
    expect(src).toContain("bg-purple-soft");
    expect(src).toContain("bg-danger-soft");
  });

  it("setStatusMsg/setError 동작 코드 미변경 (BC)", () => {
    const src = read(FILE);
    expect(src).toContain('setStatusMsg("이미지 처리 중...")');
    expect(src).toContain('setStatusMsg("영수증 인식 중...")');
  });
});

describe("ReceiptResultStep — 성공 배지 aria-live", () => {
  const FILE = "components/cost/ReceiptResultStep.tsx";

  it("성공 배지 div: role=\"status\" + aria-live=\"polite\"", () => {
    const src = read(FILE);
    // "영수증 인식 완료" 직전 div에 role="status" + aria-live="polite"
    expect(src).toMatch(/role="status"[\s\S]*?영수증 인식 완료/);
    expect(src).toMatch(/aria-live="polite"[\s\S]*?영수증 인식 완료/);
  });

  it("성공 배지 시각 강조(bg-success-soft + check_circle) 보존", () => {
    const src = read(FILE);
    expect(src).toContain("bg-success-soft");
    expect(src).toContain("check_circle");
  });
});

describe("회귀 차단 — aria-live 부재 패턴 부재", () => {
  it("ReceiptCaptureStep statusMsg는 aria-live 없이 등장 안 함", () => {
    const src = read("components/cost/ReceiptCaptureStep.tsx");
    // statusMsg div 블록에 반드시 aria-live가 함께 있어야 함
    const statusBlock = src.match(/\{statusMsg && \([\s\S]*?\)\}/)?.[0] ?? "";
    expect(statusBlock).toContain("aria-live");
  });

  it("ReceiptCaptureStep error는 role=\"alert\" 없이 등장 안 함", () => {
    const src = read("components/cost/ReceiptCaptureStep.tsx");
    const errorBlock = src.match(/\{error && \([\s\S]*?\)\}/)?.[0] ?? "";
    expect(errorBlock).toContain('role="alert"');
  });
});
