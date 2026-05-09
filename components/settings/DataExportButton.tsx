"use client";

/**
 * DataExportButton — 내 데이터 JSON 다운로드 트리거.
 *
 * Server Action으로 데이터 수집 → Blob → 브라우저 다운로드.
 */

import { useTransition } from "react";
import { useToast } from "@/lib/hooks/useToast";
import { Toast } from "@/components/ui/Toast";
import { exportUserData } from "@/actions/data-export";

export function DataExportButton() {
  const [isPending, startTransition] = useTransition();
  const { toast, show: showToast } = useToast();

  function handleExport() {
    startTransition(async () => {
      const result = await exportUserData();

      if (!result.ok) {
        const msgs: Record<string, string> = {
          no_db: "데이터베이스 연결 없음 (데모 모드)",
          no_data: "내보낼 데이터가 없습니다",
          internal: "내보내기 실패 — 잠시 후 다시 시도해주세요",
        };
        showToast(msgs[result.code] ?? "알 수 없는 오류", { variant: "warning" });
        return;
      }

      // Blob → download
      const blob = new Blob([result.json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `traveldiary-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const { trips, items, costs, checklists, votes } = result.counts;
      showToast(
        `다운로드 완료 — 여행 ${trips}, 일정 ${items}, 비용 ${costs}, 체크리스트 ${checklists}, 투표 ${votes}건`,
        { variant: "success" },
      );
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={handleExport}
        disabled={isPending}
        className="w-full h-14 bg-purple text-white rounded-md font-bold flex items-center justify-center gap-td-xs transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
      >
        <span className="material-symbols-outlined text-xl" aria-hidden>
          download
        </span>
        <span>{isPending ? "내보내는 중…" : "JSON 파일로 다운로드"}</span>
      </button>
      <Toast toast={toast} />
    </>
  );
}
