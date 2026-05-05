/**
 * Toast 5 variants 단위 테스트 — Stitch 시안 (a66c84466c91426d8833d271e5fa6459).
 *
 * BC: <Toast message={msg} /> 기존 호출 호환.
 * 신규: <Toast toast={data} /> 5 variants + neutral.
 */

import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Toast } from "@/components/ui/Toast";
import type { ToastData } from "@/lib/hooks/useToast";

function makeToast(over: Partial<ToastData> = {}): ToastData {
  return {
    message: "테스트 메시지",
    variant: "neutral",
    ...over,
  };
}

describe("Toast — BC 호환", () => {
  it("message 없으면 null", () => {
    const html = renderToStaticMarkup(<Toast message={null} />);
    expect(html).toBe("");
  });

  it("message만 — 기존 ink pill 디자인", () => {
    const html = renderToStaticMarkup(<Toast message="테스트" />);
    expect(html).toContain("테스트");
    expect(html).toContain("bg-ink");
    expect(html).toContain("rounded-full");
  });

  it("className override 작동", () => {
    const html = renderToStaticMarkup(
      <Toast message="X" className="custom-toast-class" />,
    );
    expect(html).toContain("custom-toast-class");
    expect(html).not.toContain("rounded-full");
  });
});

describe("Toast — 5 variants 시안 매칭", () => {
  it("success — bg-success-soft + check_circle + green border-l", () => {
    const html = renderToStaticMarkup(
      <Toast toast={makeToast({ variant: "success", message: "완료" })} />,
    );
    expect(html).toContain("bg-success-soft");
    expect(html).toContain("border-success");
    expect(html).toContain("check_circle");
    expect(html).toContain("완료");
  });

  it("info — bg-purple-soft + psychology + purple border-l", () => {
    const html = renderToStaticMarkup(
      <Toast toast={makeToast({ variant: "info", message: "AI 추천" })} />,
    );
    expect(html).toContain("bg-purple-soft");
    expect(html).toContain("border-purple");
    expect(html).toContain("psychology");
  });

  it("warning — bg-amber-soft + schedule + amber border-l", () => {
    const html = renderToStaticMarkup(
      <Toast toast={makeToast({ variant: "warning", message: "곧 마감" })} />,
    );
    expect(html).toContain("bg-amber-soft");
    expect(html).toContain("border-amber");
    expect(html).toContain("schedule");
  });

  it("danger — bg-danger-soft + emergency + danger border-l", () => {
    const html = renderToStaticMarkup(
      <Toast toast={makeToast({ variant: "danger", message: "알레르기" })} />,
    );
    expect(html).toContain("bg-danger-soft");
    expect(html).toContain("border-danger");
    expect(html).toContain("emergency");
  });

  it("undo — bg-ink + 액션 버튼 (보라)", () => {
    const html = renderToStaticMarkup(
      <Toast
        toast={makeToast({
          variant: "undo",
          message: "변경됨",
          action: { label: "되돌리기", onClick: () => {} },
        })}
      />,
    );
    expect(html).toContain("bg-ink");
    expect(html).toContain("되돌리기");
    expect(html).toContain("bg-purple-soft");
    expect(html).toContain("text-purple-deep");
  });

  it("neutral — bg-ink + info 아이콘 + 흰 텍스트", () => {
    const html = renderToStaticMarkup(
      <Toast toast={makeToast({ variant: "neutral", message: "안내" })} />,
    );
    expect(html).toContain("bg-ink");
    expect(html).toContain(">info<");
    expect(html).toContain("text-white");
  });
});

describe("Toast — variant + className 위치 override", () => {
  it("variant render에서 className은 wrapper 위치 override (색·구조 보존)", () => {
    const html = renderToStaticMarkup(
      <Toast
        toast={makeToast({ variant: "success", message: "OK" })}
        className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 w-[min(420px,90vw)]"
      />,
    );
    expect(html).toContain("bottom-32");
    expect(html).toContain("z-50");
    expect(html).not.toContain("bottom-24");
    expect(html).toContain("bg-success-soft");
    expect(html).toContain("border-success");
    expect(html).toContain("min-h-[52px]");
  });

  it("className 없으면 default 위치 (bottom-24 z-40)", () => {
    const html = renderToStaticMarkup(
      <Toast toast={makeToast({ variant: "success" })} />,
    );
    expect(html).toContain("bottom-24");
    expect(html).toContain("z-40");
  });

  it("BC: <Toast message + className /> — 기존 ink pill 유지 (variant render 미진입)", () => {
    const html = renderToStaticMarkup(
      <Toast
        message="X"
        className="custom-position-class"
      />,
    );
    expect(html).toContain("custom-position-class");
    expect(html).not.toContain("min-h-[52px]");
  });
});

describe("Toast — subtitle + action", () => {
  it("subtitle 노출", () => {
    const html = renderToStaticMarkup(
      <Toast
        toast={makeToast({
          variant: "success",
          message: "타이틀",
          subtitle: "추가 설명",
        })}
      />,
    );
    expect(html).toContain("타이틀");
    expect(html).toContain("추가 설명");
  });

  it("action 없으면 버튼 미렌더", () => {
    const html = renderToStaticMarkup(
      <Toast toast={makeToast({ variant: "success" })} />,
    );
    expect(html).not.toContain("type=\"button\"");
  });

  it("action 있으면 버튼 렌더", () => {
    const html = renderToStaticMarkup(
      <Toast
        toast={makeToast({
          variant: "info",
          action: { label: "탭하세요", onClick: () => {} },
        })}
      />,
    );
    expect(html).toContain('type="button"');
    expect(html).toContain("탭하세요");
  });

  it("min-h-[52px] + role=status (시안 룰)", () => {
    const html = renderToStaticMarkup(
      <Toast toast={makeToast({ variant: "success" })} />,
    );
    expect(html).toContain("min-h-[52px]");
    expect(html).toContain('role="status"');
  });
});
