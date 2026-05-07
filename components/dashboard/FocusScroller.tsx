"use client";
/**
 * FocusScroller — 옵션 J (PR #288 후속).
 *
 * 외부 진입(예: /city/[slug]/payment → /trips/[tripId]?focus=cost) 시 해당 카드로 자연 scroll.
 * SSR 페이지에 mount되는 작은 client island — props 변경 없으면 한 번만 실행.
 *
 * 의도적으로 시각 효과 자동 클리어는 없음. 페이지를 떠나면 자연 사라지므로 충분.
 */
import { useEffect } from "react";

interface FocusScrollerProps {
  targetId: string;
}

export function FocusScroller({ targetId }: FocusScrollerProps) {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const el = document.getElementById(targetId);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [targetId]);
  return null;
}
