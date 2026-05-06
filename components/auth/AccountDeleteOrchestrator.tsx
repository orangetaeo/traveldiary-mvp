/**
 * 계정 삭제 Orchestrator — 사이클 8 (G3, ADR-049).
 *
 * 2단계 step state: idle → warning → confirm → loading → success/error.
 * 성공 시: clientUuid LocalStorage clear (R1 결정 D3) → router.replace('/account/deleted').
 */

"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AccountDeleteWarningModal } from "./AccountDeleteWarningModal";
import { AccountDeleteConfirmModal } from "./AccountDeleteConfirmModal";

type Step = "idle" | "warning" | "confirm";

const CLIENT_UUID_STORAGE_KEY = "td-client-uuid";

interface AccountDeleteOrchestratorProps {
  trigger: (props: { onClick: () => void }) => React.ReactNode;
}

export function AccountDeleteOrchestrator({
  trigger,
}: AccountDeleteOrchestratorProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("idle");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpen = useCallback(() => {
    setError(null);
    setStep("warning");
  }, []);

  const handleCancel = useCallback(() => {
    if (pending) return;
    setStep("idle");
    setError(null);
  }, [pending]);

  const handleNext = useCallback(() => {
    setStep("confirm");
  }, []);

  const handleConfirm = useCallback(
    async (phrase: string) => {
      setPending(true);
      setError(null);
      try {
        const res = await fetch("/api/auth/account", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ confirm: phrase }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          const code = data?.code as string | undefined;
          if (code === "confirm_mismatch") {
            setError("입력한 문구가 일치하지 않습니다.");
          } else if (code === "not_authenticated" || code === "invalid_token") {
            setError("로그인이 만료됐어요. 다시 로그인해주세요.");
          } else {
            setError("삭제에 실패했어요. 잠시 뒤 다시 시도해주세요.");
          }
          setPending(false);
          return;
        }
        try {
          window.localStorage.removeItem(CLIENT_UUID_STORAGE_KEY);
        } catch {
          // private mode 등 — 무시
        }
        setStep("idle");
        router.replace("/account/deleted");
      } catch {
        setError("네트워크 오류로 삭제하지 못했어요.");
        setPending(false);
      }
    },
    [router],
  );

  return (
    <>
      {trigger({ onClick: handleOpen })}
      <AccountDeleteWarningModal
        open={step === "warning"}
        onNext={handleNext}
        onCancel={handleCancel}
      />
      <AccountDeleteConfirmModal
        open={step === "confirm"}
        pending={pending}
        errorMessage={error}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </>
  );
}
