import { defineConfig, devices } from '@playwright/test'

const PORT = 4173
const isCI = Boolean(process.env.CI)

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: isCI ? 2 : undefined,
  timeout: 60_000,
  reporter: [['list'], ['html', { open: 'never' }]],
  expect: {
    timeout: 10_000,

    toHaveScreenshot: { maxDiffPixelRatio: 0.03, animations: 'disabled', caret: 'hide' },
  },
  snapshotPathTemplate: '{testDir}/visual/__screenshots__/{projectName}/{arg}{ext}',
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {

      name: 'mobile',
      use: { ...devices['Pixel 7'] },
      grep: /@principal|@visual/,
    },
  ],
  webServer: {

    command: `npm run build:e2e && npm run preview:e2e -- --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !isCI,
    timeout: 180_000,
  },
})
