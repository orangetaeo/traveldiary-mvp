"use client";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function InviteError({ reset }: ErrorPageProps) {
  return (
    <div className="min-h-screen bg-surface-soft flex flex-col items-center justify-center px-td-md text-center">
      <span className="text-6xl mb-td-md">💌</span>
      <h1 className="text-xl font-bold text-ink mb-td-xs">
        초대 페이지 오류
      </h1>
      <p className="text-td-body text-ink-soft max-w-xs leading-relaxed">
        초대 링크를 처리하는 중 문제가 발생했습니다. 링크가 만료되었거나 올바르지 않을 수 있어요.
      </p>
      <button
        onClick={reset}
        className="mt-td-lg px-6 py-3 bg-purple text-white rounded-xl text-td-body font-semibold hover:opacity-90 transition-opacity"
      >
        다시 시도
      </button>
      <a
        href="/"
        className="mt-td-sm text-td-caption text-purple hover:underline"
      >
        홈으로 돌아가기
      </a>
    </div>
  );
}
