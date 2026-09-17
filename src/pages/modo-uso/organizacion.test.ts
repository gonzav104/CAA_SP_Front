import { describe, expect, it } from 'vitest'
import type { CartillaDetalle } from '../../types/Cartilla'
import { ORGANIZACION_POR_DEFECTO, organizacionDeCartilla } from './organizacion'

/**
 * Adaptador de organización de tablero (sdd/modo-uso-zona-b, D6 — obs #118):
 * este es el ÚNICO punto donde se resuelve el paradigma de agrupamiento del
 * tablero. Hoy `CartillaDetalle` no trae ningún campo de paradigma (verificado
 * en fuente, obs #119), así que el adaptador devuelve el default para
 * cualquier cartilla — esto es un seam deliberado (obs #119/#115), no todavía
 * una feature: cuando el backend exponga el campo real (PR4b, bloqueado en
 * obs #119), se lee y valida ACÁ y en ningún otro lado.
 *
 * `'escena-visual'` (Visual Scene Display) está declarado en la unión de
 * tipos pero el adaptador nunca lo devuelve: VSD necesita imagen de escena +
 * coordenadas de hotspot que el modelo de datos no tiene (obs #119), y queda
 * explícitamente fuera de alcance de todo este cambio.
 */
const CARTILLA_BASE: CartillaDetalle = {
  id: 'cartilla-1',
  creadorId: 'terapeuta-1',
  nombre: 'Cartilla de prueba',
  esPrincipal: true,
  categorias: [],
}

describe('organizacionDeCartilla — adaptador de paradigma de organización', () => {
  it('devuelve el default (taxonomica) para cualquier cartilla hoy', () => {
    expect(organizacionDeCartilla(CARTILLA_BASE)).toBe('taxonomica')
    expect(organizacionDeCartilla(CARTILLA_BASE)).toBe(ORGANIZACION_POR_DEFECTO)
  })

  it('el default está pineado como taxonomica', () => {
    expect(ORGANIZACION_POR_DEFECTO).toBe('taxonomica')
  })

  it('nunca devuelve escena-visual (VSD fuera de alcance, sin dato de escena/hotspot)', () => {
    expect(organizacionDeCartilla(CARTILLA_BASE)).not.toBe('escena-visual')
  })
})
