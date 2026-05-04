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
    <div className="min-h-screen bg-surface-soft text-ink pb-24">
      {/* TopAppBar */}
      <header className="bg-surface-card border-b border-divider sticky top-0 z-40 flex justify-between items-center w-full px-td-md h-16">
        <div className="flex items-center gap-td-sm">
          <Link
            href="/"
            aria-label="홈"
            className="p-2 rounded-full hover:bg-surface-soft transition-colors"
          >
            <span className="material-symbols-outlined text-ink">home</span>
          </Link>
          <h1 className="text-lg font-bold text-ink tracking-tight">내 프로필</h1>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-td-md pt-td-lg space-y-td-lg">
        {/* 인증 상태 카드 */}
        <section className="bg-surface-card border border-divider rounded-xl p-td-md shadow-sm">
          <div className="flex items-center justify-between mb-td-md">
            <h2 className="text-td-card-title text-ink font-bold">계정</h2>
            <LoginButton
              currentUserId={currentUserId}
              currentUserName={userName}
              oauthAvailable={oauthAvailable}
            />
          </div>

          {currentUserId ? (
            <div className="space-y-td-xs">
              <InfoRow label="이름" value={userName ?? "미설정"} />
              {userEmail && <InfoRow label="이메일" value={userEmail} />}
              <InfoRow label="사용자 ID" value={currentUserId.slice(0, 8) + "…"} muted />
            </div>
          ) : (
            <div className="bg-purple-soft rounded-lg p-td-sm">
              <p className="text-td-meta text-purple-deep font-medium mb-td-xxs">
                카카오 로그인으로 내 여행을 안전하게 관리하세요
              </p>
              <p className="text-td-caption text-purple-deep/70">
                로그인하면 기기 간 여행 동기화, 내 여행 분리가 가능해요.
              </p>
            </div>
          )}
        </section>

        {/* 통계 카드 — 클라이언트 컴포넌트 (LocalStorage 접근) */}
        <ProfileStats
          tripCount={tripCount}
          isAuthenticated={!!currentUserId}
        />

        {/* 빠른 링크 */}
        <section className="space-y-td-sm">
          <h2 className="text-td-card-title text-ink font-bold">바로가기</h2>
          <div className="grid grid-cols-2 gap-td-sm">
            <QuickLink href="/trips" icon="explore" label="내 여행" />
            <QuickLink href="/shared" icon="inbox" label="받은 여행" />
            <QuickLink href="/translate" icon="photo_camera" label="카메라 번역" />
            <QuickLink href="/onboarding" icon="add_circle" label="새 여행 계획" />
          </div>
        </section>

        {/* 앱 정보 */}
        <section className="text-center pt-td-md">
          <p className="text-td-caption text-ink-mute">TravelDiary v0.1.0 (MVP)</p>
          <p className="text-td-caption text-ink-mute">베트남 자유여행 AI 동반자</p>
        </section>
      </main>

      <BottomNav active="profile" />
    </div>
  );
}

function InfoRow({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-td-xxs">
      <span className="text-td-meta text-ink-soft">{label}</span>
      <span className={`text-td-meta font-medium ${muted ? "text-ink-mute" : "text-ink"}`}>
        {value}
      </span>
    </div>
  );
}

function QuickLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-td-xs bg-surface-card border border-divider rounded-lg p-td-sm hover:border-purple/40 transition-colors"
    >
      <span className="material-symbols-outlined text-purple text-[20px]" aria-hidden>
        {icon}
      </span>
      <span className="text-td-meta text-ink font-medium">{label}</span>
    </Link>
  );
}
