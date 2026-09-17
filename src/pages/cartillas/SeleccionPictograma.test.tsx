// @vitest-environment jsdom
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SeleccionPictograma, type PictogramaElegido } from './SeleccionPictograma'

/**
 * Design obs #85 (Decisiones 1-3): SeleccionPictograma deja de ser un Radix
 * `Dialog` y pasa a ser un panel NO modal montado en el lugar. Estos tests
 * cubren el contrato de contenedor y el guard-set de seguridad (Commit 1),
 * más el contrato de foco (Commit 2) y la sobrevivencia de `textoHablado`
 * (Commit 4, verificación estructural — Decisión 1 lo garantiza por el punto
 * de montaje, sin código de producción nuevo).
 *
 * Los 4 hooks de datos/mutación se mockean por módulo (no hay
 * QueryClientProvider en este test): son las 4 dependencias REALES del
 * componente (globales, custom, búsqueda ARASAAC, materialize), no mocks
 * artificiales de algo no relacionado. `useDebouncedValue` se mockea como
 * identidad para no depender de temporizadores reales en tests de foco/teclado
 * que no ejercitan el debounce en sí (ya cubierto por los specs Playwright).
 *
 * `userEvent` (no `fireEvent.click`) para clickear los tabs de Radix: Radix
 * Tabs activa por eventos de puntero compuestos que `fireEvent.click` no
 * dispara igual que un click real — con `fireEvent.click` el tab nunca
 * cambiaba de `data-state` en jsdom. `fireEvent` se mantiene para
 * `change`/`keyDown`, que no son de Radix.
 *
 * No hay `@testing-library/jest-dom` instalado (Fase B, obs #92 — scope
 * exacto de devDependencies): todas las aserciones usan propiedades/atributos
 * DOM crudos (`.getAttribute`, `.hasAttribute`, `.disabled`), nunca
 * `toHaveAttribute`/`toBeDisabled`.
 */

const pictogramasGlobales = [
  { id: 'g1', etiqueta: 'Agua', imagenUrl: '/agua.png', creadoEn: '2026-01-01', arasaacId: 111 },
]
const pictogramasCustom = [
  { id: 'c1', pacienteId: 'p1', etiqueta: 'Mamá', imagenUrl: '/mama.png', creadoEn: '2026-01-01' },
]
const resultadoArasaacNuevo = {
  _id: 222,
  keywords: [{ keyword: 'Pelota', type: 1 }],
  schematic: false,
}

// `vi.hoisted` (no un `const` de módulo plano): `vi.mock` se iza al tope del
// archivo, así que una referencia directa a una `const` normal caería en un
// "cannot access before initialization" — este helper aloja el mock ANTES.
const { mutateAsyncMock } = vi.hoisted(() => ({ mutateAsyncMock: vi.fn() }))

// jsdom no implementa `ResizeObserver`; el `ScrollArea` de Radix (usado por
// las 3 grillas) lo requiere en un layout effect de montaje. No hay
// `setupFiles` global (fuera de scope, Fase B) — el stub se declara por
// archivo, igual que el `afterEach(cleanup)` de EncabezadoSeccion.test.tsx.
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
}))
vi.mock('../../hooks/pictogramas-custom', () => ({
  usePictogramasCustom: () => ({ data: pictogramasCustom, isPending: false, isError: false }),
}))
vi.mock('../../hooks/arasaac', () => ({
  useBuscarArasaac: () => ({ data: [resultadoArasaacNuevo], isPending: false, isError: false }),
}))
vi.mock('../../hooks/pictogramas-globales', () => ({
  useMaterializarPictogramaGlobal: () => ({ mutateAsync: mutateAsyncMock, isPending: false }),
}))
vi.mock('../../hooks/useDebouncedValue', () => ({
  useDebouncedValue: (value: unknown) => value,
}))

function renderPanel(
  overrides: {
    onAbiertoChange?: (abierto: boolean) => void
    onConfirmar?: (pictograma: PictogramaElegido) => void
    valor?: { recursoGlobalId?: string; recursoCustomId?: string }
  } = {},
) {
  const onAbiertoChange = overrides.onAbiertoChange ?? vi.fn()
  const onConfirmar = overrides.onConfirmar ?? vi.fn()
  render(
    <SeleccionPictograma
      abierto
      onAbiertoChange={onAbiertoChange}
      pacienteId="p1"
      valor={overrides.valor ?? {}}
      onConfirmar={onConfirmar}
    />,
  )
  // Cast: en este archivo `onAbiertoChange`/`onConfirmar` SIEMPRE son
  // `vi.fn()` (el default acá arriba, o un `vi.fn()` que el propio test pasó
  // como override) — nunca una función "real" no espiada. La unión que
  // infiere TS entre el tipo de prop y `ReturnType<typeof vi.fn>` no expone
  // `.mockClear()`/`.mock`, así que se afirma el tipo real en vez de pelear
  // contra la varianza estructural de `Mock<T>`.
  return { onAbiertoChange, onConfirmar } as unknown as {
    onAbiertoChange: ReturnType<typeof vi.fn>
    onConfirmar: ReturnType<typeof vi.fn>
  }
}

