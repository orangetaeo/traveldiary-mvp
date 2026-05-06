/**
 * Legal placeholder shell — 사이클 7 (G10, 2026-05-06).
 *
 * /legal/terms + /legal/privacy 두 페이지가 공유하는 placeholder shell.
 * 정식 콘텐츠는 BLOCKER 7 OTA 어필리에이트 + 사업자 등록 후 사용자(법무)
 * 결정 영역. 본 사이클은 라우트 활성화 + 사용자 인지 가시화만.
 *
 * server component — 정적 마크업 (renderToStaticMarkup 직접 단언 가능).
 */

import Link from "next/link";

export interface LegalPlaceholderShellProps {
  /** 페이지 제목 (예: "이용약관" / "개인정보 처리방침") */
  title: string;
  /** 짧은 부제 — 무엇이 들어갈 페이지인지 */
  description: string;
  /** 핵심 항목 bullet (placeholder에서도 정체성 노출) */
  highlights: string[];
  /** 마지막 갱신 일자 (placeholder는 빈 문자열 OK) */
  lastUpdated?: string;
}

export function LegalPlaceholderShell({
  title,
  description,
  highlights,
  lastUpdated,
}: LegalPlaceholderShellProps) {
  return (
    <div className="min-h-screen bg-surface-soft text-ink pb-24">
      <header className="sticky top-0 z-40 bg-surface-card/90 backdrop-blur-md border-b border-divider flex items-center px-4 h-14">
        <Link
          href="/settings"
          aria-label="설정으로 돌아가기"
          className="p-2 rounded-full hover:bg-surface-soft transition-colors"
        >
          <span className="material-symbols-outlined text-ink">
            arrow_back
          </span>
        </Link>
        <h1 className="text-lg font-bold tracking-tight text-ink ml-td-xs">
          {title}
        </h1>
      </header>

      <main className="max-w-md mx-auto px-td-md py-td-lg">
        <div className="flex flex-col items-center mb-td-md">
          <div className="w-16 h-16 rounded-full bg-purple-soft flex items-center justify-center mb-td-sm">
            <span
              className="material-symbols-outlined text-purple-deep text-3xl"
              aria-hidden
            >
              gavel
            </span>
          </div>
          <h2 className="text-td-title text-ink text-center mb-td-xxs">
            {title}
          </h2>
          <p className="text-td-body text-ink-soft text-center">
            {description}
          </p>
        </div>

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
                  className="material-symbols-outlined text-purple-deep text-[18px] mt-0.5 shrink-0"
                  aria-hidden
                >
                  check
                </span>
                <p className="text-td-body text-ink flex-1">{line}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Placeholder 명시 — 사용자 신뢰 */}
        <section
          role="note"
          aria-live="polite"
          className="bg-amber-soft border border-amber/30 rounded-md p-td-sm mb-td-md"
        >
          <div className="flex items-start gap-td-xs">
            <span
              className="material-symbols-outlined text-amber-deep text-lg shrink-0 mt-0.5"
              aria-hidden
            >
              info
            </span>
            <div>
              <p className="text-td-body font-bold text-amber-deep mb-td-xxs">
                정식 문서 준비 중
              </p>
              <p className="text-td-caption text-amber-deep/85">
                상용 출시(BLOCKER 7 사업자 등록 + OTA 어필리에이트 계약) 전까지
                위 주요 항목이 적용됩니다. 정식 문서는 출시 시점에 게시되며
                중대한 변경 시 앱 내 알림으로 안내합니다.
              </p>
            </div>
          </div>
        </section>

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
          <Link
            href="/settings"
            className="text-td-meta text-ink-soft hover:underline text-center mt-td-xs"
          >
            ← 설정으로
          </Link>
        </div>
      </main>
    </div>
  );
}
