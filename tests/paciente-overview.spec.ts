import { test, expect, request as playwrightRequest } from '@playwright/test'

// NOTE (apply-time environment finding, PR3a — see apply-progress for the
// full account): the backend (:8080) hardcodes its CORS/security allow-list
// to `http://localhost:5173`, and that exact port is bound in this sandbox to
// a DIFFERENT, shared checkout's `vite` process that this worktree-isolated
// session must not stop or restart (out of this PR's edit scope, and shared
// with other concurrent work). Serving this worktree's code from any other
// port gets a live 403 from the backend's own security filter, not just a
// browser-side CORS block — there is no header-only workaround that doesn't
// mean re-stamping the Origin the request leaves with, which is a security
// control this unit has no authorization to bypass. `BASE` below is the
// correct, canonical origin (matches CORS config and every other spec file
// in this suite) for a normal run where the checkout under test genuinely
// owns :5173. In THIS sandbox, exercising this exact scenario matrix required
// falling back to manual code-review-based verification instead (documented
// in apply-progress), consistent with this task's documented fallback for
// "no live backend reachable."
const BASE = 'http://localhost:5173'
const API_BASE = 'http://localhost:8080'
const TERAPEUTA_STORAGE_STATE = 'tests/.auth/shell-navegacion.json'

/**
 * ID de un paciente real perteneciente a la cuenta TERAPEUTA de fixtures
 * (playwright.test@correo.com), mismo paciente usado en pictogramas-guard.spec.ts.
 */
const PACIENTE_ID_TERAPEUTA = '6ed4fde4-6d7e-45c4-b870-2e2c8bde0c7c'

/**
 * ID ficticio: el guard de rol actúa antes de cualquier fetch de datos del
 * paciente, así que para el caso FAMILIAR el pacienteId es irrelevante.
 */
const PACIENTE_ID_FICTICIO = '00000000-0000-0000-0000-000000000000'

