import { defineConfig, devices } from '@playwright/test';

const DEPLOYMENT_URL = process.env.DEPLOYMENT_URL ?? 'http://localhost:3000';
const BYPASS_SECRET = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 2,
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
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
