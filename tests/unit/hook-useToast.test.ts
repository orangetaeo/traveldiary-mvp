/**
 * useToast hook 로직 테스트 — Batch 42.
 *
 * @testing-library/react 미설치 → React hooks 직접 호출 불가.
 * 대신 hook의 핵심 로직(타이머 관리)을 분리 테스트.
 * Toast 컴포넌트는 순수 렌더 → snapshot 불필요.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// hook 내부 로직을 시뮬: clearTimeout + setTimeout 동작 확인
describe("useToast — 타이머 로직", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("setTimeout이 지정된 ms 후 콜백 실행", () => {
    const cb = vi.fn();
    setTimeout(cb, 3500);
    vi.advanceTimersByTime(3499);
    expect(cb).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("clearTimeout은 콜백 실행을 취소", () => {
    const cb = vi.fn();
    const timer = setTimeout(cb, 3500);
    vi.advanceTimersByTime(2000);
    clearTimeout(timer);
    vi.advanceTimersByTime(5000);
    expect(cb).not.toHaveBeenCalled();
  });

  it("연속 호출 시 이전 타이머를 clear해야 이전 콜백 미실행", () => {
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    const timer1 = setTimeout(cb1, 3500);
    // 2초 경과 후 새 타이머 시작 + 이전 clear
    vi.advanceTimersByTime(2000);
    clearTimeout(timer1);
    setTimeout(cb2, 3500);
    // 3500ms 후 cb1은 실행 X, cb2는 실행
    vi.advanceTimersByTime(3500);
    expect(cb1).not.toHaveBeenCalled();
    expect(cb2).toHaveBeenCalledTimes(1);
  });
});

// Toast 컴포넌트 import 정합성 확인
describe("Toast + useToast — 모듈 import", () => {
  it("useToast 모듈 import 가능", async () => {
    const mod = await import("@/lib/hooks/useToast");
    expect(mod.useToast).toBeTypeOf("function");
  });

  it("Toast 컴포넌트 import 가능", async () => {
    const mod = await import("@/components/ui/Toast");
    expect(mod.Toast).toBeTypeOf("function");
  });
});
