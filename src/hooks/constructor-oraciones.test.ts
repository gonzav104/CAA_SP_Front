// @vitest-environment jsdom
/**
 * Unit tests de `useConstructorOraciones` (sdd/modo-uso-zona-b, D3):
 * persistencia en `sessionStorage` bajo la clave
 * `caa:frase:{pacienteId}:{cartillaId}`, envoltura versionada
 * `{ v, frase, borrada }`, escritura síncrona en cada mutación, hidratación
 * lazy vía `useState`, y degradación silenciosa (nunca throw) ante cualquier
 * falla de storage. Ninguna investigación específica de CAA respalda esta
 * decisión (research obs #112/#114) — se justifica solo en W3C COGA
 * §4.5.2/§4.5.4 (fuente S5).
 */
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useConstructorOraciones } from './constructor-oraciones'

const claveDe = (pacienteId: string, cartillaId: string) => `caa:frase:${pacienteId}:${cartillaId}`

beforeEach(() => {
  window.sessionStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
  window.sessionStorage.clear()
})

describe('useConstructorOraciones — persistencia', () => {
  it('hidrata vacío cuando no hay nada persistido y escribe sincrónicamente al agregar una palabra', () => {
    const { result } = renderHook(() => useConstructorOraciones('p1', 'c1'))

    expect(result.current.frase).toEqual([])

    act(() => result.current.agregarPalabra('Agua'))

    expect(result.current.frase).toEqual(['Agua'])
    const persistido = JSON.parse(window.sessionStorage.getItem(claveDe('p1', 'c1'))!) as unknown
    expect(persistido).toEqual({ v: 1, frase: ['Agua'], borrada: null })
  })

  it('hidrata desde una envoltura previamente persistida (reload / back-navigation)', () => {
    window.sessionStorage.setItem(
      claveDe('p1', 'c1'),
      JSON.stringify({ v: 1, frase: ['Hola', 'Mundo'], borrada: null }),
    )

    const { result } = renderHook(() => useConstructorOraciones('p1', 'c1'))

    expect(result.current.frase).toEqual(['Hola', 'Mundo'])
  })

  it('no hereda estado entre distintos pares paciente/cartilla (clave con ambos ids)', () => {
    window.sessionStorage.setItem(
      claveDe('p1', 'c1'),
      JSON.stringify({ v: 1, frase: ['Agua'], borrada: null }),
    )

    const { result } = renderHook(() => useConstructorOraciones('p2', 'c2'))

    expect(result.current.frase).toEqual([])
  })
})

describe('useConstructorOraciones — limpiar reversible (undo, no confirm)', () => {
  it('limpiar mueve la frase a `borrada` en vez de descartarla, y deshacer la restaura', () => {
    const { result } = renderHook(() => useConstructorOraciones('p1', 'c1'))

    act(() => result.current.agregarPalabra('Uno'))
    act(() => result.current.agregarPalabra('Dos'))
    act(() => result.current.limpiar())

    expect(result.current.frase).toEqual([])
    expect(result.current.borrada).toEqual(['Uno', 'Dos'])

    act(() => result.current.deshacer())

    expect(result.current.frase).toEqual(['Uno', 'Dos'])
    expect(result.current.borrada).toBeNull()
    const persistido = JSON.parse(window.sessionStorage.getItem(claveDe('p1', 'c1'))!) as unknown
    expect(persistido).toEqual({ v: 1, frase: ['Uno', 'Dos'], borrada: null })
  })

  it('`borrada` se limpia en el próximo agregarPalabra, en vez de quedar deshacible para siempre', () => {
    const { result } = renderHook(() => useConstructorOraciones('p1', 'c1'))

    act(() => result.current.agregarPalabra('Uno'))
    act(() => result.current.limpiar())
    expect(result.current.borrada).toEqual(['Uno'])

    act(() => result.current.agregarPalabra('Tres'))

    expect(result.current.frase).toEqual(['Tres'])
    expect(result.current.borrada).toBeNull()
  })
})

describe('useConstructorOraciones — degradación silenciosa ante fallas de storage', () => {
  it('sigue funcionando en memoria, sin lanzar, cuando acceder a sessionStorage lanza (navegación privada)', () => {
    vi.spyOn(window, 'sessionStorage', 'get').mockImplementation(() => {
      throw new Error('SecurityError: storage bloqueado')
    })

    const { result } = renderHook(() => useConstructorOraciones('p1', 'c1'))
    expect(result.current.frase).toEqual([])

    expect(() => {
      act(() => result.current.agregarPalabra('Agua'))
    }).not.toThrow()

    expect(result.current.frase).toEqual(['Agua'])
  })

  it('sigue funcionando en memoria, sin lanzar, cuando setItem lanza por cuota excedida', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('cuota excedida', 'QuotaExceededError')
    })

    const { result } = renderHook(() => useConstructorOraciones('p1', 'c1'))

    expect(() => {
      act(() => result.current.agregarPalabra('Agua'))
      act(() => result.current.agregarPalabra('Fría'))
    }).not.toThrow()

    expect(result.current.frase).toEqual(['Agua', 'Fría'])
  })

  it('arranca vacío cuando el valor persistido es JSON corrupto', () => {
    window.sessionStorage.setItem(claveDe('p1', 'c1'), '{esto no es json')

    const { result } = renderHook(() => useConstructorOraciones('p1', 'c1'))

    expect(result.current.frase).toEqual([])
    expect(result.current.borrada).toBeNull()
  })

  it('arranca vacío cuando el valor persistido tiene forma equivocada (sin versión, campos ajenos)', () => {
    window.sessionStorage.setItem(claveDe('p1', 'c1'), JSON.stringify({ palabras: ['Agua'] }))

    const { result } = renderHook(() => useConstructorOraciones('p1', 'c1'))

    expect(result.current.frase).toEqual([])
  })
})
