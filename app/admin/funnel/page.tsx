/**
 * 온보딩 퍼널 대시보드 — 시나리오 C Phase C4.
 *
 * AuditLog "funnel.onboarding" → step별 카운트 + 전환율.
 * ADMIN_SECRET_KEY 접근 가드.
 */

import Link from "next/link";
import { getFunnelSummary } from "@/lib/repositories/funnel.repository";
import { isDbConnected } from "@/lib/prisma";
import { parseWindow } from "@/lib/admin/window-filter";
import { TimeWindowFilter } from "@/components/admin/TimeWindowFilter";
import { assertAdminAccess } from "@/lib/auth/admin-guard";

export const dynamic = "force-dynamic";

const STEP_LABEL: Record<string, string> = {
  view: "페이지 진입",
  step1: "Step 1 (여행지)",
  step2: "Step 2 (동행)",
  step3: "Step 3 (일정)",
  step4: "Step 4 (취향)",
  submit: "생성 요청",
  complete: "완료",
};

interface PageProps {
  searchParams: { window?: string; key?: string };
}

export default async function FunnelDashboard({
  searchParams,
}: PageProps) {
  assertAdminAccess(searchParams);
  const windowDays = parseWindow(searchParams.window);

  if (!isDbConnected) {
    return (
      <div className="min-h-screen bg-surface-soft text-ink p-td-md">
        <DashboardHeader />
        <main className="max-w-2xl mx-auto py-td-lg">
          <div className="bg-amber-soft border border-amber/40 rounded-xl p-td-md text-center">
            <p className="text-td-body text-amber-deep">
              DB 미연결 — 퍼널 통계 조회 불가
            </p>
          </div>
        </main>
      </div>
    );
  }

  const summary = await getFunnelSummary({ windowDays });

  return (
    <div className="min-h-screen bg-surface-soft text-ink pb-24">
      <DashboardHeader />

      <main className="max-w-2xl mx-auto px-td-md">
        <div className="pt-td-md">
          <TimeWindowFilter
            current={windowDays}
            basePath="/admin/funnel"
          />
        </div>

        {!summary ? (
          <div className="py-td-lg text-center text-td-body text-ink-soft">
            데이터 로드 실패
          </div>
        ) : (
          <>
            {/* 요약 카드 */}
            <section className="py-td-lg grid grid-cols-3 gap-td-sm">
              <div className="bg-surface-card border border-divider rounded-xl p-td-sm text-center">
                <p className="text-td-caption text-ink-soft">진입</p>
                <p className="text-td-title text-ink tabular-nums">
                  {summary.totalViews}
                </p>
              </div>
              <div className="bg-surface-card border border-divider rounded-xl p-td-sm text-center">
                <p className="text-td-caption text-ink-soft">완료</p>
                <p className="text-td-title text-success-deep tabular-nums">
                  {summary.totalCompletes}
                </p>
              </div>
              <div className="bg-surface-card border border-divider rounded-xl p-td-sm text-center">
                <p className="text-td-caption text-ink-soft">전환율</p>
                <p className="text-td-title text-purple-deep tabular-nums">
                  {(summary.overallConversionRate * 100).toFixed(1)}%
                </p>
              </div>
            </section>

            {/* 퍼널 단계 */}
            <section className="mb-td-lg">
              <h2 className="text-td-card-title text-ink mb-td-sm">
                단계별 전환
              </h2>
              <div className="space-y-td-xs">
                {summary.steps.map((s, i) => {
                  const maxCount = summary.totalViews || 1;
                  const barWidth = Math.max(
                    (s.count / maxCount) * 100,
                    2,
                  );
                  return (
                    <article
                      key={s.step}
                      className="bg-surface-card border border-divider rounded-xl p-td-sm"
                    >
                      <div className="flex items-center justify-between mb-td-xxs">
                        <span className="text-td-meta text-ink font-medium">
                          {STEP_LABEL[s.step] ?? s.step}
                        </span>
                        <div className="flex items-center gap-td-xs">
                          <span className="text-td-card-title text-ink tabular-nums">
                            {s.count}
                          </span>
                          {i > 0 && (
                            <span
                              className={`text-td-caption tabular-nums ${
                                s.conversionRate >= 0.7
                                  ? "text-success-deep"
                                  : s.conversionRate >= 0.4
                                  ? "text-amber-deep"
                                  : "text-danger-deep"
                              }`}
                            >
                              {(s.conversionRate * 100).toFixed(0)}%
                            </span>
                          )}
                        </div>
                      </div>
                      {/* 바 차트 */}
                      <div className="h-2 bg-surface-soft rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple rounded-full transition-all"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <p className="text-td-caption text-ink-mute text-center">
              시나리오 C Phase C4 — 온보딩 퍼널 분석
            </p>
          </>
        )}
      </main>
    </div>
  );
}

function DashboardHeader() {
  return (
    <header className="bg-surface-card border-b border-divider sticky top-0 z-40 flex justify-between items-center w-full px-td-md h-16">
      <div className="flex items-center gap-td-sm">
        <Link
          href="/"
          aria-label="홈"
          className="p-2 rounded-full hover:bg-surface-soft transition-colors"
        >
          <span className="material-symbols-outlined text-ink">home</span>
        </Link>
        <h1 className="text-lg font-bold text-ink tracking-tight">
          온보딩 퍼널
        </h1>
      </div>
      <span className="text-td-caption text-ink-mute">C4 · 시나리오 C</span>
    </header>
  );
}
