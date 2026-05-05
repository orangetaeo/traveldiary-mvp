"use client";

import { useState, useCallback, useRef } from "react";

/**
 * 토스트 메시지 상태 관리 hook.
 *
 * 사이클 옵셔널 객체 진화 (feedback_helper_evolution_options_pattern, 6+ 답습 정착).
 *
 * BC: show(msg) / show(msg, ms:number) — 기존 6+ 호출처 그대로 작동.
 * 신규: show(msg, { ms?, variant?, subtitle?, action? }) — variant + subtitle + action.
 *
 * Stitch 시안 (a66c84466c91426d8833d271e5fa6459) 5 variants:
 *   success / info / warning / danger / undo (+ default neutral).
 */

export type ToastVariant =
  | "neutral"
  | "success"
  | "info"
  | "warning"
  | "danger"
  | "undo";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  ms?: number;
  variant?: ToastVariant;
  subtitle?: string;
  action?: ToastAction;
}

export interface ToastData {
  message: string;
  variant: ToastVariant;
  subtitle?: string;
  action?: ToastAction;
}

export function useToast(defaultMs = 3500) {
  const [toast, setToast] = useState<ToastData | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (message: string, msOrOptions?: number | ToastOptions) => {
      const options: ToastOptions =
        typeof msOrOptions === "number"
          ? { ms: msOrOptions }
          : (msOrOptions ?? {});
      const ms = options.ms ?? defaultMs;

      if (timerRef.current) clearTimeout(timerRef.current);
      setToast({
        message,
        variant: options.variant ?? "neutral",
        subtitle: options.subtitle,
        action: options.action,
      });
      timerRef.current = setTimeout(() => setToast(null), ms);
    },
    [defaultMs],
  );

  const dismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast(null);
  }, []);

  return {
    /** BC: 단순 메시지 — 기존 <Toast message={message} /> 호출 호환 */
    message: toast?.message ?? null,
    /** 신규: variant + subtitle + action 풀 객체 — <Toast toast={toast} /> */
    toast,
    show,
    dismiss,
  } as const;
}
