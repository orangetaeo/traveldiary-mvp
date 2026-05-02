/**
 * Smoke E2E — 사이클 K. 핵심 페이지 200 + 기본 텍스트 노출 확인.
 *
 * 회귀 방어용 최소 시나리오. 실 mutation은 별 시나리오에서 (auth.spec.ts 등 후속).
 * 데모 trip ID: demo-trip-phu-quoc (lib/seed/index.ts).
 */

import { test, expect } from "@playwright/test";

const DEMO_TRIP = "demo-trip-phu-quoc";

test("home page loads with destination", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("푸꾸옥")).toBeVisible();
  await expect(page.getByText(/AI가 24곳 검증 완료/)).toBeVisible();
});

test("itinerary page renders day tabs", async ({ page }) => {
  await page.goto(`/itinerary/${DEMO_TRIP}`);
  await expect(page.getByRole("button", { name: /Day 1/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Day 4/ })).toBeVisible();
});

test("item detail shows hero + evidence panel", async ({ page }) => {
  await page.goto(`/itinerary/${DEMO_TRIP}`);
  // 첫 번째 일정 카드 클릭
  const firstCard = page.locator("a[href*='/item/']").first();
  await firstCard.click();
  await expect(page.getByText(/왜 이걸 골랐나|추천 근거/)).toBeVisible({ timeout: 5000 });
});

test("city page loads phu-quoc emergency contacts", async ({ page }) => {
  await page.goto("/city/phu-quoc");
  await expect(page.getByText("푸꾸옥")).toBeVisible();
  await expect(page.getByText(/긴급 상황|113|115/)).toBeVisible();
});

test("translate capturing view loads", async ({ page }) => {
  await page.goto("/translate");
  await expect(page.getByText(/메뉴판을 비춰보세요/)).toBeVisible();
});

test("travel mode page loads with timeline", async ({ page }) => {
  await page.goto(`/travel/${DEMO_TRIP}`);
  await expect(page.getByText(/DAY 1/)).toBeVisible();
});

test("checklist page shows empty state with template button", async ({ page }) => {
  await page.goto(`/checklist/${DEMO_TRIP}`);
  await expect(
    page.getByRole("button", { name: /기본 템플릿 추가/ }),
  ).toBeVisible();
});

test("cost page shows totals", async ({ page }) => {
  await page.goto(`/cost/${DEMO_TRIP}`);
  await expect(page.getByText(/합계/)).toBeVisible();
});

test("api health returns healthy or demo", async ({ request }) => {
  const resp = await request.get("/api/health");
  expect(resp.status()).toBeLessThan(500);
  const json = await resp.json();
  expect(["healthy", "demo"]).toContain(json.status);
});
