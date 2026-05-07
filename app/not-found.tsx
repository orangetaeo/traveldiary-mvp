import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface-soft flex flex-col">
      <header className="fixed top-0 inset-x-0 z-50 h-14 bg-surface-card border-b border-divider flex items-center px-td-md">
        <Link
          href="/"
          aria-label="뒤로 가기"
          className="flex items-center justify-center w-8 h-8 rounded-md text-ink-soft hover:bg-surface-soft active:scale-95 transition-all"
        >
          <span aria-hidden="true" className="text-lg leading-none">←</span>
        </Link>
        <h1 className="ml-td-sm text-td-body font-medium text-ink">
          404 · 페이지를 찾지 못했어요
        </h1>
      </header>

      <main className="flex-grow pt-14 pb-td-lg px-td-lg flex flex-col">
        <section className="flex flex-col items-center text-center mt-td-lg mb-td-lg">
          <div aria-hidden="true" className="text-7xl mb-td-md leading-none">
            🗺️
          </div>
          <div className="space-y-td-xs">
            <h2 className="text-td-title text-ink font-medium">
              여행 경로를 잃었어요
            </h2>
            <p className="text-td-body text-ink-soft">
              주소를 다시 확인해주시거나, 아래에서 다른 길을 찾아보세요.
            </p>
            <p className="text-td-meta text-ink-mute">Error 404 · Not Found</p>
          </div>
        </section>

        <nav aria-label="복구 경로" className="flex flex-col gap-td-sm">
          <Link
            href="/"
            className="flex items-center gap-td-md p-td-md bg-surface-card border border-divider rounded-md hover:bg-surface-soft active:scale-[0.98] transition-all"
          >
            <span
              aria-hidden="true"
              className="w-10 h-10 rounded-full bg-purple-soft flex items-center justify-center text-xl shrink-0"
            >
              🏠
            </span>
            <span className="flex-grow text-left">
              <span className="block text-td-body font-bold text-ink">
                홈으로 돌아가기
              </span>
              <span className="block text-td-meta text-ink-soft">
                오늘의 추천 여행 보기
              </span>
            </span>
            <span aria-hidden="true" className="text-ink-mute text-lg">›</span>
          </Link>

          <Link
            href="/trips"
            className="flex items-center gap-td-md p-td-md bg-surface-card border border-divider rounded-md hover:bg-surface-soft active:scale-[0.98] transition-all"
          >
            <span
              aria-hidden="true"
              className="w-10 h-10 rounded-full bg-purple-soft flex items-center justify-center text-xl shrink-0"
            >
              🧳
            </span>
            <span className="flex-grow text-left">
              <span className="block text-td-body font-bold text-ink">
                내 여행 목록
              </span>
              <span className="block text-td-meta text-ink-soft">
                지금까지 만든 여행
              </span>
            </span>
            <span aria-hidden="true" className="text-ink-mute text-lg">›</span>
          </Link>

          <Link
            href="/guide"
            className="flex items-center gap-td-md p-td-md bg-surface-card border border-divider rounded-md hover:bg-surface-soft active:scale-[0.98] transition-all"
          >
            <span
              aria-hidden="true"
              className="w-10 h-10 rounded-full bg-purple-soft flex items-center justify-center text-xl shrink-0"
            >
              🔍
            </span>
            <span className="flex-grow text-left">
              <span className="block text-td-body font-bold text-ink">
                장소 검색
              </span>
              <span className="block text-td-meta text-ink-soft">
                베트남 6개 도시
              </span>
            </span>
            <span aria-hidden="true" className="text-ink-mute text-lg">›</span>
          </Link>
        </nav>

        <div className="mt-auto pt-td-lg flex justify-center">
          <Link
            href="/settings"
            className="text-td-meta text-purple underline underline-offset-4 hover:opacity-80 transition-opacity"
          >
            문제가 계속되나요? 버그 신고하기
          </Link>
        </div>
      </main>
    </div>
  );
}
