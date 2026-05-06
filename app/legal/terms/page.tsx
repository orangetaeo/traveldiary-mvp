/**
 * 이용약관 placeholder 페이지 — 사이클 7 (G10, 2026-05-06).
 *
 * BLOCKER 7 사업자 등록 + 법무 검토 후 정식 문서로 진화.
 * 본 사이클은 라우트 활성화 + 주요 항목 가시화 1차.
 */

import type { Metadata } from "next";
import { LegalPlaceholderShell } from "@/components/legal/LegalPlaceholderShell";

export const metadata: Metadata = {
  title: "이용약관 — TRAVELDIARY",
  description: "TravelDiary 이용약관 (정식 문서 출시 시점 게시).",
};

const HIGHLIGHTS = [
  "본 서비스는 자유여행자를 위한 AI 여행 동반자입니다.",
  "AI가 생성한 일정·번역·추천은 참고용이며 사용자 책임으로 활용합니다.",
  "OTA 어필리에이트 링크 클릭 시 외부 사이트 이용약관이 별도 적용됩니다.",
  "사용자가 작성한 일정·체크리스트·비용 데이터는 본인이 소유합니다.",
  "본 약관은 출시 시점에 정식 문서로 대체되며 중대한 변경은 앱 내 알림으로 안내합니다.",
];

export default function TermsPage() {
  return (
    <LegalPlaceholderShell
      title="이용약관"
      description="TravelDiary를 사용하시는 여러분을 위한 약속입니다."
      highlights={HIGHLIGHTS}
    />
  );
}
