/**
 * Google Places 검증 배지 — ADR-018.
 * 모든 모드(demo/verified/not_found/error)에서 회귀 안전.
 */

import type { VerifyPlaceResult } from "@/lib/services/place-verification";

export function GoogleVerificationBadge({ result }: { result: VerifyPlaceResult }) {
  if (result.mode === "demo") {
    return (
      <div className="flex items-center gap-td-xs p-td-sm bg-surface-soft border border-divider rounded-md">
        <span className="material-symbols-outlined text-ink-mute" aria-hidden>
          help_outline
        </span>
        <span className="text-td-meta text-ink-soft">
          Google 검증 미실행 (데모 모드)
        </span>
      </div>
    );
  }

  if (result.mode === "verified") {
    const isOpen = result.operatingStatus === "open";
    const tone = isOpen
      ? "bg-purple-soft border-purple-soft text-purple-deep"
      : "bg-amber-soft border-amber-soft text-amber-deep";
    return (
      <div className={`flex items-center gap-td-xs p-td-sm border rounded-md ${tone}`}>
        <span className="material-symbols-outlined filled" aria-hidden>
          {isOpen ? "verified" : "schedule"}
        </span>
        <span className="text-td-body">
          Google 검증 — {isOpen ? "운영 중" : "현재 운영 외 시간"}
          {typeof result.rating === "number" && (
            <>
              {" "}· ★ <span className="font-bold tabular-nums">
                {result.rating.toFixed(1)}
              </span>
              {typeof result.userRatingsTotal === "number" && result.userRatingsTotal > 0 && (
                <>
                  {" "}
                  <span className="text-td-caption opacity-80">
                    ({result.userRatingsTotal.toLocaleString()}건)
                  </span>
                </>
              )}
            </>
          )}
        </span>
      </div>
    );
  }

  if (result.mode === "not_found") {
    return (
      <div className="flex items-center gap-td-xs p-td-sm bg-danger-soft border border-danger-soft rounded-md">
        <span className="material-symbols-outlined filled text-danger" aria-hidden>
          error
        </span>
        <span className="text-td-body text-danger-deep">
          Google에서 장소를 찾지 못했어요. 사용자 검토 권장.
        </span>
      </div>
    );
  }

  // mode: "error" — 무표시 (회귀 안전. 시드 evidence가 fallback)
  return null;
}
