/**
 * Admin 대시보드 메인 — Phase 7 Stitch 디자인 적용.
 *
 * Stitch 시안: #23 Admin Main Dashboard (f11edd83c0534c1fb0a29cac262ea2d0)
 * 레이아웃: sticky header + KPI 2×2 + 빠른 도구 2×3 + 라이브 피드.
 * ADMIN_SECRET_KEY 접근 가드 유지.
 */

import Link from "next/link";
import { assertAdminAccess } from "@/lib/auth/admin-guard";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: { key?: string };
}

// --- KPI 데모 데이터 (추후 실 API 연동) ---
const KPI_DATA = [
  {
    label: "New Trips",
    icon: "rocket_launch",
    iconColor: "text-purple",
    value: "32",
    delta: "+8 vs yesterday",
    deltaColor: "text-purple font-bold",
  },
  {
    label: "AI Calls (Anthropic)",
    icon: "smart_toy",
    iconColor: "text-amber-deep",
    value: "847",
    sub: "$11.20 / cap $30",
    progress: 37,
  },
  {
    label: "Active OAuth Users",
    icon: "person_check",
    iconColor: "text-purple",
    value: "186",
    delta: "+12",
    deltaColor: "text-purple font-bold",
  },
  {
    label: "Error Rate",
    icon: "bolt",
    iconColor: "text-danger",
    value: "0.4%",
    badge: { text: "Normal", color: "bg-success-soft text-success-deep" },
  },
] as const;

// --- 빠른 도구 ---
const QUICK_LINKS = [
  {
    href: "/admin/funnel",
    icon: "filter_alt",
    iconBg: "bg-purple-soft",
    iconColor: "text-purple",
    title: "Funnels",
    description: "사용자 전환 경로",
  },
  {
    href: "/admin/affiliate",
    icon: "handshake",
    iconBg: "bg-amber-soft",
    iconColor: "text-amber-deep",
    title: "Affiliates",
    description: "제휴사 관리 및 수익",
  },
  {
    href: "/admin/m2-skip-reasons",
    icon: "quiz",
    iconBg: "bg-accent-soft",
    iconColor: "text-accent-deep",
    title: "M2 Skip Reasons",
    description: "온보딩 이탈 분석",
  },
  {
    href: "/admin/invite",
    icon: "vignette",
    iconBg: "bg-surface-soft",
    iconColor: "text-ink-soft",
    title: "Invite Codes",
    description: "초대 코드 생성/조회",
  },
  {
    href: "/admin/ab",
    icon: "splitscreen",
    iconBg: "bg-surface-soft",
    iconColor: "text-purple",
    title: "A/B Testing",
    description: "진행 중인 실험 관리",
  },
  // 사이클 U-admin-demo (2026-05-07) — /api/health 라우트 활성 (이전 href="#" 데드 링크)
  {
    href: "/api/health",
    icon: "health_and_safety",
    iconBg: "bg-danger-soft",
    iconColor: "text-danger",
    title: "Health Check",
    description: "서버·DB·외부 의존성 JSON",
  },
] as const;

// --- 라이브 피드 데모 데이터 ---
const LIVE_EVENTS = [
  {
    type: "trip.create",
    dotColor: "bg-purple",
    user: "usr_9b2e... (Seoul, KR)",
    time: "2분 전",
  },
  {
    type: "ota.click",
    dotColor: "bg-accent",
    user: "usr_4f1a... (Tokyo, JP)",
    time: "4분 전",
    detail: 'provider: "booking.com", hotel_id: "77218"',
  },
  {
    type: "share.lookup",
    dotColor: "bg-ink-mute",
    user: "guest_ff32... (Anonymous)",
    time: "11분 전",
  },
] as const;

