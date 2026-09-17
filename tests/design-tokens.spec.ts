import { test, expect, request as playwrightRequest, type Locator, type Page } from '@playwright/test'

const BASE = 'http://localhost:5173'
const API_BASE = 'http://localhost:8080'
const TERAPEUTA_STORAGE_STATE = 'tests/.auth/shell-navegacion.json'

/**
 * Valor de `--primary` que esta unidad adopta: el mismo azul que hoy solo
 * usa `--sidebar-primary` (verbatim), en ambos temas — ver
 * sdd/design-foundation/design. `--sidebar-primary` pasa a derivar de
 * `--primary` (`var(--primary)`) en vez de declarar un literal
 * independiente, en `:root` y en `.dark`.
 */
const PRIMARY_LIGHT = 'oklch(0.546 0.245 262.881)'
const PRIMARY_DARK = 'oklch(0.488 0.243 264.376)'
const PRIMARY_FOREGROUND_DARK = 'oklch(0.985 0 0)'

/** Lee valores crudos de custom properties CSS en <html>, sin conversión de color. */
function leerVariables(page: Page, nombres: string[]) {
  return page.evaluate((vars) => {
    const estilos = getComputedStyle(document.documentElement)
    return Object.fromEntries(vars.map((v) => [v, estilos.getPropertyValue(v).trim()]))
  }, nombres)
}

test.describe('Design tokens — derivación de --primary (light)', () => {
  test('--primary resuelve al azul de acción que antes solo tenía --sidebar-primary', async ({
    page,
  }) => {
    await page.goto(`${BASE}/login`)
    const valores = await leerVariables(page, ['--primary'])
    expect(valores['--primary']).toBe(PRIMARY_LIGHT)
  })

  test('--sidebar-primary deriva de --primary, no declara un literal independiente', async ({
    page,
  }) => {
    await page.goto(`${BASE}/login`)
    const valores = await leerVariables(page, ['--primary', '--sidebar-primary'])
    expect(valores['--sidebar-primary']).toBe(valores['--primary'])
    expect(valores['--sidebar-primary']).toBe(PRIMARY_LIGHT)
  })
})

test.describe('Design tokens — derivación de --primary (dark, forzado sin ThemeProvider)', () => {
  // La app no aplica `.dark` en ninguna ruta hoy (sin ThemeProvider): se
  // fuerza la clase manualmente para verificar la cascada CSS de forma
  // automatizada, en vez de dejarlo solo a revisión de código.
  test('--primary resuelve al azul de acción oscuro y --sidebar-primary se re-declara dentro de .dark', async ({
    page,
  }) => {
    await page.goto(`${BASE}/login`)
    await page.evaluate(() => document.documentElement.classList.add('dark'))

    const valores = await leerVariables(page, ['--primary', '--sidebar-primary'])
    expect(valores['--primary']).toBe(PRIMARY_DARK)
    // Si --sidebar-primary NO se re-declarara dentro de .dark, heredaría el
    // valor ya sustituido contra el --primary claro (la sustitución de
    // custom properties ocurre en el punto de declaración) en vez de volver
    // a sustituir contra el --primary oscuro.
    expect(valores['--sidebar-primary']).toBe(PRIMARY_DARK)
  })

  test('--primary-foreground se vuelve casi blanco en dark (antes casi negro, fallaba AA contra el nuevo azul)', async ({
    page,
  }) => {
    await page.goto(`${BASE}/login`)
    await page.evaluate(() => document.documentElement.classList.add('dark'))

    const valores = await leerVariables(page, ['--primary-foreground'])
    expect(valores['--primary-foreground']).toBe(PRIMARY_FOREGROUND_DARK)
  })
})

