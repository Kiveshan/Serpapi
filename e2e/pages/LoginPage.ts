import { type Page, type Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;

  // Locators — resolved once in constructor, reused across methods
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly registerNavButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByTestId('login-email-input');
    this.passwordInput = page.getByTestId('login-password-input');
    this.submitButton = page.getByTestId('login-submit-button');
    this.registerNavButton = page.getByTestId('login-register-nav-button');
    this.errorMessage = page.getByTestId('login-error-message');
  }

  async goto(): Promise<void> {
    await this.page.goto('/login');
  }

  // Atomic actions — no assertions inside. This keeps them composable:
  // different tests can submit the same form and assert different outcomes.
  async fillEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  // Composite action — combines the common "fill and submit" flow
  async loginAs(email: string, password: string): Promise<void> {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submit();
  }

  async clickRegister(): Promise<void> {
    await this.registerNavButton.click();
  }

  // Assertion methods — isolate expect() calls so test bodies read as prose
  async expectErrorMessage(text: string | RegExp): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessage).toContainText(text);
  }

  async expectNoErrorMessage(): Promise<void> {
    await expect(this.errorMessage).not.toBeVisible();
  }

  async expectRedirectedTo(path: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(path.replace(/\//g, '\\/')));
  }

  async expectSubmitButtonText(text: 'Login' | 'Logging in...'): Promise<void> {
    await expect(this.submitButton).toContainText(text);
  }

  async expectInputsDisabled(): Promise<void> {
    await expect(this.emailInput).toBeDisabled();
    await expect(this.passwordInput).toBeDisabled();
  }
}
