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
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
      testIgnore: ['**/shell-navegacion.spec.ts', '**/shell-navegacion.setup.ts'],
    },
    {
      name: 'setup',
      testMatch: '**/shell-navegacion.setup.ts',
      use: { browserName: 'chromium' },
    },
    {
      name: 'shell-navegacion',
      testMatch: '**/shell-navegacion.spec.ts',
      use: {
        browserName: 'chromium',
        storageState: 'tests/.auth/shell-navegacion.json',
        viewport: { width: 390, height: 844 },
      },
      dependencies: ['setup'],
    },
  ],
})