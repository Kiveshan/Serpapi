import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { TEST_USERS } from '../../fixtures/test-data';
import { mockLoginWithDelay } from '../../helpers/route-mocks';

/**
 * Login flow tests.
 *
 * These tests cover:
 * - Happy paths (regular user, system admin)
 * - Error states (wrong credentials, pending/disabled accounts)
 * - HTML5 native validation (empty fields, invalid email format)
 * - Loading state during async submission
 * - Navigation to the register page
 * - JWT token presence and format after login
 *
 * Selector strategy: all locators use data-testid (added to login.jsx).
 * This survives CSS class renames, text copy changes, and DOM restructuring.
 */

test.describe('Login', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  // ─── Happy paths ────────────────────────────────────────────────────────────

  test('regular user can log in and lands on search page', async ({ page }) => {
    await loginPage.loginAs(TEST_USERS.regular.email, TEST_USERS.regular.password);

    // Wait for navigation — this is the synchronisation barrier for all subsequent assertions
    await expect(page).toHaveURL(/\/search/);

    // Token must be in localStorage — assert after navigation to avoid a race
    const token = await page.evaluate(() => localStorage.getItem('authToken'));
    expect(token).toBeTruthy();
  });

  test('system admin lands on admin registrations page', async ({ page }) => {
    await loginPage.loginAs(TEST_USERS.admin.email, TEST_USERS.admin.password);

    await expect(page).toHaveURL(/\/system-admin\/registrations/);

    const token = await page.evaluate(() => localStorage.getItem('authToken'));
    expect(token).toBeTruthy();
  });

  test('JWT stored in localStorage has valid three-segment format', async ({ page }) => {
    await loginPage.loginAs(TEST_USERS.regular.email, TEST_USERS.regular.password);
    await expect(page).toHaveURL(/\/search/);

    const token = await page.evaluate(() => localStorage.getItem('authToken'));
    // A valid JWT is three base64url segments separated by dots
    expect(token?.split('.')).toHaveLength(3);
  });

  // ─── Error states ────────────────────────────────────────────────────────────

  test('shows error for wrong password', async ({ page }) => {
    await loginPage.loginAs(TEST_USERS.regular.email, 'wrong-password-xyz');

    await loginPage.expectErrorMessage(/Invalid email or password/i);
    // URL must stay on login — no redirect
    await expect(page).toHaveURL(/\/login/);
    // No token written
    const token = await page.evaluate(() => localStorage.getItem('authToken'));
    expect(token).toBeNull();
  });

  test('shows error for unregistered email', async ({ page }) => {
    // Server returns the same message regardless — it does not reveal whether
    // the email exists. This is intentional security behaviour.
    await loginPage.loginAs('nobody@does-not-exist.edu', 'anypassword');

    await loginPage.expectErrorMessage(/Invalid email or password/i);
    await expect(page).toHaveURL(/\/login/);
  });

  test('pending account cannot log in', async ({ page }) => {
    await loginPage.loginAs(TEST_USERS.pending.email, TEST_USERS.pending.password);

    // The server rejects non-enabled accounts
    await loginPage.expectErrorMessage(/.+/); // any visible error is sufficient
    await expect(page).toHaveURL(/\/login/);
  });

  test('disabled (enabled=false, status=approved) account cannot log in', async ({ page }) => {
    await loginPage.loginAs(TEST_USERS.disabled.email, TEST_USERS.disabled.password);

    await loginPage.expectErrorMessage(/.+/);
    await expect(page).toHaveURL(/\/login/);
  });

  // ─── Native validation (no network calls) ────────────────────────────────────

  test('empty email field triggers browser validation — no API call', async ({ page }) => {
    // Track whether any login request was made
    let loginRequestMade = false;
    await page.route('**/api/auth/login', () => {
      loginRequestMade = true;
    });

    await loginPage.fillPassword('anypassword');
    await loginPage.submit();

    // Give a brief window for any unexpected request to appear
    await page.waitForTimeout(500);
    expect(loginRequestMade).toBe(false);
  });

  test('empty password field triggers browser validation — no API call', async ({ page }) => {
    let loginRequestMade = false;
    await page.route('**/api/auth/login', () => {
      loginRequestMade = true;
    });

    await loginPage.fillEmail(TEST_USERS.regular.email);
    await loginPage.submit();

    await page.waitForTimeout(500);
    expect(loginRequestMade).toBe(false);
  });

  test('malformed email triggers browser validation — no API call', async ({ page }) => {
    let loginRequestMade = false;
    await page.route('**/api/auth/login', () => {
      loginRequestMade = true;
    });

    // Fill a non-email string — HTML5 type="email" validation will block submission
    await loginPage.fillEmail('notanemail');
    await loginPage.fillPassword('anypassword');
    await loginPage.submit();

    await page.waitForTimeout(500);
    expect(loginRequestMade).toBe(false);
  });

  // ─── Loading state (deterministic via route interception) ────────────────────

  test('submit button shows loading text and inputs become disabled during request', async ({
    page,
  }) => {
    // Intercept the login request and hold it — gives us a window to assert
    // the loading state before the response arrives
    const releaseLogin = await mockLoginWithDelay(page);

    // Start the login (don't await — we need to inspect state while it's pending)
    await loginPage.fillEmail(TEST_USERS.regular.email);
    await loginPage.fillPassword(TEST_USERS.regular.password);
    const submitPromise = loginPage.submit();

    // Assert loading state while the request is paused
    await loginPage.expectSubmitButtonText('Logging in...');
    await loginPage.expectInputsDisabled();

    // Release the intercepted request so the test can complete
    releaseLogin();
    await submitPromise;
  });

  // ─── Navigation ──────────────────────────────────────────────────────────────

  test('clicking Register navigates to the registration page', async ({ page }) => {
    await loginPage.clickRegister();
    await expect(page).toHaveURL(/\/register/);
  });
});
