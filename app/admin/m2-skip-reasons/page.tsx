/**
 * M2 Skip Reasons Dashboard — 사이클 PP.
 *
 * AuditLog "trip.mode_transition" 행을 outcome × skipReason × trigger로 집계.
 * MVP: 인증 미요구 (단일 운영자 가정 — affiliate 답습). 11d+에서 admin role 체크.
 *
 * 좌표·정확도는 AAA `buildModeTransitionMetadata` 화이트리스트 단계에서 차단됨 —
 * 본 dashboard는 raw row를 신뢰해도 안전 (ADR-017 §C).
 */

import Link from "next/link";
import { getModeTransitionStats } from "@/lib/repositories/mode-transition-stats.repository";
import { isDbConnected } from "@/lib/prisma";
import type {
  ModeTransitionSkipReason,
  ModeTransitionTrigger,
} from "@/lib/mode-transition";

// 라이브 audit log를 매 요청마다 조회 (build-time 캐시 X)
export const dynamic = "force-dynamic";

const REASON_LABEL: Record<ModeTransitionSkipReason, string> = {
  not_in_destination: "도시 경계 밖",
  not_yet_started: "출발 전",
  already_in_mode: "이미 여행 중",
  geolocation_unsupported: "기기 미지원",
  geolocation_denied: "권한 거부",
  geolocation_unavailable: "위치 가져오기 실패",
};

const REASON_TONE: Record<ModeTransitionSkipReason, string> = {
  not_in_destination: "bg-amber-soft text-amber-deep",
  not_yet_started: "bg-purple-soft text-purple-deep",
  already_in_mode: "bg-success-soft text-success-deep",
  geolocation_unsupported: "bg-surface-soft text-ink-soft",
  geolocation_denied: "bg-danger-soft text-danger-deep",
  geolocation_unavailable: "bg-surface-soft text-ink-soft",
};

const TRIGGER_LABEL: Record<ModeTransitionTrigger | "unknown", string> = {
  manual: "수동",
  geolocation: "위치 기반",
  unknown: "(기록 이전)",
};

// 사이클 RR — destinationCode → 한국어 라벨 매핑.
// 베트남 단일 국가 정책: 8 도시 활성. 비-베트남(TYO/BKK/CNX)은 dormant 시드라
// 실 데이터 미발생 예상이지만 안전망으로 매핑 포함.
const CITY_LABEL: Record<string, string> = {
  PQC: "푸꾸옥",
  DAD: "다낭",
  HAN: "하노이",
  SGN: "호치민",
  HOI: "호이안",
  NHA: "나트랑",
  DLI: "달랏",
  CTH: "껀터",
  TYO: "도쿄",
  BKK: "방콕",
  CNX: "치앙마이",
  unknown: "(기록 이전)",
};

const ALLOWED_WINDOWS = [7, 30] as const;
type WindowOption = (typeof ALLOWED_WINDOWS)[number];

function parseWindow(raw: string | undefined): WindowOption | undefined {
  if (!raw) return undefined;
  const n = Number.parseInt(raw, 10);
  return ALLOWED_WINDOWS.includes(n as WindowOption)
    ? (n as WindowOption)
    : undefined;
}

interface PageProps {
  searchParams: { window?: string };
}

