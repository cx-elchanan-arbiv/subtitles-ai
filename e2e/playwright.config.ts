import { defineConfig, devices } from '@playwright/test';

/**
 * E2E Testing Configuration for SubsTranslator
 *
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e/tests',

  // Maximum time one test can run for
  timeout: 10 * 60 * 1000, // 10 minutes (for long-running transcription)

  // Maximum time expect() should wait for condition to be met
  expect: {
    timeout: 30 * 1000, // 30 seconds
  },

  // Run tests in files in parallel
  fullyParallel: false, // Sequential for E2E tests (avoid overwhelming server)

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : 1, // Always 1 worker for E2E

  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    ...(process.env.CI ? [['github']] : []),
  ],

  // Shared settings for all the projects below
  use: {
    // Base URL for the application
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    // Collect trace when retrying the failed test
    trace: 'retain-on-failure',

    // Record video on failure
    video: 'retain-on-failure',

    // Take screenshot on failure
    screenshot: 'only-on-failure',

    // Maximum time each action can take
    actionTimeout: 30 * 1000, // 30 seconds

    // Browser viewport size
    viewport: { width: 1280, height: 720 },
  },

  // Configure projects for major browsers and test tiers
  projects: [
    // Smoke tests - fast, critical path checks (2-5 minutes)
    {
      name: 'smoke',
      testMatch: '**/smoke/**/*.spec.ts',
      timeout: 2 * 60 * 1000, // 2 minutes
      use: {
        ...devices['Desktop Chrome'],
        // Use mocked APIs for smoke tests
        launchOptions: {
          args: ['--disable-web-security'], // Allow CORS mocking
        },
      },
    },

    // E2E tests - complete user flows on production (10-15 minutes)
    {
      name: 'e2e',
      testMatch: '**/e2e/**/*.spec.ts',
      timeout: 10 * 60 * 1000, // 10 minutes
      use: {
        ...devices['Desktop Chrome'],
      },
    },

    // Critical path tests - main user journeys (5-15 minutes)
    {
      name: 'critical',
      testMatch: '**/critical/**/*.spec.ts',
      timeout: 15 * 60 * 1000, // 15 minutes
      use: {
        ...devices['Desktop Chrome'],
      },
    },

    // Extended tests - advanced features (10-30 minutes)
    {
      name: 'extended',
      testMatch: '**/extended/**/*.spec.ts',
      timeout: 30 * 60 * 1000, // 30 minutes
      use: {
        ...devices['Desktop Chrome'],
      },
    },

    // Regression tests - error handling & edge cases
    {
      name: 'regression',
      testMatch: '**/regression/**/*.spec.ts',
      timeout: 5 * 60 * 1000, // 5 minutes
      use: {
        ...devices['Desktop Chrome'],
      },
    },

    // Firefox testing (optional, for CI)
    {
      name: 'firefox',
      testMatch: '**/smoke/**/*.spec.ts',
      timeout: 2 * 60 * 1000,
      use: {
        ...devices['Desktop Firefox'],
      },
    },

    // Safari testing (optional, for CI)
    {
      name: 'webkit',
      testMatch: '**/smoke/**/*.spec.ts',
      timeout: 2 * 60 * 1000,
      use: {
        ...devices['Desktop Safari'],
      },
    },

    // Mobile Chrome (optional)
    {
      name: 'mobile-chrome',
      testMatch: '**/smoke/**/*.spec.ts',
      timeout: 2 * 60 * 1000,
      use: {
        ...devices['Pixel 5'],
      },
    },
  ],

  // Run your local dev server before starting the tests
  // Uncomment if you want to auto-start the dev server
  // webServer: {
  //   command: 'cd frontend && npm start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120 * 1000,
  // },
});
