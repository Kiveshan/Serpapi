import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/tests',
  timeout: 30_000,
  expect: { timeout: 8_000 },
  retries: process.env.CI ? 2 : 0,
  fullyParallel: true,
  // Cap workers to 1 locally to avoid DB unique-constraint races on mutation tests
  workers: process.env.CI ? 2 : 1,

  reporter: [
    ['html', { outputFolder: 'e2e/reports/html', open: 'never' }],
    ['list'],
    ...(process.env.CI
      ? ([['junit', { outputFile: 'e2e/reports/results.xml' }]] as const)
      : []),
  ],

  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    trace: 'on-first-retry',
    navigationTimeout: 15_000,
  },

  globalSetup: './e2e/global-setup.ts',

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Uncomment to enable cross-browser coverage:
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],

  webServer: [
    {
      command: 'npm run client',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: 'npm run server',
      url: 'http://localhost:5001/api/auth/roles',
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
  ],
});