/** Escribe un término válido (>=2 chars) en la búsqueda ARASAAC para que el tab renderice el radiogroup. */
function buscarEnArasaac(termino: string) {
  const input = screen.getByRole('textbox', { name: 'Buscar en ARASAAC' })
  fireEvent.change(input, { target: { value: termino } })
}

afterEach(() => {
  cleanup()
})

beforeEach(() => {
  mutateAsyncMock.mockReset()
})

describe('SeleccionPictograma — contenedor no-modal (Commit 1, tarea 4.1)', () => {
  it('renderiza un role=group con nombre y descripción accesibles, sin role=dialog/aria-modal', () => {
    renderPanel()

    const panel = screen.getByRole('group', { name: 'Seleccionar pictograma' })
    expect(panel.tagName).toBe('SECTION')
    expect(panel.hasAttribute('aria-modal')).toBe(false)

    const idDescripcion = panel.getAttribute('aria-describedby')
    expect(idDescripcion).toBeTruthy()
    const descripcion = document.getElementById(idDescripcion!)
    expect(descripcion?.textContent).toContain('ARASAAC')

    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('preserva role=radio/aria-checked en los tiles de Globales guardados', async () => {
    const user = userEvent.setup()
    renderPanel()

    await user.click(screen.getByRole('tab', { name: /Globales/ }))
    const radio = screen.getByRole('radio', { name: 'Agua' })
    expect(radio.getAttribute('aria-checked')).toBe('false')

    await user.click(radio)
    expect(radio.getAttribute('aria-checked')).toBe('true')
  })

  it('preserva role=radio/aria-checked en los tiles de Custom del paciente', async () => {
    const user = userEvent.setup()
    renderPanel()

    await user.click(screen.getByRole('tab', { name: /Custom del paciente/ }))
    const radio = screen.getByRole('radio', { name: 'Mamá' })
    expect(radio.getAttribute('aria-checked')).toBe('false')

    await user.click(radio)
    expect(radio.getAttribute('aria-checked')).toBe('true')
  })
})

describe('SeleccionPictograma — Enter no envía el form padre (Commit 1, tarea 4.4)', () => {
  it('Enter sobre el input de búsqueda ARASAAC llama preventDefault', () => {
    renderPanel()
    const input = screen.getByRole('textbox', { name: 'Buscar en ARASAAC' })

    const noPrevenido = fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })

    // fireEvent (dispatchEvent) devuelve `false` cuando algún handler llamó
    // preventDefault sobre un evento cancelable — la señal real de que el
    // guard corrió, no una inferencia sobre si el <form> se envió.
    expect(noPrevenido).toBe(false)
  })

  it('triangulación: Enter sobre un tile (no input) NO llama preventDefault', async () => {
    const user = userEvent.setup()
    renderPanel()
    await user.click(screen.getByRole('tab', { name: /Globales/ }))
    const radio = screen.getByRole('radio', { name: 'Agua' })

    const noPrevenido = fireEvent.keyDown(radio, { key: 'Enter', code: 'Enter' })

    expect(noPrevenido).toBe(true)
  })
})

