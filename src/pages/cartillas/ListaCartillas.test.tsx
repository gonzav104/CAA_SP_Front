// @vitest-environment jsdom
/**
 * Unit test de ListaCartillas (change cartillas-revival, Fase E2, obs #85
 * Decisión 5): el sitio de comparación de posesión en el `.map()` sobre el
 * DTO de listado usa el predicado puro `esCreadorDe` directamente — NUNCA
 * `usePosesionCartilla` (evitaría N fetches por card, uno por cartilla del
 * listado). Este render path no tenía cobertura previa (ni componente ni
 * E2E: `git grep` en `tests/*.spec.ts` no encuentra ninguna aserción sobre
 * el menú de Acciones de una card de cartilla), así que se agrega un test
 * mínimo probando el efecto observable: el menú de acciones (Editar/Eliminar)
 * solo aparece cuando el usuario logueado es el creador de esa cartilla.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { Cartilla } from '../../types/Cartilla'
import { ListaCartillas } from './ListaCartillas'

const cartilla: Cartilla = {
  id: 'cartilla-1',
  pacienteId: 'p1',
  creadorId: 'usuario-1',
  nombre: 'Cartilla de Juan',
  esPrincipal: false,
  creadoEn: '2026-01-01T00:00:00.000Z',
}

const { useAuthMock, useCartillasMock, useCrearCartillaMock, useEliminarCartillaMock } =
  vi.hoisted(() => ({
    useAuthMock: vi.fn(),
    useCartillasMock: vi.fn(),
    useCrearCartillaMock: vi.fn(),
    useEliminarCartillaMock: vi.fn(),
  }))

vi.mock('../../hooks/useAuth', () => ({
  useAuth: useAuthMock,
}))
vi.mock('../../hooks/cartillas', () => ({
  useCartillas: useCartillasMock,
  useCrearCartilla: useCrearCartillaMock,
  useEliminarCartilla: useEliminarCartillaMock,
}))

afterEach(() => {
  cleanup()
})

function renderListaCartillas() {
  render(
    <MemoryRouter initialEntries={['/pacientes/p1/cartillas']}>
      <Routes>
        <Route path="/pacientes/:pacienteId/cartillas" element={<ListaCartillas />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ListaCartillas — posesión vía esCreadorDe (predicado puro, sin hook)', () => {
  it('muestra el menú de acciones cuando esCreadorDe(usuario, cartilla) es true', () => {
    useAuthMock.mockReturnValue({ usuario: { id: 'usuario-1' } })
    useCartillasMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [cartilla],
    })
    useCrearCartillaMock.mockReturnValue({ isPending: false, mutateAsync: vi.fn() })
    useEliminarCartillaMock.mockReturnValue({ isPending: false, mutateAsync: vi.fn() })

    renderListaCartillas()

    expect(
      screen.getByRole('button', { name: 'Acciones de Cartilla de Juan' }),
    ).toBeTruthy()
  })

  it('oculta el menú de acciones cuando esCreadorDe(usuario, cartilla) es false', () => {
    useAuthMock.mockReturnValue({ usuario: { id: 'usuario-2' } })
    useCartillasMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [cartilla],
    })
    useCrearCartillaMock.mockReturnValue({ isPending: false, mutateAsync: vi.fn() })
    useEliminarCartillaMock.mockReturnValue({ isPending: false, mutateAsync: vi.fn() })

    renderListaCartillas()

    expect(
      screen.queryByRole('button', { name: 'Acciones de Cartilla de Juan' }),
    ).toBeNull()
  })
})
