/**
 * 데이터 내보내기 — 사용자 데이터 JSON 다운로드.
 *
 * GDPR 개인정보보호법에 따른 사용자 데이터 이동 권리.
 * Server Action으로 데이터 수집 → 클라이언트 JSON 다운로드.
 * 다운로드 시 audit log에 30일간 기록 (ADR-046).
 */

import type { Metadata } from "next";
import { PlaceholderShell } from "@/components/common/PlaceholderShell";

export const metadata: Metadata = {
  title: "데이터 내보내기",
  description: "내 여행 데이터를 JSON 파일로 다운로드합니다.",
};
import { DataExportButton } from "@/components/settings/DataExportButton";

const INCLUDED_DATA: { label: string; sub: string }[] = [
  { label: "내 trip 목록", sub: "여행 단위 메타" },
  { label: "일정 항목", sub: "DAG 노드 + 위치" },
  { label: "비용 기록", sub: "정산 마커 포함" },
  { label: "체크리스트", sub: "D-Day 항목" },
  { label: "댓글·리액션", sub: "ShareComment 흔적" },
  { label: "감사 로그", sub: "최근 30일 (ADR-046)" },
];

const EXCLUDED_DATA: string[] = [
  "다른 사용자 정보",
  "외부 API 응답 캐시",
  "시스템 메타데이터",
];

export default function DataExportPage() {
  return (
    <PlaceholderShell
      title="내 데이터 내보내기"
      description={
        <>
          <p className="text-td-body text-ink-soft mb-td-xs">
            JSON 파일로 다운로드해서 백업하거나
            <br />
            다른 서비스로 옮길 수 있습니다
          </p>
          <span className="text-td-caption text-ink-mute">
            GDPR · 개인정보보호법에 따른 사용자 권리
          </span>
        </>
      }
      iconName="download"
      iconVariant="solid-purple"
      note={{
        title: "데이터 보호 안내",
        body: "다운로드되는 JSON 파일에는 내 여행 정보만 포함됩니다. 다른 사용자 정보나 시스템 데이터는 포함되지 않으며, 다운로드 기록은 30일간 audit log에 보관됩니다 (ADR-046).",
      }}
    >
      <section aria-labelledby="included-heading" className="mb-td-md">
        <h3
          id="included-heading"
          className="text-td-meta text-ink-soft font-bold uppercase tracking-wider mb-td-xs px-td-xxs"
        >
          포함되는 데이터
        </h3>
        <div className="bg-surface-card rounded-md border border-divider divide-y divide-divider overflow-hidden">
          {INCLUDED_DATA.map((item) => (
            <div
              key={item.label}
              className="px-td-sm py-td-sm flex items-center gap-td-sm"
            >
              <span
                className="material-symbols-outlined text-success text-xl shrink-0"
                aria-hidden
              >
                check_circle
              </span>
              <div className="flex-1 flex justify-between items-center">
                <span className="text-td-body text-ink">{item.label}</span>
                <span className="text-td-caption text-ink-mute">{item.sub}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="excluded-heading" className="mb-td-md">
        <h3
          id="excluded-heading"
          className="text-td-meta text-ink-soft font-bold uppercase tracking-wider mb-td-xs px-td-xxs"
        >
          포함되지 않는 데이터
        </h3>
        <div className="bg-surface-card rounded-md border border-divider divide-y divide-divider overflow-hidden">
          {EXCLUDED_DATA.map((label) => (
            <div
              key={label}
              className="px-td-sm py-td-sm flex items-center gap-td-sm"
            >
              <span
                className="material-symbols-outlined text-ink-mute text-xl shrink-0"
                aria-hidden
              >
                cancel
              </span>
              <span className="text-td-body text-ink-soft">{label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-td-md">
        <DataExportButton />
      </section>

      <p className="text-td-caption text-ink-mute text-center leading-relaxed mb-td-md">
        다운로드 기록은 30일간 audit log에 보관됩니다 (ADR-046)
      </p>
    </PlaceholderShell>
  );
}
