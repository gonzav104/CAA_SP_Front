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

/**
 * sesiones-colaboradores (obs #102 Requirement 2, Decision 4) — WCAG 2.2 AA
 * (4.5:1) medido a mano contra los valores reales de `src/index.css`:
 * `text-primary` plano sobre `--card` da ~5.26:1 en light (PASA) pero solo
 * ~2.63:1 en dark (`--primary` dark L=0.488 vs `--card` dark L=0.205 —
 * FALLA). A diferencia de `--destructive`, que ya tiene un paso dark más
 * claro para texto (L 0.577→0.704), `--primary` reutiliza el mismo L que su
 * fondo de botón (pensado para pares junto a `--primary-foreground`, no
 * como texto plano sobre superficie). Remediación (Decisión 4): un paso de
 * texto más claro, mismo hue (264.376°), SOLO para estos dos usos nuevos —
 * el token compartido `--primary` no se toca (no debe repercutir en los
 * botones ya enviados que sí pasan por estar emparejados con
 * `--primary-foreground`). Verificado: ~5.44:1 en dark con este valor.
 */
const PRIMARY_TEXT_ON_SURFACE_DARK_AA = 'oklch(0.65 0.15 264.376)'

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

/**
 * cartillas-revival Phase C (obs #87, tasks 3.1/3.5) — extiende la suite a
 * `EditorCartilla`, `FormCategoriaInline`, `dialogos.tsx` (`DialogoNuevaCartilla`)
 * y `seccionCategoria.tsx`: ninguna clase `blue-(600|700)` ni `accent-blue-600`
 * sobrevive la migración a `--primary` (incluye la propiedad CSS `accent-color`
 * del checkbox «esPrincipal»), y el anillo de foco de los swatches de color de
 * `FormCategoriaInline` adopta la convención del shell (misma convención que
 * Phase A, `focus-visible:ring-[3px] focus-visible:ring-sidebar-ring/50`).
 */
