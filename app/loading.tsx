/**
 * 전역 로딩 상태 — 페이지 전환 시 스켈레톤 표시.
 */

export default function Loading() {
  return (
    <div className="min-h-screen bg-surface-soft flex flex-col items-center justify-center">
      <div className="animate-pulse flex flex-col items-center gap-td-sm">
        <div className="w-12 h-12 rounded-full bg-purple/20" />
        <div className="h-4 w-32 bg-ink/10 rounded" />
        <div className="h-3 w-48 bg-ink/5 rounded" />
      </div>
    </div>
  );
}
