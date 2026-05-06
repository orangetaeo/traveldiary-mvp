/**
 * 로그아웃 Orchestrator — 사이클 8 (G3, ADR-049).
 *
 * settings 페이지에서 mount하고, 트리거 버튼은 외부에서 props로 전달.
 * fetch('/api/auth/logout') 호출 → 성공 시 router.replace('/').
 *
 * clientUuid는 보존 (R1 결정 D3) — LocalStorage clear 안 함.
 */

"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LogoutConfirmModal } from "./LogoutConfirmModal";

interface LogoutOrchestratorProps {
  /**
   * settings 페이지의 "로그아웃" 메뉴 항목을 render-prop 패턴으로 외부에 노출.
   * 사용자가 항목을 클릭하면 모달이 열림.
   */
  trigger: (props: { onClick: () => void }) => React.ReactNode;
}

export function LogoutOrchestrator({ trigger }: LogoutOrchestratorProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpen = useCallback(() => {
    setError(null);
    setOpen(true);
  }, []);

  const handleCancel = useCallback(() => {
    if (pending) return;
    setOpen(false);
  }, [pending]);

  const handleConfirm = useCallback(async () => {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (!res.ok) {
        setError("로그아웃에 실패했어요. 잠시 뒤 다시 시도해주세요.");
        setPending(false);
        return;
      }
      setOpen(false);
      router.replace("/");
      router.refresh();
    } catch {
      setError("네트워크 오류로 로그아웃하지 못했어요.");
      setPending(false);
    }
  }, [router]);

  return (
    <>
      {trigger({ onClick: handleOpen })}
      <LogoutConfirmModal
        open={open}
        pending={pending}
        errorMessage={error}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </>
  );
}