test.describe('Design tokens — zero-delta en consumidores existentes de bg-sidebar-primary (TERAPEUTA)', () => {
  test.use({ storageState: 'tests/.auth/shell-navegacion.json' })

  test('NavItem activo del sidebar conserva el mismo azul renderizado', async ({ page }) => {
    await page.goto(`${BASE}/pacientes`)
    const navItem = page.locator('aside:visible a[aria-current="page"]')
    await expect(navItem).toHaveCSS('background-color', PRIMARY_LIGHT)
  })

  test('logo de SidebarNav conserva el mismo azul renderizado', async ({ page }) => {
    await page.goto(`${BASE}/pacientes`)
    const logo = page.locator('aside:visible span.bg-sidebar-primary')
    await expect(logo).toHaveCSS('background-color', PRIMARY_LIGHT)
  })

  test('PacienteAvatar conserva el mismo azul de texto', async ({ page }) => {
    await page.goto(`${BASE}/pacientes`)
    const avatar = page.locator('main span.text-sidebar-primary').first()
    await expect(avatar).toHaveCSS('color', PRIMARY_LIGHT)
  })

  test('CTA "Nuevo paciente" de Lista conserva el mismo azul renderizado', async ({ page }) => {
    await page.goto(`${BASE}/pacientes`)
    const cta = page.getByRole('link', { name: 'Nuevo paciente' }).first()
    await expect(cta).toHaveCSS('background-color', PRIMARY_LIGHT)
  })
})

test.describe('Design tokens — zero-delta en consumidores existentes de bg-sidebar-primary (FAMILIAR)', () => {
  // Usa el storageState por defecto del proyecto "design-tokens"
  // (tests/.auth/pictogramas-guard-familiar.json — cuenta FAMILIAR ya
  // vinculada como colaboradora al paciente de fixtures de TERAPEUTA).
  test('CTA "Ver cartillas" de FamiliarDashboard conserva el mismo azul renderizado', async ({
    page,
  }) => {
    await page.goto(`${BASE}/familiar`)
    const cta = page.getByRole('link', { name: /Ver cartillas/ }).first()
    await expect(cta).toHaveCSS('background-color', PRIMARY_LIGHT)
  })
})

/**
 * PictogramaTile (variante "preview") — regresión de identidad de clase tras
 * el refactor de design-foundation PR2 (ver sdd/design-foundation/design,
 * Focus Point 2: "class strings copiadas byte-for-byte"). El root del tile
 * es un <div> estático (sin `cn`/twMerge de un `Button`), así que este valor
 * SÍ puede compararse contra el string literal documentado en el diseño —a
 * diferencia del tile de uso (ver tests/modo-uso.spec.ts), que compone
 * `Button` y necesita el valor capturado en vivo.
 */
const CLASE_TILE_PREVIEW =
  'flex h-full w-full flex-col items-center gap-2 rounded-lg border border-border px-3 py-3 text-center'

test.describe('PictogramaTile — identidad de clase en CartillaView (preview, TERAPEUTA con datos reales)', () => {
  test.use({ storageState: TERAPEUTA_STORAGE_STATE })

  let pacienteId: string
  let cartillaId: string

  test.beforeAll(async () => {
    const api = await playwrightRequest.newContext({ storageState: TERAPEUTA_STORAGE_STATE })

    const pacientesResp = await api.get(`${API_BASE}/api/pacientes`)
    const pacientes = (await pacientesResp.json()) as Array<{ id: string }>
    pacienteId = pacientes[0].id

    const cartillaResp = await api.post(`${API_BASE}/api/pacientes/${pacienteId}/cartillas`, {
      data: { nombre: `[E2E CartillaView] ${Date.now()}` },
    })
    const cartilla = (await cartillaResp.json()) as { id: string }
    cartillaId = cartilla.id

    const categoriaResp = await api.post(
      `${API_BASE}/api/pacientes/${pacienteId}/cartillas/${cartillaId}/categorias`,
      { data: { nombre: 'Comidas', colorHex: '#4287f5', orden: 0 } },
    )
    const categoria = (await categoriaResp.json()) as { id: string }

    const pictogramasResp = await api.get(`${API_BASE}/api/pictogramas-globales`)
    const pictogramas = (await pictogramasResp.json()) as Array<{ id: string }>

    await api.post(
      `${API_BASE}/api/pacientes/${pacienteId}/cartillas/${cartillaId}/categorias/${categoria.id}/items`,
      { data: { textoHablado: 'Agua', ordenVisual: 0, recursoGlobalId: pictogramas[0].id } },
    )

    await api.dispose()
  })

  test.afterAll(async () => {
    if (!pacienteId || !cartillaId) return
    const api = await playwrightRequest.newContext({ storageState: TERAPEUTA_STORAGE_STATE })
    await api.delete(`${API_BASE}/api/pacientes/${pacienteId}/cartillas/${cartillaId}`)
    await api.dispose()
  })

  test('el tile de preview conserva exactamente la clase de chrome documentada en el diseño', async ({
    page,
  }) => {
    await page.goto(`${BASE}/pacientes/${pacienteId}/cartillas/${cartillaId}`)

    // El tile de preview es un <div> sin rol de botón (no interactivo, ver
    // design "preview es estático: no focosable, sin tab stop") — se
    // escopea al <li> del grid para llegar a su único hijo.
    const tile = page.locator('li').filter({ hasText: 'Agua' }).locator('> div').first()
    await expect(tile).toHaveAttribute('class', CLASE_TILE_PREVIEW)
  })
})

