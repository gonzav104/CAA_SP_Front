import { test, expect, request as playwrightRequest } from '@playwright/test'

const BASE = 'http://localhost:5173'
const API_BASE = 'http://localhost:8080'
const TERAPEUTA_STORAGE_STATE = 'tests/.auth/shell-navegacion.json'

const ITEM_1 = 'Agua'
const ITEM_2 = 'Pelota'

/**
 * Class attribute exacto del tile de uso, re-capturado (`getAttribute('class')`
 * vía render real de `PictogramaTile`, mismo `cn(buttonVariants({...}))` que
 * produce Playwright) DESPUÉS de la migración de tokens Zona B (sdd/modo-uso-zona-b,
 * tarea 1.9). Este valor DELIBERADAMENTE difiere del capturado en
 * sdd/design-foundation — la ruptura es esperada y revisada, nunca una
 * regresión a perseguir: `border-white/70`/`bg-white`/`text-slate-800`
 * (alpha, ad-hoc) pasan a sus equivalentes opacos `zona-b-*`.
 */
const CLASE_TILE_USO_BASE_COMMIT =
  "group/button shrink-0 bg-clip-padding text-sm font-medium whitespace-nowrap outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 h-11 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 flex min-h-[120px] min-w-[120px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-zona-b-border-soft bg-zona-b-surface-raised p-2 text-zona-b-foreground shadow-sm transition-transform hover:bg-zona-b-surface-raised hover:shadow-md active:scale-95"

/**
 * Fixture de datos reales: crea una cartilla + categoría + 2 items vía API
 * (backend real en :8080, mismo patrón de `auditoria-flujo-completo.spec.ts`
 * pero sin pasar por la UI del editor — más rápido y estable). Se limpia en
 * `afterAll`. El paciente se resuelve dinámicamente (no se hardcodea el UUID:
 * ver el gotcha de PR2 — los IDs de fixtures cambian entre resets del backend
 * compartido).
 */
let pacienteId: string
let cartillaId: string

