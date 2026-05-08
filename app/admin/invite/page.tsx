/**
 * 초대 코드 통계 대시보드 — 시나리오 C Phase C2.
 *
 * AuditLog "invite.use" → 코드별 사용 횟수 + 링크 생성기.
 * ADMIN_SECRET_KEY 접근 가드.
 */

import Link from "next/link";
import { getInviteSummary } from "@/lib/repositories/invite.repository";
import { isDbConnected } from "@/lib/prisma";
import { parseWindow } from "@/lib/admin/window-filter";
import { TimeWindowFilter } from "@/components/admin/TimeWindowFilter";
import { assertAdminAccess } from "@/lib/auth/admin-guard";

export const dynamic = "force-dynamic";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://traveldiary-mvp-production.up.railway.app";

interface PageProps {
  searchParams: { window?: string; key?: string };
}

export default async function InviteDashboard({
  searchParams,
}: PageProps) {
  assertAdminAccess(searchParams);
  const windowDays = parseWindow(searchParams.window);
  const adminLink = searchParams.key ? `/admin?key=${searchParams.key}` : "/admin";

  if (!isDbConnected) {
    return (
      <div className="min-h-screen bg-surface-soft text-ink p-td-md">
        <DashboardHeader adminLink={adminLink} />
        <main className="max-w-2xl mx-auto py-td-lg">
          <div className="bg-amber-soft border border-amber/40 rounded-md p-td-md text-center">
            <p className="text-td-body text-amber-deep">
              DB 미연결 — 초대 통계 조회 불가
            </p>
          </div>
        </main>
      </div>
    );
  }

  const summary = await getInviteSummary({ windowDays });

  return (
    <div className="min-h-screen bg-surface-soft text-ink pb-24">
      <DashboardHeader adminLink={adminLink} />

      <main className="max-w-2xl mx-auto px-td-md">
        <div className="pt-td-md">
          <TimeWindowFilter
            current={windowDays}
            basePath="/admin/invite"
          />
        </div>

        {/* 초대 링크 생성 가이드 */}
        <section className="py-td-md">
          <div className="bg-purple-soft border border-purple/30 rounded-md p-td-md">
            <p className="text-td-caption text-purple-deep font-bold mb-td-xs">
              초대 링크 형식
            </p>
            <code className="text-td-meta text-ink break-all">
              {APP_URL}/invite/&lt;코드&gt;
            </code>
            <p className="text-td-caption text-ink-soft mt-td-xs">
              코드는 자유 형식 (예: beta01, friend-kim, kakao-share).
              방문 시 자동 기록 + 온보딩으로 이동.
            </p>
          </div>
        </section>

        {!summary ? (
          <div className="py-td-lg text-center text-td-body text-ink-soft">
            데이터 로드 실패
          </div>
        ) : (
          <>
            {/* 요약 */}
            <section className="pb-td-lg grid grid-cols-2 gap-td-sm">
              <div className="bg-surface-card border border-divider rounded-md p-td-sm text-center">
                <p className="text-td-caption text-ink-soft">총 사용</p>
                <p className="text-td-title text-ink tabular-nums">
                  {summary.totalUses}
                </p>
              </div>
              <div className="bg-surface-card border border-divider rounded-md p-td-sm text-center">
                <p className="text-td-caption text-ink-soft">고유 코드</p>
                <p className="text-td-title text-purple-deep tabular-nums">
                  {summary.uniqueCodes}
                </p>
              </div>
            </section>

            {/* 코드별 */}
            <section className="mb-td-lg">
              <h2 className="text-td-card-title text-ink mb-td-sm">코드별 사용</h2>
              {summary.byCodes.length === 0 ? (
                <p className="text-td-meta text-ink-soft text-center py-td-md bg-surface-card border border-divider rounded-md">
                  아직 초대 사용 기록이 없어요.
                </p>
              ) : (
                <ul className="space-y-td-xs">
                  {summary.byCodes.map((row) => (
                    <li
                      key={row.code}
                      className="bg-surface-card border border-divider rounded-md p-td-sm"
                    >
                      <div className="flex items-center justify-between mb-td-xxs">
                        <code className="text-td-body text-purple-deep font-medium">
                          {row.code}
                        </code>
                        <span className="text-td-card-title text-ink tabular-nums">
                          {row.uses}회
                        </span>
                      </div>
                      <p className="text-td-caption text-ink-mute">
                        최초{" "}
                        {new Date(row.firstUsed).toLocaleDateString("ko-KR")}
                        {row.uses > 1 && (
                          <>
                            {" "}· 최근{" "}
                            {new Date(row.lastUsed).toLocaleDateString("ko-KR")}
                          </>
                        )}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <p className="text-td-caption text-ink-mute text-center">
              시나리오 C Phase C2 — 베타 초대 추적
            </p>
          </>
        )}
      </main>
    </div>
  );
}

function DashboardHeader({ adminLink }: { adminLink: string }) {
  return (
    <header className="sticky top-0 z-40 bg-surface-card/90 backdrop-blur-md border-b border-divider flex items-center justify-between px-td-md h-14">
      <div className="flex items-center gap-td-sm">
        <Link
          href={adminLink}
          aria-label="Admin 대시보드로 돌아가기"
          className="p-2 rounded-full hover:bg-surface-soft transition-colors"
        >
          <span className="material-symbols-outlined text-ink">arrow_back</span>
        </Link>
        <h1 className="text-lg font-bold text-ink tracking-tight">
          초대 코드
        </h1>
        <span className="px-2 py-0.5 bg-surface-soft text-ink-soft text-td-badge font-bold rounded uppercase">
          Admin
        </span>
      </div>
    </header>
  );
}