/**
 * cartillas-revival Phase A (obs #87, tasks 1.1/1.5) — extiende la suite al
 * cluster de cartillas/pictogramas: ninguna clase `blue-(600|700)` ni
 * `accent-blue-600` debe sobrevivir la migración a `--primary`, el color
 * resuelto sigue siendo PRIMARY_LIGHT/PRIMARY_DARK en ambos temas, y el
 * anillo de foco de ListaCartillas adopta la convención del shell
 * (`focus-visible:ring-[3px] focus-visible:ring-sidebar-ring/50`, ver
 * `src/layouts/shell/NavItem.tsx:36`).
 */
async function expectSinClasesAzulLiteral(locator: Locator) {
  await expect(locator).not.toHaveClass(/blue-(600|700)/)
  await expect(locator).not.toHaveClass(/accent-blue-600/)
}

async function expectColorPrimarioEnAmbosTemas(
  page: Page,
  locator: Locator,
  propiedadCss: 'background-color' | 'color',
) {
  await expect(locator).toHaveCSS(propiedadCss, PRIMARY_LIGHT)
  await page.evaluate(() => document.documentElement.classList.add('dark'))
  await expect(locator).toHaveCSS(propiedadCss, PRIMARY_DARK)
  await page.evaluate(() => document.documentElement.classList.remove('dark'))
}

