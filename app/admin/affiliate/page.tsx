/**
 * Affiliate Commission Dashboard — Phase 7 Stitch 디자인 적용.
 *
 * Stitch 시안: #28 Admin Affiliate Tracking (b6b53fe497e8491d9c7c30676aea02e5)
 * 레이아웃: header + hero commission + KPI 2×2 + OTA stacked bar + city table + BLOCKER 7 경고.
 * ADMIN_SECRET_KEY 접근 가드.
 */

import Link from "next/link";
import { getAffiliateSummary } from "@/lib/repositories/affiliate.repository";
import { isDbConnected } from "@/lib/prisma";
import { parseWindow } from "@/lib/admin/window-filter";
import { TimeWindowFilter } from "@/components/admin/TimeWindowFilter";
import { assertAdminAccess } from "@/lib/auth/admin-guard";

export const dynamic = "force-dynamic";

const OTA_LABEL: Record<string, string> = {
  klook: "Klook",
  kkday: "KKday",
  agoda: "Agoda",
  unknown: "기타",
};

const OTA_COLOR: Record<string, string> = {
  klook: "bg-purple",
  kkday: "bg-amber",
  agoda: "bg-success",
  unknown: "bg-ink-mute",
};

interface PageProps {
  searchParams: { window?: string; key?: string };
}

