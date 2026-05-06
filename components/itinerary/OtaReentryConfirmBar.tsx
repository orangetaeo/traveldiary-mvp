"use client";

/**
 * OTA reentry confirm bar — 사이클 5 (G8, 2026-05-06).
 *
 * 외부 OTA 사이트에서 돌아왔을 때 sessionStorage outgoing 마킹을 감지하고
 * "예약하셨나요? — 예/아니요" inline 카드 노출. 사용자 답변은 audit log에 기록
 * (BLOCKER 7 webhook 부재 시 self-report 신호).
 *
 * 갭 해소: 결제 후 reentry 시 우리가 사용자가 예약을 진행했는지 알 수 없었음.
 *         OtaCompareSection 안에 마운트되어 outgoing 클릭이 있을 때만 활성.
 *
 * 분할 패턴 (사이클 3 ItineraryCoachMark 답습):
 *  - Overlay (presentation, props만): renderToStaticMarkup 단언 가능
 *  - Orchestrator (visibilitychange/focus + storage 검사 + action 호출)
 */

import { useCallback, useEffect, useState, useTransition } from "react";
import {
  type OtaOutgoingMark,
  clearOtaOutgoing,
  getOtaOutgoing,
} from "@/lib/ota/outgoing";
import { confirmOtaBookingAction } from "@/actions/ota-booking-confirm";
import { OTA_LABEL } from "@/lib/constants/ota-constants";

interface OverlayProps {
  ota: string;
  priceKrw: number;
  isPending: boolean;
  onConfirm: () => void;
  onDecline: () => void;
}

export function OtaReentryConfirmOverlay({
  ota,
  priceKrw,
  isPending,
  onConfirm,
  onDecline,
}: OverlayProps) {
  const label =
    (OTA_LABEL as Record<string, string>)[ota] ?? ota.toUpperCase();
  return (
    <div
      role="region"
      aria-label="OTA 예약 확인"
      className="bg-purple-soft border border-purple/30 rounded-md p-td-sm mb-td-sm"
    >
      <div className="flex items-start gap-td-xs mb-td-xs">
        <span
          className="material-symbols-outlined text-purple-deep text-[22px] shrink-0 mt-0.5"
          aria-hidden
        >
          help
        </span>
        <div className="flex-1">
          <p className="text-td-body font-bold text-purple-deep">
            {label} 예약을 마치셨나요?
          </p>
          <p className="text-td-caption text-purple-deep/80 mt-0.5">
            방금 클릭하신 약 {priceKrw.toLocaleString()}원 옵션 결제가 완료됐는지 알려주시면
            여행 기록에 반영해 드릴게요.
          </p>
        </div>
      </div>
      <div className="flex gap-td-xs">
        <button
          type="button"
          onClick={onConfirm}
          disabled={isPending}
          className="flex-1 py-td-xs rounded-md bg-purple text-white text-td-meta font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          예, 예약했어요
        </button>
        <button
          type="button"
          onClick={onDecline}
          disabled={isPending}
          className="flex-1 py-td-xs rounded-md border border-purple/40 text-td-meta font-semibold text-purple-deep hover:bg-purple/10 transition-colors disabled:opacity-50"
        >
          아니요
        </button>
      </div>
    </div>
  );
}

interface OrchestratorProps {
  itemId: string;
}

export function OtaReentryConfirmBar({ itemId }: OrchestratorProps) {
  const [mark, setMark] = useState<OtaOutgoingMark | null>(null);
  const [isPending, startTransition] = useTransition();

  // 재진입 감지 — visibilitychange + focus + 첫 마운트
  useEffect(() => {
    function check() {
      const m = getOtaOutgoing();
      if (m && m.itemId === itemId) {
        setMark(m);
      }
    }
    check();
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", check);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", check);
    };
  }, [itemId]);

  const submit = useCallback(
    (decision: "confirmed" | "declined") => {
      if (!mark) return;
      startTransition(async () => {
        await confirmOtaBookingAction({
          offerId: mark.offerId,
          itemId: mark.itemId,
          ota: mark.ota,
          priceKrw: mark.priceKrw,
          clickedAt: mark.clickedAt,
          decision,
        });
        clearOtaOutgoing();
        setMark(null);
      });
    },
    [mark],
  );

  if (!mark) return null;

  return (
    <OtaReentryConfirmOverlay
      ota={mark.ota}
      priceKrw={mark.priceKrw}
      isPending={isPending}
      onConfirm={() => submit("confirmed")}
      onDecline={() => submit("declined")}
    />
  );
}
