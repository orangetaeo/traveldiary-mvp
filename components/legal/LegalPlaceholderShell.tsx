/**
 * Legal placeholder shell — /legal/terms + /legal/privacy + /legal/oss 공유.
 *
 * 사이클 legal-swap (2026-05-07): 내부 구현을 PlaceholderShell로 위임.
 * 외부 호출처(Terms/Privacy/OSS) 무중단 — public API 100% 유지.
 */

import Link from "next/link";
import { PlaceholderShell } from "@/components/common/PlaceholderShell";

export interface LegalPlaceholderShellProps {
  /** 페이지 제목 (예: "이용약관" / "개인정보 처리방침") */
  title: string;
  /** 짧은 부제 — 무엇이 들어갈 페이지인지 */
  description: string;
  /** 핵심 항목 bullet (placeholder에서도 정체성 노출) */
  highlights: string[];
  /** 마지막 갱신 일자 (placeholder는 빈 문자열 OK) */
  lastUpdated?: string;
  /** Hero 원형 아이콘 (Material Symbols 이름). 기본 "gavel". */
  iconName?: string;
}

const NOTE_BODY =
  "상용 출시(BLOCKER 7 사업자 등록 + OTA 어필리에이트 계약) 전까지 위 주요 항목이 적용됩니다. 정식 문서는 출시 시점에 게시되며 중대한 변경 시 앱 내 알림으로 안내합니다.";

export function LegalPlaceholderShell({
  title,
  description,
  highlights,
  lastUpdated,
  iconName = "gavel",
}: LegalPlaceholderShellProps) {
  return (
    <PlaceholderShell
      title={title}
      description={description}
      iconName={iconName}
      note={{ title: "정식 문서 준비 중", body: NOTE_BODY }}
      footerExtra={
        <>
          {lastUpdated && (
            <p className="text-td-caption text-ink-mute text-center">
              마지막 갱신: {lastUpdated}
            </p>
          )}

          <div className="mt-td-lg flex flex-col gap-td-xs">
            <Link
              href="/legal/terms"
              className="text-td-body text-purple-deep hover:underline text-center"
            >
              이용약관 보기
            </Link>
            <Link
              href="/legal/privacy"
              className="text-td-body text-purple-deep hover:underline text-center"
            >
              개인정보 처리방침 보기
            </Link>
          </div>
        </>
      }
    >
      {/* Highlights — placeholder에서도 핵심 항목은 노출 (사용자 신뢰) */}
      <section
        aria-labelledby="legal-highlights-heading"
        className="bg-surface-card rounded-md border border-divider p-td-md mb-td-md"
      >
        <h3
          id="legal-highlights-heading"
          className="text-td-meta text-ink-soft font-bold uppercase tracking-wider mb-td-xs"
        >
          주요 항목
        </h3>
        <ul className="space-y-td-xs">
          {highlights.map((line, i) => (
            <li key={i} className="flex items-start gap-td-sm">
              <span
                className="material-symbols-outlined text-purple-deep text-td-icon mt-0.5 shrink-0"
                aria-hidden
              >
                check
              </span>
              <p className="text-td-body text-ink flex-1">{line}</p>
            </li>
          ))}
        </ul>
      </section>
    </PlaceholderShell>
  );
}