test.describe('PacienteOverview — /pacientes/:pacienteId (design/spec sdd/paciente-overview, obs #65/#64)', () => {
  test.describe('FAMILIAR', () => {
    // Usa el storageState por defecto del proyecto "paciente-overview"
    // (tests/.auth/pictogramas-guard-familiar.json), mismo patrón que
    // pictogramas-guard.spec.ts / dashboard-pacientes.spec.ts.

    test('acceso a la raíz del paciente sigue redirigiendo a cartillas, byte-for-byte', async ({
      page,
    }) => {
      await page.goto(`${BASE}/pacientes/${PACIENTE_ID_FICTICIO}`)
      await page.waitForURL(/\/cartillas$/, { timeout: 10_000 })
      await expect(page).toHaveURL(`${BASE}/pacientes/${PACIENTE_ID_FICTICIO}/cartillas`)
    })
  })

  test.describe('TERAPEUTA', () => {
    test.use({ storageState: TERAPEUTA_STORAGE_STATE })

    test('renderiza PacienteOverview en vez de redirigir', async ({ page }) => {
      await page.goto(`${BASE}/pacientes/${PACIENTE_ID_TERAPEUTA}`)
      // No debe haber redirigido: la URL se mantiene en la raíz del paciente
      // (antes de esta unidad, TERAPEUTA Y FAMILIAR compartían el mismo
      // `<Navigate to="cartillas" replace>` incondicional acá). No se afirma
      // contenido específico del hero — eso es la escena 3.2/3.3, cada una con
      // su propia fixture determinística; esta escena solo prueba "no redirect".
      await expect(page).toHaveURL(`${BASE}/pacientes/${PACIENTE_ID_TERAPEUTA}`)
      await expect(page).not.toHaveURL(`${BASE}/pacientes/${PACIENTE_ID_TERAPEUTA}/cartillas`)
    })

    test.describe('con una cartilla marcada como principal', () => {
      // Paciente propio, creado y destruido por este describe — no depende de
      // un ID de fixture compartido con otros specs (ver hallazgo obs #71:
      // un ID hardcodeado quedó huérfano cuando se reseteó la DB de dev).
      let pacienteId: string
      let cartillaId: string

      test.beforeAll(async () => {
        const api = await playwrightRequest.newContext({ storageState: TERAPEUTA_STORAGE_STATE })
        const pacienteResp = await api.post(`${API_BASE}/api/pacientes`, {
          data: {
            nombre: 'E2E',
            apellido: `Overview-ConPrincipal-${Date.now()}`,
            fechaNacimiento: '2015-01-01',
          },
        })
        const paciente = (await pacienteResp.json()) as { id: string }
        pacienteId = paciente.id
        const cartillaResp = await api.post(`${API_BASE}/api/pacientes/${pacienteId}/cartillas`, {
          data: { nombre: `[E2E Overview] Principal ${Date.now()}`, esPrincipal: true },
        })
        const cartilla = (await cartillaResp.json()) as { id: string }
        cartillaId = cartilla.id
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

      test('la entrada directa del hero lleva a esa cartilla en 2 saltos de navegación', async ({
        page,
      }) => {
        await page.goto(`${BASE}/pacientes/${pacienteId}`)
        await page.getByRole('link', { name: /Abrir cartilla principal/ }).click()
        await page.waitForURL(`${BASE}/pacientes/${pacienteId}/cartillas/${cartillaId}`, {
          timeout: 10_000,
        })
        await expect(page).toHaveURL(`${BASE}/pacientes/${pacienteId}/cartillas/${cartillaId}`)
      })
    })

    test.describe('con cartillas, ninguna marcada como principal', () => {
      // Mismo motivo que el describe anterior: paciente propio, no compartido.
      let pacienteId: string
      let cartillaId: string

      test.beforeAll(async () => {
        const api = await playwrightRequest.newContext({ storageState: TERAPEUTA_STORAGE_STATE })
        const pacienteResp = await api.post(`${API_BASE}/api/pacientes`, {
          data: {
            nombre: 'E2E',
            apellido: `Overview-SinPrincipal-${Date.now()}`,
            fechaNacimiento: '2015-01-01',
          },
        })
        const paciente = (await pacienteResp.json()) as { id: string }
        pacienteId = paciente.id
        const cartillaResp = await api.post(`${API_BASE}/api/pacientes/${pacienteId}/cartillas`, {
          data: { nombre: `[E2E Overview] No principal ${Date.now()}` },
        })
        const cartilla = (await cartillaResp.json()) as { id: string }
        cartillaId = cartilla.id
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

      test('el hero muestra "Sin cartilla principal" con link a la lista de cartillas', async ({
        page,
      }) => {
        await page.goto(`${BASE}/pacientes/${pacienteId}`)
        await expect(page.getByText('Sin cartilla principal')).toBeVisible()
        await expect(
          page.getByRole('link', { name: /Sin cartilla principal|Ver cartillas/ }),
        ).toHaveAttribute('href', `/pacientes/${pacienteId}/cartillas`)
      })
    })

    test.describe('paciente sin ninguna cartilla', () => {
      let pacienteId: string

      test.beforeAll(async () => {
        const api = await playwrightRequest.newContext({ storageState: TERAPEUTA_STORAGE_STATE })
        const pacienteResp = await api.post(`${API_BASE}/api/pacientes`, {
          data: {
            nombre: 'E2E',
            apellido: `Overview-Vacio-${Date.now()}`,
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

      test('el hero ofrece "Crear la primera cartilla" enlazando a Cartillas', async ({
        page,
      }) => {
        await page.goto(`${BASE}/pacientes/${pacienteId}`)
        const cta = page.getByRole('link', { name: /Crear la primera cartilla/ })
        await expect(cta).toBeVisible()
        await expect(cta).toHaveAttribute('href', `/pacientes/${pacienteId}/cartillas`)
      })
    })

    // PR3b (Fase 4, obs #66, tasks 4.1-4.4): resumen cruzado bajo el hero.
    // Email de colaborador: cuenta FAMILIAR de fixtures ya usada por
    // pictogramas-guard.setup.ts (playwright.familiar@correo.com) — evita
    // crear una cuenta nueva solo para satisfacer el email de un colaborador.
    const EMAIL_COLABORADOR_FIXTURE = 'playwright.familiar@correo.com'
    // PNG 1x1 transparente válido, usado únicamente como archivo de subida
    // multipart para el fixture de pictograma custom (no se verifica su
    // contenido visual, solo que la subida cuenta para el resumen).
    const PNG_1X1_BASE64 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='

    test.describe('resumen: sesiones, colaboradores y pictogramas con datos (4.1)', () => {
      let pacienteId: string

      test.beforeAll(async () => {
        const api = await playwrightRequest.newContext({ storageState: TERAPEUTA_STORAGE_STATE })
        const pacienteResp = await api.post(`${API_BASE}/api/pacientes`, {
          data: {
            nombre: 'E2E',
            apellido: `Overview-ResumenPoblado-${Date.now()}`,
            fechaNacimiento: '2015-01-01',
          },
        })
        const paciente = (await pacienteResp.json()) as { id: string }
        pacienteId = paciente.id

        // Dos sesiones: la de "hoy" debe ganar como "más reciente".
        await api.post(`${API_BASE}/api/pacientes/${pacienteId}/sesiones`, {
          data: {
            fechaHora: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            objetivosTrabajados: 'Sesión vieja (no debe ganar como más reciente)',
          },
        })
        await api.post(`${API_BASE}/api/pacientes/${pacienteId}/sesiones`, {
          data: {
            fechaHora: new Date().toISOString(),
            objetivosTrabajados: 'Sesión de hoy (debe ser la más reciente)',
          },
        })

        await api.post(`${API_BASE}/api/pacientes/${pacienteId}/colaboradores`, {
          data: { email: EMAIL_COLABORADOR_FIXTURE, permiso: 'LECTURA' },
        })

        await api.post(`${API_BASE}/api/pacientes/${pacienteId}/pictogramas-custom`, {
          multipart: {
            etiqueta: `E2E Overview ${Date.now()}`,
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
        await api.delete(`${API_BASE}/api/pacientes/${pacienteId}`)
        await api.dispose()
      })

      test('muestra la sesión más reciente con chip de recencia, y los conteos de colaboradores y pictogramas, cada uno enlazando a su sección', async ({
        page,
      }) => {
        await page.goto(`${BASE}/pacientes/${pacienteId}`)

        // Scoped a `<main>`: el sidebar también tiene links "Sesiones"/
        // "Colaboradores"/"Pictogramas" (navegación), que no son las tarjetas
        // de resumen que esta escena verifica.
        const main = page.getByRole('main')
        const fechaEsperada = new Date().toLocaleDateString('es-AR')
        const tarjetaSesiones = main.getByRole('link', { name: /Sesiones/ })
        await expect(tarjetaSesiones).toBeVisible()
        await expect(tarjetaSesiones.getByText('Hoy')).toBeVisible()
        await expect(tarjetaSesiones.getByText(fechaEsperada)).toBeVisible()
        await expect(tarjetaSesiones).toHaveAttribute('href', `/pacientes/${pacienteId}/sesiones`)

        const tarjetaColaboradores = main.getByRole('link', { name: /Colaboradores/ })
        await expect(tarjetaColaboradores).toBeVisible()
        await expect(tarjetaColaboradores.getByText(/^1\b/)).toBeVisible()
        await expect(tarjetaColaboradores).toHaveAttribute(
          'href',
          `/pacientes/${pacienteId}/colaboradores`,
        )

        const tarjetaPictogramas = main.getByRole('link', { name: /Pictogramas/ })
        await expect(tarjetaPictogramas).toBeVisible()
        await expect(tarjetaPictogramas.getByText(/^1\b/)).toBeVisible()
        await expect(tarjetaPictogramas).toHaveAttribute(
          'href',
          `/pacientes/${pacienteId}/pictogramas`,
        )
      })
    })

    test.describe('resumen: estados vacíos independientes por tarjeta (4.2)', () => {
      let pacienteId: string

      test.beforeAll(async () => {
        const api = await playwrightRequest.newContext({ storageState: TERAPEUTA_STORAGE_STATE })
        const pacienteResp = await api.post(`${API_BASE}/api/pacientes`, {
          data: {
            nombre: 'E2E',
            apellido: `Overview-ResumenVacio-${Date.now()}`,
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

      test('cero sesiones, cero colaboradores y cero pictogramas muestran un estado vacío definido con entrada propia, no un callejón sin salida', async ({
        page,
      }) => {
        await page.goto(`${BASE}/pacientes/${pacienteId}`)

        const main = page.getByRole('main')
        const tarjetaSesiones = main.getByRole('link', { name: /Sesiones/ })
        await expect(tarjetaSesiones.getByText(/Todavía no hay sesiones/)).toBeVisible()
        await expect(tarjetaSesiones).toHaveAttribute('href', `/pacientes/${pacienteId}/sesiones`)

        const tarjetaColaboradores = main.getByRole('link', { name: /Colaboradores/ })
        await expect(tarjetaColaboradores.getByText(/Todavía no hay colaboradores/)).toBeVisible()
        await expect(tarjetaColaboradores).toHaveAttribute(
          'href',
          `/pacientes/${pacienteId}/colaboradores`,
        )

        const tarjetaPictogramas = main.getByRole('link', { name: /Pictogramas/ })
        await expect(tarjetaPictogramas.getByText(/Todavía no hay pictogramas/)).toBeVisible()
        await expect(tarjetaPictogramas).toHaveAttribute(
          'href',
          `/pacientes/${pacienteId}/pictogramas`,
        )
      })
    })

    test.describe('resumen: error en una fuente no bloquea el resto de la página (4.3)', () => {
      let pacienteId: string

      test.beforeAll(async () => {
        const api = await playwrightRequest.newContext({ storageState: TERAPEUTA_STORAGE_STATE })
        const pacienteResp = await api.post(`${API_BASE}/api/pacientes`, {
          data: {
            nombre: 'E2E',
            apellido: `Overview-ResumenError-${Date.now()}`,
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

      test('si falla únicamente la carga de sesiones, esa tarjeta muestra error y las demás siguen usables', async ({
        page,
      }) => {
        await page.route(`${API_BASE}/api/pacientes/${pacienteId}/sesiones`, (route) =>
          route.fulfill({ status: 500, contentType: 'application/json', body: '{}' }),
        )

        await page.goto(`${BASE}/pacientes/${pacienteId}`)

        const main = page.getByRole('main')

        // La tarjeta con error NO es un link a Sesiones (no hay a dónde
        // navegar con datos rotos): muestra el estado de error compartido
        // (`ErrorCarga`, `src/components/estados.tsx`), scoped a esta tarjeta.
        await expect(main.getByText('No se pudieron cargar las sesiones.')).toBeVisible()

        // El resto de la página sigue usable: colaboradores y pictogramas
        // (ambos sin datos, pero con su propio estado vacío, no bloqueados).
        const tarjetaColaboradores = main.getByRole('link', { name: /Colaboradores/ })
        await expect(tarjetaColaboradores.getByText(/Todavía no hay colaboradores/)).toBeVisible()
        const tarjetaPictogramas = main.getByRole('link', { name: /Pictogramas/ })
        await expect(tarjetaPictogramas.getByText(/Todavía no hay pictogramas/)).toBeVisible()
      })
    })

    test.describe('rango del sidebar perceptible sin color (4.4)', () => {
      test('Cartillas, Sesiones y Colaboradores/Pictogramas mantienen su rango estructural bajo escala de grises', async ({
        page,
      }) => {
        await page.goto(`${BASE}/pacientes/${PACIENTE_ID_TERAPEUTA}`)
        await page.addStyleTag({ content: 'html { filter: grayscale(1) !important; }' })

        // El shell renderiza dos `<nav>` con el mismo contenido (desktop
        // `AppSidebar` + `MobileNavDrawer`, uno oculto por CSS responsive
        // según el viewport) — se toma el primero consistentemente para
        // evitar violaciones de modo estricto; ambos comparten exactamente
        // la misma fuente (`navItems.ts`) y estructura.
        const nav = page.getByRole('navigation', { name: 'Navegación principal' }).first()

        // Encabezados de grupo (tiers 2-3) siguen siendo texto legible, no
        // color: prueban el rango sin depender de ningún canal cromático.
        const encabezadoSeguimiento = nav.getByText('Seguimiento', { exact: true })
        const encabezadoGestion = nav.getByText('Gestión', { exact: true })
        await expect(encabezadoSeguimiento).toBeVisible()
        await expect(encabezadoGestion).toBeVisible()

        // Orden estructural en el DOM (independiente de cualquier estilo):
        // Cartillas antes que Sesiones, y Sesiones antes que Colaboradores/
        // Pictogramas — el orden de grupos ES el rango (design, obs #65).
        const enlaceCartillas = nav.getByRole('link', { name: 'Cartillas' })
        const enlaceSesiones = nav.getByRole('link', { name: 'Sesiones' })
        const enlaceColaboradores = nav.getByRole('link', { name: 'Colaboradores' })
        await expect(enlaceCartillas).toBeVisible()
        await expect(enlaceSesiones).toBeVisible()
        await expect(enlaceColaboradores).toBeVisible()

        const cartillasBox = await enlaceCartillas.boundingBox()
        const sesionesBox = await enlaceSesiones.boundingBox()
        const colaboradoresBox = await enlaceColaboradores.boundingBox()
        if (!cartillasBox || !sesionesBox || !colaboradoresBox) {
          throw new Error('No se pudo medir la posición de los items del nav')
        }
        expect(cartillasBox.y).toBeLessThan(sesionesBox.y)
        expect(sesionesBox.y).toBeLessThan(colaboradoresBox.y)

        // Un separador estructural (role="separator") existe entre grupos,
        // visible incluso en escala de grises.
        await expect(page.getByRole('separator').first()).toBeVisible()
      })
    })
  })
})