export default async function AffiliateDashboard({ searchParams }: PageProps) {
  assertAdminAccess(searchParams);
  const windowDays = parseWindow(searchParams.window);
  const keyParam = searchParams.key ? searchParams.key : "";
  const adminLink = keyParam ? `/admin?key=${keyParam}` : "/admin";

  if (!isDbConnected) {
    return (
      <div className="min-h-screen bg-surface-soft text-ink">
        <AffiliateHeader adminLink={adminLink} />
        <main className="max-w-4xl mx-auto px-td-md py-td-lg">
          <div className="bg-amber-soft border border-amber/40 rounded-md p-td-md text-center">
            <p className="text-td-body text-amber-deep">
              DB 미연결 — 어필리에이트 통계 조회 불가
            </p>
          </div>
        </main>
      </div>
    );
  }

  const summary = await getAffiliateSummary({ limit: 20, windowDays });

  return (
    <div className="min-h-screen bg-surface-soft text-ink pb-24">
      <AffiliateHeader adminLink={adminLink} />

      <main className="max-w-4xl mx-auto px-td-md space-y-td-lg py-td-md">
        {/* Hero Section */}
        {summary && (
          <section className="space-y-td-xxs">
            <p className="text-td-meta text-ink-soft">
              {windowDays ? `최근 ${windowDays}일` : "전체 기간"}
            </p>
            <div className="flex items-end gap-td-xs">
              <h2 className="text-[32px] font-medium leading-none tabular-nums text-ink">
                ₩ {summary.totalEstimatedCommissionKrw.toLocaleString()}
              </h2>
            </div>
            <p className="text-td-meta text-ink-soft">예상 매출 (OTA 정산 전 추정)</p>
          </section>
        )}

        {/* Date Filter */}
        <TimeWindowFilter current={windowDays} basePath="/admin/affiliate" />

        {!summary ? (
          <div className="py-td-lg text-center text-td-body text-ink-soft">
            데이터 로드 실패
          </div>
        ) : (
          <>
            {/* KPI Grid */}
            <section className="grid grid-cols-2 gap-td-sm">
              <div className="bg-surface-card border border-divider p-td-sm rounded-md">
                <p className="text-td-meta text-ink-soft mb-td-xxs">Clicks</p>
                <p className="text-td-card-title font-bold tabular-nums">
                  {summary.totalClicks.toLocaleString()}
                </p>
              </div>
              <div className="bg-surface-card border border-divider p-td-sm rounded-md">
                <p className="text-td-meta text-ink-soft mb-td-xxs">OTA 수</p>
                <p className="text-td-card-title font-bold tabular-nums">
                  {summary.byOta.length}
                </p>
              </div>
              <div className="bg-surface-card border border-divider p-td-sm rounded-md">
                <p className="text-td-meta text-ink-soft mb-td-xxs">추정 Commission</p>
                <p className="text-td-card-title font-bold tabular-nums">
                  ₩{summary.totalEstimatedCommissionKrw.toLocaleString()}
                </p>
              </div>
              <div className="bg-surface-card border border-divider p-td-sm rounded-md">
                <p className="text-td-meta text-ink-soft mb-td-xxs">도시 수</p>
                <p className="text-td-card-title font-bold tabular-nums">
                  {summary.byCity.length}
                </p>
              </div>
            </section>

            {/* OTA Breakdown */}
            <section className="space-y-td-sm">
              <h3 className="text-td-card-title font-bold text-ink">OTA Breakdown</h3>

              {summary.byOta.length === 0 ? (
                <p className="text-td-meta text-ink-soft text-center py-td-md bg-surface-card border border-divider rounded-md">
                  {windowDays ? `최근 ${windowDays}일간 클릭 데이터가 없어요.` : "아직 클릭 데이터가 없어요."}
                </p>
              ) : (
                <>
                  {/* Stacked Bar */}
                  <div className="flex h-10 w-full rounded-md overflow-hidden border border-divider">
                    {summary.byOta.map((row) => {
                      const pct = summary.totalClicks > 0 ? (row.clicks / summary.totalClicks) * 100 : 0;
                      return (
                        <div
                          key={row.ota}
                          className={`h-full ${OTA_COLOR[row.ota] ?? OTA_COLOR.unknown}`}
                          style={{ width: `${Math.max(pct, 2)}%` }}
                          title={`${OTA_LABEL[row.ota] ?? row.ota}: ${pct.toFixed(1)}%`}
                        />
                      );
                    })}
                  </div>

                  {/* Table */}
                  <div className="bg-surface-card rounded-md border border-divider overflow-hidden">
                    <div className="flex items-center text-td-meta text-ink-soft border-b border-divider px-td-sm py-td-xxs uppercase font-bold">
                      <span className="w-2/6">Provider</span>
                      <span className="w-2/6 text-right">Clicks</span>
                      <span className="w-2/6 text-right">Revenue</span>
                    </div>
                    {summary.byOta.map((row) => (
                      <div
                        key={row.ota}
                        className="flex items-center px-td-sm py-td-xs border-b border-divider last:border-b-0"
                      >
                        <div className="w-2/6 flex items-center gap-td-xxs">
                          <div className={`w-2 h-2 rounded-full ${OTA_COLOR[row.ota] ?? OTA_COLOR.unknown} shrink-0`} />
                          <span className="text-td-body font-medium">{OTA_LABEL[row.ota] ?? row.ota}</span>
                        </div>
                        <span className="w-2/6 text-right text-td-body tabular-nums">
                          {row.clicks.toLocaleString()}
                        </span>
                        <span className="w-2/6 text-right text-td-body tabular-nums font-bold">
                          ₩{row.estimatedCommissionKrw.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>

            {/* City Breakdown */}
            <section className="space-y-td-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-td-card-title font-bold text-ink">City Breakdown</h3>
                <span className="text-td-meta text-purple font-bold">Vietnam</span>
              </div>

              {summary.byCity.length === 0 ? (
                <p className="text-td-meta text-ink-soft text-center py-td-md bg-surface-card border border-divider rounded-md">
                  도시별 데이터 없음
                </p>
              ) : (
                <div className="bg-surface-card rounded-md border border-divider overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-surface-soft text-td-meta text-ink-soft uppercase">
                        <th className="px-td-sm py-td-xxs font-bold">City</th>
                        <th className="px-td-sm py-td-xxs font-bold text-right">Clicks</th>
                        <th className="px-td-sm py-td-xxs font-bold text-right">Share</th>
                      </tr>
                    </thead>
                    <tbody className="text-td-body tabular-nums">
                      {summary.byCity.map((row) => {
                        const share = summary.totalClicks > 0
                          ? ((row.clicks / summary.totalClicks) * 100).toFixed(1)
                          : "0.0";
                        return (
                          <tr key={row.city} className="border-b border-divider last:border-b-0">
                            <td className="px-td-sm py-td-xs font-medium">{row.cityLabel}</td>
                            <td className="px-td-sm py-td-xs text-right">{row.clicks.toLocaleString()}</td>
                            <td className="px-td-sm py-td-xs text-right text-purple font-bold">{share}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Top Offers */}
            {summary.topOffers.length > 0 && (
              <section className="space-y-td-sm">
                <h3 className="text-td-card-title font-bold text-ink">인기 오퍼 Top 10</h3>
                <div className="bg-surface-card rounded-md border border-divider divide-y divide-divider">
                  {summary.topOffers.map((row, i) => (
                    <div key={row.offerId} className="flex items-center justify-between px-td-sm py-td-xs">
                      <div className="flex items-center gap-td-xs min-w-0">
                        <span className="text-td-caption text-ink-mute tabular-nums w-5 text-center shrink-0">
                          {i + 1}
                        </span>
                        <p className="text-td-meta text-ink truncate">{row.offerId}</p>
                      </div>
                      <div className="text-right shrink-0 ml-td-xs">
                        <span className="text-td-meta text-ink tabular-nums">{row.clicks}회</span>
                        <span className="text-td-caption text-success-deep ml-td-xxs tabular-nums">
                          ₩{row.estimatedCommissionKrw.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* BLOCKER 7 Warning */}
            <section className="bg-accent-soft p-td-md rounded-md border border-accent/20">
              <div className="flex items-center gap-td-xs mb-td-xxs">
                <span className="material-symbols-outlined text-accent text-lg">warning</span>
                <h4 className="text-td-body font-bold text-accent-deep">BLOCKER 7 — Stub URL 사용 중</h4>
              </div>
              <p className="text-td-meta text-accent-deep/80 leading-relaxed">
                현재 OTA 어필리에이트 링크가 고정 스텁(Stub) URL을 참조하고 있습니다.
                실 계약 링크로 교체하면 전환 추적이 가능합니다. (사업 액션 대기 중)
              </p>
            </section>

            {/* Recent Clicks */}
            {summary.recent.length > 0 && (
              <section className="space-y-td-sm">
                <h3 className="text-td-card-title font-bold text-ink">최근 클릭</h3>
                <div className="bg-surface-card rounded-md border border-divider divide-y divide-divider">
                  {summary.recent.map((click) => (
                    <div key={click.id} className="px-td-sm py-td-xs">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-td-xxs">
                          <div className={`w-2 h-2 rounded-full ${OTA_COLOR[click.ota] ?? OTA_COLOR.unknown}`} />
                          <span className="text-td-meta font-medium text-ink">
                            {OTA_LABEL[click.ota] ?? click.ota}
                          </span>
                          {!click.tracked && (
                            <span className="text-td-caption text-ink-mute">⚠ stub</span>
                          )}
                        </div>
                        <span className="text-td-caption text-ink-mute tabular-nums">
                          {new Date(click.createdAt).toLocaleString("ko-KR", {
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-td-caption text-ink-soft truncate flex-1">{click.offerId}</p>
                        <p className="text-td-meta text-ink tabular-nums ml-td-xs">
                          ₩{click.priceKrw.toLocaleString()}
                          <span className="text-success-deep ml-1">≈₩{click.estimatedCommissionKrw.toLocaleString()}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Footer */}
            <footer className="pt-td-md border-t border-divider flex flex-col items-center gap-td-xs">
              <button className="w-full md:w-auto px-td-lg py-td-sm bg-ink text-white rounded-md text-td-body font-bold hover:opacity-90 transition-opacity">
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

function AffiliateHeader({ adminLink }: { adminLink: string }) {
  return (
    <header className="sticky top-0 z-40 bg-surface-card/90 backdrop-blur-md border-b border-divider flex items-center justify-between px-4 h-16">
      <div className="flex items-center gap-td-sm">
        <Link
          href={adminLink}
          className="p-2 rounded-full hover:bg-surface-soft transition-colors"
          aria-label="Admin 대시보드로 돌아가기"
        >
          <span className="material-symbols-outlined text-ink">arrow_back</span>
        </Link>
        <h1 className="text-lg font-bold tracking-tight text-ink">어필리에이트</h1>
        <span className="bg-amber-soft text-amber-deep text-td-caption px-2 py-0.5 rounded font-bold uppercase tracking-wider">
          Admin
        </span>
      </div>
    </header>
  );
}
