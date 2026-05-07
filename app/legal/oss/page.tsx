/**
 * 오픈소스 라이선스 placeholder 페이지 — 사이클 U-deadlinks (2026-05-07).
 *
 * settings 데드 링크 청소 (박제 답습 LegalPlaceholderShell).
 * 정식 라이선스 목록은 BLOCKER 7 출시 시점 자동 생성기(license-checker
 * 등) 도입 후 동적 페이지로 진화. 본 사이클은 라우트 활성화 + 핵심
 * 의존성 가시화 1차.
 */

import type { Metadata } from "next";
import { LegalPlaceholderShell } from "@/components/legal/LegalPlaceholderShell";

export const metadata: Metadata = {
  title: "오픈소스 라이선스 — TRAVELDIARY",
  description: "TravelDiary가 사용하는 오픈소스 라이선스 목록 (정식 출시 시점 게시).",
};

const HIGHLIGHTS = [
  "Next.js 14 (MIT) — App Router 기반 풀스택 프레임워크.",
  "React 18 + TypeScript 5 (MIT) — UI 라이브러리 + 정적 타입 시스템.",
  "Tailwind CSS 3 (MIT) — 유틸리티 우선 CSS 프레임워크.",
  "Prisma 7 (Apache 2.0) — PostgreSQL ORM + 마이그레이션 도구.",
  "shadcn/ui + Material Symbols (MIT / Apache 2.0) — 디자인 시스템 + 아이콘.",
  "정식 라이선스 전체 목록은 출시 시점 자동 생성하여 게시합니다.",
];

export default function OssLicensesPage() {
  return (
    <LegalPlaceholderShell
      title="오픈소스 라이선스"
      description="TravelDiary는 다음 오픈소스 프로젝트의 도움을 받아 만들어졌습니다."
      highlights={HIGHLIGHTS}
      iconName="description"
    />
  );
}
