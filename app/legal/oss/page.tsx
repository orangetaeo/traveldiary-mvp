/**
 * 오픈소스 라이선스 페이지 — 실제 의존성 기반 라이선스 목록.
 */

import type { Metadata } from "next";
import { LegalPlaceholderShell } from "@/components/legal/LegalPlaceholderShell";

export const metadata: Metadata = {
  title: "오픈소스 라이선스 — TRAVELDIARY",
  description: "TravelDiary가 사용하는 오픈소스 소프트웨어 라이선스 목록.",
};

const HIGHLIGHTS = [
  "Next.js 14 (MIT) — App Router 기반 풀스택 프레임워크.",
  "React 18 + React DOM 18 (MIT) — UI 라이브러리.",
  "TypeScript 5 (Apache 2.0) — 정적 타입 시스템.",
  "Tailwind CSS 3 (MIT) — 유틸리티 우선 CSS 프레임워크.",
  "Prisma 7 + @prisma/client + @prisma/adapter-pg (Apache 2.0) — PostgreSQL ORM + 어댑터.",
  "pg (MIT) — PostgreSQL 네이티브 드라이버.",
  "jose (MIT) — JWT 서명 및 검증 라이브러리.",
  "PostCSS + Autoprefixer (MIT) — CSS 후처리.",
  "Material Symbols (Apache 2.0) — Google 아이콘 시스템.",
  "이 목록은 package.json dependencies 기준이며, 전이 의존성은 각 패키지의 라이선스를 따릅니다.",
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
