// @vitest-environment jsdom
/**
 * Unit tests de CartillaView (change cartillas-revival, Fase E2, obs #85
 * Decisión 5): la posesión se deriva de `usePosesionCartilla` en lugar de
 * un `useCartilla`+comparación inline propios. Las 5 ramas de `AccesoCartilla`:
 * - `propia`  → botón «Editar» visible.
 * - `ajena`   → botón «Editar» ausente, una explicación de una línea visible,
 *              y la entrada a modo uso («Abrir en modo uso») SIGUE disponible
 *              (spec "Known non-owner surface": viewing/usage-mode entry
 *              remain available — no es un notice bloqueante).
 * - `no-encontrada` → `NoticeNoEncontrada` (spec "Unknown-existence surface
 *              stays generic" — nunca afirma conocimiento de posesión).
 * - `error`/`cargando` → primitivas existentes `ErrorCarga`/`DetalleSkeleton`.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { CartillaDetalle } from '../../types/Cartilla'
import { CartillaView } from './CartillaView'

const { usePosesionCartillaMock } = vi.hoisted(() => ({
  usePosesionCartillaMock: vi.fn(),
}))
vi.mock('../../hooks/usePosesionCartilla', () => ({
  usePosesionCartilla: usePosesionCartillaMock,
}))

const cartillaDetalle: CartillaDetalle = {
  id: 'cartilla-1',
  creadorId: 'usuario-1',
  nombre: 'Cartilla de Juan',
  esPrincipal: false,
  categorias: [],
}

afterEach(() => {
  cleanup()
})

function renderCartillaView() {
  render(
    <MemoryRouter initialEntries={['/pacientes/p1/cartillas/c1']}>
      <Routes>
        <Route path="/pacientes/:pacienteId/cartillas/:idCartilla" element={<CartillaView />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('CartillaView — posesión vía usePosesionCartilla', () => {
  it('estado "propia": muestra el botón Editar', () => {
    usePosesionCartillaMock.mockReturnValue({ estado: 'propia', cartilla: cartillaDetalle })

    renderCartillaView()

    expect(screen.getByRole('link', { name: /Editar/ })).toBeTruthy()
  })

  it('estado "ajena": oculta Editar, muestra una explicación, y mantiene «Abrir en modo uso»', () => {
    usePosesionCartillaMock.mockReturnValue({ estado: 'ajena', cartilla: cartillaDetalle })

    renderCartillaView()

    expect(screen.queryByRole('link', { name: /Editar/ })).toBeNull()
    expect(
      screen.getByText('Solo el creador puede editar esta cartilla.'),
    ).toBeTruthy()
    expect(screen.getByRole('link', { name: /Abrir en modo uso/ })).toBeTruthy()
  })

  it('estado "no-encontrada": renderiza NoticeNoEncontrada, nunca afirma posesión', () => {
    usePosesionCartillaMock.mockReturnValue({ estado: 'no-encontrada' })

    renderCartillaView()

    expect(screen.getByText('No encontramos esta cartilla')).toBeTruthy()
    expect(screen.queryByRole('link', { name: /Editar/ })).toBeNull()
  })

  it('estado "error": renderiza ErrorCarga con el mensaje', () => {
    usePosesionCartillaMock.mockReturnValue({ estado: 'error', mensaje: 'Error del servidor' })

    renderCartillaView()

    expect(screen.getByText('No se pudo cargar')).toBeTruthy()
    expect(screen.getByText('Error del servidor')).toBeTruthy()
  })

  it('estado "cargando": renderiza DetalleSkeleton', () => {
    usePosesionCartillaMock.mockReturnValue({ estado: 'cargando' })

    const { container } = render(
      <MemoryRouter initialEntries={['/pacientes/p1/cartillas/c1']}>
        <Routes>
          <Route path="/pacientes/:pacienteId/cartillas/:idCartilla" element={<CartillaView />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0)
  })
})
