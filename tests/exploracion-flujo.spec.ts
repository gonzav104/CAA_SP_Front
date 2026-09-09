import { test, expect } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SCREENSHOTS_DIR = path.join(__dirname, '..', 'screenshots', 'exploracion')
const BASE = 'http://localhost:5173'

// Usuario de prueba local creado vía API (no Google, para poder automatizar)
const TEST_EMAIL = 'playwright.test@correo.com'
const TEST_PASSWORD = 'Playwright1!'

test('Explorar flujo cartilla → categoría → item → pictograma', async ({ page }) => {
  // ── 1. Login con email/password ────────────────────────────────
  await page.goto(`${BASE}/login`)

  await page.getByLabel('Email').fill(TEST_EMAIL)
  await page.getByLabel('Contraseña').fill(TEST_PASSWORD)
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '00-login-lleno.png'), fullPage: true })

  await page.getByRole('button', { name: 'Ingresar' }).click()
  await page.waitForURL(/\/pacientes|\/familiar/, { timeout: 15_000 })
  console.log('✅ Sesión iniciada (login local)')

  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-dashboard.png'), fullPage: true })

  // ── 2. Ir al primer paciente de la lista ───────────────────────
  // Esperar a que cargue la lista de pacientes
  await page.waitForSelector('[data-slot="card"], a[href*="cartillas"]', { timeout: 15_000 })
  const primerPaciente = page.locator('a[href*="cartillas"]').first()
  if (await primerPaciente.isVisible().catch(() => false)) {
    await primerPaciente.click()
    await page.waitForURL(/\/pacientes\/[^/]+\/cartillas/, { timeout: 10_000 })
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02-lista-cartillas.png'), fullPage: true })
  }

  // ── 3. Crear nueva cartilla ────────────────────────────────────
  const btnNueva = page.getByRole('button', { name: /nueva cartilla/i })
  if (await btnNueva.isVisible().catch(() => false)) {
    await btnNueva.click()
    await page.waitForTimeout(500)
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03-dialog-nueva-cartilla.png'), fullPage: true })

    const inputNombre = page.locator('input[name="nombre"], input[placeholder*="nombre"]').first()
    if (await inputNombre.isVisible()) {
      await inputNombre.fill('Cartilla de prueba Playwright')
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04-nueva-cartilla-llenada.png'), fullPage: true })

      const btnCrear = page.getByRole('button', { name: /crear|guardar/i })
      if (await btnCrear.isVisible()) {
        await btnCrear.click()
        await page.waitForTimeout(1500)
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05-editor-vacio.png'), fullPage: true })
      }
    }
  }

  // ── 4. Crear primera categoría (formulario inline) ─────────────
  const btnAgregarCat = page.getByRole('button', { name: /agregar categoría/i })
  if (await btnAgregarCat.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await btnAgregarCat.click()
    await page.waitForTimeout(300)
  }

  // Buscar el form inline de categoría (puede tener nombre de campo variado)
  const inputCat = page.locator('input[name="nombre"]').first()
  if (await inputCat.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06-form-categoria-inline.png'), fullPage: true })

    await inputCat.fill('Comidas')
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '07-categoria-llenada.png'), fullPage: true })

    const btnGuardarCat = page.getByRole('button', { name: /guardar/i }).first()
    if (await btnGuardarCat.isVisible()) {
      await btnGuardarCat.click()
      await page.waitForTimeout(1500)
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '08-categoria-creada.png'), fullPage: true })
    }
  }

  // ── 5. Crear ítem (abre form inline de ítem) ───────────────────
  const btnAgregarItem = page.getByRole('button', { name: /nuevo ítem|agregar ítem|nuevo item/i }).first()
  if (await btnAgregarItem.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await btnAgregarItem.click()
    await page.waitForTimeout(300)
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '09-form-item-inline.png'), fullPage: true })

    const inputTexto = page.locator('input[name="textoHablado"], input[placeholder*="texto"]').first()
    if (await inputTexto.isVisible()) {
      await inputTexto.fill('Agua')
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '10-item-llenado.png'), fullPage: true })
    }
  }

  // ── 6. Abrir selector de pictogramas ───────────────────────────
  const btnSeleccionarPicto = page.getByRole('button', { name: /seleccionar pictograma/i }).first()
  if (await btnSeleccionarPicto.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await btnSeleccionarPicto.click()
    await page.waitForTimeout(500)
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '11-dialog-pictograma-globales.png'), fullPage: true })

    // ── 7. Tab de búsqueda ARASAAC ────────────────────────────────
    const tabArasaac = page.getByRole('tab', { name: /buscar.*arasaac/i })
    if (await tabArasaac.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await tabArasaac.click()
      await page.waitForTimeout(300)
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '12-tab-arasaac-vacio.png'), fullPage: true })

      const inputBusqueda = page.locator('input[placeholder*="buscar"], input[type="search"], input[role="searchbox"]').first()
      if (await inputBusqueda.isVisible()) {
        await inputBusqueda.fill('agua')
        await page.waitForTimeout(2000) // debounce + fetch ARASAAC
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '13-busqueda-arasaac-agua.png'), fullPage: true })
      }
    }

    // ── 8. Tab de pictogramas custom ──────────────────────────────
    const tabCustom = page.getByRole('tab', { name: /custom|propio/i })
    if (await tabCustom.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await tabCustom.click()
      await page.waitForTimeout(300)
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '14-tab-custom.png'), fullPage: true })
    }

    // Cerrar dialog
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
  }

  // ── 9. Vista final del editor con la categoría creada ──────────
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '15-editor-con-categoria.png'), fullPage: true })

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  Exploración completada.')
  console.log(`  Screenshots en: ${SCREENSHOTS_DIR}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
})