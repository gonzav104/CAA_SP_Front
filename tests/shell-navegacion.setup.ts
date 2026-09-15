import { test as setup } from '@playwright/test'

const BASE = 'http://localhost:5173'
const TEST_EMAIL = 'playwright.test@correo.com'
const TEST_PASSWORD = 'Playwright1!'

/** Viewport móvil (<1024px) para que el trigger del drawer esté visible (`lg:hidden`). */
const VIEWPORT_MOBILE = { width: 390, height: 844 }

const AUTH_FILE = 'tests/.auth/shell-navegacion.json'

setup('autenticarse una vez para shell-navegacion.spec.ts', async ({ page }) => {
  await page.setViewportSize(VIEWPORT_MOBILE)
  await page.goto(`${BASE}/login`)
  await page.getByLabel('Email').fill(TEST_EMAIL)
  await page.getByLabel('Contraseña').fill(TEST_PASSWORD)
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await page.waitForURL(/\/pacientes|\/familiar/, { timeout: 15_000 })

  await page.context().storageState({ path: AUTH_FILE })
})
