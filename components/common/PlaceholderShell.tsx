/**
 * PlaceholderShell — 출시 전 정식 기능 대체 placeholder 페이지의 공통 chrome.
 *
 * 추출 배경 (사이클 U-shell-dry, 2026-05-07): LegalPlaceholderShell + cache + reminder
 * + data-export + admin 데모 마커 등 6번째 답습 임계점 도달. DRY 추출.
 *
 * 본 컴포넌트는 헤더 + Hero(원형 아이콘 + 제목 + 부제) + amber 정체성 노트 + 푸터
 * 링크만 담당. 본문(섹션·버튼·CTA)은 children으로 위임.
 *
 * LegalPlaceholderShell은 본 사이클에서 swap하지 않음(외부 호출처 5건 무중단 유지).
 * 다음 사이클에서 internal swap 진화 예정.
 *
 * server component (정적 마크업 — renderToStaticMarkup 직접 단언 가능).
 */

import Link from "next/link";

export type PlaceholderIconVariant = "soft-purple" | "solid-purple";

export interface PlaceholderShellProps {
  /** 페이지 제목 (헤더 + Hero h2) */
  title: string;
  /** Hero 부제. ReactNode 허용 (br/추가 캡션 등) */
  description: React.ReactNode;
  /** Hero 원형 아이콘 (Material Symbols 이름) */
  iconName: string;
  /** 아이콘 컨테이너 톤. soft-purple = bg-purple-soft + text-purple-deep / solid-purple = bg-purple + text-white */
  iconVariant?: PlaceholderIconVariant;
  /** Amber "준비 중" 정체성 노트. title + body. */
  note: {
    title: string;
    body: React.ReactNode;
  };
  /** 헤더 뒤로가기 + 푸터 링크 — default "/settings" */
  backHref?: string;
  /** 푸터 링크 텍스트 — default "← 설정으로" */
  backLabel?: string;
  /** 헤더 뒤로가기 aria-label — default "설정으로 돌아가기" */
  backAriaLabel?: string;
  /** 본문 (섹션 + 버튼 + 추가 CTA 등) */
  children: React.ReactNode;
}

export function PlaceholderShell({
  title,
  description,
  iconName,
  iconVariant = "soft-purple",
  note,
  backHref = "/settings",
  backLabel = "← 설정으로",
  backAriaLabel = "설정으로 돌아가기",
  children,
}: PlaceholderShellProps) {
  const iconBg =
    iconVariant === "solid-purple" ? "bg-purple" : "bg-purple-soft";
  const iconColor =
    iconVariant === "solid-purple" ? "text-white" : "text-purple-deep";

  return (
    <div className="min-h-screen bg-surface-soft text-ink pb-24">
      <header className="sticky top-0 z-40 bg-surface-card/90 backdrop-blur-md border-b border-divider flex items-center px-4 h-14">
        <Link
          href={backHref}
          aria-label={backAriaLabel}
          className="p-2 rounded-full hover:bg-surface-soft transition-colors"
        >
          <span className="material-symbols-outlined text-ink">arrow_back</span>
        </Link>
        <h1 className="text-lg font-bold tracking-tight text-ink ml-td-xs">
          {title}
        </h1>
      </header>

      <main className="max-w-md mx-auto px-td-md py-td-lg">
        <div className="flex flex-col items-center mb-td-md text-center">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mb-td-sm ${iconBg}`}
          >
            <span
              className={`material-symbols-outlined text-3xl ${iconColor}`}
              aria-hidden
            >
              {iconName}
            </span>
          </div>
          <h2 className="text-td-title text-ink mb-td-xxs">{title}</h2>
          <div className="text-td-body text-ink-soft">{description}</div>
        </div>

        {children}

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
                {note.title}
              </p>
              <div className="text-td-caption text-amber-deep/85">
                {note.body}
              </div>
            </div>
          </div>
        </section>

        <Link
          href={backHref}
          className="mt-td-md block text-td-meta text-ink-soft hover:underline text-center"
        >
          {backLabel}
        </Link>
      </main>
    </div>
  );
}
