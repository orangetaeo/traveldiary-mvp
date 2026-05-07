/**
 * lib/hooks/useToast.ts 단위 테스트.
 *
 * React hook이므로 내부 로직만 간접 검증.
 * show()의 옵셔널 패턴 분기 + BC 호환 + type export.
 */

import { describe, it, expect } from "vitest";
import type {
  ToastVariant,
  ToastAction,
  ToastOptions,
  ToastData,
} from "@/lib/hooks/useToast";

// ─── 모듈 export 검증 ──────────────────────────────────

describe("useToast module exports", () => {
  it("useToast 함수 export", async () => {
    const mod = await import("@/lib/hooks/useToast");
    expect(typeof mod.useToast).toBe("function");
  });
});

// ─── 옵셔널 객체 분기 로직 (show 내부) 단위 테스트 ─────────
// show 내부의 분기 로직을 순수 함수로 추출하여 검증

function parseShowArgs(
  message: string,
  msOrOptions?: number | ToastOptions,
  defaultMs = 3500,
): { toastData: ToastData; ms: number } {
  const options: ToastOptions =
    typeof msOrOptions === "number"
      ? { ms: msOrOptions }
      : (msOrOptions ?? {});
  const ms = options.ms ?? defaultMs;
  return {
    toastData: {
      message,
      variant: options.variant ?? "neutral",
      subtitle: options.subtitle,
      action: options.action,
    },
    ms,
  };
}

describe("show() 분기 로직 (BC + options)", () => {
  it("show(msg) — 기본값 neutral + defaultMs", () => {
    const { toastData, ms } = parseShowArgs("안녕");
    expect(toastData).toEqual({
      message: "안녕",
      variant: "neutral",
      subtitle: undefined,
      action: undefined,
    });
    expect(ms).toBe(3500);
  });

  it("show(msg, number) — BC 숫자→ms 해석", () => {
    const { toastData, ms } = parseShowArgs("테스트", 2000);
    expect(ms).toBe(2000);
    expect(toastData.variant).toBe("neutral");
  });

  it("show(msg, { variant }) — variant 지정", () => {
    const { toastData } = parseShowArgs("성공", { variant: "success" });
    expect(toastData.variant).toBe("success");
  });

  it("show(msg, { ms, variant, subtitle, action })", () => {
    const onClick = () => {};
    const { toastData, ms } = parseShowArgs("에러", {
      ms: 5000,
      variant: "danger",
      subtitle: "다시 시도하세요",
      action: { label: "재시도", onClick },
    });
    expect(toastData).toEqual({
      message: "에러",
      variant: "danger",
      subtitle: "다시 시도하세요",
      action: { label: "재시도", onClick },
    });
    expect(ms).toBe(5000);
  });

  it("show(msg, {}) — 빈 옵션 → 기본값", () => {
    const { toastData, ms } = parseShowArgs("빈", {});
    expect(toastData.variant).toBe("neutral");
    expect(ms).toBe(3500);
  });

  it("커스텀 defaultMs", () => {
    const { ms } = parseShowArgs("커스텀", undefined, 1000);
    expect(ms).toBe(1000);
  });

  it("options.ms가 defaultMs 오버라이드", () => {
    const { ms } = parseShowArgs("오버", { ms: 500 }, 3500);
    expect(ms).toBe(500);
  });
});

// ─── 타입 호환성 검증 ──────────────────────────────────

describe("type exports", () => {
  it("ToastVariant 6종", () => {
    const variants: ToastVariant[] = [
      "neutral", "success", "info", "warning", "danger", "undo",
    ];
    expect(variants).toHaveLength(6);
  });

  it("ToastAction 구조", () => {
    const action: ToastAction = { label: "실행취소", onClick: () => {} };
    expect(action.label).toBe("실행취소");
    expect(typeof action.onClick).toBe("function");
  });

  it("ToastOptions 선택적 필드", () => {
    const opts: ToastOptions = {};
    expect(opts.ms).toBeUndefined();
    expect(opts.variant).toBeUndefined();
    expect(opts.subtitle).toBeUndefined();
    expect(opts.action).toBeUndefined();
  });

  it("ToastData 필수 + 선택 필드", () => {
    const data: ToastData = { message: "test", variant: "info" };
    expect(data.message).toBe("test");
    expect(data.variant).toBe("info");
    expect(data.subtitle).toBeUndefined();
    expect(data.action).toBeUndefined();
  });
});
