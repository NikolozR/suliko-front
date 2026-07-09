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
    // Setup projects — run first (as dependencies), write auth state to disk
    { name: 'setup-user',  testMatch: /auth\.setup\.ts/,  testDir: './tests' },
    { name: 'setup-admin', testMatch: /admin\.setup\.ts/, testDir: './tests' },

    // Public frontend smoke tests — no auth, no Supabase needed to pass.
    // This is the reliable "is the app healthy" signal and runs as its own CI job.
    {
      name: 'public',
      use: { ...devices['Desktop Chrome'] },
      testMatch: [
        /smoke\.spec\.ts/,
        /public-pages\.spec\.ts/,
        /navigation\.spec\.ts/,
        /pricing\.spec\.ts/,
        /referral\.spec\.ts/,
        /blog\.spec\.ts/,
        /auth\.spec\.ts/,
      ],
    },

    // Supabase-backed API routes — isolated so a Supabase outage on the
    // deployment doesn't take down the public suite.
    {
      name: 'api',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /api\.spec\.ts/,
    },

    // Authenticated user pages — needs the auth backend + a valid test account.
    {
      name: 'authenticated',
      use: { ...devices['Desktop Chrome'], storageState: 'playwright/.auth/user.json' },
      testMatch: /authenticated\.spec\.ts/,
      dependencies: ['setup-user'],
    },

    // Admin panel — needs the auth backend + a valid admin account.
    {
      name: 'admin',
      use: { ...devices['Desktop Chrome'], storageState: 'playwright/.auth/admin.json' },
      testMatch: /admin\.spec\.ts/,
      dependencies: ['setup-admin'],
    },
  ],
});
