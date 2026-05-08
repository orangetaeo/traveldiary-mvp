/**
 * Admin 감사 로그 뷰어 — 전체 AuditLog 타임라인.
 *
 * 기능:
 *   - 시간 윈도우 필터 (전체 / 7일 / 30일)
 *   - action prefix 필터 (trip / itinerary / cost / auth 등)
 *   - 페이지네이션 (50건 단위)
 *   - 각 로그: action · resource · actor · timestamp · JSON delta
 *
 * ADMIN_SECRET_KEY 접근 가드.
 */

import Link from "next/link";
import { listAuditLogs } from "@/lib/repositories/audit-log.repository";
import { isDbConnected } from "@/lib/prisma";
import { parseWindow } from "@/lib/admin/window-filter";
import { TimeWindowFilter } from "@/components/admin/TimeWindowFilter";
import { assertAdminAccess } from "@/lib/auth/admin-guard";

export const dynamic = "force-dynamic";

// action prefix → 표시 레이블
const ACTION_FILTERS: Array<{ prefix: string; label: string }> = [
  { prefix: "", label: "전체" },
  { prefix: "trip", label: "Trip" },
  { prefix: "itinerary", label: "Itinerary" },
  { prefix: "cost", label: "Cost" },
  { prefix: "checklist", label: "Checklist" },
  { prefix: "share", label: "Share" },
  { prefix: "comment", label: "Comment" },
  { prefix: "auth", label: "Auth" },
  { prefix: "affiliate", label: "Affiliate" },
  { prefix: "replan", label: "Replan" },
  { prefix: "funnel", label: "Funnel" },
];

// action → dot 색상
const ACTION_DOT_COLOR: Record<string, string> = {
  trip: "bg-purple",
  itinerary: "bg-accent",
  cost: "bg-amber-deep",
  checklist: "bg-success",
  share: "bg-purple/70",
  comment: "bg-ink-mute",
  auth: "bg-danger",
  affiliate: "bg-accent-deep",
  replan: "bg-purple-deep",
  funnel: "bg-amber",
};

function getDotColor(action: string): string {
  const prefix = action.split(".")[0];
  return ACTION_DOT_COLOR[prefix] ?? "bg-ink-mute";
}

const PAGE_SIZE = 50;

interface PageProps {
  searchParams: {
    key?: string;
    window?: string;
    action?: string;
    page?: string;
  };
}

