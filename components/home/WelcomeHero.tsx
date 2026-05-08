/**
 * Mode A Hero — 비로그인 또는 본인 trip 0건 사용자용.
 *
 * 베트남 일몰 그라디언트(splash overlay PR #364 톤 답습) + 가치 제안 + 카카오 CTA.
 * 데모 둘러보기는 보조 CTA — 첫 진입 시 시드 푸꾸옥 일정 미리보기로 유도.
 */

import Link from "next/link";
import { LoginButton } from "@/components/auth/LoginButton";
import { DEMO_TRIP_ID } from "@/lib/seed";

interface WelcomeHeroProps {
  oauthAvailable: boolean;
  currentUserId: string | null;
  currentUserName?: string | null;
}

export function WelcomeHero({
  oauthAvailable,
  currentUserId,
  currentUserName,
}: WelcomeHeroProps) {
  return (
    <section
      className="relative overflow-hidden rounded-lg mx-td-md mt-td-md mb-td-lg bg-gradient-to-br from-purple-deep via-accent to-amber"
      aria-label="환영"
    >
      <div className="px-td-md py-td-xl text-white">
        <p className="text-td-caption text-white/80 tracking-wide uppercase mb-td-xs">
          베트남 자유여행 AI 동반자
        </p>
        <h2 className="text-td-title text-white mb-td-xs leading-tight">
          일정을 짜고,<br />
          살아 움직이게 하고,<br />
          함께 만들어요.
        </h2>
        <p className="text-td-body text-white/90 mb-td-md">
          AI가 추천하고 근거까지 보여줍니다. 베트남 6개 도시 검증 완료.
        </p>

        <div className="flex flex-col gap-td-xs">
          <div className="bg-surface-card rounded-md p-td-xs flex items-center justify-center">
            <LoginButton
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              oauthAvailable={oauthAvailable}
            />
          </div>
          <Link
            href={`/itinerary/${DEMO_TRIP_ID}`}
            className="inline-flex items-center justify-center gap-1.5 px-td-md py-td-sm rounded-md bg-white/10 backdrop-blur-sm text-white border border-white/30 text-td-meta font-semibold hover:bg-white/20 transition-colors"
          >
            <span className="material-symbols-outlined text-td-icon-md" aria-hidden>
              play_circle
            </span>
            데모로 둘러보기
          </Link>
        </div>
      </div>
    </section>
  );
}
