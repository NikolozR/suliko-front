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
    // Setup projects — run first (as dependencies), write auth state to disk.
    // They type real credentials, which a trace records verbatim (and CI uploads the
    // report as an artifact), so no trace or video for them.
    { name: 'setup-user',  testMatch: /auth\.setup\.ts/,  testDir: './tests', use: { trace: 'off', video: 'off' } },
    { name: 'setup-admin', testMatch: /admin\.setup\.ts/, testDir: './tests', use: { trace: 'off', video: 'off' } },

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
        /office\.spec\.ts/,
        /route-progress\.spec\.ts/,
        /seo\.spec\.ts/,
        /access\.spec\.ts/,
        /site-api\.spec\.ts/,
      ],
    },

    // The API's blog and passport-template endpoints — isolated so an API
    // outage doesn't take down the public suite.
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
