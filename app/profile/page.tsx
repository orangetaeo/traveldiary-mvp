/**
 * Profile 페이지 — PRD BLOCKER 2 (Phase 1 skeleton).
 *
 * 기본 정보: 닉네임, clientUuid, 인증 상태.
 * 카카오 OAuth 연동 자리 마련 (LoginButton).
 * 내 여행 수 + 받은 공유 수는 클라이언트 컴포넌트(ProfileStats)에서 표시.
 *
 * BLOCKER 6 (actorId 격리) 완료 후 실 사용자 데이터로 전환 예정.
 */

import Link from "next/link";
import { getCurrentUserId } from "@/lib/auth/session";
import { kakaoAvailable } from "@/lib/auth/kakao";
import { jwtAvailable } from "@/lib/auth/jwt";
import { LoginButton } from "@/components/auth/LoginButton";
import { BottomNav } from "@/components/ui/BottomNav";
import { ProfileStats } from "@/components/profile/ProfileStats";
import { prisma, isDbConnected } from "@/lib/prisma";

export default async function ProfilePage() {
  const oauthAvailable = kakaoAvailable() && jwtAvailable();
  const currentUserId = oauthAvailable ? await getCurrentUserId() : null;

  // 인증 사용자 정보 (Kakao OAuth 후)
  let userName: string | null = null;
  let userEmail: string | null = null;
  let tripCount = 0;

  if (currentUserId && isDbConnected && prisma) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: currentUserId },
        select: { name: true, email: true },
      });
      userName = user?.name ?? null;
      userEmail = user?.email ?? null;

      tripCount = await prisma.trip.count({
        where: { ownerId: currentUserId },
      });
    } catch {
      // DB 오류 시 graceful fallback
    }
  }

  return (
    <div className="min-h-screen bg-surface text-ink pb-24">
      {/* TopAppBar */}
      <header className="bg-surface-card/90 backdrop-blur-md border-b border-divider sticky top-0 z-40 flex justify-between items-center w-full px-4 h-16">
        <Link
          href="/"
          aria-label="홈"
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-soft transition-colors"
        >
          <span className="material-symbols-outlined text-ink">home</span>
        </Link>
        <h1 className="text-td-title font-black text-ink">내 프로필</h1>
        <Link
          href="/settings"
          aria-label="설정"
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-soft transition-colors"
        >
          <span className="material-symbols-outlined text-ink-mute">settings</span>
        </Link>
      </header>

      <main className="max-w-md mx-auto px-4 pt-6 pb-8">
        {/* 계정 섹션 */}
        <section className="mb-6">
          <h2 className="text-td-title mb-3">계정</h2>

          {currentUserId ? (
            <div className="bg-surface-card border border-divider rounded-md p-4 flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-purple-soft border-2 border-purple/30 flex items-center justify-center shrink-0">
                {userName ? (
                  <span className="text-xl font-bold text-purple">{userName.charAt(0)}</span>
                ) : (
                  <span className="material-symbols-outlined text-purple text-[28px]">person</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-td-card-title font-medium text-ink truncate">
                  {userName ?? "미설정"}
                </p>
                <p className="text-td-meta text-ink-mute truncate">
                  {userEmail ?? "이메일 미설정"}
                </p>
              </div>
              <span className="material-symbols-outlined text-ink-mute">chevron_right</span>
            </div>
          ) : (
            <div className="bg-purple/5 border border-purple/20 rounded-md p-4">
              <p className="text-td-body text-ink-soft mb-3 leading-relaxed text-center">
                카카오 로그인으로 내 여행을 안전하게 관리하세요
              </p>
              <LoginButton
                currentUserId={currentUserId}
                currentUserName={userName}
                oauthAvailable={oauthAvailable}
              />
            </div>
          )}
        </section>

        {/* 통계 */}
        <section className="mb-6">
          <h2 className="text-td-title mb-3">통계</h2>
          <ProfileStats
            tripCount={tripCount}
            isAuthenticated={!!currentUserId}
          />
        </section>

        {/* 바로가기 */}
        <section className="mb-6">
          <h2 className="text-td-title mb-3">바로가기</h2>
          <div className="grid grid-cols-2 gap-3">
            <QuickLink href="/trips" icon="map" label="내 여행" />
            <QuickLink href="/shared" icon="ios_share" label="받은 여행" />
            <QuickLink href="/translate" icon="translate" label="카메라 번역" />
            <QuickLink href="/onboarding" icon="add_circle" label="새 여행 계획" highlight />
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-6 text-center">
          <p className="text-td-caption text-ink-mute mb-0.5">v0.1.0 (MVP)</p>
          <p className="text-td-caption text-ink-mute">베트남 자유여행 AI 동반자 TravelDiary</p>
        </footer>
      </main>

      <BottomNav active="profile" />
    </div>
  );
}


function QuickLink({
  href,
  icon,
  label,
  highlight,
}: {
  href: string;
  icon: string;
  label: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`bg-surface-card border rounded-md p-4 text-left hover:bg-surface-soft transition-colors shadow-[0_4px_12px_rgba(15,23,42,0.05)] ${
        highlight ? "border-2 border-purple" : "border-divider"
      }`}
    >
      <span
        className="material-symbols-outlined text-purple mb-3 block text-td-icon-xl"
        aria-hidden
      >
        {icon}
      </span>
      <span className={`text-td-body ${highlight ? "text-purple font-bold" : "text-ink font-medium"}`}>
        {label}
      </span>
    </Link>
  );
}