test.describe('ModoUso — comportamiento, accesibilidad y sizing (TERAPEUTA con datos reales)', () => {
  test.use({ storageState: TERAPEUTA_STORAGE_STATE })

  test.beforeAll(async () => {
    const api = await playwrightRequest.newContext({ storageState: TERAPEUTA_STORAGE_STATE })

    const pacientesResp = await api.get(`${API_BASE}/api/pacientes`)
    const pacientes = (await pacientesResp.json()) as Array<{ id: string }>
    pacienteId = pacientes[0].id

    const cartillaResp = await api.post(`${API_BASE}/api/pacientes/${pacienteId}/cartillas`, {
      data: { nombre: `[E2E ModoUso] ${Date.now()}` },
    })
    const cartilla = (await cartillaResp.json()) as { id: string }
    cartillaId = cartilla.id

    const categoriaResp = await api.post(
      `${API_BASE}/api/pacientes/${pacienteId}/cartillas/${cartillaId}/categorias`,
      { data: { nombre: 'Comidas', colorHex: '#4287f5', orden: 0 } },
    )
    const categoria = (await categoriaResp.json()) as { id: string }

    // El backend exige exactamente un recurso por item (recursoGlobalId O
    // recursoCustomId): se usan los dos primeros pictogramas globales
    // existentes como recurso; `textoHablado` es independiente de la
    // etiqueta del pictograma y es lo que la UI (y estos tests) usan.
    const pictogramasResp = await api.get(`${API_BASE}/api/pictogramas-globales`)
    const pictogramas = (await pictogramasResp.json()) as Array<{ id: string }>

    await api.post(
      `${API_BASE}/api/pacientes/${pacienteId}/cartillas/${cartillaId}/categorias/${categoria.id}/items`,
      { data: { textoHablado: ITEM_1, ordenVisual: 0, recursoGlobalId: pictogramas[0].id } },
    )
    await api.post(
      `${API_BASE}/api/pacientes/${pacienteId}/cartillas/${cartillaId}/categorias/${categoria.id}/items`,
      { data: { textoHablado: ITEM_2, ordenVisual: 1, recursoGlobalId: pictogramas[1].id } },
    )

    await api.dispose()
  })

  test.afterAll(async () => {
    if (!pacienteId || !cartillaId) return
    const api = await playwrightRequest.newContext({ storageState: TERAPEUTA_STORAGE_STATE })
    await api.delete(`${API_BASE}/api/pacientes/${pacienteId}/cartillas/${cartillaId}`)
    await api.dispose()
  })

  test('tocar un tile agrega la palabra a la frase, "Decir" dispara TTS y "Salir" pide confirmación', async ({
    page,
  }) => {
    // Reemplaza `speechSynthesis.speak` por un espía ANTES de que cargue la
    // app: `hablar()` (src/lib/tts.ts) llama al método real, así que esto
    // ejercita la producción real sin depender de que el entorno headless
    // tenga voces instaladas.
    await page.addInitScript(() => {
      const llamadas: string[] = []
      // @ts-expect-error -- instrumentación de test, no tipada
      window.__ttsLlamadas = llamadas
      window.speechSynthesis.speak = (utterance: SpeechSynthesisUtterance) => {
        llamadas.push(utterance.text)
      }
    })

    await page.goto(`${BASE}/uso/${pacienteId}/${cartillaId}`)

    const tile1 = page.getByRole('button', { name: `Agregar ${ITEM_1} a la frase` })
    await expect(tile1).toBeVisible()
    await tile1.click()

    // La palabra agregada aparece en el resumen de frase de BarraFrase
    // (RI-12: agrega, no habla). Se escopea al <span> aria-live (no al
    // selector genérico, que también matchea la región de notificaciones de
    // sonner) porque el mismo texto también aparece en el propio tile y, tras
    // agregarlo, en el chip.
    await expect(page.locator('span[aria-live="polite"]')).toHaveText(ITEM_1)

    const decirBtn = page.getByRole('button', { name: 'Decir', exact: true })
    await expect(decirBtn).toBeEnabled()
    await decirBtn.click()

    const llamadas = await page.evaluate(() => (window as unknown as { __ttsLlamadas: string[] }).__ttsLlamadas)
    expect(llamadas).toContain(ITEM_1)

    // Salir SIEMPRE pide confirmación (KU-1/D10).
    const salirTrigger = page.getByRole('button', { name: 'Salir', exact: true })
    await salirTrigger.click()
    const dialog = page.getByRole('alertdialog', { name: '¿Salir del modo de uso?' })
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: 'Salir', exact: true }).click()
    await page.waitForURL(new RegExp(`/pacientes/${pacienteId}$`), { timeout: 10_000 })
  })

  test('el tile expone como nombre accesible "Agregar {textoHablado} a la frase"', async ({ page }) => {
    await page.goto(`${BASE}/uso/${pacienteId}/${cartillaId}`)

    await expect(page.getByRole('button', { name: `Agregar ${ITEM_1} a la frase` })).toBeVisible()
    await expect(page.getByRole('button', { name: `Agregar ${ITEM_2} a la frase` })).toBeVisible()
  })

  test('el tile de uso mide al menos 120x120px (touch target)', async ({ page }) => {
    await page.goto(`${BASE}/uso/${pacienteId}/${cartillaId}`)

    const tile = page.getByRole('button', { name: `Agregar ${ITEM_1} a la frase` })
    const box = await tile.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.width).toBeGreaterThanOrEqual(120)
    expect(box!.height).toBeGreaterThanOrEqual(120)
  })

  test('presionar el tile produce feedback visual real (active:scale-95) y conserva su class exacta', async ({
    page,
  }) => {
    await page.goto(`${BASE}/uso/${pacienteId}/${cartillaId}`)

    const tile = page.getByRole('button', { name: `Agregar ${ITEM_1} a la frase` })
    await expect(tile).toBeVisible()

    // Aserción de regresión (aprobación): el `class` real del root no cambió
    // ni un byte respecto al commit base — prueba que la extracción a
    // PictogramaTile es "rendering-neutral" (ver design, Focus Point 2).
    await expect(tile).toHaveAttribute('class', CLASE_TILE_USO_BASE_COMMIT)

    // Aserción de comportamiento real: el navegador aplica `active:scale-95`
    // (Tailwind) solo mientras el botón está en estado `:active`. Tailwind v4
    // compila `scale-*` a la propiedad CSS nativa `scale` (no a la matriz
    // `transform`) — se lee esa propiedad directamente, no `transform`. En
    // reposo es "none"; con el mouse presionado pasa a "0.95".
    const box = await tile.boundingBox()
    expect(box).not.toBeNull()

    const escalaEnReposo = await tile.evaluate((el) => getComputedStyle(el).scale)
    expect(escalaEnReposo).toBe('none')

    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2)
    await page.mouse.down()
    // Margen mayor a la duración de `transition-transform` (~150-200ms) para
    // leer el valor YA asentado, no un frame intermedio de la animación.
    await page.waitForTimeout(400)
    const escalaPresionado = await tile.evaluate((el) => getComputedStyle(el).scale)
    await page.mouse.up()

    expect(escalaPresionado).toBe('0.95')
  })

  test('recargar la página en medio de una frase la restaura (sdd/modo-uso-zona-b, D3: sessionStorage)', async ({
    page,
  }) => {
    await page.goto(`${BASE}/uso/${pacienteId}/${cartillaId}`)

    await page.getByRole('button', { name: `Agregar ${ITEM_1} a la frase` }).click()
    await expect(page.locator('span[aria-live="polite"]')).toHaveText(ITEM_1)

    await page.reload()

    await expect(page.locator('span[aria-live="polite"]')).toHaveText(ITEM_1)
  })

  test('navegar atrás y volver a la misma cartilla restaura la frase', async ({ page }) => {
    await page.goto(`${BASE}/uso/${pacienteId}/${cartillaId}`)

    await page.getByRole('button', { name: `Agregar ${ITEM_1} a la frase` }).click()
    await expect(page.locator('span[aria-live="polite"]')).toHaveText(ITEM_1)

    await page.goto(`${BASE}/pacientes/${pacienteId}`)
    await page.goBack()

    await expect(page).toHaveURL(new RegExp(`/uso/${pacienteId}/${cartillaId}$`))
    await expect(page.locator('span[aria-live="polite"]')).toHaveText(ITEM_1)
  })

  test('«Limpiar» es reversible: ofrece «Deshacer» y restaura la frase sin confirmación (D4)', async ({
    page,
  }) => {
    await page.goto(`${BASE}/uso/${pacienteId}/${cartillaId}`)

    await page.getByRole('button', { name: `Agregar ${ITEM_1} a la frase` }).click()
    await expect(page.locator('span[aria-live="polite"]')).toHaveText(ITEM_1)

    await expect(page.getByRole('button', { name: 'Deshacer' })).toHaveCount(0)

    await page.getByRole('button', { name: 'Limpiar', exact: true }).click()
    await expect(page.locator('span[aria-live="polite"]')).toHaveText('Frase vacía')

    const deshacerBtn = page.getByRole('button', { name: 'Deshacer' })
    await expect(deshacerBtn).toBeVisible()
    await deshacerBtn.click()

    await expect(page.locator('span[aria-live="polite"]')).toHaveText(ITEM_1)
    await expect(page.getByRole('button', { name: 'Deshacer' })).toHaveCount(0)
  })

  test('el diálogo de salida ya no afirma que la frase "se pierde" al salir con palabras armadas', async ({
    page,
  }) => {
    await page.goto(`${BASE}/uso/${pacienteId}/${cartillaId}`)

    await page.getByRole('button', { name: `Agregar ${ITEM_1} a la frase` }).click()
    await expect(page.locator('span[aria-live="polite"]')).toHaveText(ITEM_1)

    await page.getByRole('button', { name: 'Salir', exact: true }).click()
    const dialog = page.getByRole('alertdialog', { name: '¿Salir del modo de uso?' })
    await expect(dialog).toBeVisible()
    await expect(dialog).not.toContainText('se pierde')
    await expect(dialog).toContainText('queda guardada')
  })

  test('«Borrar último» y «Limpiar» miden al menos 44x44px (touch target, SC 2.5.5) y conservan su nombre accesible', async ({
    page,
  }) => {
    await page.goto(`${BASE}/uso/${pacienteId}/${cartillaId}`)

    await page.getByRole('button', { name: `Agregar ${ITEM_1} a la frase` }).click()
    await expect(page.locator('span[aria-live="polite"]')).toHaveText(ITEM_1)

    const borrarUltimoBtn = page.getByRole('button', { name: 'Borrar último' })
    const limpiarBtn = page.getByRole('button', { name: 'Limpiar', exact: true })

    for (const boton of [borrarUltimoBtn, limpiarBtn]) {
      await expect(boton).toBeVisible()
      const box = await boton.boundingBox()
      expect(box).not.toBeNull()
      expect(box!.width).toBeGreaterThanOrEqual(44)
      expect(box!.height).toBeGreaterThanOrEqual(44)
    }

    // El nombre accesible no cambia al resolver el tamaño con la talla por
    // defecto del Button en vez de `size="dense"`.
    await expect(borrarUltimoBtn).toHaveAccessibleName('Borrar último')
    await expect(limpiarBtn).toHaveAccessibleName('Limpiar')
  })

  test('los botones de categoría en el nav lateral (≥md) miden al menos 44x44px', async ({ page }) => {
    await page.goto(`${BASE}/uso/${pacienteId}/${cartillaId}`)

    const categoriaBtn = page.getByRole('button', { name: 'Comidas' })
    await expect(categoriaBtn).toBeVisible()
    const box = await categoriaBtn.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.width).toBeGreaterThanOrEqual(44)
    expect(box!.height).toBeGreaterThanOrEqual(44)
  })

  test.describe('nav de categorías en strip horizontal (<md)', () => {
    test.use({ viewport: { width: 390, height: 844 } })

    test('los botones de categoría en el strip miden al menos 44x44px', async ({ page }) => {
      await page.goto(`${BASE}/uso/${pacienteId}/${cartillaId}`)

      const categoriaBtn = page.getByRole('button', { name: 'Comidas' })
      await expect(categoriaBtn).toBeVisible()
      const box = await categoriaBtn.boundingBox()
      expect(box).not.toBeNull()
      expect(box!.width).toBeGreaterThanOrEqual(44)
      expect(box!.height).toBeGreaterThanOrEqual(44)
    })
  })
})
