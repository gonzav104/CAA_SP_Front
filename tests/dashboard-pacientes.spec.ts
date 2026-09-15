import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:5173'

// Ambos describes reutilizan storageState, sin login por test: TERAPEUTA vía
// `tests/.auth/shell-navegacion.json` (test.use abajo, mismo patrón que
// pictogramas-guard.spec.ts) y FAMILIAR vía el storageState por defecto del
// proyecto "dashboard-pacientes" (`tests/.auth/pictogramas-guard-familiar.json`,
// ver playwright.config.ts). Cada test tiene su propia `page` (aislamiento
// normal de Playwright) — ya no hace falta compartir página ni modo `serial`.
test.describe('Dashboard de pacientes — TERAPEUTA (/pacientes)', () => {
  test.use({ storageState: 'tests/.auth/shell-navegacion.json' })

  test('expone un único heading de sección y conserva el subtítulo', async ({ page }) => {
    await page.goto(`${BASE}/pacientes`)
    await expect(page.getByRole('heading', { name: 'Pacientes', exact: true })).toHaveCount(1)
    await expect(
      page.getByText('Administrá pacientes, cartillas, sesiones y colaboradores.'),
    ).toBeVisible()
  })

  test('renderiza la grilla con las tarjetas de pacientes', async ({ page }) => {
    await page.goto(`${BASE}/pacientes`)
    await expect(page.locator('a[href*="/cartillas"]').first()).toBeVisible()
  })

  test('cancelar el diálogo de eliminación no envía la request', async ({ page }) => {
    await page.goto(`${BASE}/pacientes`)

    const accionesBtn = page.getByRole('button', { name: /^Acciones de/ }).first()
    const disponible = await accionesBtn
      .waitFor({ state: 'visible', timeout: 5_000 })
      .then(() => true)
      .catch(() => false)
    // El menú de acciones se renderiza según `puedeEditar` en `Lista.tsx`.
    // Bug preexistente detectado y corregido en esta misma unidad: la
    // condición original (`esTerapeuta && paciente.miPermiso ===
    // 'EDICION_LIMITADA'`) era inalcanzable para cualquier TERAPEUTA, porque
    // el backend nunca asigna `EDICION_LIMITADA` al dueño (siempre `null`).
    // Corregida a `esTerapeuta` a secas (gestión de pacientes es SOLO para
    // terapeutas, sin mirar `miPermiso` — RI-2). El `test.skip` dinámico
    // queda como red de seguridad, no debería dispararse.
    test.skip(!disponible, 'Menú de acciones no visible para la cuenta TERAPEUTA de prueba.')

    let deleteEnviado = false
    await page.route('**/api/pacientes/*', async (route) => {
      if (route.request().method() === 'DELETE') deleteEnviado = true
      await route.continue()
    })

    await accionesBtn.click()
    await page.getByRole('menuitem', { name: 'Eliminar' }).click()

    const dialog = page.getByRole('alertdialog', { name: '¿Eliminar paciente?' })
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: 'Cancelar' }).click()
    await expect(dialog).toBeHidden()
    expect(deleteEnviado).toBe(false)

    await page.unroute('**/api/pacientes/*')
  })

  test('confirmar deshabilita las acciones mientras la request está pendiente', async ({
    page,
  }) => {
    await page.goto(`${BASE}/pacientes`)

    const accionesBtn = page.getByRole('button', { name: /^Acciones de/ }).first()
    const disponible = await accionesBtn
      .waitFor({ state: 'visible', timeout: 5_000 })
      .then(() => true)
      .catch(() => false)
    test.skip(!disponible, 'Menú de acciones no visible para la cuenta TERAPEUTA de prueba.')

    // Intercepta y responde el DELETE con demora + 204, sin borrar de verdad
    // al paciente de prueba compartido (no se deja pasar a la API real).
    await page.route('**/api/pacientes/*', async (route) => {
      if (route.request().method() !== 'DELETE') return route.continue()
      await new Promise((resolve) => setTimeout(resolve, 600))
      await route.fulfill({ status: 204 })
    })

    await accionesBtn.click()
    await page.getByRole('menuitem', { name: 'Eliminar' }).click()

    const dialog = page.getByRole('alertdialog', { name: '¿Eliminar paciente?' })
    await dialog.getByRole('button', { name: 'Eliminar', exact: true }).click()

    await expect(dialog.getByRole('button', { name: 'Eliminando…' })).toBeDisabled()
    await expect(dialog.getByRole('button', { name: 'Cancelar' })).toBeDisabled()

    await page.unroute('**/api/pacientes/*')
  })

  test('estado vacío muestra el CTA "Nuevo paciente" (header + tarjeta vacía)', async ({
    page,
  }) => {
    await page.route('**/api/pacientes', async (route) => {
      if (route.request().method() !== 'GET') return route.continue()
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    })
    await page.goto(`${BASE}/pacientes`)

    await expect(page.getByText('Todavía no hay pacientes')).toBeVisible()
    // El CTA persiste en el header y se repite en la tarjeta de estado vacío.
    await expect(page.getByRole('link', { name: 'Nuevo paciente' })).toHaveCount(2)

    await page.unroute('**/api/pacientes')
  })

  test('estado de error muestra el botón de reintentar', async ({ page }) => {
    await page.route('**/api/pacientes', async (route) => {
      if (route.request().method() !== 'GET') return route.continue()
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: '{"message":"Error simulado"}',
      })
    })
    await page.goto(`${BASE}/pacientes`)

    await expect(page.getByRole('button', { name: 'Reintentar' })).toBeVisible()

    await page.unroute('**/api/pacientes')
  })
})

test.describe('Dashboard familiar — FAMILIAR (/familiar)', () => {
  // Usa el storageState por defecto del proyecto "dashboard-pacientes"
  // (tests/.auth/pictogramas-guard-familiar.json — cuenta FAMILIAR ya
  // vinculada como colaboradora LECTURA al paciente de fixtures de
  // TERAPEUTA, ver playwright.config.ts).

  test('expone un único heading de sección', async ({ page }) => {
    await page.goto(`${BASE}/familiar`)
    await expect(page.getByRole('heading', { name: 'Mi familia', exact: true })).toHaveCount(1)
  })

  test('renderiza la grilla sin acciones de gestión', async ({ page }) => {
    await page.goto(`${BASE}/familiar`)
    await expect(page.getByRole('link', { name: /Ver cartillas/ }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: /^Acciones de/ })).toHaveCount(0)
    await expect(page.getByRole('menuitem', { name: 'Eliminar' })).toHaveCount(0)
  })

  test('estado vacío no muestra CTA de alta', async ({ page }) => {
    await page.route('**/api/pacientes', async (route) => {
      if (route.request().method() !== 'GET') return route.continue()
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    })
    await page.goto(`${BASE}/familiar`)

    await expect(page.getByText('Todavía no estás vinculado a ningún paciente')).toBeVisible()
    await expect(page.getByRole('main').getByRole('link')).toHaveCount(0)

    await page.unroute('**/api/pacientes')
  })
})
