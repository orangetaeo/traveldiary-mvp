/**
 * 한국인 자유여행자 분실·도난 통합 가이드 — 사이클 P (ADR-035).
 *
 * 정책 (T16 보안 합의):
 *  - 검증 불가능한 개별 번호(KB·신한 등 카드사별)는 시드하지 않음 (환각 위험)
 *  - 통합 번호(외교부 영사 콜센터·한국 카드 통합 분실신고)만 시드
 *  - 각 카테고리에 절차(steps) 우선 + 출국 전 본인 카드사·통신사 번호 사전 메모 권장
 *
 * country-agnostic — 모든 도시 응급 페이지에서 동일하게 노출.
 */

export type LossCategory = "passport" | "card" | "phone" | "theft";

export interface LossGuideContact {
  label: string;
  phone?: string;
  url?: string;
  notes?: string;
}

export interface LossGuide {
  category: LossCategory;
  title: string;
  emoji: string;
  /** 패닉 상황 단계별 절차 — ≥3 단계 */
  steps: string[];
  /** 검증 가능한 통합 번호만 시드 */
  contacts: LossGuideContact[];
  /** 사용자 사전 준비 권장 안내 */
  preparation?: string;
}

export const KOREAN_LOSS_GUIDES: LossGuide[] = [
  {
    category: "passport",
    title: "여권 분실",
    emoji: "📕",
    steps: [
      "1. 가까운 경찰서에서 분실 신고 → '분실 신고서(Police Report)' 발급 (반드시 영문)",
      "2. 영사관 방문 또는 24시간 영사 콜센터 연락 — 임시 여권(여행 증명서) 발급 신청",
      "3. 여권 사진 2매 + 신분증 사본 + 분실 신고서 + 수수료 (약 USD 15)",
      "4. 임시 여권은 1회용·귀국 전용 — 한국 도착 후 정식 여권 재발급",
    ],
    contacts: [
      {
        label: "외교부 영사 콜센터 (24시간 한국어)",
        phone: "+82-2-3210-0404",
        url: "https://www.0404.go.kr",
        notes: "통화료만 부담. 영사관 위치·임시 여권 절차 안내",
      },
      {
        label: "외교부 해외안전여행 사이트",
        url: "https://www.0404.go.kr",
        notes: "도시별 영사관 주소·연락처 검색",
      },
    ],
    preparation:
      "출국 전: 여권 사본 2부 (휴대 1, 짐 1) + 여권 사진 4장 + 사진 클라우드 업로드",
  },
  {
    category: "card",
    title: "카드 분실 (신용·체크)",
    emoji: "💳",
    steps: [
      "1. 즉시 카드사 분실신고 (24시간 콜센터) — 통합 콜센터 1577-0000 또는 본인 카드사 직통",
      "2. 분실 시각·장소 신고 — 부정사용 면책 적용 시점",
      "3. 경찰서 분실 신고 (영문 신고서) — 부정사용 발생 시 증빙 자료",
      "4. 한국 도착 후 카드 재발급 신청 (영업일 7~10일)",
    ],
    contacts: [
      {
        label: "한국 카드사 통합 분실신고 (KB·신한·삼성·현대)",
        phone: "+82-2-1577-0000",
        notes: "24시간. 통화료만 부담",
      },
    ],
    preparation:
      "출국 전: 본인 카드사 해외 분실신고 번호 메모 + 백업 카드 1장 (다른 가방 보관)",
  },
  {
    category: "phone",
    title: "휴대폰 분실 (해외 로밍 사용 중)",
    emoji: "📱",
    steps: [
      "1. 본인 통신사 해외 로밍센터에 즉시 회선 일시 정지 신청 (부정 사용 차단)",
      "2. '나의 디바이스 찾기' (Find My iPhone / 안드로이드 기기 찾기) 원격 잠금 + 위치 추적",
      "3. 경찰서 분실 신고 (영문 신고서) — 보험 청구 자료",
      "4. 임시 회선 또는 현지 SIM 카드 구입 (긴급 연락용)",
    ],
    contacts: [
      {
        label: "본인 통신사 해외 로밍센터",
        notes:
          "출국 전 본인 통신사(SKT/KT/LGU+) 해외 로밍센터 번호를 메모해 둘 것 — 카드사·여권과 별개",
      },
      {
        label: "Apple Find My / Google Find My Device",
        url: "https://www.icloud.com/find",
        notes: "iCloud / Google 계정으로 다른 기기에서 원격 잠금·삭제",
      },
    ],
    preparation:
      "출국 전: '나의 기기 찾기' 활성화 + 통신사 해외 로밍센터 번호 메모 + 클라우드 백업",
  },
  {
    category: "theft",
    title: "도난·강도",
    emoji: "🚨",
    steps: [
      "1. 안전 확보 — 추적 금지, 안전한 장소(호텔·관광경찰 부스)로 이동",
      "2. 즉시 경찰 신고 (도시별 관광경찰 우선 — 도시 응급 카드 참조)",
      "3. 경찰 신고서(Police Report) 영문 발급 — 보험·카드·여권 청구 자료",
      "4. 영사관 연락 (한국어 통역 + 사후 절차 안내)",
      "5. 여행자 보험 회사 연락 — 24시간 핫라인 (출국 전 사본 휴대)",
    ],
    contacts: [
      {
        label: "외교부 영사 콜센터 (24시간 한국어)",
        phone: "+82-2-3210-0404",
        notes: "통화료만 부담. 도난 사후 절차·영사관 연결",
      },
    ],
    preparation:
      "출국 전: 여행자 보험 가입 + 보험 증서·24시간 핫라인 사본 휴대 + 현금 분산 (지갑·짐·호텔)",
  },
];

/** category로 가이드 조회 */
export function getLossGuide(category: LossCategory): LossGuide | undefined {
  return KOREAN_LOSS_GUIDES.find((g) => g.category === category);
}
