/**
 * 초대 페이지 로딩 스켈레톤.
 */

export default function InviteLoading() {
  return (
    <div className="min-h-screen bg-surface-soft flex flex-col items-center justify-center px-td-md">
      <div className="animate-pulse flex flex-col items-center gap-td-sm">
        <div className="w-16 h-16 rounded-full bg-purple/20" />
        <div className="h-5 w-40 bg-ink/15 rounded" />
        <div className="h-3 w-56 bg-ink/5 rounded" />
        <div className="mt-td-md h-10 w-48 bg-purple/20 rounded-xl" />
      </div>
    </div>
  );
}
