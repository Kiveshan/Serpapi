import { test, expect } from '@playwright/test';

/**
 * Smoke tests — fast sanity checks that the application is reachable and
 * the most critical pages render without crashing.
 *
 * These run first (smallest, cheapest) and provide an early signal.
 * They do NOT use Page Object Models — no shared state, one assertion each.
 */

test.describe('Smoke', () => {
  test('login page renders', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /Welcome to Publications/i })).toBeVisible();
  });

  test('register page renders', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: /Register/i })).toBeVisible();
  });

  test('landing page is reachable and does not show a server error', async ({ page }) => {
    const response = await page.goto('/');
    // Accept any 2xx response — we just want to confirm the app is serving
    expect(response?.status()).toBeLessThan(400);
  });
});
