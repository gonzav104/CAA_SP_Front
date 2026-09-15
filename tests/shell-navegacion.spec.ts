import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:5173'

test.describe('Shell de navegación — drawer móvil', () => {
  test('abrir el drawer mueve el foco adentro y Tab cicla sin escapar al fondo', async ({ page }) => {
    await page.goto(`${BASE}/pacientes`)

    const trigger = page.getByRole('button', { name: 'Abrir menú de navegación' })
    await trigger.click()

    const drawer = page.getByRole('dialog', { name: 'Menú de navegación' })
    await expect(drawer).toBeVisible()

    // El foco debe entrar al drawer (primer elemento focosable dentro de él).
    await expect(drawer.locator(':focus')).toHaveCount(1)

    // Tab hasta el último elemento focosable del drawer y un Tab más NO debe
    // escapar al fondo — debe volver al primer elemento (ciclo).
    const focosables = drawer.locator('a[href], button:not([disabled])')
    const total = await focosables.count()
    expect(total).toBeGreaterThan(0)

    for (let i = 0; i < total; i++) {
      await page.keyboard.press('Tab')
    }
    // Tras recorrer todos los focosables del drawer, el próximo Tab cicla al primero.
    await expect(focosables.first()).toBeFocused()
  })

  test('Escape cierra el drawer y devuelve el foco al trigger', async ({ page }) => {
    await page.goto(`${BASE}/pacientes`)

    const trigger = page.getByRole('button', { name: 'Abrir menú de navegación' })
    await trigger.click()

    const drawer = page.getByRole('dialog', { name: 'Menú de navegación' })
    await expect(drawer).toBeVisible()

    await page.keyboard.press('Escape')

    // El drawer se cierra vía `inert` + `-translate-x-full` (transform), no
    // vía display/visibility — toBeHidden() no detecta transforms, así que
    // verificamos el mecanismo real de cierre (la propiedad JS `inert`).
    await expect(drawer).toHaveJSProperty('inert', true)
    await expect(trigger).toBeFocused()
  })

  test('click en el backdrop cierra el drawer y devuelve el foco al trigger', async ({ page }) => {
    await page.goto(`${BASE}/pacientes`)

    const trigger = page.getByRole('button', { name: 'Abrir menú de navegación' })
    await trigger.click()

    const drawer = page.getByRole('dialog', { name: 'Menú de navegación' })
    await expect(drawer).toBeVisible()

    // Backdrop: capa fixed inset-0 (z-30) por debajo del drawer (aside w-64
    // = 256px, z-40). Clickear fuera del ancho del panel (x=350 en un
    // viewport de 390px) evita que Playwright intercepte el click sobre el
    // propio drawer.
    await page.locator('div.fixed.inset-0.z-30').click({ position: { x: 350, y: 10 } })

    // Mismo mecanismo real de cierre que en el resto de tests: `inert`, no
    // display/visibility (ver comentario en el test de Escape).
    await expect(drawer).toHaveJSProperty('inert', true)
    await expect(trigger).toBeFocused()
  })

  test('cambio de ruta cierra el drawer', async ({ page }) => {
    await page.goto(`${BASE}/pacientes`)

    // En /pacientes (lista, sin pacienteId) el drawer solo tiene el item
    // "Pacientes" (ver navItems.ts: los items de paciente — Cartillas,
    // Sesiones, etc. — solo se agregan cuando hay pacienteId en la ruta), así
    // que clickearlo ahí navegaría a la MISMA ruta y jamás dispararía el
    // efecto de cierre por cambio de ruta. Para probar el cierre real,
    // primero entramos a la ficha de un paciente (agrega esos items al
    // drawer) y esperamos a que la página asiente antes de abrir el drawer.
    await page.locator('main a[href*="/cartillas"]').first().click()
    await page.waitForURL(/\/pacientes\/.+\/cartillas$/)
    await page.locator('h2', { hasText: 'Cartillas' }).waitFor()

    const trigger = page.getByRole('button', { name: 'Abrir menú de navegación' })
    await trigger.click()

    const drawer = page.getByRole('dialog', { name: 'Menú de navegación' })
    await expect(drawer).toBeVisible()

    // Ahora "Cartillas" es la ruta activa: navegar a un item genuinamente
    // distinto ("Sesiones") sí dispara el cierre por cambio de ruta.
    await drawer.getByRole('link', { name: 'Sesiones' }).click()

    // Mismo mecanismo real de cierre que en el resto de tests: `inert`, no
    // display/visibility (ver comentario en el test de Escape).
    await expect(drawer).toHaveJSProperty('inert', true)
  })

  test('con el drawer cerrado, sus links no son alcanzables con Tab (inert)', async ({ page }) => {
    await page.goto(`${BASE}/pacientes`)

    // Esperar a que el shell esté realmente montado (no quedarse en la
    // pantalla de "Cargando…" mientras se resuelve el usuario) antes de
    // inspeccionar el estado del drawer.
    const trigger = page.getByRole('button', { name: 'Abrir menú de navegación' })
    await expect(trigger).toBeVisible()

    const drawer = page.getByRole('dialog', { name: 'Menú de navegación' })
    await expect(drawer).toHaveJSProperty('inert', true)

    // `toBeVisible()` no detecta el ocultamiento por transform
    // (-translate-x-full): la propiedad CSS `visibility` del link sigue
    // siendo "visible" aunque esté fuera de pantalla, así que esa aserción
    // pasaría incluso con el drawer cerrado (mismo problema ya resuelto para
    // el contenedor del drawer vía `toHaveJSProperty('inert', ...)`).
    // `toBeInViewport()` sí verifica la posición real del elemento y detecta
    // correctamente que el link off-screen no es alcanzable.
    const primerLinkDrawer = drawer.locator('a[href]').first()
    await expect(primerLinkDrawer).not.toBeInViewport()

    // El drawer cerrado tiene `inert`: sus descendientes quedan fuera del árbol
    // de accesibilidad/foco aunque el nodo siga montado en el DOM.
    const esInerte = await page.evaluate(() => {
      const aside = document.querySelector('[aria-label="Menú de navegación"]')
      return aside?.hasAttribute('inert') ?? false
    })
    expect(esInerte).toBe(true)
  })
})

