/**
 * 설정 페이지 (Phase 7 신규 — /profile에서 분리).
 *
 * Stitch 시안: #31 Settings Page — 설정 (d15ebd366d5e4b068a6ba3c6818357fc)
 * 용도: 계정·알림·위치·데이터·앱 정보 설정 분리 페이지.
 */

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogoutOrchestrator } from "@/components/auth/LogoutOrchestrator";
import { AccountDeleteOrchestrator } from "@/components/auth/AccountDeleteOrchestrator";

// 사이클 8 (G3, ADR-049) — "계정" 섹션은 로그아웃·계정 삭제 액션 항목 포함하므로
// 다른 섹션과 분리하여 별도 JSX로 렌더링. 액션 메뉴는 Link 대신 button onClick 트리거.
const SETTING_SECTIONS = [
  {
    title: "알림",
    items: [
      { icon: "notifications", label: "알림 설정", href: "/permission/notification" },
      { icon: "schedule", label: "리마인더 시간", href: "#", sub: "출발 30분 전" },
    ],
  },
  {
    title: "위치 & 프라이버시",
    items: [
      { icon: "location_on", label: "위치 권한", href: "/permission/location" },
      // 사이클 7 (G10) — 사이드 placeholder 라우트 연결 (이전 href="#" 데드 링크)
      { icon: "shield", label: "개인정보 처리방침", href: "/legal/privacy" },
      { icon: "visibility_off", label: "데이터 수집 동의", href: "/legal/privacy", sub: "위치 서버 미전송" },
    ],
  },
  // 사이클 7 (G10) — 약관 섹션 신규 (기존엔 메뉴 자체 부재)
  {
    title: "법적 고지",
    items: [
      { icon: "gavel", label: "이용약관", href: "/legal/terms" },
      { icon: "privacy_tip", label: "개인정보 처리방침", href: "/legal/privacy" },
    ],
  },
  {
    title: "데이터",
    items: [
      { icon: "download", label: "내 데이터 내보내기", href: "#" },
      { icon: "cached", label: "캐시 삭제", href: "#" },
    ],
  },
  {
    title: "앱 정보",
    items: [
      { icon: "info", label: "버전", href: "#", sub: "v0.1.0 (MVP)" },
      { icon: "description", label: "오픈소스 라이선스", href: "#" },
      { icon: "bug_report", label: "버그 신고", href: "#" },
    ],
  },
] as const;

export default function SettingsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-surface-soft text-ink pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface-card/90 backdrop-blur-md border-b border-divider flex items-center px-4 h-14">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-surface-soft transition-colors"
          aria-label="뒤로"
        >
          <span className="material-symbols-outlined text-ink">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold tracking-tight text-ink ml-td-xs">설정</h1>
      </header>

      <main className="max-w-md mx-auto px-td-md py-td-md space-y-td-lg">
        {/* 사이클 8 (G3, ADR-049) — 계정 섹션: 로그아웃·계정 삭제 액션 + 기존 링크 */}
        <section>
          <h2 className="text-td-meta text-ink-soft font-bold uppercase tracking-wider mb-td-xs px-td-xxs">
            계정
          </h2>
          <div className="bg-surface-card rounded-md border border-divider divide-y divide-divider overflow-hidden">
            <LogoutOrchestrator
              trigger={({ onClick }) => (
                <button
                  type="button"
                  onClick={onClick}
                  className="w-full flex items-center justify-between px-td-sm py-td-xs hover:bg-surface-soft transition-colors text-left"
                >
                  <div className="flex items-center gap-td-sm">
                    <span className="material-symbols-outlined text-xl text-ink-soft">
                      logout
                    </span>
                    <span className="text-td-body text-ink">로그아웃</span>
                  </div>
                  <span className="material-symbols-outlined text-ink-mute text-lg">chevron_right</span>
                </button>
              )}
            />
            <Link
              href="/profile"
              className="flex items-center justify-between px-td-sm py-td-xs hover:bg-surface-soft transition-colors"
            >
              <div className="flex items-center gap-td-sm">
                <span className="material-symbols-outlined text-xl text-ink-soft">person</span>
                <span className="text-td-body text-ink">프로필 편집</span>
              </div>
              <span className="material-symbols-outlined text-ink-mute text-lg">chevron_right</span>
            </Link>
            <Link
              href="#"
              aria-disabled="true"
              className="flex items-center justify-between px-td-sm py-td-xs hover:bg-surface-soft transition-colors"
            >
              <div className="flex items-center gap-td-sm">
                <span className="material-symbols-outlined text-xl text-ink-soft">key</span>
                <span className="text-td-body text-ink">카카오 연결 관리</span>
              </div>
              <div className="flex items-center gap-td-xxs">
                <span className="text-td-caption text-ink-mute">준비 중</span>
                <span className="material-symbols-outlined text-ink-mute text-lg">chevron_right</span>
              </div>
            </Link>
            <AccountDeleteOrchestrator
              trigger={({ onClick }) => (
                <button
                  type="button"
                  onClick={onClick}
                  className="w-full flex items-center justify-between px-td-sm py-td-xs hover:bg-surface-soft transition-colors text-left"
                >
                  <div className="flex items-center gap-td-sm">
                    <span className="material-symbols-outlined text-xl text-danger">delete</span>
                    <span className="text-td-body text-danger">계정 삭제</span>
                  </div>
                  <span className="material-symbols-outlined text-ink-mute text-lg">chevron_right</span>
                </button>
              )}
            />
          </div>
        </section>

        {SETTING_SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="text-td-meta text-ink-soft font-bold uppercase tracking-wider mb-td-xs px-td-xxs">
              {section.title}
            </h2>
            <div className="bg-surface-card rounded-md border border-divider divide-y divide-divider overflow-hidden">
              {section.items.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center justify-between px-td-sm py-td-xs hover:bg-surface-soft transition-colors"
                >
                  <div className="flex items-center gap-td-sm">
                    <span className="material-symbols-outlined text-xl text-ink-soft">
                      {item.icon}
                    </span>
                    <span className="text-td-body text-ink">
                      {item.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-td-xxs">
                    {"sub" in item && (
                      <span className="text-td-caption text-ink-mute">{item.sub}</span>
                    )}
                    <span className="material-symbols-outlined text-ink-mute text-lg">chevron_right</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
