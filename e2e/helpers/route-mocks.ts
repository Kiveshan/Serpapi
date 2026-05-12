import { type Page, type Route } from '@playwright/test';

/**
 * Mock the /api/auth/register endpoint with a 201 success response.
 *
 * Why mock the entire endpoint (not individual S3 calls): S3 calls happen on
 * the server side and are invisible to Playwright's page.route(). The correct
 * interception point is the browser-facing API boundary.
 *
 * Use this in registration tests to avoid real S3 dependency.
 */
export async function mockRegisterSuccess(page: Page): Promise<void> {
  await page.route('**/api/auth/register', async (route: Route) => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        message: 'User registered successfully',
        user: {
          userid: 99999,
          fullname: 'Test User',
          institutionemail: 'test@example.com',
          roleid: 2,
          enabled: false,
          status: 'pending',
        },
        token: 'mock-jwt-token-for-registration-test',
      }),
    });
  });
}

/**
 * Mock the /api/auth/register endpoint with a 409 Conflict (duplicate email).
 */
export async function mockRegisterDuplicateEmail(page: Page): Promise<void> {
  await page.route('**/api/auth/register', async (route: Route) => {
    await route.fulfill({
      status: 409,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Email already exists' }),
    });
  });
}

/**
 * Mock the /api/auth/register endpoint with a generic 500 server error.
 */
export async function mockRegisterServerError(page: Page): Promise<void> {
  await page.route('**/api/auth/register', async (route: Route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Internal server error' }),
    });
  });
}

/**
 * Mock the /api/auth/login endpoint with a controlled delay.
 *
 * Returns a resolve function — call it to release the intercepted request
 * and let the response complete. This gives deterministic control over
 * loading-state assertions without relying on timing.
 *
 * Usage:
 *   const releaseLogin = await mockLoginWithDelay(page);
 *   await loginPage.submit();
 *   await loginPage.expectSubmitButtonText('Logging in...');
 *   releaseLogin();
 */
export async function mockLoginWithDelay(page: Page): Promise<() => void> {
  let release: () => void = () => {};
  const blocker = new Promise<void>((resolve) => {
    release = resolve;
  });

  await page.route('**/api/auth/login', async (route: Route) => {
    await blocker;
    await route.continue();
  });

  return release;
}

/**
 * Mock the /api/auth/register endpoint with a controlled delay (same pattern as login).
 */
export async function mockRegisterWithDelay(page: Page): Promise<() => void> {
  let release: () => void = () => {};
  const blocker = new Promise<void>((resolve) => {
    release = resolve;
  });

  await page.route('**/api/auth/register', async (route: Route) => {
    await blocker;
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        message: 'User registered successfully',
        user: { userid: 99999, roleid: 2, enabled: false, status: 'pending' },
        token: 'mock-jwt-token',
      }),
    });
  });

  return release;
}

/**
 * Mock the institutions endpoint to return a 500 error.
 * Used to test error handling when dropdown data fails to load.
 */
export async function mockInstitutionsLoadFailure(page: Page): Promise<void> {
  await page.route('**/api/auth/institutions', async (route: Route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Internal server error' }),
    });
  });
}