export default async function AdminLogsPage({ searchParams }: PageProps) {
  assertAdminAccess(searchParams);
  const windowDays = parseWindow(searchParams.window);
  const actionPrefix = searchParams.action ?? "";
  const page = Math.max(1, Number.parseInt(searchParams.page ?? "1", 10) || 1);
  const keyParam = searchParams.key ? `key=${searchParams.key}` : "";

  if (!isDbConnected) {
    return (
      <div className="min-h-screen bg-surface-soft text-ink">
        <LogsHeader keyParam={keyParam} />
        <main className="max-w-4xl mx-auto px-td-md py-td-lg">
          <div className="bg-amber-soft border border-amber/40 rounded-md p-td-md text-center">
            <p className="text-td-body text-amber-deep">
              DB 미연결 — 감사 로그 조회 불가
            </p>
          </div>
        </main>
      </div>
    );
  }

  const result = await listAuditLogs({
    actionPrefix: actionPrefix || undefined,
    windowDays,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  const totalPages = result ? Math.max(1, Math.ceil(result.total / PAGE_SIZE)) : 1;

  // 쿼리 파라미터 빌더
  function buildHref(params: Record<string, string | number | undefined>) {
    const parts = [keyParam];
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== "") parts.push(`${k}=${v}`);
    }
    return `/admin/logs?${parts.filter(Boolean).join("&")}`;
  }

  return (
    <div className="min-h-screen bg-surface-soft text-ink pb-24">
      <LogsHeader keyParam={keyParam} />

      <main className="max-w-4xl mx-auto px-td-md space-y-td-lg py-td-lg">
        {/* Hero */}
        <section className="space-y-td-xxs">
          <h2 className="text-td-title text-ink">감사 로그</h2>
          <p className="text-td-body text-ink-soft">
            모든 변경 API 호출 기록 — {result?.total.toLocaleString() ?? 0}건
          </p>
        </section>

        {/* Time Window Filter */}
        <div className="sticky top-16 z-30 bg-surface-soft/80 backdrop-blur-sm py-td-xs border-b border-divider/30">
          <TimeWindowFilter
            current={windowDays}
            basePath="/admin/logs"
          />
        </div>

        {/* Action Prefix Filter */}
        <div
          className="flex gap-2 overflow-x-auto hide-scrollbar pb-1"
          role="radiogroup"
          aria-label="액션 필터"
        >
          {ACTION_FILTERS.map((f) => {
            const isActive = actionPrefix === f.prefix;
            return (
              <Link
                key={f.prefix}
                href={buildHref({
                  action: f.prefix || undefined,
                  window: windowDays,
                  page: undefined,
                })}
                role="radio"
                aria-checked={isActive ? "true" : "false"}
                prefetch={false}
                className={`shrink-0 px-3 py-1.5 rounded-full text-td-meta font-semibold border transition-colors flex items-center ${
                  isActive
                    ? "bg-ink text-white border-ink"
                    : "bg-surface-card border-divider text-ink-soft hover:text-ink hover:border-ink-mute"
                }`}
              >
                {f.label}
              </Link>
            );
          })}
        </div>

        {/* Log List */}
        {!result ? (
          <div className="py-td-lg text-center text-td-body text-ink-soft">
            데이터 로드 실패
          </div>
        ) : result.rows.length === 0 ? (
          <div className="py-td-lg text-center text-td-body text-ink-soft">
            조회 결과 없음
          </div>
        ) : (
          <section className="bg-surface-card border border-divider rounded-md divide-y divide-divider">
            {result.rows.map((log) => (
              <div
                key={log.id}
                className="p-td-sm flex items-start gap-td-sm"
              >
                <div
                  className={`mt-1.5 w-2 h-2 rounded-full ${getDotColor(log.action)} shrink-0`}
                />
                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-td-meta font-bold text-ink">
                      {log.action}
                    </span>
                    <span className="text-td-meta text-ink-soft tabular-nums">
                      {formatTime(log.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-td-sm text-td-meta text-ink-soft">
                    <span className="flex items-center gap-td-xxs truncate">
                      <span
                        className="material-symbols-outlined text-td-icon-sm"
                        aria-hidden
                      >
                        database
                      </span>
                      {log.resource}:{truncateId(log.resourceId)}
                    </span>
                    {log.actorId && (
                      <span className="flex items-center gap-td-xxs truncate">
                        <span
                          className="material-symbols-outlined text-td-icon-sm"
                          aria-hidden
                        >
                          alternate_email
                        </span>
                        {truncateId(log.actorId)}
                      </span>
                    )}
                  </div>
                  {/* JSON delta (after만 표시, 콤팩트) */}
                  {log.after != null ? (
                    <div className="mt-1 p-1 bg-surface-soft rounded border border-divider font-mono text-td-badge text-ink-soft truncate">
                      {formatJson(log.after)}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Pagination */}
        {result && totalPages > 1 && (
          <nav
            className="flex items-center justify-center gap-td-sm"
            aria-label="페이지 탐색"
          >
            {page > 1 && (
              <Link
                href={buildHref({
                  action: actionPrefix || undefined,
                  window: windowDays,
                  page: page - 1,
                })}
                prefetch={false}
                className="px-3 py-1.5 rounded-md border border-divider bg-surface-card text-td-meta font-semibold text-ink hover:bg-surface-soft transition-colors"
              >
                이전
              </Link>
            )}
            <span className="text-td-meta text-ink-soft tabular-nums">
              {page} / {totalPages}
            </span>
            {page < totalPages && (
              <Link
                href={buildHref({
                  action: actionPrefix || undefined,
                  window: windowDays,
                  page: page + 1,
                })}
                prefetch={false}
                className="px-3 py-1.5 rounded-md border border-divider bg-surface-card text-td-meta font-semibold text-ink hover:bg-surface-soft transition-colors"
              >
                다음
              </Link>
            )}
          </nav>
        )}

        {/* Footer */}
        <footer className="pt-td-lg border-t border-divider text-center">
          <span className="text-td-caption text-ink-mute">
            로그는 writeAuditLog() 호출 시 자동 기록됩니다
          </span>
        </footer>
      </main>
    </div>
  );
}

// ── 헬퍼 ──────────────────────────────────────

function LogsHeader({ keyParam }: { keyParam: string }) {
  return (
    <header className="sticky top-0 z-40 bg-surface-card/90 backdrop-blur-md border-b border-divider flex items-center justify-between px-td-md h-14">
      <div className="flex items-center gap-td-sm">
        <Link
          href={`/admin${keyParam ? `?${keyParam}` : ""}`}
          className="p-2 rounded-full hover:bg-surface-soft transition-colors"
          aria-label="Admin 대시보드로 돌아가기"
        >
          <span className="material-symbols-outlined text-ink">arrow_back</span>
        </Link>
        <h1 className="text-lg font-bold tracking-tight text-ink">감사 로그</h1>
        <span className="px-2 py-0.5 bg-surface-soft text-ink-soft text-td-badge font-bold rounded uppercase">
          Admin
        </span>
      </div>
    </header>
  );
}

function formatTime(date: Date): string {
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const mins = String(d.getMinutes()).padStart(2, "0");
  return `${month}/${day} ${hours}:${mins}`;
}

function truncateId(id: string): string {
  if (id.length <= 12) return id;
  return `${id.slice(0, 8)}…`;
}

function formatJson(value: unknown): string {
  if (value === null || value === undefined) return "";
  try {
    const str = JSON.stringify(value);
    return str.length > 120 ? `${str.slice(0, 120)}…` : str;
  } catch {
    return String(value);
  }
}
