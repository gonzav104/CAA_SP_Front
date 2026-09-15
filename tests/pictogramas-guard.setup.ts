import { test as setup } from '@playwright/test'

const BASE = 'http://localhost:5173'
const FAMILIAR_EMAIL = 'playwright.familiar@correo.com'
const FAMILIAR_PASSWORD = 'Playwright1!'

const AUTH_FILE = 'tests/.auth/pictogramas-guard-familiar.json'

/**
 * Login único para pictogramas-guard.spec.ts, mismo patrón que
 * shell-navegacion.setup.ts: un solo login por corrida, storageState
 * reutilizado por todos los tests del describe FAMILIAR de ese spec.
 */
setup('autenticarse como FAMILIAR una vez para pictogramas-guard.spec.ts', async ({ page }) => {
  await page.goto(`${BASE}/login`)
  await page.getByLabel('Email').fill(FAMILIAR_EMAIL)
  await page.getByLabel('Contraseña').fill(FAMILIAR_PASSWORD)
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await page.waitForURL(/\/familiar/, { timeout: 15_000 })

  await page.context().storageState({ path: AUTH_FILE })
})
