// @vitest-environment jsdom
/**
 * Unit tests de `usePosesionCartilla` (change cartillas-revival, Fase E1,
 * obs #85 Decisión 5): deriva un `AccesoCartilla` discriminado sobre el
 * `useCartilla` YA existente (`src/hooks/cartillas.ts:35-46`) — nunca un
 * segundo fetch. Mockea `useCartilla` y `useAuth` para controlar cada una
 * de las 5 ramas sin depender de TanStack Query real.
 */
import { describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { ApiError } from '../services/api'
import type { CartillaDetalle } from '../types'

const { useCartillaMock } = vi.hoisted(() => ({
  useCartillaMock: vi.fn(),
}))
vi.mock('./cartillas', () => ({
  useCartilla: useCartillaMock,
}))

const { useAuthMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
}))
vi.mock('./useAuth', () => ({
  useAuth: useAuthMock,
}))

// Importado DESPUÉS de declarar los mocks (hoisted por vitest, pero mantiene
// el orden de lectura claro).
import { usePosesionCartilla } from './usePosesionCartilla'

const cartillaPropia: CartillaDetalle = {
  id: 'cartilla-1',
  creadorId: 'usuario-1',
  nombre: 'Cartilla de Juan',
  esPrincipal: true,
  paradigma: 'taxonomica',
  categorias: [],
}

const cartillaAjena: CartillaDetalle = {
  ...cartillaPropia,
  creadorId: 'usuario-2',
}

describe('usePosesionCartilla', () => {
  it('estado "cargando" mientras la query está pendiente', () => {
    useAuthMock.mockReturnValue({ usuario: { id: 'usuario-1' } })
    useCartillaMock.mockReturnValue({ isPending: true, isError: false, data: undefined, error: null })

    const { result } = renderHook(() => usePosesionCartilla('p1', 'c1'))

    expect(result.current).toEqual({ estado: 'cargando' })
  })

  it('estado "no-encontrada" cuando el error es un ApiError 404', () => {
    useAuthMock.mockReturnValue({ usuario: { id: 'usuario-1' } })
    useCartillaMock.mockReturnValue({
      isPending: false,
      isError: true,
      data: undefined,
      error: new ApiError(404, 'No encontrado'),
    })

    const { result } = renderHook(() => usePosesionCartilla('p1', 'c1'))

    expect(result.current).toEqual({ estado: 'no-encontrada' })
  })

  it('estado "error" para cualquier otra falla (no 404)', () => {
    useAuthMock.mockReturnValue({ usuario: { id: 'usuario-1' } })
    useCartillaMock.mockReturnValue({
      isPending: false,
      isError: true,
      data: undefined,
      error: new ApiError(500, 'Error del servidor'),
    })

    const { result } = renderHook(() => usePosesionCartilla('p1', 'c1'))

    expect(result.current).toEqual({ estado: 'error', mensaje: 'Error del servidor' })
  })

  it('estado "propia" cuando usuario.id === creadorId', () => {
    useAuthMock.mockReturnValue({ usuario: { id: 'usuario-1' } })
    useCartillaMock.mockReturnValue({
      isPending: false,
      isError: false,
      data: cartillaPropia,
      error: null,
    })

    const { result } = renderHook(() => usePosesionCartilla('p1', 'c1'))

    expect(result.current).toEqual({ estado: 'propia', cartilla: cartillaPropia })
  })

  it('estado "ajena" cuando la query resuelve OK pero creadorId !== usuario.id', () => {
    useAuthMock.mockReturnValue({ usuario: { id: 'usuario-1' } })
    useCartillaMock.mockReturnValue({
      isPending: false,
      isError: false,
      data: cartillaAjena,
      error: null,
    })

    const { result } = renderHook(() => usePosesionCartilla('p1', 'c1'))

    expect(result.current).toEqual({ estado: 'ajena', cartilla: cartillaAjena })
  })
})
