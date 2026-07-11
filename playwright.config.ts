import { defineConfig, devices } from '@playwright/test';
import { nanoid } from 'nanoid';
import path from 'path';
import fs from 'node:fs';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

const PORT = process.env._PW_PORT
  ? parseInt(process.env._PW_PORT)
  : Math.floor(Math.random() * (59999 - 50000) + 50000);
process.env._PW_PORT = String(PORT);
const baseURL = `http://localhost:${PORT}`;

const WS_PORT = process.env._PW_WS_PORT
  ? parseInt(process.env._PW_WS_PORT)
  : Math.floor(Math.random() * (49999 - 40000) + 40000);
process.env._PW_WS_PORT = String(WS_PORT);
process.env.WS_PORT = String(WS_PORT);

const TEST_FOLDER = process.env._PW_DATA || path.resolve('tmp', 'data', nanoid(10));
process.env._PW_DATA = TEST_FOLDER;
// Set DATA so both the webServer process and test workers see the same sandbox dir
process.env.DATA = TEST_FOLDER;
fs.mkdirSync(TEST_FOLDER, { recursive: true });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Run tests serially to avoid shared DATA races between workers. */
  workers: 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['list'],
    ['./lib/conditionalJsonReporter.ts', { outputFile: path.join(TEST_FOLDER, 'results.json') }],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: baseURL,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  webServer: [
    {
      command: `npm run start -- --port ${PORT}`,
      url: baseURL,
      reuseExistingServer: false,
      stdout: 'pipe',
      env: { DATA: TEST_FOLDER },
    },
    {
      command: `npm --prefix server run start`,
      env: { PORT: String(WS_PORT), DATA: TEST_FOLDER },
      url: `http://localhost:${WS_PORT}/health`,
      reuseExistingServer: false,
      stdout: 'pipe',
    },
  ],
});
