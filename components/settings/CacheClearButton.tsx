"use client";

/**
 * CacheClearButton — localStorage/sessionStorage 캐시 삭제 버튼.
 *
 * td-* 접두어 키만 삭제 (사용자 데이터는 DB에 영속화 — 영향 없음).
 * PWA Service Worker cache는 향후 도입 시 추가.
 */

import { useState } from "react";
import { useToast } from "@/lib/hooks/useToast";
import { Toast } from "@/components/ui/Toast";

export function CacheClearButton() {
  const [cleared, setCleared] = useState(false);
  const { toast, show: showToast } = useToast();

  function handleClear() {
    let count = 0;

    // localStorage — td-* 키만 삭제 (인증·설정 등 비-td 키 보존)
    const lsKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("td-")) lsKeys.push(key);
    }
    lsKeys.forEach((k) => localStorage.removeItem(k));
    count += lsKeys.length;

    // sessionStorage 전체 삭제 (탭 한정, 안전)
    const ssCount = sessionStorage.length;
    sessionStorage.clear();
    count += ssCount;

    setCleared(true);
    showToast(
      count > 0
        ? `캐시 ${count}건 삭제 완료`
        : "삭제할 캐시가 없습니다",
      { variant: count > 0 ? "success" : "info" },
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClear}
        disabled={cleared}
        className={`w-full rounded-md font-bold py-td-sm transition-colors ${
          cleared
            ? "bg-success/20 text-success-deep cursor-default"
            : "bg-purple text-white hover:opacity-90 active:scale-[0.98]"
        }`}
      >
        {cleared ? (
          <span className="flex items-center justify-center gap-td-xs">
            <span className="material-symbols-outlined text-xl" aria-hidden>check_circle</span>
            삭제 완료
          </span>
        ) : (
          <span className="flex items-center justify-center gap-td-xs">
            <span className="material-symbols-outlined text-xl" aria-hidden>cached</span>
            캐시 삭제
          </span>
        )}
      </button>
      <Toast toast={toast} />
    </>
  );
}
