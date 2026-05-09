/**
 * 계정 연결 관리 placeholder 페이지 — 옵션 X 디자인 갭 (2026-05-08).
 *
 * /settings 페이지 마지막 데드 `href="#"` (카카오 연결 관리) 청소.
 * 정식 활성은 4-OAuth 콘솔 등록 (Google/Apple/Naver/Kakao —
 * project_4oauth_requirement_2026_05_06) + R1 보안 사인오프 + ADR
 * 통과 후. 본 사이클은 라우트 활성화만.
 *
 * server component (정적 마크업).
 *
 * PlaceholderShell DRY 답습 (PR #265 / PR #287).
 */

import type { Metadata } from "next";
import { PlaceholderShell } from "@/components/common/PlaceholderShell";

export const metadata: Metadata = {
  title: "계정 연결 관리 — TRAVELDIARY",
  description: "Google / Apple / Naver / Kakao 계정 연결 관리 (정식 출시 시점 활성).",
};

const PROVIDERS: Array<{
  icon: string;
  iconColor: string;
  label: string;
  oauth: string;
}> = [
  { icon: "🟡", iconColor: "text-amber-deep", label: "카카오", oauth: "Kakao OAuth" },
  { icon: "🟢", iconColor: "text-success-deep", label: "네이버", oauth: "Naver OAuth" },
  { icon: "🔵", iconColor: "text-purple-deep", label: "Google", oauth: "Google OAuth" },
  { icon: "⚫", iconColor: "text-ink", label: "Apple", oauth: "Apple OAuth" },
];

export default function SettingsAccountLinkPage() {
  return (
    <PlaceholderShell
      title="계정 연결 관리"
      description="여러 소셜 계정을 한 프로필에 연결해 안전하게 로그인하세요."
      iconName="key"
      iconVariant="soft-purple"
      note={{
        title: "준비 중",
        body: "정식 활성 = 4-OAuth 콘솔 등록 (Google + Apple + Naver + Kakao) + R1 보안 사인오프 + ADR 통과 후. 그 전까지는 카카오 단일 로그인만 동작하며, 다른 OAuth는 노출되지 않습니다.",
      }}
    >
      <section
        aria-labelledby="account-providers-heading"
        className="bg-surface-card rounded-md border border-divider p-td-md mb-td-md"
      >
        <h3
          id="account-providers-heading"
          className="text-td-meta text-ink-soft font-bold uppercase tracking-wider mb-td-xs"
        >
          연결 가능 계정
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
                aria-label={`${p.label} 연결 — 준비 중`}
                className="text-td-caption text-ink-mute bg-surface-soft px-td-xs py-0.5 rounded-full shrink-0 ml-td-xs"
              >
                준비 중
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby="account-link-policy-heading"
        className="bg-surface-card rounded-md border border-divider p-td-md mb-td-md"
      >
        <h3
          id="account-link-policy-heading"
          className="text-td-meta text-ink-soft font-bold uppercase tracking-wider mb-td-xs"
        >
          연결 후 가능한 일
        </h3>
        <ul className="space-y-td-xs">
          <li className="flex items-start gap-td-sm">
            <span
              className="material-symbols-outlined text-purple-deep text-td-icon mt-0.5 shrink-0"
              aria-hidden
            >
              check
            </span>
            <p className="text-td-body text-ink flex-1">
              어느 소셜 계정으로 로그인해도 같은 내 여행 데이터.
            </p>
          </li>
          <li className="flex items-start gap-td-sm">
            <span
              className="material-symbols-outlined text-purple-deep text-td-icon mt-0.5 shrink-0"
              aria-hidden
            >
              check
            </span>
            <p className="text-td-body text-ink flex-1">
              한 계정 분실 시 다른 계정으로 안전하게 복구.
            </p>
          </li>
          <li className="flex items-start gap-td-sm">
            <span
              className="material-symbols-outlined text-purple-deep text-td-icon mt-0.5 shrink-0"
              aria-hidden
            >
              check
            </span>
            <p className="text-td-body text-ink flex-1">
              연결 해제 시점에 어느 계정도 데이터 소유권을 잃지 않음.
            </p>
          </li>
        </ul>
      </section>

      <button
        type="button"
        disabled
        aria-disabled="true"
        className="w-full rounded-md bg-ink/30 text-surface-card font-bold py-td-sm cursor-not-allowed"
      >
        계정 연결 (준비 중)
      </button>
    </PlaceholderShell>
  );
}
