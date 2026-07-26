import { defineConfig, devices } from '@playwright/test';

const e2ePort = Number(process.env.E2E_PORT || 3000);
const e2eBaseURL = `http://127.0.0.1:${e2ePort}`;
const e2eServerCommand = process.env.E2E_SERVER_MODE === "production"
  ? `PORT=${e2ePort} NODE_ENV=production npm run start`
  : `PORT=${e2ePort} DISABLE_HMR=${process.env.DISABLE_HMR || "false"} npm run dev`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: e2eBaseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
      },
    },
  ],
  webServer: {
    command: e2eServerCommand,
    url: e2eBaseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180000,
  },
});
