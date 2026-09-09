import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:5173'
const TEST_EMAIL = 'playwright.test@correo.com'
const TEST_PASSWORD = 'Playwright1!'

/**
 * Reporter de DOM: imprime botones, links, inputs y headings visibles.
 * Esto funciona sin soporte de imágenes — audita la estructura real.
 */
async function reportarDom(page: Page, etiqueta: string) {
  const datos = await page.evaluate(() => {
    const visibles = (sel: string) =>
      Array.from(document.querySelectorAll(sel))
        .filter((el) => {
          const r = el.getBoundingClientRect()
          return r.width > 0 && r.height > 0
        })
        .map((el) => {
          const t = (el.textContent || '').trim().slice(0, 60)
          const aria = el.getAttribute('aria-label')
          return { tag: el.tagName, texto: t, aria, placeholder: el.getAttribute('placeholder'), name: el.getAttribute('name') }
        })
    return {
      url: location.pathname + location.search,
      botones: visibles('button'),
      links: visibles('a'),
      inputs: visibles('input'),
      headings: visibles('h1, h2, h3'),
      tabs: visibles('[role="tab"]'),
      dialogs: visibles('[role="dialog"]'),
    }
  })
  console.log(`\n┌─ ${etiqueta} @ ${datos.url}`)
  console.log(`│ Headings: ${JSON.stringify(datos.headings.map(h => h.texto))}`)
  console.log(`│ Botones: ${JSON.stringify(datos.botones.map(b => b.texto || b.aria))}`)
  console.log(`│ Links: ${JSON.stringify(datos.links.map(l => l.texto))}`)
  console.log(`│ Inputs: ${JSON.stringify(datos.inputs.map(i => i.name || i.placeholder))}`)
  console.log(`│ Tabs: ${JSON.stringify(datos.tabs.map(t => t.texto))}`)
  console.log(`│ Dialogs: ${JSON.stringify(datos.dialogs.map(d => d.texto || d.aria))}`)
  console.log(`└─`)
}

test('Auditoría DOM del flujo cartilla → categoría → item → pictograma', async ({ page }) => {
  await page.goto(`${BASE}/login`)
  await page.getByLabel('Email').fill(TEST_EMAIL)
  await page.getByLabel('Contraseña').fill(TEST_PASSWORD)
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await page.waitForURL(/\/pacientes/, { timeout: 15_000 })
  await reportarDom(page, 'Dashboard (pacientes)')

  // Ir a cartillas del primer paciente
  const linkCartillas = page.locator('a[href*="cartillas"]').first()
  await linkCartillas.click()
  await page.waitForURL(/\/cartillas/, { timeout: 10_000 })
  await page.waitForLoadState('networkidle')
  await reportarDom(page, 'Lista de cartillas')

  // Botón "Nueva cartilla"
  const botonesNueva = page.getByRole('button', { name: /nueva cartilla/i })
  const cnt = await botonesNueva.count()
  console.log(`\n>>> Botones "Nueva cartilla" encontrados: ${cnt}`)
  if (cnt > 0) {
    await botonesNueva.first().click()
    await page.waitForTimeout(600)
    await reportarDom(page, 'Dialog nueva cartilla')
  } else {
    console.log('>>> NO SE ENCONTRÓ el botón Nueva cartilla — el flujo se corta acá')
    // Buscar links con texto similar
    const linksCart = page.locator('a', { hasText: /cartilla/i })
    console.log(`>>> Links con "cartilla" en el texto: ${await linksCart.count()}`)
  }
})