test.describe('Design tokens — cartillas cluster: browse surfaces (con datos, TERAPEUTA)', () => {
  test.use({ storageState: TERAPEUTA_STORAGE_STATE })

  let pacienteId: string
  let cartillaId: string
  let cartillaNombre: string
  let etiquetaPictogramaCustom: string

  test.beforeAll(async () => {
    const api = await playwrightRequest.newContext({ storageState: TERAPEUTA_STORAGE_STATE })

    const pacienteResp = await api.post(`${API_BASE}/api/pacientes`, {
      data: { nombre: 'E2E', apellido: `BrowseTokens-${Date.now()}`, fechaNacimiento: '2015-01-01' },
    })
    const paciente = (await pacienteResp.json()) as { id: string }
    pacienteId = paciente.id

    cartillaNombre = `[E2E Browse] ${Date.now()}`
    const cartillaResp = await api.post(`${API_BASE}/api/pacientes/${pacienteId}/cartillas`, {
      data: { nombre: cartillaNombre },
    })
    const cartilla = (await cartillaResp.json()) as { id: string }
    cartillaId = cartilla.id

    const categoriaResp = await api.post(
      `${API_BASE}/api/pacientes/${pacienteId}/cartillas/${cartillaId}/categorias`,
      { data: { nombre: 'Comidas', colorHex: '#4287f5', orden: 0 } },
    )
    const categoria = (await categoriaResp.json()) as { id: string }

    const pictogramasResp = await api.get(`${API_BASE}/api/pictogramas-globales`)
    const pictogramas = (await pictogramasResp.json()) as Array<{ id: string }>

    await api.post(
      `${API_BASE}/api/pacientes/${pacienteId}/cartillas/${cartillaId}/categorias/${categoria.id}/items`,
      { data: { textoHablado: 'Agua', ordenVisual: 0, recursoGlobalId: pictogramas[0].id } },
    )

    etiquetaPictogramaCustom = `E2E Browse Custom ${Date.now()}`
    const PNG_1X1_BASE64 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='
    await api.post(`${API_BASE}/api/pacientes/${pacienteId}/pictogramas-custom`, {
      multipart: {
        etiqueta: etiquetaPictogramaCustom,
        archivo: {
          name: 'pictograma-e2e.png',
          mimeType: 'image/png',
          buffer: Buffer.from(PNG_1X1_BASE64, 'base64'),
        },
      },
    })

    await api.dispose()
  })

  test.afterAll(async () => {
    if (!pacienteId) return
    const api = await playwrightRequest.newContext({ storageState: TERAPEUTA_STORAGE_STATE })
    if (cartillaId) {
      await api.delete(`${API_BASE}/api/pacientes/${pacienteId}/cartillas/${cartillaId}`)
    }
    const pictogramasCustomResp = await api.get(
      `${API_BASE}/api/pacientes/${pacienteId}/pictogramas-custom`,
    )
    if (pictogramasCustomResp.ok()) {
      const items = (await pictogramasCustomResp.json()) as Array<{ id: string }>
      for (const item of items) {
        await api.delete(`${API_BASE}/api/pacientes/${pacienteId}/pictogramas-custom/${item.id}`)
      }
    }
    await api.delete(`${API_BASE}/api/pacientes/${pacienteId}`)
    await api.dispose()
  })

  test('ListaCartillas: anillo de foco de la card adopta la convención del shell', async ({
    page,
  }) => {
    await page.goto(`${BASE}/pacientes/${pacienteId}/cartillas`)
    const card = page.locator('a').filter({ hasText: cartillaNombre })
    await expect(card).toHaveClass(
      /focus-visible:ring-\[3px\] focus-visible:ring-sidebar-ring\/50/,
    )
    await expect(card).not.toHaveClass(/focus-visible:ring-2\b/)
  })

  test('ListaCartillas: ícono de la card migra a --primary sin blue-600/700', async ({ page }) => {
    await page.goto(`${BASE}/pacientes/${pacienteId}/cartillas`)
    const icono = page.locator('a').filter({ hasText: cartillaNombre }).locator('span').first()
    await expectSinClasesAzulLiteral(icono)
    await expectColorPrimarioEnAmbosTemas(page, icono, 'color')
  })

  test('ListaCartillas: CTA "Nueva cartilla" (header) migra a --primary sin blue-600/700', async ({
    page,
  }) => {
    await page.goto(`${BASE}/pacientes/${pacienteId}/cartillas`)
    const cta = page.getByRole('button', { name: 'Nueva cartilla' })
    await expectSinClasesAzulLiteral(cta)
    await expectColorPrimarioEnAmbosTemas(page, cta, 'background-color')
  })

  test('ListaCartillas: la card (tile) mide al menos 24x24 CSS px', async ({ page }) => {
    await page.goto(`${BASE}/pacientes/${pacienteId}/cartillas`)
    const card = page.locator('a').filter({ hasText: cartillaNombre })
    const caja = await card.boundingBox()
    expect(caja).not.toBeNull()
    expect(caja!.width).toBeGreaterThanOrEqual(24)
    expect(caja!.height).toBeGreaterThanOrEqual(24)
  })

  test('CartillaView: CTA "Abrir en modo uso" migra a --primary sin blue-600/700', async ({
    page,
  }) => {
    await page.goto(`${BASE}/pacientes/${pacienteId}/cartillas/${cartillaId}`)
    const cta = page.getByRole('link', { name: /Abrir en modo uso/ })
    await expectSinClasesAzulLiteral(cta)
    await expectColorPrimarioEnAmbosTemas(page, cta, 'background-color')
  })

  test('PictogramasCustom: CTA "Subir pictograma" (header) migra a --primary sin blue-600/700', async ({
    page,
  }) => {
    await page.goto(`${BASE}/pacientes/${pacienteId}/pictogramas`)
    const cta = page.getByRole('button', { name: 'Subir pictograma' })
    await expectSinClasesAzulLiteral(cta)
    await expectColorPrimarioEnAmbosTemas(page, cta, 'background-color')
  })

  test('PictogramasCustom: botón "Subir" del diálogo migra a --primary sin blue-600/700', async ({
    page,
  }) => {
    await page.goto(`${BASE}/pacientes/${pacienteId}/pictogramas`)
    await page.getByRole('button', { name: 'Subir pictograma' }).click()
    const submit = page.getByRole('button', { name: 'Subir', exact: true })
    await expectSinClasesAzulLiteral(submit)
    await expectColorPrimarioEnAmbosTemas(page, submit, 'background-color')
  })

  test('PictogramasCustom: el tile de pictograma custom mide al menos 24x24 CSS px', async ({
    page,
  }) => {
    await page.goto(`${BASE}/pacientes/${pacienteId}/pictogramas`)
    const tile = page.getByAltText(etiquetaPictogramaCustom)
    const caja = await tile.boundingBox()
    expect(caja).not.toBeNull()
    expect(caja!.width).toBeGreaterThanOrEqual(24)
    expect(caja!.height).toBeGreaterThanOrEqual(24)
  })
})

