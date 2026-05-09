/**
 * LegalDocumentShell — 정식 법적 문서 페이지 레이아웃.
 *
 * LegalPlaceholderShell과 달리 "준비 중" 노트 없이 실제 문서를 표시.
 * 헤더 + 본문 + 교차 링크 + 설정 복귀.
 */

import Link from "next/link";

interface Props {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export function LegalDocumentShell({ title, lastUpdated, children }: Props) {
  return (
    <div className="min-h-screen bg-surface-soft text-ink pb-24">
      <header className="sticky top-0 z-40 bg-surface-card/90 backdrop-blur-md border-b border-divider flex items-center px-4 h-14">
        <Link
          href="/settings"
          aria-label="설정으로 돌아가기"
          className="p-2 rounded-full hover:bg-surface-soft transition-colors"
        >
          <span className="material-symbols-outlined text-ink">arrow_back</span>
        </Link>
        <h1 className="text-td-title font-bold tracking-tight text-ink ml-td-xs">
          {title}
        </h1>
      </header>

      <main className="max-w-2xl mx-auto px-td-md py-td-lg">
        <p className="text-td-caption text-ink-mute mb-td-lg">
          최종 갱신: {lastUpdated}
        </p>

        <div className="prose-legal space-y-td-lg">
          {children}
        </div>

        <div className="mt-td-lg pt-td-md border-t border-divider flex flex-col gap-td-xs">
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

        <Link
          href="/settings"
          className="mt-td-md block text-td-meta text-ink-soft hover:underline text-center"
        >
          ← 설정으로
        </Link>
      </main>
    </div>
  );
}
