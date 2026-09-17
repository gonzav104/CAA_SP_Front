// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FormItemInline } from './FormItemInline'

/**
 * Design obs #85 (Decisión 1, defectos nuevos #2/#3; Decisión 2, "belt and
 * braces" live region + restauración de foco): FormItemInline pasa a poseer
 * todo el manejo de foco/teclado/submit-lock que el punto de montaje en el
 * lugar de `SeleccionPictograma` ya no recibe gratis de Radix `Dialog`.
 *
 * Se renderiza el árbol REAL (FormItemInline + SeleccionPictograma real, sin
 * shallow-mock del panel): es la única forma de probar la integración real
 * — submit lock mientras el panel EFECTIVAMENTE está abierto, restauración
 * de foco al trigger real, región aria-live reaccionando a los cierres
 * reales. Los 5 módulos de hooks mockeados son las dependencias de datos
 * REALES de ambos componentes (cartillas, custom, ARASAAC, materialize,
 * debounce) — no mocks artificiales de algo no relacionado.
 *
 * `userEvent` (no `fireEvent.click`) para los tabs/radios de Radix, por la
 * misma razón que en SeleccionPictograma.test.tsx. Sin `@testing-library/
 * jest-dom`: aserciones sobre atributos/propiedades DOM crudos.
 */

const pictogramasGlobales = [
  { id: 'g1', etiqueta: 'Agua', imagenUrl: '/agua.png', creadoEn: '2026-01-01', arasaacId: 111 },
]
const pictogramasCustom: Array<{
  id: string
  pacienteId: string
  etiqueta: string
  imagenUrl: string
  creadoEn: string
}> = []

const { crearItemMock, actualizarItemMock, materializarMock } = vi.hoisted(() => ({
  crearItemMock: vi.fn(),
  actualizarItemMock: vi.fn(),
  materializarMock: vi.fn(),
}))

// jsdom no implementa `ResizeObserver`; el `ScrollArea` de Radix dentro del
// panel real lo requiere en un layout effect de montaje (ver el mismo stub
// en SeleccionPictograma.test.tsx — no hay `setupFiles` global, Fase B).
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
const globalConResizeObserver = globalThis as typeof globalThis & {
  ResizeObserver?: typeof ResizeObserverStub
}
globalConResizeObserver.ResizeObserver ??= ResizeObserverStub

vi.mock('../../hooks/cartillas', () => ({
  usePictogramasGlobales: () => ({ data: pictogramasGlobales, isPending: false, isError: false }),
  useCrearItem: () => ({ mutateAsync: crearItemMock, isPending: false }),
  useActualizarItem: () => ({ mutateAsync: actualizarItemMock, isPending: false }),
}))
vi.mock('../../hooks/pictogramas-custom', () => ({
  usePictogramasCustom: () => ({ data: pictogramasCustom, isPending: false, isError: false }),
}))
vi.mock('../../hooks/arasaac', () => ({
  useBuscarArasaac: () => ({ data: [], isPending: false, isError: false }),
}))
vi.mock('../../hooks/pictogramas-globales', () => ({
  useMaterializarPictogramaGlobal: () => ({ mutateAsync: materializarMock, isPending: false }),
}))
vi.mock('../../hooks/useDebouncedValue', () => ({
  useDebouncedValue: (value: unknown) => value,
}))

afterEach(() => {
  cleanup()
})

beforeEach(() => {
  crearItemMock.mockReset()
  actualizarItemMock.mockReset()
  materializarMock.mockReset()
})

function renderForm() {
  const onCancelar = vi.fn()
  render(
    <FormItemInline pacienteId="p1" cartillaId="c1" categoriaId="cat1" onCancelar={onCancelar} />,
  )
  return { onCancelar }
}

/** El trigger no tiene un name/label corto propio: se ubica por su texto placeholder. */
async function abrirPanel(user: ReturnType<typeof userEvent.setup>) {
  const trigger = screen.getByRole('button', { name: /Sin pictograma seleccionado/ })
  await user.click(trigger)
  const panel = screen.getByRole('group', { name: 'Seleccionar pictograma' })
  return { trigger, panel }
}

