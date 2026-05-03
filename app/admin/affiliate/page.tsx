/**
 * Affiliate Commission Dashboard — 사이클 12c.
 *
 * AuditLog "affiliate.click" 행을 OTA별 집계.
 * MVP: 인증 미요구 (단일 운영자 가정). 11d+에서 admin role 체크 추가.
 *
 * Estimated commission은 OTA별 가정 rate (COMMISSION_RATE).
 * 실 commission은 어필리에이트 콘솔에서 정산 후 비교.
 */

import Link from "next/link";
import { getAffiliateSummary } from "@/lib/repositories/affiliate.repository";
import { isDbConnected } from "@/lib/prisma";

// 라이브 audit log를 매 요청마다 조회 (build-time 캐시 X) — 사이클 SS (PP 답습)
export const dynamic = "force-dynamic";

const OTA_LABEL: Record<string, string> = {
  klook: "Klook",
  kkday: "KKday",
  agoda: "Agoda",
  unknown: "기타",
};

const OTA_TONE: Record<string, string> = {
  klook: "bg-purple-soft text-purple-deep",
  kkday: "bg-amber-soft text-amber-deep",
  agoda: "bg-success-soft text-success-deep",
  unknown: "bg-surface-soft text-ink-soft",
};

export default async function AffiliateDashboard() {
  if (!isDbConnected) {
    return (
      <div className="min-h-screen bg-surface-soft text-ink p-td-md">
        <DashboardHeader />
        <main className="max-w-2xl mx-auto py-td-lg">
          <div className="bg-amber-soft border border-amber/40 rounded-xl p-td-md text-center">
            <p className="text-td-body text-amber-deep">
              DB 미연결 — 어필리에이트 통계 미사용 가능
            </p>
            <p className="text-td-caption text-amber-deep/80 mt-td-xs">
              데모 모드 또는 Railway PostgreSQL 추가 필요
            </p>
          </div>
        </main>
      </div>
    );
  }

  const summary = await getAffiliateSummary(20);

  return (
    <div className="min-h-screen bg-surface-soft text-ink pb-24">
      <DashboardHeader />

      <main className="max-w-2xl mx-auto px-td-md">
        {!summary ? (
          <div className="py-td-lg text-center text-td-body text-ink-soft">
            데이터 로드 실패
          </div>
        ) : (
          <>
            {/* 총 합계 */}
            <section className="py-td-lg">
              <p className="text-td-meta text-ink-soft">총 클릭</p>
              <p className="text-td-title text-ink tabular-nums">
                {summary.totalClicks.toLocaleString()}회
              </p>
              <p className="text-td-meta text-ink-soft mt-td-md">
                추정 누적 commission
              </p>
              <p className="text-td-title text-success-deep tabular-nums">
                {summary.totalEstimatedCommissionKrw.toLocaleString()}원
              </p>
              <p className="text-td-caption text-ink-mute mt-td-xs">
                💡 OTA 가정 rate (Klook 5% / KKday 4% / Agoda 4%) — 실 commission은
                각 OTA 콘솔에서 정산 확인
              </p>
            </section>

            {/* OTA별 */}
            <section className="mb-td-lg">
              <h2 className="text-td-card-title text-ink mb-td-sm">OTA별</h2>
              {summary.byOta.length === 0 ? (
                <p className="text-td-meta text-ink-soft text-center py-td-md bg-surface-card border border-divider rounded-xl">
                  아직 클릭 데이터가 없어요.
                </p>
              ) : (
                <div className="space-y-td-xs">
                  {summary.byOta.map((row) => (
                    <article
                      key={row.ota}
                      className="bg-surface-card border border-divider rounded-xl p-td-sm flex items-center justify-between"
                    >
                      <span
                        className={`px-2 py-0.5 rounded-full text-td-caption font-bold ${
                          OTA_TONE[row.ota] ?? OTA_TONE.unknown
                        }`}
                      >
                        {OTA_LABEL[row.ota] ?? row.ota}
                      </span>
                      <div className="text-right">
                        <p className="text-td-card-title text-ink tabular-nums">
                          {row.clicks.toLocaleString()}회
                        </p>
                        <p className="text-td-caption text-success-deep tabular-nums">
                          ≈ {row.estimatedCommissionKrw.toLocaleString()}원
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            {/* 최근 클릭 */}
            <section>
              <h2 className="text-td-card-title text-ink mb-td-sm">최근 클릭</h2>
              {summary.recent.length === 0 ? (
                <p className="text-td-meta text-ink-soft text-center py-td-md bg-surface-card border border-divider rounded-xl">
                  최근 클릭이 없어요.
                </p>
              ) : (
                <ul className="space-y-td-xs">
                  {summary.recent.map((click) => (
                    <li
                      key={click.id}
                      className="bg-surface-card border border-divider rounded-xl p-td-sm"
                    >
                      <div className="flex items-center justify-between mb-td-xxs">
                        <div className="flex items-center gap-td-xs">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-td-caption font-bold ${
                              OTA_TONE[click.ota] ?? OTA_TONE.unknown
                            }`}
                          >
                            {OTA_LABEL[click.ota] ?? click.ota}
                          </span>
                          {!click.tracked && (
                            <span className="text-td-caption text-ink-mute">
                              ⚠ 어필리에이트 ID 미설정
                            </span>
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
                        <p className="text-td-meta text-ink-soft truncate flex-1">
                          {click.offerId}
                        </p>
                        <p className="text-td-meta text-ink tabular-nums ml-td-xs">
                          {click.priceKrw.toLocaleString()}원
                          <span className="text-td-caption text-success-deep ml-td-xxs">
                            ≈ {click.estimatedCommissionKrw.toLocaleString()}
                          </span>
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
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
          어필리에이트 통계
        </h1>
      </div>
      <span className="text-td-caption text-ink-mute">M8 · 사이클 12c</span>
    </header>
  );
}
