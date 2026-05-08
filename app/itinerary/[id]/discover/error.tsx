"use client";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DiscoverError({ reset }: ErrorPageProps) {
  return (
    <div className="min-h-screen bg-surface-soft flex flex-col items-center justify-center px-td-md text-center">
      <span className="text-6xl mb-td-md">🔍</span>
      <h1 className="text-xl font-bold text-ink mb-td-xs">
        주변 장소 탐색 실패
      </h1>
      <p className="text-td-body text-ink-soft max-w-xs leading-relaxed">
        AI 추천 장소를 불러오지 못했어요. 네트워크를 확인하고 다시 시도해 주세요.
      </p>
      <button
        onClick={reset}
        className="mt-td-lg px-6 py-3 bg-purple text-white rounded-md text-td-body font-semibold hover:opacity-90 transition-opacity"
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
