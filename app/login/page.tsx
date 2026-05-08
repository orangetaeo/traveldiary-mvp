/**
 * 로그인 및 회원가입 환영 화면 — Stitch screen ad58e472
 *
 * /login — 미인증 사용자를 위한 전용 랜딩.
 * 카카오 로그인 CTA + 게스트 모드 진입.
 * 이미 로그인된 사용자는 / 로 redirect.
 */

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUserId } from "@/lib/auth/session";
import { kakaoAvailable } from "@/lib/auth/kakao";
import { jwtAvailable } from "@/lib/auth/jwt";
import { AuthErrorBanner } from "@/components/auth/AuthErrorBanner";

export const metadata: Metadata = {
  title: "로그인 — 여행을 더 똑똑하게",
  description: "카카오 로그인으로 AI 여행 동반자를 시작하세요.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { auth_error?: string };
}) {
  const oauthReady = kakaoAvailable() && jwtAvailable();
  const userId = oauthReady ? await getCurrentUserId() : null;
  if (userId) redirect("/");

  return (
    <div className="min-h-screen bg-surface-soft flex flex-col">
      {/* Hero */}
      <main className="flex-grow flex flex-col items-center justify-center px-td-md">
        <div className="w-full max-w-sm flex flex-col items-center text-center">
          {/* 로고 + 브랜드 */}
          <div className="w-16 h-16 rounded-2xl bg-purple flex items-center justify-center mb-td-lg shadow-lg">
            <span className="material-symbols-outlined text-white text-[32px]">
              flight_takeoff
            </span>
          </div>

          <h1 className="text-td-title text-ink font-bold mb-td-xs">
            여행을 더 똑똑하게
          </h1>
          <p className="text-td-body text-ink-soft mb-td-xl leading-relaxed">
            AI가 검증한 일정과 근거를 함께.
            <br />
            베트남 6개 도시, 4,300+ 장소.
          </p>

          {/* OAuth 에러 배너 */}
          {searchParams.auth_error && (
            <div className="w-full mb-td-md">
              <AuthErrorBanner errorCode={searchParams.auth_error} />
            </div>
          )}

          {/* 기능 하이라이트 3개 */}
          <div className="w-full space-y-td-sm mb-td-xl">
            <div className="flex items-center gap-td-sm text-left">
              <span className="material-symbols-outlined text-purple text-td-icon-xl shrink-0">
                verified
              </span>
              <div>
                <p className="text-td-meta font-medium text-ink">5단계 검증된 추천</p>
                <p className="text-td-caption text-ink-soft">Google·Naver 실제 후기 기반</p>
              </div>
            </div>
            <div className="flex items-center gap-td-sm text-left">
              <span className="material-symbols-outlined text-accent text-td-icon-xl shrink-0">
                sync
              </span>
              <div>
                <p className="text-td-meta font-medium text-ink">기기 간 자동 동기화</p>
                <p className="text-td-caption text-ink-soft">어디서든 내 여행 이어가기</p>
              </div>
            </div>
            <div className="flex items-center gap-td-sm text-left">
              <span className="material-symbols-outlined text-amber text-td-icon-xl shrink-0">
                group
              </span>
              <div>
                <p className="text-td-meta font-medium text-ink">일행과 함께 만들기</p>
                <p className="text-td-caption text-ink-soft">공유 링크로 투표·댓글·정산</p>
              </div>
            </div>
          </div>

          {/* 로그인 버튼들 */}
          <div className="w-full space-y-td-sm">
            {oauthReady ? (
              <a
                href="/api/auth/kakao/start"
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-lg bg-kakao text-ink font-semibold text-td-body hover:opacity-90 active:scale-[0.98] transition-all"
              >
                <span className="material-symbols-outlined text-td-icon">
                  chat_bubble
                </span>
                카카오로 시작하기
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-lg bg-kakao/50 text-ink-mute font-semibold text-td-body cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-td-icon">
                  lock
                </span>
                카카오 로그인 (미설정)
              </button>
            )}

            <Link
              href="/"
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-lg border border-divider bg-surface-card text-ink-soft font-medium text-td-body hover:bg-surface-soft active:scale-[0.98] transition-all"
            >
              둘러보기 (로그인 없이)
            </Link>
          </div>
        </div>
      </main>

      {/* 약관 */}
      <footer className="pb-td-lg pt-td-md px-td-md text-center">
        <p className="text-td-caption text-ink-mute">
          로그인 시{" "}
          <Link href="/legal/terms" className="underline underline-offset-2">
            이용약관
          </Link>{" "}
          및{" "}
          <Link href="/legal/privacy" className="underline underline-offset-2">
            개인정보처리방침
          </Link>
          에 동의합니다.
        </p>
      </footer>
    </div>
  );
}
