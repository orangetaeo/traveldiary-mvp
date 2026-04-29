import type { Config } from "tailwindcss";

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
          DEFAULT: "#1A1F26",
          soft: "#5A6270",
          mute: "#8B8F98",
        },
        accent: {
          DEFAULT: "#FF6B47",   // 코랄 — 여행 중·진행
          soft: "#FFE8E0",
          deep: "#993C1D",
        },
        purple: {
          DEFAULT: "#5B4BC4",   // 보라 — 계획·정보·AI 추천
          soft: "#ECE9FB",
          deep: "#3C3489",
        },
        amber: {
          DEFAULT: "#C97A1F",   // 앰버 — 주의·지연·사회적 증거
          soft: "#FAEEDA",
          deep: "#854F0B",
        },
        success: {
          DEFAULT: "#1D7F5C",   // 초록 — 완료·여행 후
          soft: "#E1F5EC",
          deep: "#085041",
        },
        danger: {
          DEFAULT: "#C73F3F",   // 빨강 — 알레르기·진짜 위험
          soft: "#FCEBEB",
          deep: "#791F1F",
        },
        surface: {
          card: "#FFFFFF",
          soft: "#F4F1EB",
          dark: "#0F1419",
        },
        divider: "#E5E2DC",
      },
      fontFamily: {
        sans: ["Pretendard", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        md: "8px",
        lg: "12px",
      },
    },
  },
  plugins: [],
};

export default config;
