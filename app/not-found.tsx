/**
 * 404 Not Found — 디자인 시스템 일관성 유지.
 */

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface-soft flex flex-col items-center justify-center px-td-md text-center">
      <span className="text-6xl mb-td-md">🗺️</span>
      <h1 className="text-xl font-bold text-ink mb-td-xs">
        페이지를 찾을 수 없어요
      </h1>
      <p className="text-td-body text-ink-soft max-w-xs leading-relaxed">
        요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
      </p>
      <Link
        href="/"
        className="mt-td-lg px-6 py-3 bg-purple text-white rounded-xl text-td-body font-semibold hover:opacity-90 transition-opacity"
      >
        홈으로 돌아가기
      </Link>
      <Link
        href="/trips"
        className="mt-td-sm text-td-caption text-purple hover:underline"
      >
        내 여행 보기 →
      </Link>
    </div>
  );
}