export default function AdminIndexPage({ searchParams }: PageProps) {
  assertAdminAccess(searchParams);
  const keyParam = searchParams.key ? `?key=${searchParams.key}` : "";

  return (
    <div className="min-h-screen bg-surface-soft text-ink">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-surface-card/90 backdrop-blur-md border-b border-divider flex items-center justify-between px-4 h-16 shadow-sm">
        <div className="flex items-center gap-td-sm">
          <span className="material-symbols-outlined text-purple text-2xl">
            travel_explore
          </span>
          <h1 className="text-xl font-bold tracking-tight">관리자</h1>
          <span className="px-2 py-0.5 bg-accent text-white text-td-caption rounded-full font-medium">
            Admin
          </span>
        </div>
        <div className="flex items-center gap-td-xs">
          <span className="text-td-meta text-ink-soft">v0.1.0 · production</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-td-md py-td-lg space-y-td-lg pb-24">
        {/* Hero */}
        <section className="space-y-td-xxs">
          <h2 className="text-td-title text-ink">운영 한눈에</h2>
          <p className="text-td-body text-ink-soft">핵심 지표 + 빠른 진입</p>
        </section>

        {/* 사이클 U-admin-demo (2026-05-07) — 데모 데이터 마커 배너.
            KPI / 라이브 피드는 정적 데모 값. 실 API 연동은 R1 사인오프 +
            ADR-046 audit log 집계 정책 확정 후 활성. */}
        <section
          role="note"
          aria-live="polite"
          aria-labelledby="admin-demo-banner-heading"
          className="bg-amber-soft border border-amber/30 rounded-md p-td-sm flex items-start gap-td-xs"
        >
          <span
            className="material-symbols-outlined text-amber-deep text-lg shrink-0 mt-0.5"
            aria-hidden
          >
            info
          </span>
          <div>
            <p
              id="admin-demo-banner-heading"
              className="text-td-body font-bold text-amber-deep mb-td-xxs"
            >
              데모 데이터 — 실 API 연동 대기 중
            </p>
            <p className="text-td-caption text-amber-deep/85">
              아래 KPI(New Trips / AI Calls / Active OAuth Users / Error Rate)와
              라이브 이벤트 피드는 디자인 시안의 정적 데모 값입니다. 실 운영
              지표는 R1 사인오프 + ADR-046 audit log 집계 정책 확정 후 활성
              됩니다. Health Check만 실 라우트로 동작합니다.
            </p>
          </div>
        </section>

        {/* KPI Grid */}
        <section className="grid grid-cols-2 gap-td-sm">
          {KPI_DATA.map((kpi) => (
            <div
              key={kpi.label}
              className="p-td-md bg-surface-card border border-divider rounded-md shadow-sm space-y-td-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-td-meta text-ink-soft">{kpi.label}</span>
                <span className={`material-symbols-outlined ${kpi.iconColor}`}>
                  {kpi.icon}
                </span>
              </div>
              <div className="flex items-baseline gap-td-xxs">
                <span className="text-3xl font-bold text-ink">{kpi.value}</span>
                {"delta" in kpi && (
                  <span className={`text-td-meta ${kpi.deltaColor}`}>
                    {kpi.delta}
                  </span>
                )}
                {"sub" in kpi && (
                  <span className="text-td-meta text-ink-soft">{kpi.sub}</span>
                )}
                {"badge" in kpi && (
                  <div className={`flex items-center gap-1 px-2 py-0.5 ${kpi.badge.color} rounded-full text-td-caption`}>
                    <div className="w-1.5 h-1.5 rounded-full bg-success" />
                    <span>{kpi.badge.text}</span>
                  </div>
                )}
              </div>
              {"progress" in kpi && (
                <div className="w-full h-1 bg-surface-soft rounded-full overflow-hidden">
                  <div
                    className="bg-amber-deep h-full rounded-full"
                    style={{ width: `${kpi.progress}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </section>

        {/* Quick Links */}
        <section className="space-y-td-sm">
          <h3 className="text-td-card-title text-ink">빠른 도구</h3>
          <div className="grid grid-cols-2 gap-td-sm">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.href + link.title}
                href={link.href.startsWith("/admin") ? `${link.href}${keyParam}` : link.href}
                className="flex items-center gap-td-sm p-td-sm border border-divider bg-surface-card hover:bg-surface-soft transition-colors rounded-md text-left group"
              >
                <div className={`w-10 h-10 flex items-center justify-center ${link.iconBg} rounded-md shrink-0`}>
                  <span className={`material-symbols-outlined ${link.iconColor}`}>
                    {link.icon}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="text-td-body font-bold text-ink">{link.title}</div>
                  <div className="text-td-caption text-ink-soft">{link.description}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Live Feed */}
        <section className="space-y-td-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-td-card-title text-ink">라이브 이벤트 피드</h3>
            <span className="px-2 py-0.5 bg-purple/10 text-purple text-td-caption rounded font-bold uppercase tracking-widest">
              Live
            </span>
          </div>
          <div className="bg-surface-card border border-divider rounded-md divide-y divide-divider">
            {LIVE_EVENTS.map((event) => (
              <div key={event.type + event.time} className="p-td-sm flex items-start gap-td-sm">
                <div className={`mt-1.5 w-2 h-2 rounded-full ${event.dotColor} shrink-0`} />
                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-td-meta font-bold text-ink">
                      {event.type}
                    </span>
                    <span className="text-td-meta text-ink-soft">{event.time}</span>
                  </div>
                  <div className="text-td-meta text-ink-soft flex items-center gap-td-xxs truncate">
                    <span className="material-symbols-outlined text-[14px]">
                      alternate_email
                    </span>
                    {event.user}
                  </div>
                  {"detail" in event && (
                    <div className="mt-1 p-1 bg-surface-soft rounded border border-divider font-mono text-[10px] text-ink-soft truncate">
                      {event.detail}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button className="w-full py-td-sm text-td-meta font-bold text-purple hover:bg-purple-soft/30 transition-colors rounded-md flex items-center justify-center gap-td-xxs">
            모든 로그 보기
            <span className="material-symbols-outlined text-lg">chevron_right</span>
          </button>
        </section>
      </main>
    </div>
  );
}
