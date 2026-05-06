/**
 * 개인정보 처리방침 placeholder 페이지 — 사이클 7 (G10, 2026-05-06).
 *
 * BLOCKER 7 사업자 등록 + 개인정보보호법 검토 후 정식 문서로 진화.
 * 본 사이클은 라우트 활성화 + 핵심 항목 가시화 1차.
 *
 * 핵심 인용: ADR-017 (위치 좌표 서버 미전송) + ADR-019 (이미지 캐시 7일/30일).
 */

import type { Metadata } from "next";
import { LegalPlaceholderShell } from "@/components/legal/LegalPlaceholderShell";

export const metadata: Metadata = {
  title: "개인정보 처리방침 — TRAVELDIARY",
  description: "TravelDiary 개인정보 처리방침 (정식 문서 출시 시점 게시).",
};

const HIGHLIGHTS = [
  "위치 좌표는 기기에서만 사용되며 서버에 저장하지 않습니다 (ADR-017).",
  "카메라 번역 이미지는 OCR 결과 7일 / 번역 결과 30일 캐시 후 자동 삭제됩니다 (ADR-019).",
  "익명 협업은 LocalStorage clientUuid로 식별되며 가입 시 OAuth actorId로 자연 통합됩니다.",
  "여행 일정·체크리스트·비용 데이터는 본인 또는 명시 공유한 일행만 열람할 수 있습니다.",
  "감사 로그는 사용자 식별 키 패턴 13종(API 키·세션·토큰 등)이 자동 마스킹됩니다 (ADR-046).",
  "사용자는 언제든 데이터 내보내기 / 계정 삭제를 요청할 수 있습니다 (설정 > 계정).",
];

export default function PrivacyPage() {
  return (
    <LegalPlaceholderShell
      title="개인정보 처리방침"
      description="여러분의 데이터를 어떻게 다루는지 솔직하게 알려드립니다."
      highlights={HIGHLIGHTS}
    />
  );
}
