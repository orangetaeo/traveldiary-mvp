"use client";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminError({ reset }: ErrorPageProps) {
  return (
    <div className="min-h-screen bg-surface-soft flex flex-col items-center justify-center px-td-md text-center">
      <span className="text-6xl mb-td-md">🔧</span>
      <h1 className="text-xl font-bold text-ink mb-td-xs">
        관리자 페이지 오류
      </h1>
      <p className="text-td-body text-ink-soft max-w-xs leading-relaxed">
        관리자 대시보드를 불러오는 중 문제가 발생했습니다.
      </p>
      <button
        onClick={reset}
        className="mt-td-lg px-6 py-3 bg-purple text-white rounded-xl text-td-body font-semibold hover:opacity-90 transition-opacity"
      >
        다시 시도
      </button>
      <a
        href="/admin"
        className="mt-td-sm text-td-caption text-purple hover:underline"
      >
        관리자 홈으로
      </a>
    </div>
  );
}