describe('SeleccionPictograma — guards durante materialize en vuelo (Commit 1, tarea 4.6)', () => {
  it('Confirmar usa aria-disabled/aria-busy (no disabled) y Cancelar queda disabled durante el POST', async () => {
    const user = userEvent.setup()
    mutateAsyncMock.mockReturnValue(new Promise(() => {})) // nunca resuelve: queda "en vuelo"
    renderPanel()

    buscarEnArasaac('pelota')
    await user.click(screen.getByRole('radio', { name: 'Pelota' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar' }))

    await waitFor(() => {
      const confirmar = screen.getByRole('button', { name: 'Confirmar' }) as HTMLButtonElement
      expect(confirmar.disabled).toBe(false)
      expect(confirmar.getAttribute('aria-disabled')).toBe('true')
      expect(confirmar.getAttribute('aria-busy')).toBe('true')
    })

    const cancelar = screen.getByRole('button', { name: 'Cancelar' }) as HTMLButtonElement
    expect(cancelar.disabled).toBe(true)
  })

  it('el click en Confirmar durante el POST no dispara una segunda materialización (guard de confirmar())', async () => {
    const user = userEvent.setup()
    mutateAsyncMock.mockReturnValue(new Promise(() => {}))
    renderPanel()

    buscarEnArasaac('pelota')
    await user.click(screen.getByRole('radio', { name: 'Pelota' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar' }))
    await waitFor(() => expect(mutateAsyncMock).toHaveBeenCalledTimes(1))

    // Segundo click: el botón sigue sin `disabled` real (a propósito), así que
    // el click SÍ llega al handler — el guard debe absorberlo adentro.
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    expect(mutateAsyncMock).toHaveBeenCalledTimes(1)
  })
})

describe('SeleccionPictograma — foco al abrir (Commit 2, tarea 4.10)', () => {
  it('el foco cae en el input de búsqueda ARASAAC al montar', () => {
    renderPanel()

    expect(document.activeElement).toBe(
      screen.getByRole('textbox', { name: 'Buscar en ARASAAC' }),
    )
  })
})

describe('SeleccionPictograma — Esc cancela, no-op durante materialize (Commit 2, tarea 4.12)', () => {
  it('Esc cierra el panel (cancela) cuando no hay materialize en vuelo', () => {
    const { onAbiertoChange } = renderPanel()

    fireEvent.keyDown(screen.getByRole('group', { name: 'Seleccionar pictograma' }), { key: 'Escape' })

    expect(onAbiertoChange).toHaveBeenCalledWith(false)
  })

  it('Esc es un no-op mientras hay un materialize en vuelo', async () => {
    const user = userEvent.setup()
    mutateAsyncMock.mockReturnValue(new Promise(() => {}))
    const { onAbiertoChange } = renderPanel()

    buscarEnArasaac('pelota')
    await user.click(screen.getByRole('radio', { name: 'Pelota' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar' }))
    await waitFor(() => expect(mutateAsyncMock).toHaveBeenCalledTimes(1))
    onAbiertoChange.mockClear()

    fireEvent.keyDown(screen.getByRole('group', { name: 'Seleccionar pictograma' }), { key: 'Escape' })

    expect(onAbiertoChange).not.toHaveBeenCalled()
  })
})

describe('SeleccionPictograma — foco vuelve al cerrar (Commit 2, tarea 4.14)', () => {
  it('Cancelar llama onAbiertoChange(false) (el padre restaura el foco al trigger)', async () => {
    const user = userEvent.setup()
    const { onAbiertoChange } = renderPanel()

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(onAbiertoChange).toHaveBeenCalledWith(false)
  })

  it('Confirmar (aplicar directo, sin materialize) llama onConfirmar y luego onAbiertoChange(false)', async () => {
    const user = userEvent.setup()
    const llamadas: string[] = []
    const onConfirmar = vi.fn(() => llamadas.push('confirmar'))
    const onAbiertoChange = vi.fn(() => llamadas.push('cerrar'))
    renderPanel({ onConfirmar, onAbiertoChange })

    await user.click(screen.getByRole('tab', { name: /Globales/ }))
    await user.click(screen.getByRole('radio', { name: 'Agua' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar' }))

    expect(onConfirmar).toHaveBeenCalledWith({ globalId: 'g1' })
    expect(onAbiertoChange).toHaveBeenCalledWith(false)
    expect(llamadas).toEqual(['confirmar', 'cerrar'])
  })

  it('Confirmar (materialize exitoso) llama onConfirmar con el id nuevo y luego onAbiertoChange(false)', async () => {
    const user = userEvent.setup()
    mutateAsyncMock.mockResolvedValue({ id: 'g-nuevo', etiqueta: 'Pelota' })
    const llamadas: string[] = []
    const onConfirmar = vi.fn(() => llamadas.push('confirmar'))
    const onAbiertoChange = vi.fn(() => llamadas.push('cerrar'))
    renderPanel({ onConfirmar, onAbiertoChange })

    buscarEnArasaac('pelota')
    await user.click(screen.getByRole('radio', { name: 'Pelota' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar' }))

    await waitFor(() => expect(onConfirmar).toHaveBeenCalledWith({ globalId: 'g-nuevo' }))
    expect(onAbiertoChange).toHaveBeenCalledWith(false)
    expect(llamadas).toEqual(['confirmar', 'cerrar'])
  })
})

describe('SeleccionPictograma — textoHablado sobrevive el ciclo del panel (Commit 4, tarea 4.18)', () => {
  /**
   * Réplica mínima del punto de montaje real (`FormItemInline`, obs #85
   * Decisión 1): un `<input>` hermano DENTRO DEL MISMO `<form>` que el panel,
   * montado condicionalmente igual que en producción. No depende de
   * react-hook-form/zod (fuera de scope acá) — prueba la garantía
   * estructural de la Decisión 1 directamente: el punto de montaje en el
   * lugar nunca desmonta ni resetea a sus hermanos del `<form>`.
   */
  function Wrapper() {
    const [abierto, setAbierto] = useState(true)
    return (
      <form>
        <input name="textoHablado" defaultValue="" aria-label="Texto a hablar" />
        {abierto && (
          <SeleccionPictograma
            abierto
            onAbiertoChange={setAbierto}
            pacienteId="p1"
            valor={{}}
            onConfirmar={vi.fn()}
          />
        )}
      </form>
    )
  }

  it('el texto escrito antes de abrir sigue presente tras navegar las 3 tabs y cancelar', async () => {
    const user = userEvent.setup()
    render(<Wrapper />)
    const textoHablado = screen.getByLabelText('Texto a hablar') as HTMLInputElement
    fireEvent.change(textoHablado, { target: { value: 'Quiero agua' } })
    expect(textoHablado.value).toBe('Quiero agua')

    await user.click(screen.getByRole('tab', { name: /Globales/ }))
    await user.click(screen.getByRole('tab', { name: /Custom del paciente/ }))
    await user.click(screen.getByRole('tab', { name: /Buscar en ARASAAC/ }))
    expect(textoHablado.value).toBe('Quiero agua')

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(textoHablado.value).toBe('Quiero agua')
  })
})
