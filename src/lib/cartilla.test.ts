/**
 * Unit tests de `esCreadorDe` — predicado puro de posesión (change
 * cartillas-revival, Fase E1, obs #85 Decisión 5).
 *
 * Fuente única de verdad de la comparación de posesión: `usuario.id ===
 * cartilla.creadorId`. `ListaCartillas.tsx:234` la usa directamente sobre el
 * DTO de listado (sin hook, sin fetch por card); `usePosesionCartilla` la
 * deriva por encima del detalle. No necesita jsdom: es una función pura.
 */
import { describe, expect, it } from 'vitest'
import { esCreadorDe } from './cartilla'

const cartilla = { creadorId: 'usuario-1' }

describe('esCreadorDe', () => {
  it('true cuando el id del usuario coincide con creadorId', () => {
    expect(esCreadorDe({ id: 'usuario-1' }, cartilla)).toBe(true)
  })

  it('false cuando el id del usuario NO coincide con creadorId', () => {
    expect(esCreadorDe({ id: 'usuario-2' }, cartilla)).toBe(false)
  })

  it('false cuando el usuario es null', () => {
    expect(esCreadorDe(null, cartilla)).toBe(false)
  })

  it('false cuando el usuario es undefined', () => {
    expect(esCreadorDe(undefined, cartilla)).toBe(false)
  })
})
