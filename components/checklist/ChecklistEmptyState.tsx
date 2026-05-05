"use client";

import { EmptyState } from "@/components/ui/EmptyState";

/**
 * 사이클 QQ — ChecklistEmptyState (ChecklistView에서 추출).
 *
 * 사이클 2026-05-05 (세션 B): EmptyState 통합 컴포넌트 기반으로 마이그레이션.
 * 도메인 props(templateSize, isPending, onAddTemplate, onAddManual)를 받아
 * EmptyState 표준 시각(원형 보라 아이콘 + bold 제목 + 보라 primary 버튼)으로 변환.
 *
 * 책임: 비어있는 체크리스트의 템플릿 추가 CTA + 도메인 텍스트.
 */

interface Props {
  templateSize: number;
  isPending: boolean;
  onAddTemplate: () => void;
  /** C2 — "직접 추가" 콜백. 빈 상태에서 수동 입력 유도. */
  onAddManual?: () => void;
}

export function ChecklistEmptyState({
  templateSize,
  isPending,
  onAddTemplate,
  onAddManual,
}: Props) {
  return (
    <EmptyState
      icon="checklist"
      title="아직 체크리스트가 비어있어요"
      description={`${templateSize}건의 기본 템플릿(서류·짐·반입금지·신고)을 한 번에 추가하거나, 직접 항목을 추가해 보세요.`}
      primaryButton={{
        label: isPending ? "추가 중…" : "기본 템플릿 추가",
        onClick: onAddTemplate,
        disabled: isPending,
      }}
      secondaryButton={
        onAddManual
          ? { label: "직접 추가하기", onClick: onAddManual }
          : undefined
      }
    />
  );
}
