/**
 * Admin 대시보드 인덱스 — 시나리오 C Phase C4.
 *
 * 모든 admin 대시보드 링크 한 곳에 모음.
 * ADMIN_SECRET_KEY 접근 가드.
 */

import Link from "next/link";
import { assertAdminAccess } from "@/lib/auth/admin-guard";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: { key?: string };
}

const DASHBOARDS = [
  {
    href: "/admin/affiliate",
    icon: "payments",
    title: "어필리에이트",
    description: "OTA별 클릭 수·도시별 CTR·인기 오퍼·예상 수수료",
  },
  {
    href: "/admin/funnel",
    icon: "filter_alt",
    title: "온보딩 퍼널",
    description: "Step 1→4 단계별 전환율·이탈 구간",
  },
  {
    href: "/admin/invite",
    icon: "mail",
    title: "초대 코드",
    description: "베타 초대 코드별 사용 횟수·링크 생성",
  },
  {
    href: "/admin/ab",
    icon: "science",
    title: "A/B 실험",
    description: "실험·variant별 노출/전환·우세 variant",
  },
  {
    href: "/admin/m2-skip-reasons",
    icon: "location_off",
    title: "M2 모드 전환 스킵",
    description: "D-Day 모드 전환 스킵 사유·빈도",
  },
] as const;

export default function AdminIndexPage({ searchParams }: PageProps) {
  assertAdminAccess(searchParams);
  const keyParam = searchParams.key ? `?key=${searchParams.key}` : "";

  return (
    <div className="min-h-screen bg-surface-soft text-ink pb-24">
      <header className="bg-gradient-to-br from-purple-deep to-purple text-white px-td-md py-td-lg">
        <div className="max-w-2xl mx-auto">
          <Link
            href="/"
            className="text-white/70 text-td-caption hover:text-white transition-colors"
          >
            ← 홈
          </Link>
          <h1 className="text-2xl font-bold mt-td-sm tracking-tight">
            Admin 대시보드
          </h1>
          <p className="text-white/80 text-td-body mt-td-xs">
            {DASHBOARDS.length}개 대시보드
          </p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-td-md pt-td-lg">
        <div className="space-y-td-sm">
          {DASHBOARDS.map((d) => (
            <Link
              key={d.href}
              href={`${d.href}${keyParam}`}
              className="flex items-start gap-td-md bg-surface-card border border-divider rounded-xl p-td-md hover:border-purple/40 transition-colors"
            >
              <span className="material-symbols-outlined text-purple text-2xl mt-0.5">
                {d.icon}
              </span>
              <div className="flex-1 min-w-0">
                <h2 className="text-td-card-title text-ink font-medium">
                  {d.title}
                </h2>
                <p className="text-td-caption text-ink-soft mt-td-xxs">
                  {d.description}
                </p>
              </div>
              <span className="material-symbols-outlined text-ink-mute text-lg">
                chevron_right
              </span>
            </Link>
          ))}
        </div>

        <p className="text-td-caption text-ink-mute text-center mt-td-xl">
          시나리오 C · Admin Dashboard Hub
        </p>
      </main>
    </div>
  );
}
