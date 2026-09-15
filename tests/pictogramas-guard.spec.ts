import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:5173'

/**
 * ID de un paciente real perteneciente a la cuenta TERAPEUTA de fixtures
 * (playwright.test@correo.com), usado únicamente para el test TERAPEUTA
 * (necesita datos reales para que la página renderice sin error de fetch).
 */
const PACIENTE_ID_TERAPEUTA = '6ed4fde4-6d7e-45c4-b870-2e2c8bde0c7c'

/**
 * ID ficticio: el guard de rol (RequiereTerapeuta) actúa ANTES de cualquier
 * fetch de datos del paciente, así que para el caso FAMILIAR el pacienteId
 * es irrelevante — cualquier valor sirve para probar la redirección.
 */
const PACIENTE_ID_FICTICIO = '00000000-0000-0000-0000-000000000000'

test.describe('Guard de rol en /pacientes/:pacienteId/pictogramas', () => {
  test.describe('FAMILIAR', () => {
    // Usa el storageState logueado una sola vez en pictogramas-guard.setup.ts
    // (ver playwright.config.ts, proyecto "pictogramas-guard").

    test('acceso por URL directa es redirigido a /familiar', async ({ page }) => {
      await page.goto(`${BASE}/pacientes/${PACIENTE_ID_FICTICIO}/pictogramas`)
      await page.waitForURL(/\/familiar$/, { timeout: 10_000 })
      await expect(page).toHaveURL(`${BASE}/familiar`)
    })
  })

  test.describe('TERAPEUTA', () => {
    // Reutiliza el storageState de shell-navegacion.setup.ts (misma cuenta
    // TERAPEUTA de fixtures), en vez de loguearse de nuevo.
    test.use({ storageState: 'tests/.auth/shell-navegacion.json' })

    test('acceso a la ruta renderiza la página normalmente', async ({ page }) => {
      await page.goto(`${BASE}/pacientes/${PACIENTE_ID_TERAPEUTA}/pictogramas`)
      await expect(page.getByRole('heading', { name: 'Pictogramas', level: 2 })).toBeVisible()
    })
  })
})
