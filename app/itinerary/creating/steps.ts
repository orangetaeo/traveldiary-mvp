/** AI 일정 생성 중 표시할 진행 단계. */
export function getSteps(dest: string) {
  return [
    {
      title: "취향 분석",
      detail: "맛집 위주 · 사진 명소 · 균형 페이스",
    },
    {
      title: `${dest} 인기 장소 검토`,
      detail: "도보·차량 동선 후보 정렬",
    },
    {
      title: "AI 일정 생성",
      detail: "Claude AI가 최적 동선을 설계합니다",
    },
    {
      title: "5단계 환각 차단 검증",
      detail: "장소 존재 · 영업 상태 · 예약 · 거리 · 가격",
    },
  ];
}