export default async function ModeTransitionStatsDashboard({
  searchParams,
}: PageProps) {
  const windowDays = parseWindow(searchParams.window);

  if (!isDbConnected) {
    return (
      <div className="min-h-screen bg-surface-soft text-ink p-td-md">
        <DashboardHeader />
        <main className="max-w-2xl mx-auto py-td-lg">
          <div className="bg-amber-soft border border-amber/40 rounded-xl p-td-md text-center">
            <p className="text-td-body text-amber-deep">
              DB 미연결 — M2 통계 미사용 가능
            </p>
            <p className="text-td-caption text-amber-deep/80 mt-td-xs">
              데모 모드 또는 Railway PostgreSQL 추가 필요
            </p>
          </div>
        </main>
      </div>
    );
  }

  const stats = await getModeTransitionStats({ limit: 20, windowDays });

  return (
    <div className="min-h-screen bg-surface-soft text-ink pb-24">
      <DashboardHeader />

      <main className="max-w-2xl mx-auto px-td-md">
        {/* 사이클 RR — 시간 윈도우 필터 (전체/7일/30일). 항상 노출. */}
        <div className="pt-td-md">
          <TimeWindowFilter current={windowDays} />
        </div>

        {!stats ? (
          <div className="py-td-lg text-center text-td-body text-ink-soft">
            데이터 로드 실패
          </div>
        ) : stats.totalAttempts === 0 ? (
          <div className="py-td-lg text-center">
            <p className="text-td-body text-ink-soft">
              {windowDays
                ? `최근 ${windowDays}일간 자동 전환 시도 데이터가 없어요.`
                : "아직 자동 전환 시도 데이터가 없어요."}
            </p>
            <p className="text-td-caption text-ink-mute mt-td-xs">
              사이클 KK 머지 후 첫 사용자 클릭부터 기록됩니다.
            </p>
          </div>
        ) : (
          <>
            {/* 총합 + 성공률 */}
            <section className="py-td-lg">
              <p className="text-td-meta text-ink-soft">총 시도</p>
              <p className="text-td-title text-ink tabular-nums">
                {stats.totalAttempts.toLocaleString()}회
              </p>
              <div className="mt-td-md grid grid-cols-2 gap-td-sm">
                <div className="bg-success-soft rounded-xl p-td-sm">
                  <p className="text-td-caption text-success-deep/80">성공</p>
                  <p className="text-td-card-title text-success-deep tabular-nums">
                    {stats.applied.toLocaleString()}회
                  </p>
                </div>
                <div className="bg-amber-soft rounded-xl p-td-sm">
                  <p className="text-td-caption text-amber-deep/80">스킵</p>
                  <p className="text-td-card-title text-amber-deep tabular-nums">
                    {stats.skipped.toLocaleString()}회
                  </p>
                </div>
              </div>
              <p className="text-td-meta text-ink-soft mt-td-md">성공률</p>
              <p className="text-td-title text-purple tabular-nums">
                {stats.successRate}%
              </p>
              <p className="text-td-caption text-ink-mute mt-td-xs">
                💡 좌표·정확도는 기록되지 않습니다 (ADR-017 §C ·{" "}
                <Link
                  href="/docs"
                  className="underline hover:text-ink"
                  prefetch={false}
                >
                  privacy.md
                </Link>
                )
              </p>
            </section>

            {/* skipReason 분포 */}
            <section className="mb-td-lg">
              <h2 className="text-td-card-title text-ink mb-td-sm">
                스킵 사유 분포
              </h2>
              {stats.byReason.length === 0 ? (
                <p className="text-td-meta text-ink-soft text-center py-td-md bg-surface-card border border-divider rounded-xl">
                  스킵 데이터가 없어요.
                </p>
              ) : (
                <div className="space-y-td-xs">
                  {stats.byReason.map((row) => {
                    const ratio =
                      stats.skipped === 0
                        ? 0
                        : Math.round((row.count / stats.skipped) * 100);
                    return (
                      <article
                        key={row.reason}
                        className="bg-surface-card border border-divider rounded-xl p-td-sm flex items-center justify-between gap-td-sm"
                      >
                        <span
                          className={`px-2 py-0.5 rounded-full text-td-caption font-bold whitespace-nowrap ${
                            REASON_TONE[row.reason]
                          }`}
                        >
                          {REASON_LABEL[row.reason]}
                        </span>
                        <div className="text-right">
                          <p className="text-td-card-title text-ink tabular-nums">
                            {row.count.toLocaleString()}회
                          </p>
                          <p className="text-td-caption text-ink-soft tabular-nums">
                            {ratio}%
                          </p>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            {/* trigger 분포 */}
            <section className="mb-td-lg">
              <h2 className="text-td-card-title text-ink mb-td-sm">
                트리거별
              </h2>
              <div className="space-y-td-xs">
                {stats.byTrigger.map((row) => (
                  <article
                    key={row.trigger}
                    className="bg-surface-card border border-divider rounded-xl p-td-sm flex items-center justify-between"
                  >
                    <span className="text-td-meta text-ink">
                      {TRIGGER_LABEL[row.trigger]}
                    </span>
                    <span className="text-td-card-title text-ink tabular-nums">
                      {row.count.toLocaleString()}회
                    </span>
                  </article>
                ))}
              </div>
            </section>

            {/* 사이클 RR — 도시별 분포 */}
            {stats.byDestinationCode.length > 0 && (
              <section className="mb-td-lg">
                <h2 className="text-td-card-title text-ink mb-td-sm">도시별</h2>
                <div className="space-y-td-xs">
                  {stats.byDestinationCode.map((d) => {
                    const successRate =
                      d.total === 0
                        ? 0
                        : Math.round((d.applied / d.total) * 100);
                    return (
                      <article
                        key={d.code}
                        className="bg-surface-card border border-divider rounded-xl p-td-sm flex items-center justify-between gap-td-sm"
                      >
                        <div className="min-w-0">
                          <p className="text-td-meta text-ink truncate">
                            {CITY_LABEL[d.code] ?? d.code}
                          </p>
                          <p className="text-td-caption text-ink-soft tabular-nums">
                            성공 {d.applied} / 스킵 {d.skipped}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-td-card-title text-ink tabular-nums">
                            {d.total.toLocaleString()}회
                          </p>
                          <p className="text-td-caption text-purple tabular-nums">
                            {successRate}% 성공
                          </p>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}

            {/* 최근 N건 */}
            <section>
              <h2 className="text-td-card-title text-ink mb-td-sm">최근 시도</h2>
              {stats.recent.length === 0 ? (
                <p className="text-td-meta text-ink-soft text-center py-td-md bg-surface-card border border-divider rounded-xl">
                  최근 시도가 없어요.
                </p>
              ) : (
                <ul className="space-y-td-xs">
                  {stats.recent.map((row) => (
                    <li
                      key={row.id}
                      className="bg-surface-card border border-divider rounded-xl p-td-sm"
                    >
                      <div className="flex items-center justify-between mb-td-xxs flex-wrap gap-td-xxs">
                        <div className="flex items-center gap-td-xs flex-wrap">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-td-caption font-bold ${
                              row.outcome === "applied"
                                ? "bg-success-soft text-success-deep"
                                : row.outcome === "skipped"
                                ? "bg-amber-soft text-amber-deep"
                                : "bg-surface-soft text-ink-soft"
                            }`}
                          >
                            {row.outcome === "applied"
                              ? "성공"
                              : row.outcome === "skipped"
                              ? "스킵"
                              : "(기록 이전)"}
                          </span>
                          {row.skipReason && (
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-td-caption font-bold ${
                                REASON_TONE[row.skipReason]
                              }`}
                            >
                              {REASON_LABEL[row.skipReason]}
                            </span>
                          )}
                          {row.destinationCode && (
                            <span className="text-td-caption text-ink-soft">
                              {row.destinationCode}
                            </span>
                          )}
                        </div>
                        <span className="text-td-caption text-ink-mute tabular-nums">
                          {new Date(row.createdAt).toLocaleString("ko-KR", {
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-td-caption text-ink-soft">
                        {TRIGGER_LABEL[row.trigger]}
                        {typeof row.dDay === "number" && (
                          <span className="ml-td-xs">
                            D{row.dDay > 0 ? `-${row.dDay}` : `+${-row.dDay}`}
                          </span>
                        )}
                        {typeof row.boundaryHit === "boolean" && (
                          <span className="ml-td-xs">
                            {row.boundaryHit ? "경계 안" : "경계 밖"}
                          </span>
                        )}
                      </p>
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
          M2 자동 전환 통계
        </h1>
      </div>
      <span className="text-td-caption text-ink-mute">M2 · 사이클 RR</span>
    </header>
  );
}

/**
 * 사이클 RR — 시간 윈도우 chip 필터.
 * Link 기반 (서버 컴포넌트, force-dynamic이라 매번 재조회).
 * radiogroup + aria-checked string (feedback_aria_invariant 답습).
 */
function TimeWindowFilter({ current }: { current: WindowOption | undefined }) {
  const baseChip =
    "shrink-0 px-3 py-1.5 rounded-full text-td-meta font-semibold border transition-colors flex items-center";
  const inactive =
    "bg-surface-card border-divider text-ink-soft hover:text-ink hover:border-ink-mute";
  const active = "bg-ink text-white border-ink";

  const options: Array<{
    label: string;
    href: string;
    isActive: boolean;
  }> = [
    {
      label: "전체",
      href: "/admin/m2-skip-reasons",
      isActive: current === undefined,
    },
    {
      label: "최근 7일",
      href: "/admin/m2-skip-reasons?window=7",
      isActive: current === 7,
    },
    {
      label: "최근 30일",
      href: "/admin/m2-skip-reasons?window=30",
      isActive: current === 30,
    },
  ];

  return (
    <div
      className="flex gap-2 overflow-x-auto scrollbar-hide pb-1"
      role="radiogroup"
      aria-label="시간 윈도우"
    >
      {options.map((opt) => (
        <Link
          key={opt.label}
          href={opt.href}
          role="radio"
          aria-checked={opt.isActive ? "true" : "false"}
          prefetch={false}
          className={`${baseChip} ${opt.isActive ? active : inactive}`}
        >
          {opt.label}
        </Link>
      ))}
    </div>
  );
}
