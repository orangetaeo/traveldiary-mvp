/**
 * 캐시 삭제 placeholder 페이지 — 사이클 U-deadlinks (2026-05-07).
 *
 * settings 데드 링크 청소 박제 답습. 정식 캐시 삭제 액션은
 * (1) Service Worker cache.delete (PWA 도입 후), (2) localStorage
 * 부분 청소(td-* 키 한정), (3) IndexedDB 청소 — 사용자 데이터 영향
 * 영역이라 R1 사인오프 + ADR 필요. 본 사이클은 placeholder shell만.
 *
 * server component (정적 마크업).
 *
 * 사이클 U-shell-dry: PlaceholderShell DRY 추출 답습 (chrome 위임).
 */

import type { Metadata } from "next";
import { PlaceholderShell } from "@/components/common/PlaceholderShell";

export const metadata: Metadata = {
  title: "캐시 삭제 — TRAVELDIARY",
  description: "TravelDiary 앱 캐시 삭제 가이드 (정식 출시 시점 활성).",
};

const ITEMS = [
  "외부 API 응답 캐시 (Google Places / Naver / Vision OCR / Claude API).",
  "이미지 미리보기 + 썸네일 (PWA Service Worker — 향후 도입).",
  "AI 추천 근거 캐시 (Evidence panel 응답).",
];

const KEPT = [
  "내 trip / 일정 / 비용 / 체크리스트 — 항상 보존됩니다.",
  "동기화 키 / 협업 댓글 — DB에 영속화되어 영향 없음.",
  "감사 로그 — 사용자 액션이 아닌 시스템 기록.",
];

export default function SettingsCachePage() {
  return (
    <PlaceholderShell
      title="캐시 삭제"
      description="저장된 외부 API 응답·이미지 캐시를 비울 수 있습니다."
      iconName="cached"
      iconVariant="soft-purple"
      note={{
        title: "준비 중",
        body: "실제 캐시 삭제 액션은 PWA Service Worker 도입 + R1 사인오프 후 활성됩니다. 그 전까지는 브라우저 설정에서 사이트 데이터를 직접 비우실 수 있습니다.",
      }}
    >
      <section
        aria-labelledby="cache-target-heading"
        className="bg-surface-card rounded-md border border-divider p-td-md mb-td-md"
      >
        <h3
          id="cache-target-heading"
          className="text-td-meta text-ink-soft font-bold uppercase tracking-wider mb-td-xs"
        >
          삭제되는 항목
        </h3>
        <ul className="space-y-td-xs">
          {ITEMS.map((line, i) => (
            <li key={i} className="flex items-start gap-td-sm">
              <span
                className="material-symbols-outlined text-purple-deep text-td-icon mt-0.5 shrink-0"
                aria-hidden
              >
                check
              </span>
              <p className="text-td-body text-ink flex-1">{line}</p>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby="cache-kept-heading"
        className="bg-surface-card rounded-md border border-divider p-td-md mb-td-md"
      >
        <h3
          id="cache-kept-heading"
          className="text-td-meta text-ink-soft font-bold uppercase tracking-wider mb-td-xs"
        >
          유지되는 데이터
        </h3>
        <ul className="space-y-td-xs">
          {KEPT.map((line, i) => (
            <li key={i} className="flex items-start gap-td-sm">
              <span
                className="material-symbols-outlined text-success text-td-icon mt-0.5 shrink-0"
                aria-hidden
              >
                shield
              </span>
              <p className="text-td-body text-ink flex-1">{line}</p>
            </li>
          ))}
        </ul>
      </section>

      <button
        type="button"
        disabled
        aria-disabled
        className="w-full rounded-md bg-ink/30 text-surface-card font-bold py-td-sm cursor-not-allowed"
      >
        캐시 삭제 (준비 중)
      </button>
    </PlaceholderShell>
  );
}
