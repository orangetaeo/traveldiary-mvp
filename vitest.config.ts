/**
 * Vitest 설정 — 사이클 L+N (ADR-029).
 *
 * 단위 테스트 전용. lib/services 순수 함수만 대상.
 * E2E (Playwright)와 분리. server-only / Next.js 의존 모듈은 대상 ❌.
 */

import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    include: ["tests/unit/**/*.test.{ts,tsx}"],
    environment: "node",
    globals: false,
    reporters: ["default"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json"],
      include: ["lib/**", "actions/**", "app/api/**"],
      exclude: ["node_modules", ".next", "tests"],
    },
  },
  // 사이클 E (ADR-031) — StatusBadge .tsx 테스트 위해 자동 JSX runtime
  esbuild: {
    jsx: "automatic",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      // server-only는 Next.js 런타임 가드. 단위 테스트에서는 빈 모듈로 alias
      // (순수 함수가 같은 파일에 있어도 import 자체는 통과해야 함).
      "server-only": path.resolve(__dirname, "tests/unit/__mocks__/server-only.ts"),
    },
  },
});