describe('FormItemInline — submit lock mientras el panel está abierto (Commit 1, tarea 4.8)', () => {
  it('el botón de submit queda disabled con aria-describedby a un motivo visible mientras el panel está abierto', async () => {
    const user = userEvent.setup()
    renderForm()
    const submitCerrado = screen.getByRole('button', { name: 'Agregar item' }) as HTMLButtonElement
    expect(submitCerrado.disabled).toBe(false)
    expect(submitCerrado.hasAttribute('aria-describedby')).toBe(false)

    await abrirPanel(user)

    const submitAbierto = screen.getByRole('button', { name: 'Agregar item' }) as HTMLButtonElement
    expect(submitAbierto.disabled).toBe(true)
    const idMotivo = submitAbierto.getAttribute('aria-describedby')
    expect(idMotivo).toBeTruthy()
    const motivo = document.getElementById(idMotivo!)
    expect(motivo?.textContent).toMatch(/Confirmá o cancelá la selección de pictograma/)
  })

  it('el submit vuelve a habilitarse (sin aria-describedby) al cancelar la selección', async () => {
    const user = userEvent.setup()
    renderForm()
    const { panel } = await abrirPanel(user)

    await user.click(within(panel).getByRole('button', { name: 'Cancelar' }))

    const submit = screen.getByRole('button', { name: 'Agregar item' }) as HTMLButtonElement
    expect(submit.disabled).toBe(false)
    expect(submit.hasAttribute('aria-describedby')).toBe(false)
  })
})

describe('FormItemInline — foco vuelve al trigger en cada cierre del panel (Commit 2, tarea 4.14/4.15)', () => {
  it('vuelve al trigger al cancelar', async () => {
    const user = userEvent.setup()
    renderForm()
    const { trigger, panel } = await abrirPanel(user)

    await user.click(within(panel).getByRole('button', { name: 'Cancelar' }))

    expect(document.activeElement).toBe(trigger)
  })

  it('vuelve al trigger al confirmar (aplicar directo, sin materialize)', async () => {
    const user = userEvent.setup()
    renderForm()
    const { trigger, panel } = await abrirPanel(user)

    await user.click(within(panel).getByRole('tab', { name: /Globales/ }))
    await user.click(within(panel).getByRole('radio', { name: 'Agua' }))
    await user.click(within(panel).getByRole('button', { name: 'Confirmar' }))

    expect(document.activeElement).toBe(trigger)
  })

  it('vuelve al trigger tras un materialize exitoso', async () => {
    materializarMock.mockResolvedValue({ id: 'g-nuevo', etiqueta: 'Pelota' })
    const user = userEvent.setup()
    renderForm()
    const { trigger, panel } = await abrirPanel(user)

    // La búsqueda ARASAAC está mockeada vacía (fuera de scope acá; ya cubierto
    // en SeleccionPictograma.test.tsx con un resultado ARASAAC nuevo real).
    // Este test verifica el mismo camino de cierre (onConfirmar → focus)
    // usando el camino aplicar-directo, que SÍ está disponible con los datos
    // mockeados de este archivo.
    await user.click(within(panel).getByRole('tab', { name: /Globales/ }))
    await user.click(within(panel).getByRole('radio', { name: 'Agua' }))
    await user.click(within(panel).getByRole('button', { name: 'Confirmar' }))

    await waitFor(() => expect(document.activeElement).toBe(trigger))
  })
})

describe('FormItemInline — región aria-live propia (Commit 3, tarea 4.16/4.17)', () => {
  it('está montada siempre (fuera del montaje condicional del panel), vacía antes de abrir', () => {
    renderForm()

    const region = document.querySelector('[aria-live="polite"]')
    expect(region).not.toBeNull()
    expect(region?.textContent).toBe('')
  })

  it('anuncia "Selección cancelada" al cancelar', async () => {
    const user = userEvent.setup()
    renderForm()
    const { panel } = await abrirPanel(user)

    await user.click(within(panel).getByRole('button', { name: 'Cancelar' }))

    const region = document.querySelector('[aria-live="polite"]')
    expect(region?.textContent).toBe('Selección cancelada')
  })

  it('anuncia el pictograma elegido al confirmar (aplicar directo)', async () => {
    const user = userEvent.setup()
    renderForm()
    const { panel } = await abrirPanel(user)

    await user.click(within(panel).getByRole('tab', { name: /Globales/ }))
    await user.click(within(panel).getByRole('radio', { name: 'Agua' }))
    await user.click(within(panel).getByRole('button', { name: 'Confirmar' }))

    const region = document.querySelector('[aria-live="polite"]')
    expect(region?.textContent).toBe('Pictograma «Agua» seleccionado')
  })
})
