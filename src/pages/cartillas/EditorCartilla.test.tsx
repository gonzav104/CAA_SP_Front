// @vitest-environment jsdom
/**
 * Unit tests de EditorCartilla (change cartillas-revival, Fase E2, obs #85
 * Decisión 5): el gate de creador se re-deriva sobre `usePosesionCartilla`
 * en lugar de un `useCartilla`+`useAuth`+comparación propios, PRESERVANDO
 * el hard early-return exacto — un no-creador NUNCA debe alcanzar el JSX
 * del formulario de mutación, ni siquiera transitoriamente. La propiedad
 * de seguridad crítica se prueba DIRECTAMENTE: para el estado "ajena" se
 * asegura la ausencia de cualquier control de mutación (textbox, checkbox,
 * botón Guardar/Agregar categoría), no solo la presencia del notice.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { CartillaDetalle } from '../../types/Cartilla'
import { EditorCartilla } from './EditorCartilla'

const { usePosesionCartillaMock } = vi.hoisted(() => ({
  usePosesionCartillaMock: vi.fn(),
}))
vi.mock('../../hooks/usePosesionCartilla', () => ({
  usePosesionCartilla: usePosesionCartillaMock,
}))

const {
  actualizarCartillaMock,
  crearCategoriaMock,
  actualizarCategoriaMock,
} = vi.hoisted(() => ({
  actualizarCartillaMock: vi.fn(),
  crearCategoriaMock: vi.fn(),
  actualizarCategoriaMock: vi.fn(),
}))
vi.mock('../../hooks/cartillas', () => ({
  useActualizarCartilla: () => ({ mutateAsync: actualizarCartillaMock, isPending: false }),
  useCrearCategoria: () => ({ mutateAsync: crearCategoriaMock, isPending: false }),
  useActualizarCategoria: () => ({ mutateAsync: actualizarCategoriaMock, isPending: false }),
}))

// Sin categorías: evita montar SeccionCategoria/FormItemInline (fuera del
// alcance de esta prueba de gate) — solo CardVacio + FormCategoriaInline.
const cartillaSinCategorias: CartillaDetalle = {
  id: 'cartilla-1',
  creadorId: 'usuario-1',
  nombre: 'Cartilla de Juan',
  esPrincipal: false,
  categorias: [],
}

afterEach(() => {
  cleanup()
})

function renderEditor() {
  return render(
    <MemoryRouter initialEntries={['/pacientes/p1/cartillas/c1/editar']}>
      <Routes>
        <Route
          path="/pacientes/:pacienteId/cartillas/:idCartilla/editar"
          element={<EditorCartilla />}
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('EditorCartilla — gate de posesión vía usePosesionCartilla', () => {
  it('estado "propia": monta el formulario de mutación', () => {
    usePosesionCartillaMock.mockReturnValue({ estado: 'propia', cartilla: cartillaSinCategorias })

    renderEditor()

    // `getByDisplayValue` (no accessible name) porque `FormCategoriaInline`
    // (mostrado a la vez, cartilla sin categorías) también tiene un campo
    // "Nombre" — colisión de `id="nombre"` preexistente y fuera de alcance
    // de esta slice. El valor precargado de la cartilla es inequívoco.
    expect(screen.getByDisplayValue('Cartilla de Juan')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeTruthy()
  })

  it('estado "ajena": jamás renderiza el formulario de mutación — hard early-return antes de su JSX', () => {
    usePosesionCartillaMock.mockReturnValue({ estado: 'ajena', cartilla: cartillaSinCategorias })

    renderEditor()

    // Propiedad de seguridad crítica: ningún control de mutación existe en
    // el DOM, ni siquiera oculto — el gate corta ANTES de montar ese JSX.
    expect(screen.queryByRole('textbox')).toBeNull()
    expect(screen.queryByRole('checkbox')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Guardar' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Agregar categoría' })).toBeNull()

    // El notice de solo lectura (movido a accesoCartilla.tsx en E1) sí se ve.
    expect(screen.getByText('Solo el creador puede editar esta cartilla')).toBeTruthy()
  })

  it('estado "no-encontrada": renderiza NoticeNoEncontrada, nunca el formulario', () => {
    usePosesionCartillaMock.mockReturnValue({ estado: 'no-encontrada' })

    renderEditor()

    expect(screen.getByText('No encontramos esta cartilla')).toBeTruthy()
    expect(screen.queryByRole('textbox')).toBeNull()
  })

  it('estado "error": renderiza ErrorCarga con el mensaje, nunca el formulario', () => {
    usePosesionCartillaMock.mockReturnValue({ estado: 'error', mensaje: 'Error del servidor' })

    renderEditor()

    expect(screen.getByText('No se pudo cargar')).toBeTruthy()
    expect(screen.getByText('Error del servidor')).toBeTruthy()
    expect(screen.queryByRole('textbox')).toBeNull()
  })

  it('estado "cargando": renderiza DetalleSkeleton, nunca el formulario', () => {
    usePosesionCartillaMock.mockReturnValue({ estado: 'cargando' })

    const { container } = renderEditor()

    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0)
    expect(screen.queryByRole('textbox')).toBeNull()
  })
})
