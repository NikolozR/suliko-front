import { defineConfig, devices } from '@playwright/test';

const DEPLOYMENT_URL = process.env.DEPLOYMENT_URL ?? 'http://localhost:3000';
const BYPASS_SECRET = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 4 : 2,
  reporter: process.env.CI ? [['github'], ['html']] : 'list',
  use: {
    baseURL: DEPLOYMENT_URL,
    extraHTTPHeaders: BYPASS_SECRET
      ? { 'x-vercel-protection-bypass': BYPASS_SECRET }
      : {},
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    // Setup projects — run first, write auth state to disk
    { name: 'setup-user',  testMatch: /auth\.setup\.ts/,  testDir: './tests' },
    { name: 'setup-admin', testMatch: /admin\.setup\.ts/, testDir: './tests' },

    // Public + API tests (no auth required)
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: [/authenticated\.spec\.ts/, /admin\.spec\.ts/],
    },

    // Authenticated user pages
    {
      name: 'chromium-auth',
      use: { ...devices['Desktop Chrome'], storageState: 'playwright/.auth/user.json' },
      testMatch: /authenticated\.spec\.ts/,
      dependencies: ['setup-user'],
    },

    // Admin panel
    {
      name: 'chromium-admin',
      use: { ...devices['Desktop Chrome'], storageState: 'playwright/.auth/admin.json' },
      testMatch: /admin\.spec\.ts/,
      dependencies: ['setup-admin'],
    },
  ],
});
