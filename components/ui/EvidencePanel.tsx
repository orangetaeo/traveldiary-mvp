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
 * 룰 (T17 Stitch 시안 매칭 + T3):
 * - 흰 배경 + 보라 보더 (계획·정보 의미 매핑)
 * - lightbulb 아이콘 + 근거 건수 배지 (collapsed에서도 정보 밀도)
 * - 항상 접힘 상태에서 시작 (의심할 때 펼치게 — DDR-001)
 * - 근거 부족 시 패널 자체 숨김 (T3 규칙: reasons 0개 + sources 0개)
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

  if (reasonList.length === 0 && sources.length === 0) {
    return null;
  }

  const reasonCount = reasonList.length;

  return (
    <div className="bg-surface-card border border-purple/20 rounded-md overflow-hidden shadow-sm">
      <button
        type="button"
        className="w-full flex items-center justify-between px-td-md py-td-sm text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="evidence-panel-body"
      >
        <span className="flex items-center gap-td-xs">
          <span
            className="material-symbols-outlined filled text-purple text-td-icon-lg"
            aria-hidden="true"
          >
            lightbulb
          </span>
          <span className="text-td-body font-medium text-ink">{label}</span>
        </span>
        <span className="flex items-center gap-td-xs">
          {!open && reasonCount > 0 && (
            <span className="bg-purple-soft text-purple-deep text-td-caption px-td-xs py-0.5 rounded-full font-medium">
              근거 {reasonCount}건
            </span>
          )}
          <span
            className="material-symbols-outlined text-purple text-td-icon-lg"
            aria-hidden="true"
          >
            {open ? "expand_less" : "expand_more"}
          </span>
        </span>
      </button>

      {open && (
        <div id="evidence-panel-body">
          <div className="border-t border-purple/10 px-td-md py-td-md space-y-td-sm">
            {reasonList.length > 0 && (
              <ul className="space-y-td-sm">
                {reasonList.map((reason, i) => (
                  <li key={i} className="flex items-start gap-td-sm">
                    <span
                      className="mt-1.5 w-2 h-2 rounded-full bg-purple shrink-0"
                      aria-hidden="true"
                    />
                    <p className="flex-1 text-td-body text-ink">{reason}</p>
                  </li>
                ))}
              </ul>
            )}

            {sources.length > 0 && (
              <div className="border-t border-purple/10 pt-td-sm">
                <p className="text-td-caption font-medium text-purple-deep uppercase tracking-wider mb-td-xs">
                  출처
                </p>
                <ul className="space-y-td-xxs">
                  {sources.map((s, i) => (
                    <li
                      key={i}
                      className="text-td-meta text-ink-soft flex items-center gap-td-xs flex-wrap"
                    >
                      <span className="font-medium uppercase text-purple-deep">
                        {platformLabel(s.platform)}
                      </span>
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
                          className="underline ml-auto text-purple-deep"
                        >
                          보러가기 ↗
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {evidence?.verifiedAt && (
              <p className="text-td-caption text-ink-mute pt-td-xxs">
                마지막 검증 {formatDate(evidence.verifiedAt)}
              </p>
            )}
          </div>

          {warnings.length > 0 && (
            <div className="bg-amber-soft/40 px-td-md py-td-sm flex items-start gap-td-sm">
              <span
                className="material-symbols-outlined filled text-amber-deep text-td-icon-lg shrink-0"
                aria-hidden="true"
              >
                info
              </span>
              <ul className="space-y-td-xxs text-td-body text-amber-deep font-medium">
                {warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
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
