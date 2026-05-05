/**
 * 온보딩 퍼널 대시보드 — Phase 7 Stitch 디자인 적용.
 *
 * Stitch 시안: #24 Admin Onboarding Funnel Analysis (09f5f91339754692bf1cc1c84493d085)
 * 레이아웃: header + hero + date filter + funnel bar + insight + referral/city grid.
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
  view: "1. /onboarding 도착",
  step1: "2. Step 1 완료",
  step2: "3. 도시 선택",
  step3: "4. 기간·일행",
  step4: "5. 취향",
  submit: "6. 일정 생성 시작",
  complete: "7. 일정 완성",
};

// --- 데모: 유입 채널 (추후 AuditLog referral 집계로 교체) ---
const REFERRAL_DEMO = [
  { name: "Launch", visits: 468, completes: 232, rate: "49.6%" },
  { name: "Instagram", visits: 382, completes: 121, rate: "31.7%" },
  { name: "Blog", visits: 294, completes: 158, rate: "53.7%" },
  { name: "Direct/None", visits: 276, completes: 86, rate: "31.2%" },
] as const;

// --- 데모: 도시 점유 (추후 실 데이터로 교체) ---
const CITY_DEMO = [
  { name: "푸꾸옥", pct: 32, color: "bg-purple" },
  { name: "다낭", pct: 28, color: "bg-violet-400" },
  { name: "나트랑", pct: 15, color: "bg-violet-300" },
  { name: "호치민", pct: 12, color: "bg-violet-200" },
  { name: "하노이", pct: 8, color: "bg-violet-100" },
  { name: "기타", pct: 5, color: "bg-slate-200" },
] as const;

interface PageProps {
  searchParams: { window?: string; key?: string };
}

export default async function FunnelDashboard({ searchParams }: PageProps) {
  assertAdminAccess(searchParams);
  const windowDays = parseWindow(searchParams.window);
  const keyParam = searchParams.key ? `&key=${searchParams.key}` : "";

  if (!isDbConnected) {
    return (
      <div className="min-h-screen bg-surface-soft text-ink">
        <FunnelHeader keyParam={keyParam} />
        <main className="max-w-4xl mx-auto px-td-md py-td-lg">
          <div className="bg-amber-soft border border-amber/40 rounded-md p-td-md text-center">
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
      <FunnelHeader keyParam={keyParam} />

      <main className="max-w-4xl mx-auto px-td-md space-y-td-lg py-td-lg">
        {/* Hero */}
        <section className="space-y-td-xxs">
          <h2 className="text-td-title text-ink">���보딩 → 첫 일정 생성</h2>
          <p className="text-td-body text-ink-soft">ref 코드별 / 도시별 분기</p>
        </section>

        {/* Date Filter */}
        <div className="sticky top-16 z-30 bg-surface-soft/80 backdrop-blur-sm py-td-xs border-b border-divider/30">
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
            {/* Funnel Visualization */}
            <section className="bg-surface-card p-td-md rounded-md border border-divider shadow-sm space-y-td-md">
              <div className="space-y-td-xs">
                {summary.steps.map((s, i) => {
                  const maxCount = summary.totalViews || 1;
                  const pct = Math.round((s.count / maxCount) * 100);
                  const barWidth = Math.max(pct, 2);
                  const isLast = i === summary.steps.length - 1;
                  // 점진적 투명도 (100% → 50%)
                  const opacity = Math.round(100 - (i * 50) / (summary.steps.length - 1 || 1));

                  return (
                    <div key={s.step} className="space-y-td-xxs">
                      <div className="flex justify-between items-center">
                        <span className={`text-td-meta font-medium ${isLast ? "text-accent-deep font-bold" : "text-ink"}`}>
                          {STEP_LABEL[s.step] ?? s.step}
                        </span>
                        <span className={`text-td-meta tabular-nums ${isLast ? "text-accent-deep font-bold" : "text-ink-soft"}`}>
                          {s.count.toLocaleString()}명 ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-surface-soft rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${isLast ? "bg-accent" : "bg-purple"}`}
                          style={{ width: `${barWidth}%`, opacity: isLast ? 1 : opacity / 100 }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Insight Box */}
              {summary.steps.length > 1 && (
                <InsightBox steps={summary.steps} totalViews={summary.totalViews} />
              )}
            </section>

            {/* Summary Cards */}
            <section className="grid grid-cols-3 gap-td-sm">
              <div className="bg-surface-card border border-divider rounded-md p-td-sm text-center">
                <p className="text-td-caption text-ink-soft">진입</p>
                <p className="text-td-title text-ink tabular-nums">
                  {summary.totalViews.toLocaleString()}
                </p>
              </div>
              <div className="bg-surface-card border border-divider rounded-md p-td-sm text-center">
                <p className="text-td-caption text-ink-soft">완료</p>
                <p className="text-td-title text-success-deep tabular-nums">
                  {summary.totalCompletes.toLocaleString()}
                </p>
              </div>
              <div className="bg-surface-card border border-divider rounded-md p-td-sm text-center">
                <p className="text-td-caption text-ink-soft">전환율</p>
                <p className="text-td-title text-purple-deep tabular-nums">
                  {(summary.overallConversionRate * 100).toFixed(1)}%
                </p>
              </div>
            </section>

            {/* Referral + City Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-td-md">
              {/* Referral Breakdown */}
              <section className="space-y-td-sm">
                <h3 className="text-td-card-title text-ink">유입 채널 분석</h3>
                <div className="space-y-td-xs">
                  {REFERRAL_DEMO.map((r) => (
                    <div
                      key={r.name}
                      className="p-td-sm bg-surface-card border border-divider rounded-md flex justify-between items-center"
                    >
                      <span className="text-td-body text-ink">{r.name}</span>
                      <span className="text-td-meta text-purple font-bold tabular-nums">
                        {r.visits} / {r.completes} ({r.rate})
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              {/* City Breakdown */}
              <section className="space-y-td-sm">
                <h3 className="text-td-card-title text-ink">도시별 점유율</h3>
                <div className="bg-surface-card p-td-md border border-divider rounded-md space-y-td-md">
                  {/* Stacked bar */}
                  <div className="flex h-6 w-full rounded-sm overflow-hidden">
                    {CITY_DEMO.map((c) => (
                      <div
                        key={c.name}
                        className={`h-full ${c.color}`}
                        style={{ width: `${c.pct}%` }}
                      />
                    ))}
                  </div>
                  {/* Legend */}
                  <div className="grid grid-cols-3 gap-y-td-xs gap-x-td-sm">
                    {CITY_DEMO.map((c) => (
                      <div key={c.name} className="flex items-center gap-td-xxs">
                        <div className={`w-2 h-2 rounded-full ${c.color} shrink-0`} />
                        <span className="text-td-meta text-ink-soft">
                          {c.name} ({c.pct}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>

            {/* Footer */}
            <footer className="pt-td-lg border-t border-divider flex flex-col items-center gap-td-xs">
              <button className="w-full md:w-auto px-td-lg py-td-sm bg-ink text-white rounded-md text-td-body font-bold flex items-center justify-center gap-td-xs hover:opacity-90 transition-opacity">
                <span className="material-symbols-outlined text-[20px]">download</span>
                CSV 내보내기
              </button>
              <span className="text-td-caption text-ink-mute tabular-nums">
                audit.export 기록됨
              </span>
            </footer>
          </>
        )}
      </main>
    </div>
  );
}

/** 최대 이탈 구간 인사이트 박스 */
function InsightBox({
  steps,
  totalViews,
}: {
  steps: Array<{ step: string; count: number; conversionRate: number }>;
  totalViews: number;
}) {
  // 이전 step 대비 가장 큰 이���을 찾기
  let maxDrop = 0;
  let maxDropIdx = 0;
  for (let i = 1; i < steps.length; i++) {
    const drop = steps[i - 1].count - steps[i].count;
    if (drop > maxDrop) {
      maxDrop = drop;
      maxDropIdx = i;
    }
  }

  if (maxDrop === 0) return null;

  const prevLabel = STEP_LABEL[steps[maxDropIdx - 1].step] ?? steps[maxDropIdx - 1].step;
  const currLabel = STEP_LABEL[steps[maxDropIdx].step] ?? steps[maxDropIdx].step;
  const dropPct = Math.round((maxDrop / totalViews) * 100);

  return (
    <div className="bg-accent-soft/50 p-td-sm rounded-md border border-accent/20 flex items-start gap-td-xs">
      <span className="material-symbols-outlined text-accent text-lg mt-0.5">warning</span>
      <div className="space-y-0.5">
        <span className="text-td-body font-bold text-accent-deep">
          최대 이탈: {prevLabel} → {currLabel} -{dropPct}% ({maxDrop.toLocaleString()}명)
        </span>
        <p className="text-td-caption text-accent-deep/70 italic">
          해당 구간 UI 가독성 및 속도 점검 필요
        </p>
      </div>
    </div>
  );
}

function FunnelHeader({ keyParam }: { keyParam: string }) {
  return (
    <header className="sticky top-0 z-40 bg-surface-card/90 backdrop-blur-md border-b border-divider flex items-center justify-between px-4 h-16">
      <div className="flex items-center gap-td-sm">
        <Link
          href={`/admin${keyParam ? `?key=${keyParam.replace("&key=", "")}` : ""}`}
          className="p-2 rounded-full hover:bg-surface-soft transition-colors"
          aria-label="Admin 대시보드로 돌아가기"
        >
          <span className="material-symbols-outlined text-ink">arrow_back</span>
        </Link>
        <h1 className="text-lg font-bold tracking-tight text-ink">퍼널</h1>
        <span className="px-2 py-0.5 bg-surface-soft text-ink-soft text-[10px] font-bold rounded uppercase">
          Admin
        </span>
      </div>
    </header>
  );
}
