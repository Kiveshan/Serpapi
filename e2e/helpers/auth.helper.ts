import { type Page } from '@playwright/test';
import { API_BASE, TEST_USERS } from '../fixtures/test-data';

/**
 * Log in via the API directly and inject the JWT into the browser's localStorage.
 *
 * Use this as a test precondition when you need an authenticated session but
 * are NOT testing the login flow itself. API login is ~50ms vs ~2s for UI login.
 *
 * Why navigate to '/login' first: localStorage is scoped to the origin.
 * The page must be on http://localhost:3000 before we can write to its storage.
 */
export async function loginViaAPI(
  page: Page,
  user: { email: string; password: string }
): Promise<string> {
  const response = await page.request.post(`${API_BASE}/auth/login`, {
    data: {
      institutionemail: user.email,
      password: user.password,
    },
  });

  if (!response.ok()) {
    const body = await response.json().catch(() => ({}));
    throw new Error(
      `loginViaAPI failed for ${user.email}: HTTP ${response.status()} — ${JSON.stringify(body)}`
    );
  }

  const { token } = await response.json();

  // Navigate to the app origin so we can write to the correct localStorage scope
  await page.goto('/login');
  await page.evaluate((t: string) => localStorage.setItem('authToken', t), token);

  return token;
}

export const loginAsRegularUser = (page: Page) => loginViaAPI(page, TEST_USERS.regular);
export const loginAsAdmin = (page: Page) => loginViaAPI(page, TEST_USERS.admin);

export async function clearAuth(page: Page): Promise<void> {
  await page.evaluate(() => localStorage.removeItem('authToken'));
}
