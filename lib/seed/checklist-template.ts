/**
 * 체크리스트 기본 템플릿 — M6 사이클 9 (ADR-022).
 *
 * 사용자가 /checklist/[tripId]에서 "기본 템플릿 추가" 버튼 클릭 시
 * 이 템플릿을 ChecklistItem 행으로 일괄 복제 (audit log "checklist.add" 각 1건).
 *
 * 자동 복제 안 함 (사용자 부담 회피, ADR-022 §H).
 *
 * 큐레이션 기준:
 * - dDayBucket 6단계 × 카테고리 6 = 36 슬롯이지만 의미 있는 항목만
 * - 푸꾸옥 기준이지만 일반 동남아 여행에 공통 적용
 * - cityNote는 City 시드와 결합 시 UI에서 합쳐 표시 (사이클 9.5+)
 */

import type { ChecklistTemplate } from "../types";

export const DEFAULT_CHECKLIST_TEMPLATE: ChecklistTemplate[] = [
  // ── D-30: 비자·항공·예방접종 ──────────────────────────────────────
  {
    category: "documents",
    text: "여권 만료일 6개월 이상 확인",
    dDayBucket: "D-30",
  },
  {
    category: "documents",
    text: "비자 / 무비자 체류일 확인",
    dDayBucket: "D-30",
    cityNote: "한국 여권은 베트남 무비자 45일",
  },
  {
    category: "documents",
    text: "여행자 보험 가입 (해외 의료비 보장)",
    dDayBucket: "D-30",
  },

  // ── D-14: 예약 마감 + 환전 ────────────────────────────────────────
  {
    category: "documents",
    text: "항공권 좌석·기내식 확인",
    dDayBucket: "D-14",
  },
  {
    category: "documents",
    text: "숙소 예약 확정 (체크인 시간 확인)",
    dDayBucket: "D-14",
  },
  {
    category: "documents",
    text: "환전 (현지 통화 + 비상용 USD)",
    dDayBucket: "D-14",
  },

  // ── D-7: 짐 준비 시작 ────────────────────────────────────────────
  {
    category: "clothing",
    text: "여름 의류 (반팔·반바지·수영복)",
    dDayBucket: "D-7",
  },
  {
    category: "clothing",
    text: "방수 신발 또는 슬리퍼",
    dDayBucket: "D-7",
  },
  {
    category: "electronics",
    text: "전자 어댑터 (Type C/F/I)",
    dDayBucket: "D-7",
    cityNote: "베트남 220V, Type A/C/G 호환",
  },
  {
    category: "electronics",
    text: "보조 배터리 (10,000 mAh 이내, 기내 반입)",
    dDayBucket: "D-7",
  },
  {
    category: "documents",
    text: "여행자 데이터 / eSIM 준비",
    dDayBucket: "D-7",
    cityNote: "Viettel·Vinaphone eSIM 추천",
  },

  // ── D-1: 출발 직전 ──────────────────────────────────────────────
  {
    category: "documents",
    text: "여권·항공권 e-ticket 인쇄 또는 PDF 저장",
    dDayBucket: "D-1",
  },
  {
    category: "clothing",
    text: "자외선 차단제 / 모기 기피제",
    dDayBucket: "D-1",
  },
  {
    category: "forbidden",
    text: "라이터·인화성 액체 기내 반입 X",
    dDayBucket: "D-1",
  },
  {
    category: "forbidden",
    text: "100ml 초과 액체 기내 반입 X",
    dDayBucket: "D-1",
  },
  {
    category: "declarable",
    text: "현금 1만 USD 초과 시 신고",
    dDayBucket: "D-1",
  },
  {
    category: "declarable",
    text: "면세 한도 800 USD 초과 시 신고",
    dDayBucket: "D-1",
  },

  // ── during: 여행 중 ────────────────────────────────────────────
  {
    category: "documents",
    text: "여권 사본 별도 보관 (분실 대비)",
    dDayBucket: "during",
  },
  {
    category: "documents",
    text: "한국 영사관 / 경찰 연락처 메모",
    dDayBucket: "during",
    cityNote: "주 호치민 영사관 +84 28 3822 5757, 베트남 경찰 113",
  },
  {
    category: "custom",
    text: "매일 사용 경비 / 비용 입력",
    dDayBucket: "during",
  },

  // ── after: 귀국 후 ────────────────────────────────────────────
  {
    category: "declarable",
    text: "면세 한도 초과 물품 통관 신고",
    dDayBucket: "after",
  },
  {
    category: "custom",
    text: "여행 기록 / 후기 정리",
    dDayBucket: "after",
  },
];
