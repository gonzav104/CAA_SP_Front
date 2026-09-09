import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  timeout: 300_000,
  use: {
    headless: false,
    viewport: { width: 1280, height: 800 },
    screenshot: 'on',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
})