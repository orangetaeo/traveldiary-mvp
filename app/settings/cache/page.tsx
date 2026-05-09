/**
 * 캐시 삭제 페이지 — localStorage/sessionStorage td-* 키 삭제.
 *
 * PWA Service Worker cache는 향후 도입 시 추가.
 * 사용자 DB 데이터(trip/일정/비용/체크리스트)는 영향 없음.
 */

import type { Metadata } from "next";
import { PlaceholderShell } from "@/components/common/PlaceholderShell";
import { CacheClearButton } from "@/components/settings/CacheClearButton";

export const metadata: Metadata = {
  title: "캐시 삭제 — TRAVELDIARY",
  description: "TravelDiary 앱 캐시를 삭제합니다.",
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
        title: "참고",
        body: "삭제하면 일부 페이지에서 외부 API 응답이 다시 로드됩니다. 내 여행/일정/비용/체크리스트 데이터는 서버에 안전하게 보관되어 영향 없습니다.",
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

      <CacheClearButton />
    </PlaceholderShell>
  );
}
