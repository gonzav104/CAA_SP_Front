import { describe, expect, it } from 'vitest'
import type { CartillaDetalle } from '../../types/Cartilla'
import { ORGANIZACION_POR_DEFECTO, organizacionDeCartilla } from './organizacion'

/**
 * Adaptador de organización de tablero (sdd/modo-uso-zona-b, D6 — obs #118):
 * este es el ÚNICO punto donde se resuelve el paradigma de agrupamiento del
 * tablero. Desde PR4b, `CartillaDetalle.paradigma` es un campo real del
 * backend (`caa_sp`, commit `1c52cb6`) — el adaptador lo lee y valida acá.
 *
 * `'escena-visual'` (Visual Scene Display) NO existe en `CartillaDetalle.paradigma`
 * (el tipo del campo es `'taxonomica' | 'esquematica'`, así que el compilador
 * ya lo hace inalcanzable ahí), pero el fallback defensivo de runtime sigue
 * existiendo para cualquier valor no reconocido en general — dato corrupto,
 * versión vieja del backend, etc. — matching spec `board-organization`.
 */
const CARTILLA_BASE: CartillaDetalle = {
  id: 'cartilla-1',
  creadorId: 'terapeuta-1',
  nombre: 'Cartilla de prueba',
  esPrincipal: true,
  paradigma: 'taxonomica',
  categorias: [],
}

describe('organizacionDeCartilla — adaptador de paradigma de organización', () => {
  it('devuelve taxonomica cuando cartilla.paradigma es taxonomica', () => {
    const cartilla: CartillaDetalle = { ...CARTILLA_BASE, paradigma: 'taxonomica' }

    expect(organizacionDeCartilla(cartilla)).toBe('taxonomica')
  })

  it('devuelve esquematica cuando cartilla.paradigma es esquematica', () => {
    const cartilla: CartillaDetalle = { ...CARTILLA_BASE, paradigma: 'esquematica' }

    expect(organizacionDeCartilla(cartilla)).toBe('esquematica')
  })

  it('el default está pineado como taxonomica', () => {
    expect(ORGANIZACION_POR_DEFECTO).toBe('taxonomica')
  })

  it('cae al default ante un valor de paradigma no reconocido (dato corrupto/legado)', () => {
    // El tipo de `CartillaDetalle.paradigma` ya no permite otros strings en
    // tiempo de compilación; simulamos un dato corrupto/legado tal como
    // podría llegar en runtime (versión vieja de la API, storage stale, etc.)
    const cartillaCorrupta = {
      ...CARTILLA_BASE,
      paradigma: 'grid-invalido',
    } as unknown as CartillaDetalle

    expect(organizacionDeCartilla(cartillaCorrupta)).toBe(ORGANIZACION_POR_DEFECTO)
  })

  it('nunca devuelve escena-visual, ni siquiera con un dato corrupto que lo mande literal', () => {
    const cartillaCorrupta = {
      ...CARTILLA_BASE,
      paradigma: 'escena-visual',
    } as unknown as CartillaDetalle

    expect(organizacionDeCartilla(cartillaCorrupta)).not.toBe('escena-visual')
    expect(organizacionDeCartilla(cartillaCorrupta)).toBe(ORGANIZACION_POR_DEFECTO)
  })
})
