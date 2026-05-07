/**
 * 계정 삭제 안내 페이지 — 사이클 8 (G3, ADR-049).
 *
 * DELETE /api/auth/account 성공 후 redirect 도착지.
 * 정적 페이지 — server component (R1 결정 D2: grace 미도입, 즉시 익명화).
 */

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "계정이 삭제되었습니다 — TRAVELDIARY",
  description: "TravelDiary 계정 삭제 처리 완료 안내.",
};

export default function AccountDeletedPage() {
  return (
    <div className="min-h-screen bg-surface-soft text-ink flex flex-col">
      <main className="flex-1 max-w-md w-full mx-auto px-td-md py-td-xl flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 rounded-full bg-purple-soft flex items-center justify-center mb-td-md">
          <span
            className="material-symbols-outlined text-purple-deep text-4xl"
            aria-hidden
          >
            check_circle
          </span>
        </div>

        <h1 className="text-td-title text-ink mb-td-sm">
          계정이 삭제되었습니다
        </h1>

        <p className="text-td-body text-ink-soft mb-td-md leading-relaxed">
          이름·이메일·카카오 연결이 즉시 익명 처리되었어요.
          <br />
          내가 만든 trip은 익명화되어 동행자에게 그대로 보입니다.
        </p>

        <div className="w-full bg-surface-card rounded-md border border-divider p-td-sm mb-td-lg text-left">
          <h2 className="text-td-meta font-bold text-ink-soft uppercase tracking-wider mb-td-xs">
            그 다음에는
          </h2>
          <ul className="space-y-td-xs">
            <li className="flex items-start gap-td-xs text-td-body text-ink">
              <span className="material-symbols-outlined text-ink-soft text-lg mt-0.5">
                refresh
              </span>
              <span>
                다시 시작하고 싶으면 언제든 새 계정으로 가입할 수 있어요.
              </span>
            </li>
            <li className="flex items-start gap-td-xs text-td-body text-ink">
              <span className="material-symbols-outlined text-ink-soft text-lg mt-0.5">
                support_agent
              </span>
              <span>
                실수로 삭제하셨나요? 운영팀 문의로 복구 가능 여부를 안내해드릴 수 있어요.
              </span>
            </li>
          </ul>
        </div>

        <div className="w-full flex flex-col gap-td-xs">
          <Link
            href="/"
            className="w-full py-td-sm rounded-md bg-ink text-white text-td-body font-bold hover:opacity-90 transition-opacity"
          >
            홈으로
          </Link>
          <Link
            href="/legal/privacy"
            className="text-td-meta text-ink-soft hover:underline"
          >
            개인정보 처리방침 보기
          </Link>
        </div>
      </main>
    </div>
  );
}
