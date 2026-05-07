import type { Config } from "tailwindcss";

/**
 * Stitch (TravelDiary Narrative) 디자인 시스템과 정렬 (2026-04-30, 옵션 B).
 * 단일 진실 공급원: lib/design-tokens.ts — 그곳을 수정하면 여기도 동기화.
 */
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 우리 컬러 시스템 — lib/design-tokens.ts와 동기화
        ink: {
          DEFAULT: "#0F172A",   // slate-900 — Stitch on-surface
          soft: "#64748B",      // slate-500
          mute: "#8B8F98",
        },
        accent: {
          DEFAULT: "#F97316",   // 코랄 — 여행 중·진행 (Stitch secondary, orange-500)
          soft: "#FFDBCA",
          deep: "#9D4300",
        },
        purple: {
          DEFAULT: "#7C3AED",   // 보라 — 계획·정보·AI 추천 (Stitch primary, violet-600)
          soft: "#EDE0FF",
          deep: "#5A00C6",
        },
        amber: {
          DEFAULT: "#F59E0B",   // 앰버 — 주의·지연·사회적 증거 (Stitch tertiary, amber-500)
          soft: "#FFDDB8",
          deep: "#704500",
        },
        success: {
          DEFAULT: "#1D7F5C",   // 초록 — 완료·여행 후 (Stitch에 별도 토큰 없음, 기존 유지)
          soft: "#E1F5EC",
          deep: "#085041",
        },
        danger: {
          DEFAULT: "#BA1A1A",   // 빨강 — 알레르기·진짜 위험 (Stitch error)
          soft: "#FFDAD6",
          deep: "#93000A",
        },
        kakao: "#FEE500",         // 카카오 브랜드 옐로 — LoginButton
        surface: {
          card: "#FFFFFF",
          soft: "#F8FAFC",      // slate-50 — Stitch surface (베이지 → 슬레이트)
          dark: "#0F1419",
        },
        divider: "#E2E8F0",     // slate-200
      },
      fontFamily: {
        sans: ["Pretendard", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Stitch typography 5단 — lib/design-tokens.ts.typography와 동기화
        // [size, { lineHeight, letterSpacing? }]
        "td-title":      ["22px", { lineHeight: "28px", fontWeight: "500" }],
        "td-card-title": ["18px", { lineHeight: "24px", fontWeight: "500" }],
        "td-body":       ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "td-meta":       ["12px", { lineHeight: "16px", fontWeight: "400" }],
        "td-caption":    ["11px", { lineHeight: "14px", fontWeight: "400", letterSpacing: "0.02em" }],
        // Material Symbols 아이콘 스케일 — text-td-icon-* 으로 사용
        "td-icon-xs":  "12px",   // 체크마크, 배지 아이콘
        "td-icon-sm":  "14px",   // 필터 칩, 링크 아이콘
        "td-icon-md":  "16px",   // 인라인 네비게이션
        "td-icon":     "18px",   // 기본 액션 아이콘 (DEFAULT)
        "td-icon-lg":  "20px",   // 강조 아이콘
        "td-icon-xl":  "24px",   // 섹션 헤더 아이콘
      },
      spacing: {
        // 의미 spacing — Tailwind 기본(0.25rem 단위)과 충돌 방지 위해 td- prefix
        // lib/design-tokens.ts.spacing과 동기화
        "td-xxs": "4px",   // 같은 의미 단위 안
        "td-xs":  "8px",   // 같은 그룹 안
        "td-sm":  "12px",  // 카드 안 섹션 사이
        "td-md":  "16px",  // 카드 사이
        "td-lg":  "24px",  // 큰 섹션 사이
      },
      borderRadius: {
        // Stitch ROUND_FOUR
        sm: "4px",   // 0.25rem 기본
        md: "8px",   // 0.5rem 카드·시트
        lg: "12px",
      },
    },
  },
  plugins: [],
};

export default config;
