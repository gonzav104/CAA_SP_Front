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
      let cartillaId: string

      test.beforeAll(async () => {
        const api = await playwrightRequest.newContext({ storageState: TERAPEUTA_STORAGE_STATE })
        const cartillaResp = await api.post(
          `${API_BASE}/api/pacientes/${PACIENTE_ID_TERAPEUTA}/cartillas`,
          { data: { nombre: `[E2E Overview] Principal ${Date.now()}`, esPrincipal: true } },
        )
        const cartilla = (await cartillaResp.json()) as { id: string }
        cartillaId = cartilla.id
        await api.dispose()
      })

      test.afterAll(async () => {
        if (!cartillaId) return
        const api = await playwrightRequest.newContext({ storageState: TERAPEUTA_STORAGE_STATE })
        await api.delete(
          `${API_BASE}/api/pacientes/${PACIENTE_ID_TERAPEUTA}/cartillas/${cartillaId}`,
        )
        await api.dispose()
      })

      test('la entrada directa del hero lleva a esa cartilla en 2 saltos de navegación', async ({
        page,
      }) => {
        await page.goto(`${BASE}/pacientes/${PACIENTE_ID_TERAPEUTA}`)
        await page.getByRole('link', { name: /Abrir cartilla principal/ }).click()
        await page.waitForURL(
          `${BASE}/pacientes/${PACIENTE_ID_TERAPEUTA}/cartillas/${cartillaId}`,
          { timeout: 10_000 },
        )
        await expect(page).toHaveURL(
          `${BASE}/pacientes/${PACIENTE_ID_TERAPEUTA}/cartillas/${cartillaId}`,
        )
      })
    })

    test.describe('con cartillas, ninguna marcada como principal', () => {
      let cartillaId: string

      test.beforeAll(async () => {
        const api = await playwrightRequest.newContext({ storageState: TERAPEUTA_STORAGE_STATE })
        const cartillaResp = await api.post(
          `${API_BASE}/api/pacientes/${PACIENTE_ID_TERAPEUTA}/cartillas`,
          { data: { nombre: `[E2E Overview] No principal ${Date.now()}` } },
        )
        const cartilla = (await cartillaResp.json()) as { id: string }
        cartillaId = cartilla.id
        await api.dispose()
      })

      test.afterAll(async () => {
        if (!cartillaId) return
        const api = await playwrightRequest.newContext({ storageState: TERAPEUTA_STORAGE_STATE })
        await api.delete(
          `${API_BASE}/api/pacientes/${PACIENTE_ID_TERAPEUTA}/cartillas/${cartillaId}`,
        )
        await api.dispose()
      })

      test('el hero muestra "Sin cartilla principal" con link a la lista de cartillas', async ({
        page,
      }) => {
        await page.goto(`${BASE}/pacientes/${PACIENTE_ID_TERAPEUTA}`)
        await expect(page.getByText('Sin cartilla principal')).toBeVisible()
        await expect(
          page.getByRole('link', { name: /Sin cartilla principal|Ver cartillas/ }),
        ).toHaveAttribute('href', `/pacientes/${PACIENTE_ID_TERAPEUTA}/cartillas`)
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
  })
})
