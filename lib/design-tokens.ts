/**
 * TRAVELDIARY 디자인 시스템 — 단일 진실 공급원
 *
 * 이 파일이 우리 앱의 시각 언어를 정의합니다.
 * tailwind.config.ts와 동기화 유지.
 *
 * Stitch (TravelDiary Narrative) 디자인 시스템과 정렬됨 (2026-04-30, 옵션 B).
 * Stitch 프로젝트: https://stitch.withgoogle.com/projects/4681512633268080895
 *
 * 룰:
 * 1. 색은 의미를 동반해야 한다. 예쁘다고 색을 추가하지 않음.
 * 2. 빨강은 진짜 위험에만 (알레르기, 환불 불가). 그 외 사용 금지.
 * 3. 한 화면에 색 3개 이내 — 메인 1 + 보조 1 + 회색.
 */

// ═══════════════════════════════════════════════════════════
// COLORS — 5색 + 회색 시스템 (Stitch 정렬)
// ═══════════════════════════════════════════════════════════

export const colors = {
  ink: {
    DEFAULT: "#0F172A", // slate-900 — Stitch on-surface
    soft: "#64748B",    // slate-500 — Stitch on-surface-variant
    mute: "#8B8F98",
  },

  /**
   * 보라 — 계획·정보·AI 추천
   * 사용처: 추천 근거 패널, 예약 완료 표시, 일정 카테고리 "관광"
   * Stitch primary
   */
  purple: {
    DEFAULT: "#7C3AED", // violet-600
    soft: "#EDE0FF",
    deep: "#5A00C6",
  },

  /**
   * 코랄 — 진행·시간·여행 중
   * 사용처: 여행 중 헤더, 펄스 점, 현재 일정 강조, "강행" 옵션
   * Stitch secondary
   */
  accent: {
    DEFAULT: "#F97316", // orange-500
    soft: "#FFDBCA",
    deep: "#9D4300",
  },

  /**
   * 앰버 — 주의·지연·사회적 증거
   * 사용처: 웨이팅 시간, 지연, "한국인 BEST", 카테고리 "맛집"
   * Stitch tertiary
   */
  amber: {
    DEFAULT: "#F59E0B", // amber-500
    soft: "#FFDDB8",
    deep: "#704500",
  },

  /**
   * 빨강 — 안전·알레르기 (절제해서 사용)
   * 사용처: 알레르기 함유, 환불 불가. 그 외 금지.
   * Stitch error (Material)
   */
  danger: {
    DEFAULT: "#BA1A1A",
    soft: "#FFDAD6",
    deep: "#93000A",
  },

  /**
   * 초록 — 안전·완료·여행 후
   * 사용처: 예약 완료 알림, "안전" 옵션, 카테고리 "휴식"
   * Stitch에는 별도 토큰 없음 — 기존 값 유지
   */
  success: {
    DEFAULT: "#1D7F5C",
    soft: "#E1F5EC",
    deep: "#085041",
  },

  surface: {
    card: "#FFFFFF",
    soft: "#F8FAFC",     // slate-50 — Stitch surface (기존 베이지 #F4F1EB → 슬레이트로 정렬)
    dark: "#0F1419",
  },

  divider: "#E2E8F0",   // slate-200 — Stitch outline-variant 기조
} as const;

// ═══════════════════════════════════════════════════════════
// TYPOGRAPHY — 5단계만, 더 늘리지 않음 (Stitch 정렬)
// ═══════════════════════════════════════════════════════════

export const typography = {
  /** 화면 헤더 (최상위) — "13:42", "도쿄 4박 5일" — Stitch title */
  h1: { size: 22, weight: 500, lineHeight: 28 },

  /** 카드 메인 제목 — "스시 다이", "teamLab Planets" — Stitch card-title */
  h2: { size: 18, weight: 500, lineHeight: 24 },

  /** 항목 제목, 본문 — Stitch body */
  body: { size: 14, weight: 400, lineHeight: 20 },
  bodyBold: { size: 14, weight: 500, lineHeight: 20 },

  /** 보조 정보, 메타 — "네이버 후기 92%", 부제 — Stitch meta */
  caption: { size: 12, weight: 400, lineHeight: 16 },

  /** 라벨, 캡션 — 시간, 거리, 작은 메타 — Stitch caption (letter-spacing 0.02em) */
  micro: { size: 11, weight: 400, lineHeight: 14 },
} as const;

// ═══════════════════════════════════════════════════════════
// SPACING — 정보 우선순위는 여백으로 표현 (Stitch 정렬)
// ═══════════════════════════════════════════════════════════

export const spacing = {
  /** 같은 의미 단위 안 (제목과 부제) — Stitch xs */
  xxs: 4,

  /** 같은 그룹 안 (버튼 사이) — Stitch sm */
  xs: 8,

  /** 카드 안의 섹션 사이 — Stitch md */
  sm: 12,

  /** 카드 사이 — Stitch lg */
  md: 16,

  /** 큰 섹션 사이 (헤더 ↔ 본문) — Stitch xl */
  lg: 24,
} as const;

// ═══════════════════════════════════════════════════════════
// RADIUS (Stitch ROUND_FOUR — 0.25rem 기본, 0.5rem 카드/시트)
// ═══════════════════════════════════════════════════════════

export const radius = {
  sm: 4,    // 0.25rem — Stitch DEFAULT
  md: 8,    // 0.5rem — 카드·시트
  lg: 12,
  pill: 999,
} as const;

// ═══════════════════════════════════════════════════════════
// CARD VARIANTS — 3가지 카드 위계
// ═══════════════════════════════════════════════════════════

export const cardVariants = {
  /** 일반 카드 — 회색 배경, 보조 정보 */
  plain: "bg-surface-soft",

  /** 강조 카드 — 흰색 배경 + 0.5px 회색 테두리, 주요 단위 */
  raised: "bg-surface-card border border-divider",

  /** 추천 카드 — 흰색 배경 + 2px 보라 테두리, 한 화면 1개만 */
  featured: "bg-surface-card border-2 border-purple",
} as const;
