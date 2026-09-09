import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:5173'
const TEST_EMAIL = 'playwright.test@correo.com'
const TEST_PASSWORD = 'Playwright1!'
const NOMBRE_CARTILLA = `[AUDIT] Flujo ${Date.now().toString().slice(-6)}`

/** Reporter de DOM: estructura visible sin depender de screenshots. */
async function reportarDom(page: Page, etiqueta: string) {
  const datos = await page.evaluate(() => {
    const visibles = (sel: string) =>
      Array.from(document.querySelectorAll(sel))
        .filter((el) => {
          const r = el.getBoundingClientRect()
          return r.width > 0 && r.height > 0
        })
        .map((el) => ({
          tag: el.tagName,
          texto: (el.textContent || '').trim().slice(0, 70),
          aria: el.getAttribute('aria-label'),
          placeholder: el.getAttribute('placeholder'),
          name: el.getAttribute('name'),
        }))
    return {
      url: location.pathname + location.search,
      botones: visibles('button'),
      inputs: visibles('input'),
      headings: visibles('h1, h2, h3, h4'),
      tabs: visibles('[role="tab"]'),
      radios: visibles('[role="radio"]').slice(0, 15),
      dialogs: visibles('[role="dialog"]'),
      avisos: visibles('[role="alert"]'),
    }
  })
  console.log(`\n┌─ ${etiqueta} @ ${datos.url}`)
  console.log(`│ Headings: ${JSON.stringify(datos.headings.map(h => h.texto))}`)
  console.log(`│ Botones: ${JSON.stringify(datos.botones.map(b => b.texto || b.aria))}`)
  console.log(`│ Inputs: ${JSON.stringify(datos.inputs.map(i => i.name || i.placeholder))}`)
  console.log(`│ Radios: ${JSON.stringify(datos.radios.map(r => r.aria || r.texto))}`)
  console.log(`│ Tabs: ${JSON.stringify(datos.tabs.map(t => t.texto))}`)
  console.log(`│ Dialogs: ${JSON.stringify(datos.dialogs.map(d => d.texto || d.aria))}`)
  console.log(`│ Avisos: ${JSON.stringify(datos.avisos.map(a => a.texto))}`)
  console.log(`└─`)
}

test('Auditoría DOM completa: cartilla → categoría → item → selector pictograma', async ({ page }) => {
  // 1. Login
  await page.goto(`${BASE}/login`)
  await page.getByLabel('Email').fill(TEST_EMAIL)
  await page.getByLabel('Contraseña').fill(TEST_PASSWORD)
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await page.waitForURL(/\/pacientes/, { timeout: 15_000 })

  // 2. Ir a cartillas del paciente de prueba
  await page.locator('a[href*="cartillas"]').first().click()
  await page.waitForURL(/\/cartillas/, { timeout: 10_000 })
  await page.waitForLoadState('networkidle')
  await reportarDom(page, '2. Lista de cartillas')

  // 3. Crear cartilla nueva
  await page.getByRole('button', { name: /nueva cartilla/i }).first().click()
  await page.getByRole('dialog').locator('input[name="nombre"]').fill(NOMBRE_CARTILLA)
  await page.getByRole('button', { name: 'Crear cartilla' }).click()
  // El alta navega al editor de la cartilla nueva; esperar el swap REAL de React
  // (el dialog de la lista debe desaparecer y el editor renderizarse).
  await page.waitForURL(/\/editar/, { timeout: 15_000 })
  await page.getByRole('dialog').waitFor({ state: 'detached', timeout: 10_000 })
  await page.getByRole('button', { name: 'Crear categoría' }).waitFor({ timeout: 10_000 })
  await page.waitForLoadState('networkidle')
  await reportarDom(page, '3. Editor (cartilla vacía)')

  // 4. Crear la primera categoría (form inline visible — cartilla vacía).
  // Anclar al form que CONTIENE el botón "Crear categoría" (la cabecera también
  // tiene un campo "Nombre" — no confundirlos).
  const formCategoria = page
    .locator('form')
    .filter({ has: page.getByRole('button', { name: 'Crear categoría' }) })
  await formCategoria.locator('input[name="nombre"]').fill('Acciones')
  await formCategoria.getByRole('button', { name: 'Crear categoría' }).click()
  // Espera a que la categoría aparezca
  await page.getByText('Acciones', { exact: true }).waitFor({ timeout: 10_000 })
  await page.waitForLoadState('networkidle')
  await reportarDom(page, '4. Editor con categoría creada')

  // 5. Abrir form de item dentro de la categoría
  await page.getByRole('button', { name: 'Item', exact: true }).click()
  await reportarDom(page, '5. Form item inline')

  // 6. Completar texto y abrir el selector de pictograma
  await page.getByLabel('Texto a hablar').fill('Quiero agua')
  await page.getByRole('button', { name: 'Seleccionar pictograma' }).click()
  const dialogPicto = page.getByRole('dialog')
  await dialogPicto.waitFor({ timeout: 10_000 })
  await reportarDom(page, '6. Dialog selector pictograma (tab Globales)')

  // 7. Tab ARASAAC con búsqueda real
  await dialogPicto.getByRole('tab', { name: /buscar en arasaac/i }).click()
  await dialogPicto.getByRole('textbox', { name: 'Buscar en ARASAAC' }).fill('agua')
  await page.waitForTimeout(1200) // debounce 250ms + fetch real
  // Esperar a que aparezcan resultados o el aviso de error/vacío
  await dialogPicto
    .locator('[role="radiogroup"] .text-xs, [role="radiogroup"] ~ * .text-xs')
    .first()
    .waitFor({ timeout: 15_000 })
    .catch(() => {})
  await reportarDom(page, '7. Tab ARASAAC con "agua"')
  const resultados = await dialogPicto.locator('[role="radiogroup"] [role="radio"]').count()
  console.log(`\n>>> Resultados ARASAAC visibles: ${resultados}`)

  // 8. Tab Custom (pictogramas del paciente)
  await dialogPicto.getByRole('tab', { name: /custom del paciente/i }).click()
  await page.waitForTimeout(800)
  await reportarDom(page, '8. Tab Custom')
})