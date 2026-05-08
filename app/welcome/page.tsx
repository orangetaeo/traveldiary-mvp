/**
 * 카카오 로그인 환영 — Stitch screen e8139bbb
 *
 * /welcome — 로그인 직후 (특히 신규 사용자) 환영 + 기능 안내.
 * 미인증 시 /login 으로 redirect.
 */

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUserId } from "@/lib/auth/session";
import { kakaoAvailable } from "@/lib/auth/kakao";
import { jwtAvailable } from "@/lib/auth/jwt";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "환영합니다!",
  description: "TravelDiary에 오신 것을 환영합니다.",
};

export default async function WelcomePage() {
  const oauthReady = kakaoAvailable() && jwtAvailable();
  const userId = oauthReady ? await getCurrentUserId() : null;
  if (!userId) redirect("/login");

  const user = prisma
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true, createdAt: true },
      })
    : null;

  const displayName = user?.name ?? "여행자";

  return (
    <div className="min-h-screen bg-surface-soft flex flex-col">
      <main className="flex-grow flex flex-col items-center justify-center px-td-md">
        <div className="w-full max-w-sm flex flex-col items-center text-center">
          {/* 환영 아이콘 */}
          <div className="w-20 h-20 rounded-full bg-purple-soft flex items-center justify-center mb-td-lg">
            <span className="material-symbols-outlined text-purple text-[40px]">
              celebration
            </span>
          </div>

          <h1 className="text-td-title text-ink font-bold mb-td-xxs">
            환영합니다, {displayName}님!
          </h1>
          <p className="text-td-body text-ink-soft mb-td-xl">
            카카오 계정으로 로그인되었습니다.
            <br />
            이제 모든 기능을 이용할 수 있어요.
          </p>

          {/* 잠금 해제된 기능 카드 */}
          <div className="w-full space-y-td-sm mb-td-xl">
            <FeatureCard
              icon="sync"
              iconColor="text-purple"
              title="기기 간 자동 동기화"
              description="PC에서 만든 일정을 폰으로 바로"
            />
            <FeatureCard
              icon="share"
              iconColor="text-accent"
              title="카카오톡 1-탭 공유"
              description="친구에게 여행 일정 바로 보내기"
            />
            <FeatureCard
              icon="how_to_vote"
              iconColor="text-amber"
              title="일행 투표 & 정산"
              description="함께 결정하고 비용도 깔끔하게"
            />
            <FeatureCard
              icon="shield"
              iconColor="text-success"
              title="여행 데이터 안전 보관"
              description="일정·메모·사진 클라우드 백업"
            />
          </div>

          {/* CTA */}
          <div className="w-full space-y-td-sm">
            <Link
              href="/onboarding"
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-lg bg-purple text-white font-semibold text-td-body hover:opacity-90 active:scale-[0.98] transition-all shadow-md"
            >
              <span className="material-symbols-outlined text-td-icon">
                add_circle
              </span>
              새 여행 만들기
            </Link>
            <Link
              href="/"
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-lg border border-divider bg-surface-card text-ink-soft font-medium text-td-body hover:bg-surface-soft active:scale-[0.98] transition-all"
            >
              홈으로 이동
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ── 내부 컴포넌트 ── */

function FeatureCard({
  icon,
  iconColor,
  title,
  description,
}: {
  icon: string;
  iconColor: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-td-sm p-td-sm bg-surface-card border border-divider rounded-md text-left">
      <div className="w-10 h-10 rounded-full bg-surface-soft flex items-center justify-center shrink-0">
        <span className={`material-symbols-outlined ${iconColor} text-td-icon-lg`}>
          {icon}
        </span>
      </div>
      <div className="min-w-0">
        <p className="text-td-meta font-medium text-ink">{title}</p>
        <p className="text-td-caption text-ink-soft">{description}</p>
      </div>
      <span className="material-symbols-outlined text-ink-mute text-td-icon-sm ml-auto shrink-0">
        check_circle
      </span>
    </div>
  );
}
