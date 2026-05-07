/**
 * 한국인 자유여행자 베트남 결제 가이드 — A4 디자인 갭 자율 발견.
 *
 * 정책 (T16 보안 + T1 도메인 합의):
 *  - 검증 가능한 통합 정보만 시드 (개별 환전소·카드사 환율은 환각 위험으로 제외)
 *  - country-agnostic 구조 + 베트남 6 도시 공통 (사이클 ZZ 베트남 단일 정책)
 *  - 외부 API 미연동 — 환율 표시는 City.payment.approxKrwRate seed 기반 대략치 명시
 *
 * 답습: lib/constants/koreanLossContacts.ts (사이클 P ADR-035)
 */

export type PaymentMethod = "cash" | "card" | "qr" | "split";

export interface PaymentMethodGuide {
  method: PaymentMethod;
  title: string;
  emoji: string;
  iconName: string;
  toneClass: "danger" | "success" | "purple" | "amber";
  /** 추천 상황 (≥2건) */
  bestFor: string[];
  /** 주의사항 (≥1건) */
  cautions: string[];
}

export const VN_PAYMENT_METHODS: PaymentMethodGuide[] = [
  {
    method: "cash",
    title: "현금 (VND)",
    emoji: "💵",
    iconName: "payments",
    toneClass: "amber",
    bestFor: [
      "야시장·로컬 식당·노점 — 카드/QR 미수용",
      "그랩 바이크·재래시장 — 거의 100% 현금",
      "팁·짐꾼 (2만~5만 VND, 약 1천~3천원)",
    ],
    cautions: [
      "위조지폐 주의 — 50만 VND vs 5만 VND 색깔 헷갈림 (둘 다 청록 계열)",
      "환전은 시내 환전소(Tiệm vàng) 또는 호텔보다 공항 환전이 환율 가장 나쁨",
      "큰 단위(50만 VND) 거스름돈 안 줄 수 있음 — 잔돈 미리 분리",
    ],
  },
  {
    method: "card",
    title: "신용/체크카드",
    emoji: "💳",
    iconName: "credit_card",
    toneClass: "success",
    bestFor: [
      "리조트·호텔·고급 식당 — 비자/마스터 대부분 OK",
      "대형 마트(빈마트·롯데마트) — 카드 + Visa/Master OK",
      "그랩 앱 결제 — 사전 등록 시 카드 자동 결제 (현금 회피)",
    ],
    cautions: [
      "DCC(현지 통화 결제 옵션) 함정 — 무조건 VND 선택 (KRW 결제 시 환율 손해 5~7%)",
      "해외 결제 수수료(보통 1.0~2.5%) + 환전 마진 — 카드사 비교 필요",
      "마그네틱(MS) 단말 흔함 — IC칩·터치 가능 카드 우선",
    ],
  },
  {
    method: "qr",
    title: "QR 결제 (VietQR/MoMo)",
    emoji: "📱",
    iconName: "qr_code_2",
    toneClass: "purple",
    bestFor: [
      "VietQR — 베트남 표준 QR. 마트·일부 식당에서 사용",
      "MoMo — 베트남 1위 간편결제 앱 (현지 번호 필요)",
      "여행자 입장에선 카카오페이·네이버페이 직접 사용 불가 — 카드 백업 필수",
    ],
    cautions: [
      "외국인이 MoMo 등록하려면 베트남 SIM·은행 계좌 필요 → 보통 사용 어려움",
      "VietQR 스캔 시 금액 확인 필수 — 자동 입력된 금액 한 번 더 체크",
      "Wi-Fi 끊기면 결제 실패 — 데이터 SIM 또는 로밍 필수",
    ],
  },
  {
    method: "split",
    title: "그룹 더치페이",
    emoji: "📊",
    iconName: "groups",
    toneClass: "purple",
    bestFor: [
      "친구·가족 일행 — 식사·투어 비용을 N분의 1로",
      "TravelDiary 정산 카드 활용 — 비용 추가 시 자동 분담 제안",
      "한국 귀국 후 토스·카카오페이 송금으로 정산",
    ],
    cautions: [
      "베트남 식당 대부분 1인분 단위로 안 끊어줌 — 한 명이 결제 후 정산이 일반적",
      "그랩 합승 시 앱에서 N등분 — '균등 분할' 설정 가능",
      "팁은 분담에서 제외 (결제자가 부담) — 미리 합의",
    ],
  },
];

export interface ExchangeTip {
  emoji: string;
  title: string;
  body: string;
}

export const VN_EXCHANGE_TIPS: ExchangeTip[] = [
  {
    emoji: "🏧",
    title: "ATM 출금 — 한도·수수료 확인",
    body: "베트남 ATM 1회 한도 보통 200만~500만 VND (10만~25만원). 외화 인출 수수료 약 5~7만 VND/회 (3~4천원). Vietcombank·BIDV·Techcombank ATM이 안정적.",
  },
  {
    emoji: "💱",
    title: "환전 — 시내 환전소(Tiệm vàng) 우선",
    body: "공항 환전 < 호텔 < 시내 환전소(금은방). 시내가 1~2% 더 유리. 큰 단위(USD 100·50)가 작은 단위보다 환율 좋음.",
  },
  {
    emoji: "⚠️",
    title: "위조지폐 — 색·크기 확인",
    body: "50만 VND(청록색)와 2만 VND(청록색) 비슷. 거스름돈 받을 때 단위 명시(\"năm trăm nghìn\" = 50만). 새 폴리머 지폐는 빛에 비춰 워터마크 확인.",
  },
  {
    emoji: "💡",
    title: "팁 — 의무 아님",
    body: "베트남은 팁 문화 약함. 호텔 짐꾼·마사지 후 2만~5만 VND(약 1~3천원) 정도면 충분. 식당에서 service charge 5~10% 포함 시 추가 팁 불필요.",
  },
  {
    emoji: "🏦",
    title: "카드 결제 — DCC 거절",
    body: "결제 단말이 \"KRW 결제하시겠습니까?\" 물으면 무조건 \"VND\" 선택. DCC(현지 통화 표시) 환율은 카드사 환율보다 5~7% 불리.",
  },
];

export interface ExchangeRateExample {
  krw: number;
  /** approxKrwRate 곱한 결과 — 페이지 측에서 city 데이터로 동적 계산 */
}

/** 환율 계산용 KRW 샘플 — 자주 쓰는 단위 */
export const EXCHANGE_KRW_SAMPLES: number[] = [1000, 5000, 10000, 50000, 100000];
