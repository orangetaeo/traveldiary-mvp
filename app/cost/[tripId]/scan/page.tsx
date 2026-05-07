/**
 * 영수증 스캔 placeholder 페이지 — U4 디자인 갭 #1 (2026-05-07).
 *
 * 정식 OCR은 (1) Vision/Claude Vision API 호출, (2) 통화 자동 감지·환산,
 * (3) 사진 기기 내 처리 (서버 미저장) — 모두 R1 사인오프 + 외부 API 표준
 * (server-only / 캐시 / audit fresh-only) + 별도 ADR 필요. 본 사이클은
 * 라우트 활성화 + 정체성 가시화만.
 *
 * server component (정적 마크업 — renderToStaticMarkup 직접 단언 가능).
 */

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "영수증 스캔 — TRAVELDIARY",
  description: "영수증을 찍으면 통화·금액·항목을 자동 입력 (정식 출시 시점 활성).",
};

const FEATURES: Array<{ icon: string; title: string; desc: string }> = [
  { icon: "🇻🇳", title: "베트남 동(VND) → 원(KRW) 자동 환산", desc: "현지 환율 기준 즉시 변환." },
  { icon: "🍜", title: "메뉴/장소 카테고리 자동 분류", desc: "음식점·기념품·교통비 등 자동 태깅." },
  { icon: "🔒", title: "사진은 기기 안에서만 처리", desc: "원본 영수증 이미지는 서버에 저장하지 않습니다." },
];

export default function CostScanPage({ params }: { params: { tripId: string } }) {
  const tripId = params.tripId;

  return (
    <div className="min-h-screen bg-surface-soft text-ink pb-24">
      <header className="sticky top-0 z-40 bg-surface-card/90 backdrop-blur-md border-b border-divider flex items-center px-4 h-14">
        <Link
          href={`/cost/${tripId}`}
          aria-label="비용 관리로 돌아가기"
          className="p-2 rounded-full hover:bg-surface-soft transition-colors"
        >
          <span className="material-symbols-outlined text-ink">arrow_back</span>
        </Link>
        <h1 className="text-lg font-bold tracking-tight text-ink ml-td-xs">
          영수증 스캔
        </h1>
      </header>

      <main className="max-w-md mx-auto px-td-md py-td-lg">
        <div className="flex flex-col items-center mb-td-md">
          <div
            className="w-48 h-48 rounded-md border-2 border-dashed border-divider bg-surface-card flex items-center justify-center mb-td-sm"
            aria-hidden
          >
            <span className="text-6xl" aria-hidden>
              📸
            </span>
          </div>
          <h2 className="text-td-title text-ink text-center mb-td-xxs">
            영수증을 찍으면 자동 입력
          </h2>
          <p className="text-td-body text-ink-soft text-center">
            통화·금액·항목을 AI가 읽어드려요.
          </p>
        </div>

        <section
          aria-labelledby="receipt-features-heading"
          className="bg-surface-card rounded-md border border-divider p-td-md mb-td-md"
        >
          <h3
            id="receipt-features-heading"
            className="text-td-meta text-ink-soft font-bold uppercase tracking-wider mb-td-xs"
          >
            출시 시 들어갈 기능
          </h3>
          <ul className="space-y-td-sm">
            {FEATURES.map((f, i) => (
              <li
                key={i}
                className="flex items-start gap-td-sm border-b border-divider last:border-b-0 pb-td-xs last:pb-0"
              >
                <span className="text-2xl shrink-0 mt-0.5" aria-hidden>
                  {f.icon}
                </span>
                <div className="flex-1">
                  <p className="text-td-body font-bold text-ink">{f.title}</p>
                  <p className="text-td-caption text-ink-soft">{f.desc}</p>
                </div>
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
              info
            </span>
            <div>
              <p className="text-td-body font-bold text-amber-deep mb-td-xxs">
                준비 중
              </p>
              <p className="text-td-caption text-amber-deep/85">
                현재는 비용 직접 입력만 가능합니다. 영수증 OCR은 외부 Vision API
                연동 + R1 보안 사인오프 + ADR 통과 후 활성됩니다.
              </p>
            </div>
          </div>
        </section>

        <Link
          href={`/cost/${tripId}`}
          className="block w-full rounded-md bg-purple text-surface-card font-bold py-td-sm text-center hover:bg-purple-deep transition-colors"
        >
          비용 직접 입력하기
        </Link>

        <Link
          href={`/cost/${tripId}`}
          className="mt-td-md block text-td-meta text-ink-soft hover:underline text-center"
        >
          ← 비용 관리로
        </Link>
      </main>
    </div>
  );
}
