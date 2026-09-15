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
      testIgnore: [
        '**/shell-navegacion.spec.ts',
        '**/shell-navegacion.setup.ts',
        '**/pictogramas-guard.spec.ts',
        '**/pictogramas-guard.setup.ts',
        '**/dashboard-pacientes.spec.ts',
        '**/design-tokens.spec.ts',
        '**/modo-uso.spec.ts',
      ],
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
    {
      name: 'setup-pictogramas-guard',
      testMatch: '**/pictogramas-guard.setup.ts',
      use: { browserName: 'chromium' },
    },
    {
      name: 'pictogramas-guard',
      testMatch: '**/pictogramas-guard.spec.ts',
      use: {
        browserName: 'chromium',
        storageState: 'tests/.auth/pictogramas-guard-familiar.json',
      },
      // Depende de ambos setups: el propio (FAMILIAR) y el de
      // shell-navegacion (TERAPEUTA), cuyo storageState reutiliza el
      // describe TERAPEUTA de pictogramas-guard.spec.ts vía test.use().
      dependencies: ['setup-pictogramas-guard', 'setup'],
    },
    {
      name: 'dashboard-pacientes',
      testMatch: '**/dashboard-pacientes.spec.ts',
      use: {
        browserName: 'chromium',
        // Default FAMILIAR: el describe TERAPEUTA reutiliza
        // shell-navegacion.json vía test.use(), mismo patrón que
        // pictogramas-guard.spec.ts.
        storageState: 'tests/.auth/pictogramas-guard-familiar.json',
      },
      dependencies: ['setup-pictogramas-guard', 'setup'],
    },
    {
      name: 'design-tokens',
      testMatch: '**/design-tokens.spec.ts',
      use: {
        browserName: 'chromium',
        // Default FAMILIAR: el describe TERAPEUTA reutiliza
        // shell-navegacion.json vía test.use(), mismo patrón que
        // dashboard-pacientes.spec.ts.
        storageState: 'tests/.auth/pictogramas-guard-familiar.json',
      },
      dependencies: ['setup-pictogramas-guard', 'setup'],
    },
    {
      name: 'modo-uso',
      testMatch: '**/modo-uso.spec.ts',
      use: {
        browserName: 'chromium',
        // El describe único de este archivo usa test.use() para pisar el
        // storageState por TERAPEUTA (shell-navegacion.json): necesita crear
        // datos reales (cartilla/categoría/items) vía API antes de navegar a
        // /uso/..., y esa cuenta es la dueña del paciente de fixtures.
        storageState: 'tests/.auth/shell-navegacion.json',
      },
      dependencies: ['setup'],
    },
  ],
})