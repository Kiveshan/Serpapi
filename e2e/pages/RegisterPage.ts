import { type Page, type Locator, expect } from '@playwright/test';
import { TEST_INSTITUTION_ID, SAMPLE_PDF_PATH } from '../fixtures/test-data';

export interface RegistrationData {
  fullName: string;
  institutionId: string;
  email: string;
  password: string;
  filePath: string;
}

const DEFAULTS: RegistrationData = {
  fullName: 'Jane Smith',
  institutionId: TEST_INSTITUTION_ID,
  email: `e2e.reg.${Date.now()}@test.edu`,
  password: 'ValidPass123',
  filePath: SAMPLE_PDF_PATH,
};

export class RegisterPage {
  readonly page: Page;

  readonly fullNameInput: Locator;
  readonly institutionSelect: Locator;
  readonly otherInstitutionInput: Locator;
  readonly emailInput: Locator;
  readonly roleSelect: Locator;
  readonly passwordInput: Locator;
  readonly certificateFileInput: Locator;
  readonly uploadArea: Locator;
  readonly fileName: Locator;
  readonly submitButton: Locator;
  readonly backButton: Locator;
  readonly successMessage: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.fullNameInput = page.getByTestId('register-fullname-input');
    this.institutionSelect = page.getByTestId('register-institution-select');
    this.otherInstitutionInput = page.getByTestId('register-other-institution-input');
    this.emailInput = page.getByTestId('register-email-input');
    this.roleSelect = page.getByTestId('register-role-select');
    this.passwordInput = page.getByTestId('register-password-input');
    // The file input has an existing id and is hidden — setInputFiles works on hidden inputs
    this.certificateFileInput = page.locator('#certificate');
    this.uploadArea = page.getByTestId('register-upload-area');
    this.fileName = page.getByTestId('register-file-name');
    this.submitButton = page.getByTestId('register-submit-button');
    this.backButton = page.getByTestId('register-back-button');
    this.successMessage = page.getByTestId('register-success-message');
    this.errorMessage = page.getByTestId('register-error-message');
  }

  async goto(): Promise<void> {
    await this.page.goto('/register');
  }

  /**
   * Wait for institution and role dropdowns to finish loading.
   * The register page fires two parallel API calls on mount — never interact
   * with the selects before this resolves.
   */
  async waitForDropdownsToLoad(): Promise<void> {
    // Wait for at least one real institution option beyond the placeholder
    await expect(
      this.institutionSelect.locator('option').nth(1)
    ).toBeAttached({ timeout: 10_000 });
  }

  async fillFullName(name: string): Promise<void> {
    await this.fullNameInput.fill(name);
  }

  async selectInstitution(instid: string): Promise<void> {
    await this.institutionSelect.selectOption({ value: instid });
  }

  async fillOtherInstitution(name: string): Promise<void> {
    await this.otherInstitutionInput.fill(name);
  }

  async fillEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  async uploadCertificate(filePath: string): Promise<void> {
    // setInputFiles works on hidden inputs — no need to click the label first
    await this.certificateFileInput.setInputFiles(filePath);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  async clickBack(): Promise<void> {
    await this.backButton.click();
  }

  /**
   * Fill all required fields with sensible defaults, with optional per-field overrides.
   * Waits for dropdowns to load first.
   */
  async fillValidForm(overrides: Partial<RegistrationData> = {}): Promise<void> {
    const data: RegistrationData = { ...DEFAULTS, ...overrides };

    await this.waitForDropdownsToLoad();
    await this.fillFullName(data.fullName);
    await this.selectInstitution(data.institutionId);
    await this.fillEmail(data.email);
    await this.fillPassword(data.password);
    await this.uploadCertificate(data.filePath);
  }

  async expectSuccessMessage(): Promise<void> {
    await expect(this.successMessage).toBeVisible();
    await expect(this.successMessage).toContainText('Registration successful');
  }

  async expectErrorMessage(text: string | RegExp): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessage).toContainText(text);
  }

  async expectOtherInstitutionVisible(): Promise<void> {
    await expect(this.otherInstitutionInput).toBeVisible();
  }

  async expectOtherInstitutionHidden(): Promise<void> {
    await expect(this.otherInstitutionInput).not.toBeVisible();
  }

  async expectRedirectedToLogin(): Promise<void> {
    await expect(this.page).toHaveURL(/\/login/, { timeout: 5_000 });
  }

  async expectFileNameShown(name: string): Promise<void> {
    await expect(this.fileName).toBeVisible();
    await expect(this.fileName).toContainText(name);
  }

  async expectSubmitButtonText(text: 'Submit registration' | 'Submitting...'): Promise<void> {
    await expect(this.submitButton).toContainText(text);
  }

  async expectAllInputsDisabled(): Promise<void> {
    await expect(this.fullNameInput).toBeDisabled();
    await expect(this.institutionSelect).toBeDisabled();
    await expect(this.emailInput).toBeDisabled();
    await expect(this.passwordInput).toBeDisabled();
    await expect(this.submitButton).toBeDisabled();
  }
}
