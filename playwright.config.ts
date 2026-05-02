/**
 * Playwright config — 사이클 K (S-14 E2E 첫 도입).
 *
 * 기본 baseURL은 PLAYWRIGHT_BASE_URL 환경변수 또는 로컬 dev.
 * 라이브 검증 시: PLAYWRIGHT_BASE_URL=https://traveldiary-mvp-production.up.railway.app npx playwright test
 * 로컬 dev: npm run dev (별도 터미널) → npx playwright test
 *
 * 브라우저 binary는 한 번 설치 필요: npx playwright install chromium
 */

import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    // 모바일 추가는 사이클 K+에서
  ],
});