test.describe('Shell de navegación — estado activo', () => {
  test('aria-current="page" marca exactamente el item que matchea la ruta actual', async ({ page }) => {
    await page.goto(`${BASE}/pacientes`)

    // TERAPEUTA aterriza en /pacientes — el item "Pacientes" (end: true) debe estar activo.
    // Se escopea al <nav> del drawer móvil (dentro del dialog) porque
    // AppSidebar (desktop) y MobileNavDrawer comparten los mismos navItems y
    // ambos están montados simultáneamente en este viewport mobile; un
    // locator sin escopear matchea los dos <nav>.
    const drawerNav = page.getByRole('dialog', { name: 'Menú de navegación' })
    const activo = drawerNav.locator('a[aria-current="page"]')
    await expect(activo).toHaveCount(1)
    await expect(activo).toHaveText(/Pacientes/)
  })

  test('el item activo sigue marcado cuando la URL lleva query string', async ({ page }) => {
    await page.goto(`${BASE}/pacientes?foo=bar`)
    const drawerNav = page.getByRole('dialog', { name: 'Menú de navegación' })
    const activo = drawerNav.locator('a[aria-current="page"]')
    await expect(activo).toHaveCount(1)
    await expect(activo).toHaveText(/Pacientes/)
  })

  test('el foco por teclado en un item de nav muestra un anillo focus-visible', async ({ page }) => {
    await page.goto(`${BASE}/pacientes`)

    // El drawer arranca cerrado (`inert`) y sus descendientes no son
    // focosables mientras esté así (ver el test de "con el drawer cerrado…").
    // Hay que abrirlo antes de poder enfocar un item dentro de él.
    const trigger = page.getByRole('button', { name: 'Abrir menú de navegación' })
    await trigger.click()

    // Escopeado al <nav> del drawer móvil por la misma razón: AppSidebar
    // (desktop) queda oculto vía `hidden lg:flex` en este viewport y
    // `.first()` sin escopear podría tomar ese nodo en vez del visible.
    const drawerNav = page.getByRole('dialog', { name: 'Menú de navegación' })
    await expect(drawerNav).toBeVisible()
    const primerItem = drawerNav.locator('a').first()

    // `:focus-visible` (y por lo tanto el anillo) depende de la modalidad de
    // input detectada por el browser: un `.focus()` programático, sin una
    // interacción de teclado real de por medio, NO activa `:focus-visible`
    // en Chromium (verificado: con `.focus()` puro `boxShadow` da "none").
    // Como el test verifica específicamente "el foco POR TECLADO", usamos
    // `Tab` real en vez de `.focus()` — más fiel al nombre del test y a la
    // única forma en que el anillo realmente aparece.
    await page.keyboard.press('Tab')
    await expect(primerItem).toBeFocused()

    const tieneRing = await primerItem.evaluate((el) => {
      const estilos = getComputedStyle(el)
      return estilos.boxShadow !== 'none' && estilos.boxShadow !== ''
    })
    expect(tieneRing).toBe(true)
  })
})
