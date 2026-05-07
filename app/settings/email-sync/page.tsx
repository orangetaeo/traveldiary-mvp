/**
 * 이메일 동기화 placeholder 페이지 — U4 디자인 갭 #1 (2026-05-07).
 *
 * 정식 동기화는 (1) 4-OAuth 콘솔 등록 (Google/Apple/Naver/Kakao —
 * project_4oauth_requirement_2026_05_06), (2) IMAP/Gmail API 클라이언트
 * 1회 파싱 후 즉시 폐기 (메일 본문 미저장), (3) 추출 일정 메타만 영속화 —
 * 모두 R1 사인오프 + 외부 API 표준 + 별 ADR 필요. 본 사이클은 라우트 활성화만.
 *
 * server component (정적 마크업).
 */

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "이메일 동기화 — TRAVELDIARY",
  description: "예약/항공권 이메일을 일정에 자동 추가 (정식 출시 시점 활성).",
};

const PROVIDERS: Array<{ icon: string; label: string; oauth: string }> = [
  { icon: "✉️", label: "Gmail", oauth: "Google OAuth" },
  { icon: "🟢", label: "네이버 메일", oauth: "Naver OAuth" },
  { icon: "💬", label: "다음 메일", oauth: "Kakao OAuth" },
];

export default function SettingsEmailSyncPage() {
  return (
    <div className="min-h-screen bg-surface-soft text-ink pb-24">
      <header className="sticky top-0 z-40 bg-surface-card/90 backdrop-blur-md border-b border-divider flex items-center px-4 h-14">
        <Link
          href="/settings"
          aria-label="설정으로 돌아가기"
          className="p-2 rounded-full hover:bg-surface-soft transition-colors"
        >
          <span className="material-symbols-outlined text-ink">arrow_back</span>
        </Link>
        <h1 className="text-lg font-bold tracking-tight text-ink ml-td-xs">
          이메일 동기화
        </h1>
      </header>

      <main className="max-w-md mx-auto px-td-md py-td-lg">
        <section
          aria-labelledby="email-sync-hero-heading"
          className="bg-purple-soft rounded-md p-td-md mb-td-md flex items-start gap-td-sm"
        >
          <span className="text-4xl shrink-0" aria-hidden>
            ✉️
          </span>
          <div className="flex-1">
            <h2
              id="email-sync-hero-heading"
              className="text-td-title text-purple-deep mb-td-xxs"
            >
              예약 메일을 일정에 자동 추가
            </h2>
            <p className="text-td-body text-purple-deep/85">
              항공권·호텔·투어 예약 메일을 인식해서 일정 카드로 변환합니다.
            </p>
          </div>
        </section>

        <section
          aria-labelledby="email-providers-heading"
          className="bg-surface-card rounded-md border border-divider p-td-md mb-td-md"
        >
          <h3
            id="email-providers-heading"
            className="text-td-meta text-ink-soft font-bold uppercase tracking-wider mb-td-xs"
          >
            연동 가능 메일
          </h3>
          <ul className="space-y-td-sm">
            {PROVIDERS.map((p) => (
              <li
                key={p.label}
                className="flex items-center justify-between border-b border-divider last:border-b-0 pb-td-xs last:pb-0"
              >
                <div className="flex items-center gap-td-sm flex-1 min-w-0">
                  <span className="text-2xl shrink-0" aria-hidden>
                    {p.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="text-td-body font-bold text-ink truncate">
                      {p.label}
                    </p>
                    <p className="text-td-caption text-ink-soft truncate">
                      {p.oauth}
                    </p>
                  </div>
                </div>
                <span
                  aria-label={`${p.label} 동기화 — 준비 중`}
                  className="text-td-caption text-ink-mute bg-surface-soft px-td-xs py-0.5 rounded-full shrink-0 ml-td-xs"
                >
                  준비 중
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section
          role="note"
          aria-live="polite"
          className="bg-amber-soft border border-amber/30 rounded-md p-td-sm mb-td-md"
        >
          <div className="flex items-start gap-td-xs">
            <span
              className="material-symbols-outlined text-amber-deep text-lg shrink-0 mt-0.5"
              aria-hidden
            >
              shield
            </span>
            <div>
              <p className="text-td-body font-bold text-amber-deep mb-td-xxs">
                개인정보 처리 원칙
              </p>
              <p className="text-td-caption text-amber-deep/85">
                메일 본문은 1회 파싱 후 즉시 폐기됩니다. 추출된 일정 메타
                (날짜·항공편·호텔명)만 저장하며, 원본은 보관하지 않습니다.
                정식 출시 = 4-OAuth 콘솔 등록 + R1 보안 사인오프 + ADR 통과 후.
              </p>
            </div>
          </div>
        </section>

        <Link
          href="/trips"
          className="block w-full rounded-md bg-purple text-surface-card font-bold py-td-sm text-center hover:bg-purple-deep transition-colors"
        >
          일정 직접 추가하기
        </Link>

        <Link
          href="/settings"
          className="mt-td-md block text-td-meta text-ink-soft hover:underline text-center"
        >
          ← 설정으로
        </Link>
      </main>
    </div>
  );
}
