/**
 * A/B 실험 대시보드 — 시나리오 C Phase C4.
 *
 * AuditLog "ab.impression" / "ab.conversion" → 실험·variant별 결과.
 * ADMIN_SECRET_KEY 접근 가드.
 */

import Link from "next/link";
import { getAbSummary } from "@/lib/repositories/ab.repository";
import { isDbConnected } from "@/lib/prisma";
import { parseWindow } from "@/lib/admin/window-filter";
import { TimeWindowFilter } from "@/components/admin/TimeWindowFilter";
import { assertAdminAccess } from "@/lib/auth/admin-guard";
import { EXPERIMENTS } from "@/lib/ab/experiment";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: { window?: string; key?: string };
}

export default async function AbDashboard({ searchParams }: PageProps) {
  assertAdminAccess(searchParams);
  const windowDays = parseWindow(searchParams.window);

  if (!isDbConnected) {
    return (
      <div className="min-h-screen bg-surface-soft text-ink p-td-md">
        <DashboardHeader />
        <main className="max-w-2xl mx-auto py-td-lg">
          <div className="bg-amber-soft border border-amber/40 rounded-xl p-td-md text-center">
            <p className="text-td-body text-amber-deep">
              DB 미연결 — A/B 통계 조회 불가
            </p>
          </div>
        </main>
      </div>
    );
  }

  const summary = await getAbSummary({ windowDays });

  return (
    <div className="min-h-screen bg-surface-soft text-ink pb-24">
      <DashboardHeader />

      <main className="max-w-2xl mx-auto px-td-md">
        <div className="pt-td-md">
          <TimeWindowFilter current={windowDays} basePath="/admin/ab" />
        </div>

        {!summary ? (
          <div className="py-td-lg text-center text-td-body text-ink-soft">
            데이터 로드 실패
          </div>
        ) : summary.experiments.length === 0 ? (
          <div className="py-td-lg text-center">
            <p className="text-td-body text-ink-soft mb-td-sm">
              아직 A/B 데이터가 없습니다
            </p>
            <div className="bg-surface-card border border-divider rounded-xl p-td-md">
              <p className="text-td-meta text-ink-soft mb-td-xs">
                활성 실험 {EXPERIMENTS.length}건
              </p>
              {EXPERIMENTS.map((exp) => (
                <p
                  key={exp.id}
                  className="text-td-caption text-ink-mute"
                >
                  {exp.id}: {exp.variants.join(" vs ")}
                </p>
              ))}
            </div>
          </div>
        ) : (
          <section className="py-td-lg space-y-td-md">
            {summary.experiments.map((exp) => (
              <article
                key={exp.experimentId}
                className="bg-surface-card border border-divider rounded-xl p-td-md"
              >
                <h2 className="text-td-card-title text-ink mb-td-sm">
                  {exp.experimentId}
                </h2>

                {/* 요약 */}
                <div className="grid grid-cols-2 gap-td-sm mb-td-sm">
                  <div className="text-center">
                    <p className="text-td-caption text-ink-soft">노출</p>
                    <p className="text-td-title text-ink tabular-nums">
                      {exp.totalImpressions}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-td-caption text-ink-soft">전환</p>
                    <p className="text-td-title text-success-deep tabular-nums">
                      {exp.totalConversions}
                    </p>
                  </div>
                </div>

                {/* Variant 비교 */}
                <div className="space-y-td-xs">
                  {exp.variants.map((v) => {
                    const maxImp = Math.max(
                      ...exp.variants.map((x) => x.impressions),
                      1,
                    );
                    const barWidth = Math.max(
                      (v.impressions / maxImp) * 100,
                      2,
                    );
                    const isWinner =
                      exp.variants.length > 1 &&
                      v.conversionRate ===
                        Math.max(...exp.variants.map((x) => x.conversionRate)) &&
                      v.conversionRate > 0;
                    return (
                      <div
                        key={v.variant}
                        className="bg-surface-soft rounded-lg p-td-sm"
                      >
                        <div className="flex items-center justify-between mb-td-xxs">
                          <span className="text-td-meta text-ink font-medium">
                            {v.variant}
                            {isWinner && (
                              <span className="ml-1 text-td-caption text-success-deep">
                                (우세)
                              </span>
                            )}
                          </span>
                          <span className="text-td-caption text-ink-mute tabular-nums">
                            {v.impressions}회 / {v.conversions}전환
                          </span>
                        </div>
                        <div className="h-2 bg-divider rounded-full overflow-hidden mb-td-xxs">
                          <div
                            className="h-full bg-purple rounded-full transition-all"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                        <p
                          className={`text-td-caption tabular-nums text-right ${
                            v.conversionRate >= 0.1
                              ? "text-success-deep"
                              : v.conversionRate > 0
                              ? "text-amber-deep"
                              : "text-ink-mute"
                          }`}
                        >
                          전환율 {(v.conversionRate * 100).toFixed(1)}%
                        </p>
                      </div>
                    );
                  })}
                </div>
              </article>
            ))}
          </section>
        )}

        <p className="text-td-caption text-ink-mute text-center pb-td-md">
          시나리오 C Phase C4 — A/B 실험 분석
        </p>
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
          A/B 실험
        </h1>
      </div>
      <span className="text-td-caption text-ink-mute">C4 · 시나리오 C</span>
    </header>
  );
}