test.describe('Design tokens — cartillas cluster: editor y forms inline (TERAPEUTA)', () => {
  test.use({ storageState: TERAPEUTA_STORAGE_STATE })

  let pacienteId: string
  let cartillaId: string

  test.beforeAll(async () => {
    const api = await playwrightRequest.newContext({ storageState: TERAPEUTA_STORAGE_STATE })

    const pacienteResp = await api.post(`${API_BASE}/api/pacientes`, {
      data: { nombre: 'E2E', apellido: `EditorTokens-${Date.now()}`, fechaNacimiento: '2015-01-01' },
    })
    const paciente = (await pacienteResp.json()) as { id: string }
    pacienteId = paciente.id

    const cartillaResp = await api.post(`${API_BASE}/api/pacientes/${pacienteId}/cartillas`, {
      data: { nombre: `[E2E EditorTokens] ${Date.now()}` },
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
    if (!pacienteId) return
    const api = await playwrightRequest.newContext({ storageState: TERAPEUTA_STORAGE_STATE })
    if (cartillaId) {
      await api.delete(`${API_BASE}/api/pacientes/${pacienteId}/cartillas/${cartillaId}`)
    }
    await api.delete(`${API_BASE}/api/pacientes/${pacienteId}`)
    await api.dispose()
  })

  test('EditorCartilla: checkbox "esPrincipal" migra su accent-color a --primary sin accent-blue-600', async ({
    page,
  }) => {
    await page.goto(`${BASE}/pacientes/${pacienteId}/cartillas/${cartillaId}/editar`)
    const checkbox = page.locator('#esPrincipal')
    await expectSinClasesAzulLiteral(checkbox)
    await expectColorPrimarioEnAmbosTemas(page, checkbox, 'accent-color')
  })

  test('EditorCartilla: CTA "Guardar" (cabecera) migra a --primary sin blue-600/700', async ({
    page,
  }) => {
    await page.goto(`${BASE}/pacientes/${pacienteId}/cartillas/${cartillaId}/editar`)
    const cta = page.getByRole('button', { name: 'Guardar' })
    await expectSinClasesAzulLiteral(cta)
    await expectColorPrimarioEnAmbosTemas(page, cta, 'background-color')
  })

  test('EditorCartilla: CTA "Agregar categoría" migra a --primary sin blue-600/700', async ({
    page,
  }) => {
    await page.goto(`${BASE}/pacientes/${pacienteId}/cartillas/${cartillaId}/editar`)
    const cta = page.getByRole('button', { name: 'Agregar categoría' })
    await expectSinClasesAzulLiteral(cta)
    await expectColorPrimarioEnAmbosTemas(page, cta, 'background-color')
  })

  test('FormCategoriaInline: swatch de color adopta la convención de anillo del shell', async ({
    page,
  }) => {
    await page.goto(`${BASE}/pacientes/${pacienteId}/cartillas/${cartillaId}/editar`)
    await page.getByRole('button', { name: 'Agregar categoría' }).click()
    const swatch = page.getByRole('radio', { name: 'Amarillo' })
    await expect(swatch).toHaveClass(
      /focus-visible:ring-\[3px\] focus-visible:ring-sidebar-ring\/50/,
    )
    await expect(swatch).not.toHaveClass(/focus-visible:ring-2\b/)
  })

  test('FormCategoriaInline: CTA "Crear categoría" migra a --primary sin blue-600/700', async ({
    page,
  }) => {
    await page.goto(`${BASE}/pacientes/${pacienteId}/cartillas/${cartillaId}/editar`)
    await page.getByRole('button', { name: 'Agregar categoría' }).click()
    const cta = page.getByRole('button', { name: 'Crear categoría' })
    await expectSinClasesAzulLiteral(cta)
    await expectColorPrimarioEnAmbosTemas(page, cta, 'background-color')
  })

  test('dialogos: checkbox "esPrincipal" de DialogoNuevaCartilla migra su accent-color a --primary sin accent-blue-600', async ({
    page,
  }) => {
    await page.goto(`${BASE}/pacientes/${pacienteId}/cartillas`)
    await page.getByRole('button', { name: 'Nueva cartilla' }).click()
    const checkbox = page.locator('#esPrincipal')
    await expectSinClasesAzulLiteral(checkbox)
    await expectColorPrimarioEnAmbosTemas(page, checkbox, 'accent-color')
  })

  test('dialogos: CTA "Crear cartilla" de DialogoNuevaCartilla migra a --primary sin blue-600/700', async ({
    page,
  }) => {
    await page.goto(`${BASE}/pacientes/${pacienteId}/cartillas`)
    await page.getByRole('button', { name: 'Nueva cartilla' }).click()
    const cta = page.getByRole('button', { name: 'Crear cartilla' })
    await expectSinClasesAzulLiteral(cta)
    await expectColorPrimarioEnAmbosTemas(page, cta, 'background-color')
  })

  test('seccionCategoria: los botones de ícono de un item miden al menos 24x24 CSS px', async ({
    page,
  }) => {
    await page.goto(`${BASE}/pacientes/${pacienteId}/cartillas/${cartillaId}/editar`)
    const editarItem = page.getByRole('button', { name: 'Editar item Agua' })
    const eliminarItem = page.getByRole('button', { name: 'Eliminar item Agua' })
    for (const boton of [editarItem, eliminarItem]) {
      const caja = await boton.boundingBox()
      expect(caja).not.toBeNull()
      expect(caja!.width).toBeGreaterThanOrEqual(24)
      expect(caja!.height).toBeGreaterThanOrEqual(24)
    }
  })

  test('seccionCategoria: los botones de ícono de un item usan el anillo de foco por defecto (sin ring-2 ring-ring obsoleto)', async ({
    page,
  }) => {
    await page.goto(`${BASE}/pacientes/${pacienteId}/cartillas/${cartillaId}/editar`)
    const editarItem = page.getByRole('button', { name: 'Editar item Agua' })
    await expect(editarItem).not.toHaveClass(/focus-visible:ring-2\b/)
  })

  test('FormItemInline: el botón "Quitar pictograma" mide al menos 24x24 CSS px (obs #85, Decisión 2 — el real exposure del panel graduado)', async ({
    page,
  }) => {
    await page.goto(`${BASE}/pacientes/${pacienteId}/cartillas/${cartillaId}/editar`)
    // El item "Agua" del fixture ya tiene un recursoGlobalId (ver beforeAll):
    // abrir su edición monta FormItemInline con `tienePictograma` true, así
    // que el botón "Quitar pictograma" (FormItemInline.tsx, junto al trigger)
    // renderiza sin necesitar seleccionar nada en el panel graduado.
    await page.getByRole('button', { name: 'Editar item Agua' }).click()
    const quitar = page.getByRole('button', { name: 'Quitar pictograma' })
    const caja = await quitar.boundingBox()
    expect(caja).not.toBeNull()
    expect(caja!.width).toBeGreaterThanOrEqual(24)
    expect(caja!.height).toBeGreaterThanOrEqual(24)
  })
})

/**
 * sesiones-colaboradores (obs #101/#102/#103) — extiende la suite a
 * ListaSesiones, NuevaSesion, EditarSesion, ListaColaboradores y
 * AgregarColaborador: ninguna clase `blue-(600|700)` sobrevive la migración
 * a `--primary` en las 7 ocurrencias de las 6 páginas afectadas, el color
 * resuelto sigue siendo PRIMARY_LIGHT/PRIMARY_DARK en ambos temas, el ghost
 * "Editar" adopta `text-primary hover:text-primary` (mismo shape que el
 * `text-destructive` de su hermano "Eliminar"), y el badge de avatar de
 * colaborador adopta `bg-primary/10 text-primary`.
 */
test.describe('Design tokens — sesiones y colaboradores cluster', () => {
  test.use({ storageState: TERAPEUTA_STORAGE_STATE })

  test.describe('sesiones: con datos (TERAPEUTA)', () => {
    let pacienteId: string
    let sesionId: string

    test.beforeAll(async () => {
      const api = await playwrightRequest.newContext({ storageState: TERAPEUTA_STORAGE_STATE })

      const pacienteResp = await api.post(`${API_BASE}/api/pacientes`, {
        data: { nombre: 'E2E', apellido: `SesionesTokens-${Date.now()}`, fechaNacimiento: '2015-01-01' },
      })
      const paciente = (await pacienteResp.json()) as { id: string }
      pacienteId = paciente.id

      const sesionResp = await api.post(`${API_BASE}/api/pacientes/${pacienteId}/sesiones`, {
        data: { fechaHora: new Date().toISOString(), objetivosTrabajados: 'E2E sesion tokens' },
      })
      const sesion = (await sesionResp.json()) as { id: string }
      sesionId = sesion.id

      await api.dispose()
    })

    test.afterAll(async () => {
      if (!pacienteId) return
      const api = await playwrightRequest.newContext({ storageState: TERAPEUTA_STORAGE_STATE })
      if (sesionId) {
        await api.delete(`${API_BASE}/api/pacientes/${pacienteId}/sesiones/${sesionId}`)
      }
      await api.delete(`${API_BASE}/api/pacientes/${pacienteId}`)
      await api.dispose()
    })

    test('ListaSesiones: CTA "Nueva sesión" (header) migra a --primary sin blue-600/700', async ({
      page,
    }) => {
      await page.goto(`${BASE}/pacientes/${pacienteId}/sesiones`)
      // Resetea el cursor: la posición del mouse persiste entre navegaciones
      // dentro del mismo worker de Playwright, y puede activar :hover
      // (bg-primary/80) sobre un elemento que casualmente cae bajo esas
      // coordenadas en la página recién cargada.
      await page.mouse.move(0, 0)
      const cta = page.getByRole('link', { name: 'Nueva sesión' })
      await expectSinClasesAzulLiteral(cta)
      await expectColorPrimarioEnAmbosTemas(page, cta, 'background-color')
    })

    test('ListaSesiones: ghost "Editar" migra su color de texto a --primary sin blue-600/700', async ({
      page,
    }) => {
      await page.goto(`${BASE}/pacientes/${pacienteId}/sesiones`)
      await page.mouse.move(0, 0)
      // Expandir el Accordion para montar el link "Editar" en el DOM.
      await page.locator('[data-slot="accordion-trigger"]').first().click()
      const editar = page.getByRole('link', { name: 'Editar' })
      await expectSinClasesAzulLiteral(editar)
      // WCAG 2.2 AA (4.5:1): text-primary plano sobre --card falla en dark
      // con el L compartido con el fondo de botón (~2.63:1) — remediado con
      // un paso de texto más claro, mismo hue, solo en dark (ver constante
      // PRIMARY_TEXT_ON_SURFACE_DARK_AA arriba).
      await expect(editar).toHaveCSS('color', PRIMARY_LIGHT)
      await page.evaluate(() => document.documentElement.classList.add('dark'))
      await expect(editar).toHaveCSS('color', PRIMARY_TEXT_ON_SURFACE_DARK_AA)
      await page.evaluate(() => document.documentElement.classList.remove('dark'))
    })

    test('NuevaSesion: CTA "Guardar sesión" migra a --primary sin blue-600/700', async ({
      page,
    }) => {
      await page.goto(`${BASE}/pacientes/${pacienteId}/sesiones/nuevo`)
      await page.mouse.move(0, 0)
      const cta = page.getByRole('button', { name: 'Guardar sesión' })
      await expectSinClasesAzulLiteral(cta)
      await expectColorPrimarioEnAmbosTemas(page, cta, 'background-color')
    })

    test('EditarSesion: CTA "Guardar cambios" migra a --primary sin blue-600/700', async ({
      page,
    }) => {
      await page.goto(`${BASE}/pacientes/${pacienteId}/sesiones/${sesionId}/editar`)
      await page.mouse.move(0, 0)
      const cta = page.getByRole('button', { name: 'Guardar cambios' })
      await expectSinClasesAzulLiteral(cta)
      await expectColorPrimarioEnAmbosTemas(page, cta, 'background-color')
    })
  })

  test.describe('sesiones: estado vacío (TERAPEUTA)', () => {
    let pacienteId: string

    test.beforeAll(async () => {
      const api = await playwrightRequest.newContext({ storageState: TERAPEUTA_STORAGE_STATE })
      const pacienteResp = await api.post(`${API_BASE}/api/pacientes`, {
        data: {
          nombre: 'E2E',
          apellido: `SesionesTokensVacio-${Date.now()}`,
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

    test('ListaSesiones: CTA "Nueva sesión" del estado vacío migra a --primary sin blue-600/700', async ({
      page,
    }) => {
      await page.goto(`${BASE}/pacientes/${pacienteId}/sesiones`)
      await page.mouse.move(0, 0)
      const cta = page
        .locator('[data-slot="card"]')
        .filter({ hasText: 'Sin sesiones' })
        .getByRole('link', { name: 'Nueva sesión' })
      await expectSinClasesAzulLiteral(cta)
      await expectColorPrimarioEnAmbosTemas(page, cta, 'background-color')
    })
  })

  test.describe('colaboradores: con datos (TERAPEUTA)', () => {
    const EMAIL_COLABORADOR_FIXTURE = 'playwright.familiar@correo.com'
    let pacienteId: string
    let usuarioId: string

    test.beforeAll(async () => {
      const api = await playwrightRequest.newContext({ storageState: TERAPEUTA_STORAGE_STATE })

      const pacienteResp = await api.post(`${API_BASE}/api/pacientes`, {
        data: {
          nombre: 'E2E',
          apellido: `ColaboradoresTokens-${Date.now()}`,
          fechaNacimiento: '2015-01-01',
        },
      })
      const paciente = (await pacienteResp.json()) as { id: string }
      pacienteId = paciente.id

      const colaboradorResp = await api.post(`${API_BASE}/api/pacientes/${pacienteId}/colaboradores`, {
        data: { email: EMAIL_COLABORADOR_FIXTURE, permiso: 'LECTURA' },
      })
      const colaborador = (await colaboradorResp.json()) as { usuarioId: string }
      usuarioId = colaborador.usuarioId

      await api.dispose()
    })

    test.afterAll(async () => {
      if (!pacienteId) return
      const api = await playwrightRequest.newContext({ storageState: TERAPEUTA_STORAGE_STATE })
      if (usuarioId) {
        await api.delete(`${API_BASE}/api/pacientes/${pacienteId}/colaboradores/${usuarioId}`)
      }
      await api.delete(`${API_BASE}/api/pacientes/${pacienteId}`)
      await api.dispose()
    })

    test('ListaColaboradores: CTA "Agregar colaborador" (header) migra a --primary sin blue-600/700', async ({
      page,
    }) => {
      await page.goto(`${BASE}/pacientes/${pacienteId}/colaboradores`)
      await page.mouse.move(0, 0)
      const cta = page.getByRole('link', { name: 'Agregar colaborador' })
      await expectSinClasesAzulLiteral(cta)
      await expectColorPrimarioEnAmbosTemas(page, cta, 'background-color')
    })

    test('ListaColaboradores: badge de avatar migra a bg-primary/10 text-primary sin blue-600/700', async ({
      page,
    }) => {
      await page.goto(`${BASE}/pacientes/${pacienteId}/colaboradores`)
      await page.mouse.move(0, 0)
      const badge = page.locator('main span.rounded-full').first()
      await expectSinClasesAzulLiteral(badge)
      // `bg-primary/10` resuelve a un `color-mix`/alpha derivado de --primary,
      // no al string sólido PRIMARY_LIGHT/PRIMARY_DARK — solo el texto
      // (`text-primary`, opacidad completa) es comparable byte-a-byte contra
      // el token resuelto; la ausencia de `blue-600/700` en la clase (arriba)
      // ya cubre el fondo. WCAG AA en dark: mismo paso de texto remediado
      // que el ghost "Editar" (ver PRIMARY_TEXT_ON_SURFACE_DARK_AA arriba).
      await expect(badge).toHaveCSS('color', PRIMARY_LIGHT)
      await page.evaluate(() => document.documentElement.classList.add('dark'))
      await expect(badge).toHaveCSS('color', PRIMARY_TEXT_ON_SURFACE_DARK_AA)
      await page.evaluate(() => document.documentElement.classList.remove('dark'))
    })

    test('AgregarColaborador: CTA "Agregar" migra a --primary sin blue-600/700', async ({
      page,
    }) => {
      await page.goto(`${BASE}/pacientes/${pacienteId}/colaboradores/agregar`)
      await page.mouse.move(0, 0)
      const cta = page.getByRole('button', { name: 'Agregar', exact: true })
      await expectSinClasesAzulLiteral(cta)
      await expectColorPrimarioEnAmbosTemas(page, cta, 'background-color')
    })
  })

  test.describe('colaboradores: estado vacío (TERAPEUTA)', () => {
    let pacienteId: string

    test.beforeAll(async () => {
      const api = await playwrightRequest.newContext({ storageState: TERAPEUTA_STORAGE_STATE })
      const pacienteResp = await api.post(`${API_BASE}/api/pacientes`, {
        data: {
          nombre: 'E2E',
          apellido: `ColaboradoresTokensVacio-${Date.now()}`,
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

    test('ListaColaboradores: CTA "Agregar colaborador" del estado vacío migra a --primary sin blue-600/700', async ({
      page,
    }) => {
      await page.goto(`${BASE}/pacientes/${pacienteId}/colaboradores`)
      await page.mouse.move(0, 0)
      const cta = page
        .locator('[data-slot="card"]')
        .filter({ hasText: 'Sin colaboradores' })
        .getByRole('link', { name: 'Agregar colaborador' })
      await expectSinClasesAzulLiteral(cta)
      await expectColorPrimarioEnAmbosTemas(page, cta, 'background-color')
    })
  })
})