test.describe('Design tokens — cartillas cluster: browse surfaces (vacío, TERAPEUTA)', () => {
  test.use({ storageState: TERAPEUTA_STORAGE_STATE })

  let pacienteId: string

  test.beforeAll(async () => {
    const api = await playwrightRequest.newContext({ storageState: TERAPEUTA_STORAGE_STATE })
    const pacienteResp = await api.post(`${API_BASE}/api/pacientes`, {
      data: {
        nombre: 'E2E',
        apellido: `BrowseTokensVacio-${Date.now()}`,
        fechaNacimiento: '2015-01-01',
      },
    })
    const paciente = (await pacienteResp.json()) as { id: string }
    pacienteId = paciente.id
    await api.dispose()
  })

  test.afterAll(async () => {
    if (!pacienteId) return
    const api = await playwrightRequest.newContext({ storageState: TERAPEUTA_STORAGE_STATE })
    await api.delete(`${API_BASE}/api/pacientes/${pacienteId}`)
    await api.dispose()
  })

  test('ListaCartillas: CTA "Nueva cartilla" del estado vacío migra a --primary sin blue-600/700', async ({
    page,
  }) => {
    await page.goto(`${BASE}/pacientes/${pacienteId}/cartillas`)
    const cta = page
      .locator('[data-slot="card"]')
      .filter({ hasText: 'Sin cartillas' })
      .getByRole('button', { name: 'Nueva cartilla' })
    await expectSinClasesAzulLiteral(cta)
    await expectColorPrimarioEnAmbosTemas(page, cta, 'background-color')
  })

  test('PictogramasCustom: CTA "Subir pictograma" del estado vacío migra a --primary sin blue-600/700', async ({
    page,
  }) => {
    await page.goto(`${BASE}/pacientes/${pacienteId}/pictogramas`)
    const cta = page
      .locator('[data-slot="card"]')
      .filter({ hasText: 'Sin pictogramas custom' })
      .getByRole('button', { name: 'Subir pictograma' })
    await expectSinClasesAzulLiteral(cta)
    await expectColorPrimarioEnAmbosTemas(page, cta, 'background-color')
  })
})
