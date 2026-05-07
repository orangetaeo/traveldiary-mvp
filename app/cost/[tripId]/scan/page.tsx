/**
 * 영수증 스캔 placeholder 페이지 — Stitch screen `c389873963894d0c819c40692eea88bc` 매핑
 * (Session X cap 1, 2026-05-07).
 *
 * U4 사이클(2026-05-07)의 단순 정보 카드 placeholder를 Stitch viewfinder 시안으로
 * 코드 매핑. 시각 영웅(상단 카메라 viewfinder)은 출시 후 정체성 가시화이고,
 * 하단 정보 섹션은 placeholder로서 정식 활성 조건(Vision API + R1 + ADR)과
 * 3대 핵심 기능 + "비용 직접 입력" CTA를 그대로 유지.
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
    <div className="min-h-screen bg-ink text-white pb-24">
      {/* TopAppBar — 닫기 + 제목 + 도움말 */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-td-md h-14 bg-black/40 backdrop-blur-md border-b border-white/10">
        <Link
          href={`/cost/${tripId}`}
          aria-label="닫기"
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <span className="material-symbols-outlined text-white">close</span>
        </Link>
        <h1 className="text-td-card-title font-semibold tracking-tight text-white">
          영수증 스캔
        </h1>
        <Link
          href="/permission/camera"
          aria-label="카메라 권한 도움말"
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <span className="material-symbols-outlined text-white">help</span>
        </Link>
      </header>

      {/* Viewfinder 시각 영웅 — Stitch 시안 충실 매핑 */}
      <section
        className="relative h-[480px] flex flex-col items-center justify-between overflow-hidden bg-gradient-to-br from-purple-deep via-ink to-black py-td-lg"
        aria-hidden
      >
        {/* 안내 pill */}
        <div className="relative z-10 mt-td-md bg-accent text-white text-td-meta font-bold px-td-md py-td-xxs rounded-full shadow-lg">
          영수증을 사각형 안에 맞춰주세요
        </div>

        {/* 중앙 스캔 가이드 (3:4 비율 박스 + 4 코너 + 스캔 라인) */}
        <div className="relative z-10 w-full max-w-[280px] aspect-[3/4] border-2 border-dashed border-white/40 rounded-md">
          <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-md" />
          <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-md" />
          <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-md" />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-md" />
          <div className="absolute top-1/2 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-purple-soft to-transparent opacity-70" />
        </div>

        {/* 하단 안내 카피 */}
        <p className="relative z-10 text-center text-white/90 text-td-body font-medium drop-shadow-md px-td-md">
          가게명/금액/날짜/카테고리를 자동으로 추출해요
        </p>
      </section>

      {/* 카메라 컨트롤 데모 (정식 활성 전 — visual only) */}
      <section
        aria-label="카메라 컨트롤 (준비 중)"
        className="relative bg-ink py-td-md px-td-md flex items-center justify-around max-w-md mx-auto"
      >
        <button
          type="button"
          disabled
          aria-label="플래시 (준비 중)"
          className="w-12 h-12 flex items-center justify-center bg-white/10 rounded-full border border-white/20 opacity-60 cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-white">flash_on</span>
        </button>
        <button
          type="button"
          disabled
          aria-label="촬영 (준비 중)"
          className="relative w-20 h-20 rounded-full flex items-center justify-center opacity-60 cursor-not-allowed ring-4 ring-white/30"
        >
          <span className="w-[72px] h-[72px] bg-white rounded-full border-2 border-ink" />
        </button>
        <button
          type="button"
          disabled
          aria-label="갤러리 (준비 중)"
          className="w-12 h-12 flex flex-col items-center justify-center bg-white/10 rounded-full border border-white/20 opacity-60 cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-white">photo_library</span>
        </button>
      </section>

      {/* 정보 섹션 — 라이트 테마로 전환, placeholder 안내 + 기능 + CTA */}
      <main className="bg-surface-soft text-ink rounded-t-lg -mt-td-xs relative">
        <div className="max-w-md mx-auto px-td-md py-td-lg">
          <div className="text-center mb-td-md">
            <h2 className="text-td-title text-ink mb-td-xxs">
              영수증을 찍으면 자동 입력
            </h2>
            <p className="text-td-body text-ink-soft">
              통화·금액·항목을 AI가 읽어드려요.
            </p>
          </div>

          {/* 데모 amber 마커 — 정식 활성 조건 명시 */}
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
                  🟡 데모 — 준비 중
                </p>
                <p className="text-td-caption text-amber-deep/85 leading-relaxed">
                  현재는 비용 직접 입력만 가능합니다. 영수증 OCR은 외부 Vision API
                  연동 + R1 보안 사인오프 + 비용 가드 ADR 통과 후 활성됩니다.
                </p>
              </div>
            </div>
          </section>

          {/* 출시 시 들어갈 기능 — 3대 핵심 */}
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
        </div>
      </main>
    </div>
  );
}
