"use client";

import { useState, useCallback, useRef } from "react";

/**
 * 토스트 메시지 상태 관리 hook.
 * 6+ 컴포넌트에서 반복되던 toast + setTimeout 패턴 추출.
 */
export function useToast(defaultMs = 3500) {
  const [message, setMessage] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (msg: string, ms = defaultMs) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setMessage(msg);
      timerRef.current = setTimeout(() => setMessage(null), ms);
    },
    [defaultMs],
  );

  const dismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMessage(null);
  }, []);

  return { message, show, dismiss } as const;
}
