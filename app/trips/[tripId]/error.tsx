"use client";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function TripDashboardError({ reset }: ErrorPageProps) {
  return (
    <div className="min-h-screen bg-surface-soft flex flex-col items-center justify-center px-td-md text-center">
      <span className="material-symbols-outlined text-6xl text-ink-mute mb-td-md">dashboard</span>
      <h1 className="text-xl font-bold text-ink mb-td-xs">대시보드 로딩 실패</h1>
      <p className="text-td-body text-ink-soft max-w-xs leading-relaxed">
        여행 대시보드를 불러오지 못했어요.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-td-lg px-6 py-3 bg-purple text-white rounded-md text-td-body font-semibold hover:opacity-90 transition-opacity"
      >
        다시 시도
      </button>
      <a href="/trips" className="mt-td-sm text-td-caption text-purple hover:underline">
        여행 목록으로 돌아가기
      </a>
    </div>
  );
}
