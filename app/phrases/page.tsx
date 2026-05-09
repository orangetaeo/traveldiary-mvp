/**
 * 베트남어 핵심 문장 카드 (`/phrases`) — A3 디자인 갭, 사이클 W3 자율.
 *
 * 자유여행자가 식당/그랩/호텔/응급 상황에서 자주 쓰는 14 문장.
 * 정적 데이터 + 브라우저 음성 합성. 외부 API 0, 의존성 0.
 *
 * server component (정적 헤더) + 클라이언트 PhrasesView.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { PhrasesView } from "@/components/phrases/PhrasesView";

export const metadata: Metadata = {
  title: "베트남어 핵심 문장 — TRAVELDIARY",
  description: "현지 자주 쓰는 베트남어 14문장 (식당·그랩·호텔·응급).",
};

export default function PhrasesPage() {
  return (
    <div className="min-h-screen bg-surface-soft text-ink pb-24">
      <header className="sticky top-0 z-40 bg-surface-card/90 backdrop-blur-md border-b border-divider flex items-center px-4 h-14">
        <Link
          href="/translate"
          aria-label="번역 화면으로 돌아가기"
          className="p-2 rounded-full hover:bg-surface-soft transition-colors"
        >
          <span className="material-symbols-outlined text-ink">arrow_back</span>
        </Link>
        <h1 className="text-td-title font-bold tracking-tight text-ink ml-td-xs">
          베트남어 핵심 문장
        </h1>
      </header>

      <PhrasesView />
    </div>
  );
}
