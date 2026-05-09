"use client";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function MorningError({ reset }: ErrorPageProps) {
  return (
    <div className="min-h-screen bg-surface-soft flex flex-col items-center justify-center px-td-md text-center">
      <span className="text-6xl mb-td-md">🌅</span>
      <h1 className="text-xl font-bold text-ink mb-td-xs">
        오늘의 브리핑 불러오기 실패
      </h1>
      <p className="text-td-body text-ink-soft max-w-xs leading-relaxed">
        브리핑 데이터를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
      </p>
      <button
        onClick={reset}
        className="mt-td-lg px-6 py-3 bg-amber text-white rounded-md text-td-body font-semibold hover:opacity-90 transition-opacity"
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
