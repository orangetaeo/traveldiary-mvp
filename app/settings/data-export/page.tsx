/**
 * 데이터 내보내기 placeholder shell — Stitch 시안 `f8d3d50e` 매핑.
 *
 * 정식 export 기능은 GDPR 컴플라이언스 + BLOCKER 7 사업자 등록 후
 * 사용자(법무·운영) 결정 영역. 본 라우트는 settings 데드 링크 청소 +
 * 사용자 권리 가시화 + audit log 기록 정책 명시까지만.
 *
 * 박제 패턴 답습: components/legal/LegalPlaceholderShell (사이클 7 G10).
 */

import Link from "next/link";

const INCLUDED_DATA: { label: string; sub: string }[] = [
  { label: "내 trip 목록", sub: "여행 단위 메타" },
  { label: "일정 항목", sub: "DAG 노드 + 위치" },
  { label: "비용 기록", sub: "정산 마커 포함" },
  { label: "체크리스트", sub: "D-Day 항목" },
  { label: "댓글·리액션", sub: "ShareComment 흔적" },
  { label: "감사 로그", sub: "최근 30일 (ADR-046)" },
];

const EXCLUDED_DATA: string[] = [
  "다른 사용자 정보",
  "외부 API 응답 캐시",
  "시스템 메타데이터",
];

export default function DataExportPage() {
  return (
    <div className="min-h-screen bg-surface-soft text-ink pb-24">
      <header className="sticky top-0 z-40 bg-surface-card/90 backdrop-blur-md border-b border-divider flex items-center px-4 h-14">
        <Link
          href="/settings"
          aria-label="설정으로 돌아가기"
          className="p-2 rounded-full hover:bg-surface-soft transition-colors"
        >
          <span className="material-symbols-outlined text-ink">
            arrow_back
          </span>
        </Link>
        <h1 className="text-lg font-bold tracking-tight text-ink ml-td-xs">
          내 데이터 내보내기
        </h1>
      </header>

      <main className="max-w-md mx-auto px-td-md py-td-lg">
        <section className="flex flex-col items-center text-center mb-td-lg">
          <div className="w-16 h-16 rounded-full bg-purple flex items-center justify-center mb-td-sm">
            <span
              className="material-symbols-outlined text-white text-3xl"
              aria-hidden
            >
              download
            </span>
          </div>
          <h2 className="text-td-title text-ink font-medium mb-td-xxs">
            내 모든 데이터를 받아갈 수 있어요
          </h2>
          <p className="text-td-body text-ink-soft mb-td-xs">
            JSON 파일로 다운로드해서 백업하거나
            <br />
            다른 서비스로 옮길 수 있습니다
          </p>
          <span className="text-td-caption text-ink-mute">
            GDPR · 개인정보보호법에 따른 사용자 권리
          </span>
        </section>

        <section
          aria-labelledby="included-heading"
          className="mb-td-md"
        >
          <h3
            id="included-heading"
            className="text-td-meta text-ink-soft font-bold uppercase tracking-wider mb-td-xs px-td-xxs"
          >
            포함되는 데이터
          </h3>
          <div className="bg-surface-card rounded-md border border-divider divide-y divide-divider overflow-hidden">
            {INCLUDED_DATA.map((item) => (
              <div
                key={item.label}
                className="px-td-sm py-td-sm flex items-center gap-td-sm"
              >
                <span
                  className="material-symbols-outlined text-success text-xl shrink-0"
                  aria-hidden
                >
                  check_circle
                </span>
                <div className="flex-1 flex justify-between items-center">
                  <span className="text-td-body text-ink">{item.label}</span>
                  <span className="text-td-caption text-ink-mute">
                    {item.sub}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="excluded-heading"
          className="mb-td-md"
        >
          <h3
            id="excluded-heading"
            className="text-td-meta text-ink-soft font-bold uppercase tracking-wider mb-td-xs px-td-xxs"
          >
            포함되지 않는 데이터
          </h3>
          <div className="bg-surface-card rounded-md border border-divider divide-y divide-divider overflow-hidden">
            {EXCLUDED_DATA.map((label) => (
              <div
                key={label}
                className="px-td-sm py-td-sm flex items-center gap-td-sm"
              >
                <span
                  className="material-symbols-outlined text-ink-mute text-xl shrink-0"
                  aria-hidden
                >
                  cancel
                </span>
                <span className="text-td-body text-ink-soft">{label}</span>
              </div>
            ))}
          </div>
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
                정식 다운로드 기능 준비 중
              </p>
              <p className="text-td-caption text-amber-deep/85">
                상용 출시(BLOCKER 7 사업자 등록 + GDPR 컴플라이언스 검토)
                전까지 위 항목 범위가 적용됩니다. 정식 다운로드는 출시 시점에
                활성화되며 다운로드 시 audit log에 30일간 기록됩니다 (ADR-046).
              </p>
            </div>
          </div>
        </section>

        <section className="mb-td-md">
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="w-full h-14 bg-ink/30 text-white rounded-md font-bold flex items-center justify-center gap-td-xs cursor-not-allowed"
          >
            <span
              className="material-symbols-outlined text-xl"
              aria-hidden
            >
              download
            </span>
            <span>JSON 파일로 다운로드</span>
            <span className="ml-td-xs text-td-caption font-normal opacity-90">
              (준비 중)
            </span>
          </button>
        </section>

        <p className="text-td-caption text-ink-mute text-center leading-relaxed">
          다운로드 기록은 30일간 audit log에 보관됩니다 (ADR-046)
        </p>

        <div className="mt-td-lg flex justify-center">
          <Link
            href="/settings"
            className="text-td-meta text-ink-soft hover:underline"
          >
            ← 설정으로
          </Link>
        </div>
      </main>
    </div>
  );
}
