"use client";

import { useState } from "react";
import type { Evidence } from "@/lib/types";

interface EvidencePanelProps {
  /** 단순 사용처(데모 데이터 등)를 위해 reasons만 받기 가능 */
  reasons?: string[];
  /** 풀 Evidence 객체. 우선순위가 reasons보다 높음 */
  evidence?: Evidence;
  defaultOpen?: boolean;
  label?: string;
}

/**
 * 추천 근거 패널 — 우리의 정체성 (M1)
 *
 * "왜 이걸 골랐나" — 트리플도 Layla도 못 하는 영역.
 *
 * 룰 (T17 + T3):
 * - 보라 배경 (계획·정보 의미 매핑)
 * - 항상 접힘 상태에서 시작 (의심할 때 펼치게 — DDR-001)
 * - 근거 부족 시 패널 자체 숨김 (T3 규칙: reasons 0개 + sources 0개)
 * - 라벨 텍스트는 컨텍스트에 따라 변경 가능
 */
export function EvidencePanel({
  reasons,
  evidence,
  defaultOpen = false,
  label = "왜 이걸 골랐나",
}: EvidencePanelProps) {
  const [open, setOpen] = useState(defaultOpen);

  const reasonList = evidence?.reasons ?? reasons ?? [];
  const sources = evidence?.sources ?? [];
  const warnings = evidence?.warnings ?? [];

  // T3 규칙: 근거 0 + 출처 0이면 숨김
  if (reasonList.length === 0 && sources.length === 0) {
    return null;
  }

  return (
    <div className="bg-purple-soft rounded-md overflow-hidden transition-all">
      <button
        className="w-full flex items-center justify-between px-3 py-2.5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple"
        onClick={() => setOpen(!open)}
        aria-expanded={open ? "true" : "false"}
        aria-controls="evidence-panel-body"
      >
        <span className="text-[11px] font-medium text-purple-deep tracking-wider">
          {label}
        </span>
        <span
          className={`text-purple-deep text-xs transition-transform ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        >
          ⌃
        </span>
      </button>

      {open && (
        <div id="evidence-panel-body" className="px-4 pb-3 space-y-3">
          {reasonList.length > 0 && (
            <ul className="space-y-1.5 list-disc list-inside text-[12px] text-purple-deep">
              {reasonList.map((reason, i) => (
                <li key={i}>{reason}</li>
              ))}
            </ul>
          )}

          {sources.length > 0 && (
            <div className="border-t border-purple/20 pt-2">
              <p className="text-[10px] font-medium text-purple-deep tracking-wider mb-1.5">
                출처
              </p>
              <ul className="space-y-1">
                {sources.map((s, i) => (
                  <li key={i} className="text-[11px] text-purple-deep flex items-center gap-2 flex-wrap">
                    <span className="font-medium uppercase">{platformLabel(s.platform)}</span>
                    {typeof s.reviewCount === "number" && (
                      <span>{s.reviewCount.toLocaleString()}건</span>
                    )}
                    {typeof s.positiveRate === "number" && (
                      <span>· {s.positiveRate}% 긍정</span>
                    )}
                    {s.url && (
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline ml-auto"
                      >
                        보러가기 ↗
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {warnings.length > 0 && (
            <div className="border-t border-purple/20 pt-2">
              <p className="text-[10px] font-medium text-amber-deep tracking-wider mb-1">
                주의
              </p>
              <ul className="space-y-1 text-[11px] text-amber-deep list-disc list-inside">
                {warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {evidence?.verifiedAt && (
            <p className="text-[10px] text-ink-mute pt-1">
              마지막 검증 {formatDate(evidence.verifiedAt)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function platformLabel(p: string): string {
  switch (p) {
    case "naver": return "네이버";
    case "google": return "구글";
    case "kakao": return "카카오";
    case "ota": return "OTA";
    case "instagram": return "인스타";
    case "user_review": return "사용자";
    default: return p;
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}
