/**
 * 관리자 페이지 로딩 스켈레톤.
 */

export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-surface-soft p-td-md">
      {/* 헤더 */}
      <div className="animate-pulse mb-td-lg">
        <div className="h-5 w-16 bg-ink/10 rounded mb-td-sm" />
        <div className="h-7 w-48 bg-ink/15 rounded" />
      </div>

      {/* 카드 그리드 */}
      <div className="grid grid-cols-2 gap-td-sm">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-surface-card border border-divider rounded-md p-td-md animate-pulse"
          >
            <div className="h-4 w-20 bg-ink/10 rounded mb-td-sm" />
            <div className="h-8 w-16 bg-ink/15 rounded" />
          </div>
        ))}
      </div>

      {/* 테이블 스켈레톤 */}
      <div className="mt-td-lg space-y-td-xs">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 bg-ink/5 rounded animate-pulse" />
        ))}
      </div>
    </div>
  );
}
